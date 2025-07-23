// Функция для блокировки/разблокировки пользователей
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

// Вспомогательная функция для проверки токена
const verifyToken = (token) => {
  // Здесь должна быть проверка JWT токена
  // В простом примере просто проверяем наличие токена
  return !!token;
};

// Вспомогательная функция для проверки прав администратора
const isAdmin = (token) => {
  // В реальном приложении здесь должна быть проверка роли из токена
  // В простом примере всегда возвращаем true
  return true;
};

exports.handler = async (event, context) => {
  // Добавляем CORS заголовки
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Обрабатываем OPTIONS запросы для CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  // Проверяем метод запроса
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Проверяем авторизацию
  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!verifyToken(token)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  // Проверяем права администратора
  if (!isAdmin(token)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Forbidden: Admin access required' }),
    };
  }

  try {
    // Получаем данные из запроса
    const requestBody = JSON.parse(event.body);
    const { userId, isBlocked } = requestBody;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Получаем токен Dropbox из переменных окружения
    const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
    const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
    const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;

    if (!DROPBOX_REFRESH_TOKEN || !DROPBOX_CLIENT_ID || !DROPBOX_CLIENT_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Dropbox configuration is missing' }),
      };
    }

    // Получаем access token из refresh token
    const tokenResponse = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: DROPBOX_REFRESH_TOKEN,
        client_id: DROPBOX_CLIENT_ID,
        client_secret: DROPBOX_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Error getting access token:', tokenError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to authenticate with Dropbox' }),
      };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Создаем экземпляр Dropbox API
    const dbx = new Dropbox({ accessToken, fetch });

    // Путь к файлу users.json в Dropbox
    const filePath = '/users.json';

    // Получаем текущее содержимое файла
    const fileResponse = await dbx.filesDownload({ path: filePath });
    const fileContent = fileResponse.result.fileBinary.toString();
    const users = JSON.parse(fileContent);

    // Находим пользователя по ID и обновляем статус блокировки
    const userIndex = users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Обновляем статус блокировки
    users[userIndex].is_blocked = isBlocked ? 1 : 0;

    // Сохраняем обновленный файл обратно в Dropbox
    const updatedContent = JSON.stringify(users, null, 2);
    
    await dbx.filesUpload({
      path: filePath,
      contents: updatedContent,
      mode: { '.tag': 'overwrite' },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: `User ${userId} has been ${isBlocked ? 'blocked' : 'unblocked'}`
      }),
    };
  } catch (error) {
    console.error('Error in block-user function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};