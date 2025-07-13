const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, 'users.json');
const bcrypt = require('bcryptjs');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

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
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (e) {
    if (e.status === 409) return [];
    throw e;
  }
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

  const users = await readUsers();
  const user = users.find(u => u.username === login);
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Пользователь не найден' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Неверный пароль' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
  if (user.is_blocked === 1) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Аккаунт заблокирован администратором' }),
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