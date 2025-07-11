const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

  // GET - получить список пользователей или одного пользователя по id
  if (event.httpMethod === 'GET') {
    const dbPath = path.join(__dirname, 'users.db');
    const db = new sqlite3.Database(dbPath);
    const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
    const userId = url.searchParams.get('id');
    if (userId) {
      // Получить одного пользователя по id
      return await new Promise((resolve, reject) => {
        db.get('SELECT id, login, role, is_blocked, createdAt, dropboxRefreshToken FROM User WHERE id = ?', [userId], (err, row) => {
          db.close();
          if (err) {
            resolve({
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Ошибка базы данных' })
            });
          } else if (!row) {
            resolve({
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Пользователь не найден' })
            });
          } else {
            console.log('GET /users?id=... найден пользователь:', row);
            resolve({
              statusCode: 200,
              headers,
              body: JSON.stringify(row)
            });
          }
        });
      });
    } else {
      // Получить всех пользователей
      return await new Promise((resolve, reject) => {
        db.all('SELECT id, login, role, is_blocked, createdAt, dropboxRefreshToken FROM User', [], (err, rows) => {
          db.close();
          if (err) {
            resolve({
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Ошибка базы данных' })
            });
          } else {
            resolve({
              statusCode: 200,
              headers,
              body: JSON.stringify(rows)
            });
          }
        });
      });
    }
  }

  // POST - создать пользователя
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { login, password, role } = body;
      if (!login || !password || !role) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Все поля обязательны' })
        };
      }
      const dbPath = path.join(__dirname, 'users.db');
      const db = new sqlite3.Database(dbPath);
      return await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO User (login, password, role, is_blocked, createdAt) VALUES (?, ?, ?, 0, datetime("now"))',
          [login, password, role],
          function(err) {
            db.close();
            if (err) {
              resolve({
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Ошибка создания пользователя' })
              });
            } else {
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, id: this.lastID })
              });
            }
          }
        );
      });
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ошибка создания пользователя' })
      };
    }
  }

  // PATCH - блокировка/разблокировка пользователя или обновление dropboxRefreshToken
  if (event.httpMethod === 'PATCH') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { id, is_blocked, dropboxRefreshToken } = body;
      if (typeof id === 'undefined') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'id обязателен' })
        };
      }
      const dbPath = path.join(__dirname, 'users.db');
      const db = new sqlite3.Database(dbPath);
      // Если передан dropboxRefreshToken, обновляем его
      if (typeof dropboxRefreshToken !== 'undefined') {
        return await new Promise((resolve, reject) => {
          db.run(
            'UPDATE User SET dropboxRefreshToken = ? WHERE id = ?',
            [dropboxRefreshToken, id],
            function(err) {
              db.close();
              if (err) {
                resolve({
                  statusCode: 500,
                  headers,
                  body: JSON.stringify({ error: 'Ошибка обновления Dropbox токена' })
                });
              } else {
                resolve({
                  statusCode: 200,
                  headers,
                  body: JSON.stringify({ success: true })
                });
              }
            }
          );
        });
      }
      // Если передан is_blocked, обновляем его
      if (typeof is_blocked !== 'undefined') {
        return await new Promise((resolve, reject) => {
          db.run(
            'UPDATE User SET is_blocked = ? WHERE id = ?',
            [is_blocked ? 1 : 0, id],
            function(err) {
              db.close();
              if (err) {
                resolve({
                  statusCode: 500,
                  headers,
                  body: JSON.stringify({ error: 'Ошибка обновления пользователя' })
                });
              } else {
                resolve({
                  statusCode: 200,
                  headers,
                  body: JSON.stringify({ success: true })
                });
              }
            }
          );
        });
      }
      // Если не передано ни одного поддерживаемого поля
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Нет поддерживаемых полей для обновления' })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ошибка обновления пользователя' })
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