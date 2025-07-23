const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, 'users.json');
const bcrypt = require('bcryptjs');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN || '';
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN || '';
const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID || '';
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET || '';

const USERS_PATH = '/users.json';

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

async function readUsers() {
  try {
    const dbx = await getDropbox();
    const res = await dbx.filesDownload({ path: USERS_PATH });
    const content = res.result.fileBinary.toString();
    return JSON.parse(content);
  } catch (e) {
    if (e.status === 409) return [];
    throw e;
  }
}

async function writeUsers(users) {
  const dbx = await getDropbox();
  await dbx.filesUpload({
    path: USERS_PATH,
    contents: Buffer.from(JSON.stringify(users, null, 2)),
    mode: { '.tag': 'overwrite' }
  });
}

exports.handler = async (event, context) => {
  const method = event.httpMethod;
  
  try {
    let users = await readUsers();
    
    // Проверяем, что users является массивом
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', users);
      users = [];
    }

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
    // Хэшируем пароль
    const hashedPassword = bcrypt.hashSync(data.password, 10);
    const newUser = {
      id: maxId + 1,
      username: username,
      password: hashedPassword,
      role: data.role || 'user',
      is_blocked: 0,
      dropboxRefreshToken: data.dropboxRefreshToken || null,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await writeUsers(users);
    return {
      statusCode: 201,
      body: JSON.stringify(newUser),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (method === 'PUT') {
    const data = JSON.parse(event.body || '{}');
    users = users.map(u => u.id === data.id ? { ...u, ...data } : u);
    await writeUsers(users);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  if (method === 'DELETE') {
    const { id } = JSON.parse(event.body || '{}');
    users = users.filter(u => u.id !== id);
    await writeUsers(users);
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
  } catch (error) {
    console.error('Error in users handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 