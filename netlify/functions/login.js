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

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { login, password } = body;
      if (!login || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Логин и пароль обязательны' })
        };
      }

      const dbPath = path.join(__dirname, 'users.db');
      const db = new sqlite3.Database(dbPath);

      // Возвращаем промис для асинхронной работы
      return await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM User WHERE login = ? AND password = ?',
          [login, password],
          (err, user) => {
            db.close();
            if (err) {
              resolve({
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Ошибка базы данных' })
              });
            } else if (!user) {
              resolve({
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Неверный логин или пароль' })
              });
            } else if (user.is_blocked) {
              resolve({
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Пользователь заблокирован' })
              });
            } else {
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  token: 'test-token-123', // Здесь можно выдать реальный JWT
                  user: {
                    id: user.id,
                    login: user.login,
                    role: user.role,
                    createdAt: user.createdAt
                  }
                })
              });
            }
          }
        );
      });
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Ошибка сервера: ' + error.message })
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