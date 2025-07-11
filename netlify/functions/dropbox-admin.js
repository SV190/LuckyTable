require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
console.log('DROPBOX_APP_SECRET:', process.env.DROPBOX_APP_SECRET);
const { Dropbox } = require('dropbox');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

// Функция для получения refresh token пользователя из базы
async function getUserRefreshToken(userId) {
  const dbPath = path.join(__dirname, 'users.db');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    db.get('SELECT dropboxRefreshToken FROM User WHERE id = ?', [userId], (err, row) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.dropboxRefreshToken : null);
      }
    });
  });
}

// Получение пользователя по user_token (заглушка для тестового токена)
async function getUserFromToken(userToken) {
  const dbPath = path.join(__dirname, 'users.db');
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    if (userToken === 'test-token-123') {
      // Возвращаем первого пользователя (id = 1)
      db.get('SELECT * FROM User WHERE id = 1', [], (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row);
      });
    } else {
      db.close();
      resolve(null);
    }
  });
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
      const dbPath = path.join(__dirname, 'users.db');
      console.log('DB path:', dbPath);
      const db = new sqlite3.Database(dbPath);
      // Проверяем существование таблицы users
      const tableExists = await new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        });
      });
      if (!tableExists) {
        console.log('Table users does not exist, returning empty array');
        db.close();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ users: [] })
        };
      }
      const users = [];
      await new Promise((resolve, reject) => {
        db.all('SELECT id, login, dropboxRefreshToken FROM User', (err, rows) => {
          if (err) return reject(err);
          rows.forEach(row => {
            users.push({
              id: row.id,
              login: row.login,
              dropboxConnected: !!row.dropboxRefreshToken
            });
          });
          resolve();
        });
      });
      db.close();
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
    const dbPath = path.join(__dirname, 'users.db');
    console.log('DB path:', dbPath);
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening DB:', err);
      } else {
        console.log('DB opened successfully');
      }
    });
    const updatePromises = userIds.map(userId => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE User SET dropboxRefreshToken = ? WHERE id = ?',
          [refreshToken, userId],
          function(err) {
            if (err) {
              console.error('DB error:', err);
              reject(err);
            } else {
              console.log(`Updated userId ${userId} with refreshToken`);
              resolve();
            }
          }
        );
      });
    });
    try {
      await Promise.all(updatePromises);
      db.close((err) => {
        if (err) {
          console.error('Error closing DB:', err);
        } else {
          console.log('DB closed successfully');
        }
      });
      console.log('All users updated successfully');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: `Dropbox подключен для ${userIds.length} пользователей` })
      };
    } catch (dbError) {
      db.close();
      console.error('DB update error:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Ошибка сохранения токена', details: dbError.message })
      };
    }
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