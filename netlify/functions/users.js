const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

exports.handler = async (event, context) => {
  const method = event.httpMethod;
  let users = readUsers();

  if (method === 'GET') {
    // Проверяем, есть ли параметр id в query string
    const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
    const userId = url.searchParams.get('id');
    
    if (userId) {
      // Возвращаем одного пользователя по ID
      const user = users.find(u => u.id === parseInt(userId));
      if (!user) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'User not found' }),
          headers: { 'Content-Type': 'application/json' }
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    // Возвращаем всех пользователей
    return {
      statusCode: 200,
      body: JSON.stringify(users),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (method === 'POST') {
    const data = JSON.parse(event.body || '{}');
    
    // Проверяем, что все обязательные поля присутствуют
    if (!data.username && !data.login) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Username is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    if (!data.password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    const username = data.username || data.login;
    
    // Проверяем, не существует ли уже пользователь с таким логином
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'User with this username already exists' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    // Генерируем простой ID на основе максимального существующего ID
    const maxId = users.length > 0 ? Math.max(...users.map(u => u.id)) : 0;
    const newUser = {
      id: maxId + 1,
      username: username,
      password: data.password,
      role: data.role || 'user',
      is_blocked: 0,
      dropboxRefreshToken: data.dropboxRefreshToken || null,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);
    return {
      statusCode: 201,
      body: JSON.stringify(newUser),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (method === 'PUT') {
    const data = JSON.parse(event.body || '{}');
    users = users.map(u => u.id === data.id ? { ...u, ...data } : u);
    writeUsers(users);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (method === 'DELETE') {
    const { id } = JSON.parse(event.body || '{}');
    users = users.filter(u => u.id !== id);
    writeUsers(users);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
    headers: { 'Content-Type': 'application/json' }
  };
}; 