const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function getAccessToken(refreshToken) {
  const response = await fetch('https://api.dropbox.com/oauth2/token', {
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

const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN || '';
const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID || '';
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET || '';
const USERS_PATH = '/users.json';

async function getDropbox() {
  const accessToken = await getAccessToken(DROPBOX_REFRESH_TOKEN);
  return new Dropbox({ accessToken, fetch });
}

async function readUsers() {
  try {
    const dbx = await getDropbox();
    const res = await dbx.filesDownload({ path: USERS_PATH });
    const content = res.result.fileBinary.toString();
    if (!content || !content.trim()) return [];
    return JSON.parse(content);
  } catch (e) {
    if (e.status === 409) return [];
    throw e;
  }
}

async function getUserRefreshToken(userId) {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.dropboxRefreshToken : null;
  } catch (error) {
    console.error('Error reading users.json from Dropbox:', error);
    return null;
  }
}

exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const token = event.headers.authorization?.split(' ')[1];
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Неверный токен' }) };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { path: filePath, data } = JSON.parse(event.body || '{}');
      if (!filePath || !data) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Неверные параметры' }) };
      }

      // Используем глобальный refresh token вместо пользовательского
      const refreshToken = DROPBOX_REFRESH_TOKEN;
      if (!refreshToken) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Dropbox не настроен в переменных окружения' }) };
      }
      const accessToken = await getAccessToken(refreshToken);
      const dbx = new Dropbox({ accessToken, fetch });

      // Определяем тип файла по расширению
      const ext = (filePath.split('.').pop() || '').toLowerCase();
      const isText = ['json', 'luckysheet', 'txt'].includes(ext);

      let contents;
      if (isText) {
        // base64 → строка → Buffer (utf-8)
        const text = Buffer.from(data, 'base64').toString('utf-8');
        contents = Buffer.from(text, 'utf-8');
      } else {
        // base64 → Buffer
        contents = Buffer.from(data, 'base64');
      }

      await dbx.filesUpload({
        path: filePath,
        contents,
        mode: { '.tag': 'overwrite' }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ошибка загрузки файла' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Метод не поддерживается' }) };
}; 