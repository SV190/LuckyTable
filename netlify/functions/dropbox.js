const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN || '';
const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID || '';
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET || '';
const USERS_PATH = '/users.json';

// Функция для получения access token через refresh token
async function getAccessToken() {
  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: DROPBOX_REFRESH_TOKEN,
      client_id: DROPBOX_CLIENT_ID,
      client_secret: DROPBOX_CLIENT_SECRET
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Не удалось получить access token Dropbox: ' + (data.error_description || JSON.stringify(data)));
  return data.access_token;
}

async function getDropbox() {
  const accessToken = await getAccessToken();
  return new Dropbox({ accessToken, fetch });
}

async function getUserRefreshToken(userId) {
  try {
    const dbx = await getDropbox();
    const res = await dbx.filesDownload({ path: USERS_PATH });
    const content = res.result.fileBinary.toString();
    if (!content.trim()) return null;
    const users = JSON.parse(content);
    const user = users.find(u => u.id === userId);
    return user ? user.dropboxRefreshToken : null;
  } catch (error) {
    console.error('Error reading users.json:', error);
    return null;
  }
}

// Функция для сохранения refresh token в Dropbox
async function saveUserRefreshToken(userId, refreshToken) {
  try {
    const dbx = await getDropbox();
    
    // Читаем текущих пользователей
    let users = [];
    try {
      const res = await dbx.filesDownload({ path: USERS_PATH });
      const content = res.result.fileBinary.toString();
      if (content.trim()) {
        users = JSON.parse(content);
      }
    } catch (e) {
      if (e.status !== 409) throw e;
      // Файл не существует, создаем пустой массив
    }
    
    // Найти пользователя и обновить токен
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].dropboxRefreshToken = refreshToken;
    } else {
      // Если пользователь не найден, создать нового
      users.push({
        id: userId,
        dropboxRefreshToken: refreshToken
      });
    }
    
    // Записываем обратно в Dropbox
    await dbx.filesUpload({
      path: USERS_PATH,
      contents: Buffer.from(JSON.stringify(users, null, 2)),
      mode: { '.tag': 'overwrite' }
    });
    
    return true;
  } catch (error) {
    console.error('Error saving to Dropbox:', error);
    return false;
  }
}

exports.handler = async function(event, context) {
  // Настройка CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Обработка preflight запросов
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Проверка токена (простая проверка для тестирования)
  const token = event.headers.authorization?.split(' ')[1];
  if (!token || token !== 'test-token-123') {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Неверный токен' })
    };
  }

  // GET - получить файлы пользователя
  if (event.httpMethod === 'GET') {
    try {
      // Получаем ID пользователя из токена (упрощенно)
      const userId = 1; // В реальности извлекать из JWT токена
      const refreshToken = await getUserRefreshToken(userId);
      
      if (!refreshToken) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Dropbox не подключен' })
        };
      }
      
      const accessToken = await getAccessToken();
      const dbx = new Dropbox({ accessToken });
      
      // Получаем путь из query string
      const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
      const folderPath = url.searchParams.get('path') || '';
      
      const response = await dbx.filesListFolder({
        path: folderPath,
        limit: 100
      });
      const files = response.result.entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        path: entry.path_lower,
        updatedAt: entry.server_modified,
        size: entry.size,
        isFolder: entry['.tag'] === 'folder'
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(files)
      };
    } catch (error) {
      console.error('Error getting files:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Ошибка получения файлов' })
      };
    }
  }

  // POST - сохранить refresh token
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { code, redirect_uri, userId } = body;
      
      if (code && redirect_uri) {
        // Логируем параметры
        console.log('EXCHANGE CODE PARAMS:', {
          code,
          grant_type: 'authorization_code',
          client_id: '8nw2cgvlalf08um',
          client_secret: process.env.DROPBOX_CLIENT_SECRET || 'your_app_secret',
          redirect_uri
        });
        // Обмен authorization code на refresh token
        const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code: code,
            grant_type: 'authorization_code',
            client_id: '8nw2cgvlalf08um',
            client_secret: process.env.DROPBOX_CLIENT_SECRET || 'your_app_secret',
            redirect_uri: redirect_uri
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Dropbox token exchange error:', errorText);
          throw new Error('Failed to exchange code for token');
        }
        
        const data = await response.json();
        const refreshToken = data.refresh_token;
        
        // Сохраняем refresh token в базу
        const success = await saveUserRefreshToken(userId || 1, refreshToken);
        
        if (success) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Dropbox подключен' })
          };
        } else {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Ошибка сохранения токена' })
          };
        }
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Неверные параметры' })
        };
      }
    } catch (error) {
      console.error('Error saving token:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Ошибка сохранения токена' })
      };
    }
  }

  // Для других методов
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Метод не поддерживается' })
  };
}; 