require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
console.log('DROPBOX_APP_SECRET:', process.env.DROPBOX_APP_SECRET);
const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, 'users.json');

console.log('dropbox-admin.js loaded');

// Функция для получения access token через refresh token
async function getAccessToken(refreshToken, appKey, appSecret) {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey || '8nw2cgvlalf08um',
      client_secret: appSecret || process.env.DROPBOX_APP_SECRET || 'your_app_secret'
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Dropbox token refresh error:', errorData);
    throw new Error('Failed to refresh access token');
  }
  
  const data = await response.json();
  return data.access_token;
}

// Функция для проверки валидности refresh token
async function validateRefreshToken(refreshToken, appKey, appSecret) {
  try {
    const accessToken = await getAccessToken(refreshToken, appKey, appSecret);
    const dbx = new Dropbox({ accessToken });
    
    // Проверяем токен, получая информацию о пользователе
    const response = await dbx.usersGetCurrentAccount();
    return {
      valid: true,
      userInfo: response.result
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// Получение пользователя по user_token (заглушка для тестового токена)
async function getUserFromToken(userToken) {
  if (userToken === 'test-token-123') {
    const users = readUsers();
    return users[0] || null;
  }
  return null;
}

// Получение access token по refresh token (использует getAccessToken выше)
async function getDropboxAccessToken(refreshToken) {
  return await getAccessToken(refreshToken);
}

exports.handler = async function(event, context) {
  const headers = { 'Content-Type': 'application/json' };
  console.log('dropbox-admin function started');

  // --- GET: вернуть статус Dropbox для всех пользователей ---
  if (event.httpMethod === 'GET') {
    try {
      const users = readUsers();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users })
      };
    } catch (error) {
      console.error('GET error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  try {
    console.log('event.body:', event.body);
    let userIds, autoConnect;
    try {
      const body = JSON.parse(event.body || '{}');
      userIds = body.userIds;
      autoConnect = body.autoConnect;
      console.log('Parsed userIds:', userIds, 'autoConnect:', autoConnect);
    } catch (parseError) {
      console.error('Error parsing event.body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message })
      };
    }
    // Если autoConnect=true, используем токен из env
    let refreshToken = null;
    if (autoConnect) {
      refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
      console.log('Using env DROPBOX_REFRESH_TOKEN:', refreshToken);
      if (!refreshToken) {
        console.error('DROPBOX_REFRESH_TOKEN not set in env');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'DROPBOX_REFRESH_TOKEN не задан в env' })
        };
      }
    } else {
      refreshToken = JSON.parse(event.body || '{}').refreshToken;
      console.log('Using provided refreshToken:', refreshToken);
    }

    if (!refreshToken) {
      console.error('No refreshToken provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Refresh token обязателен' })
      };
    }
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.error('No userIds provided or not array:', userIds);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Не выбраны пользователи для подключения' })
      };
    }

    // Сохраняем токен для выбранных пользователей
    const users = readUsers();
    const updatedUsers = users.map(user => {
      if (userIds.includes(user.id)) {
        user.dropboxRefreshToken = refreshToken;
      }
      return user;
    });
    fs.writeFileSync(USERS_FILE, JSON.stringify(updatedUsers, null, 2));
    console.log('All users updated successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: `Dropbox подключен для ${userIds.length} пользователей` })
    };
  } catch (error) {
    console.error('FATAL ERROR in dropbox-admin:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
}; 

exports.getUserFromToken = getUserFromToken;
exports.getDropboxAccessToken = getDropboxAccessToken; 