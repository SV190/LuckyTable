const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function getAccessToken(refreshToken) {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '8nw2cgvlalf08um',
      client_secret: process.env.DROPBOX_CLIENT_SECRET || 'your_app_secret'
    })
  });
  if (!response.ok) throw new Error('Failed to refresh access token');
  const data = await response.json();
  return data.access_token;
}

async function getUserRefreshToken(userId) {
  try {
    const usersPath = path.join(__dirname, 'users.json');
    if (!fs.existsSync(usersPath)) {
      console.log('users.json not found');
      return null;
    }
    
    const usersData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    const user = users.find(u => u.id === userId);
    
    return user ? user.dropboxRefreshToken : null;
  } catch (error) {
    console.error('Error reading users.json:', error);
    return null;
  }
}

exports.handler = async (event) => {
  try {
    // Логируем входящие данные
    console.log('=== dropbox-download.js function called ===');
    console.log('HTTP METHOD:', event.httpMethod);
    console.log('HEADERS:', JSON.stringify(event.headers));
    console.log('BODY RAW:', event.body);

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Проверка токена авторизации
    const token = event.headers.authorization?.split(' ')[1];
    if (!token || token !== 'test-token-123') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Неверный токен' }),
      };
    }

    const parsed = JSON.parse(event.body || '{}');
    const filePath = parsed.path || parsed.filePath;
    if (!filePath) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file path provided' }),
      };
    }

    // Получаем refresh token пользователя
    const userId = 1; // В реальности извлекать из JWT токена
    const refreshToken = await getUserRefreshToken(userId);
    if (!refreshToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Dropbox не подключен' }),
      };
    }

    const accessToken = await getAccessToken(refreshToken);
    const dbx = new Dropbox({ accessToken, fetch });

    const file = await dbx.filesDownload({ path: filePath });
    const fileContents = file.result.fileBinary;
    const fileName = file.result.name || 'file.xlsx';

    // Определяем тип файла по расширению
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const isJson = ['json', 'luckysheet', 'txt'].includes(ext);

    if (isJson) {
      // Для текстовых/JSON файлов возвращаем строку
      const text = Buffer.from(fileContents).toString('utf-8');
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
        body: text,
      };
    } else {
      // Для бинарных файлов возвращаем base64
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
        body: Buffer.from(fileContents).toString('base64'),
        isBase64Encoded: true,
      };
    }
  } catch (e) {
    console.error('dropbox-download error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message }),
    };
  }
}; 