const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const { login, password } = JSON.parse(event.body || '{}');
  if (!login || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Login and password required' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const users = readUsers();
  const user = users.find(u => u.username === login && u.password === password);
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // Проверяем, не заблокирован ли пользователь
  if (user.is_blocked === 1) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Account is blocked by administrator' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // Возвращаем "токен" и пользователя (токен — просто строка для теста)
  return {
    statusCode: 200,
    body: JSON.stringify({ token: 'test-token-123', user }),
    headers: { 'Content-Type': 'application/json' }
  };
}; 