const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');
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

async function getUserRefreshToken(userId) {
  try {
    const dbx = await getDropbox();
    const res = await dbx.filesDownload({ path: USERS_PATH });
    const content = res.result.fileBinary.toString();
    if (!content.trim()) return null;
    const users = JSON.parse(content);
    const user = users.find(u => u.id === userId);
    return user ? user.dropboxRefreshToken : null;
  } catch (error) {
    console.error('Error reading users.json:', error);
    return null;
  }
}

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Проверка наличия токена
  const token = event.headers.authorization?.split(' ')[1];
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Неверный токен' }) };
  }

  if (event.httpMethod === 'GET') {
    try {
      // Используем глобальный refresh token вместо пользовательского
      const refreshToken = DROPBOX_REFRESH_TOKEN;
      if (!refreshToken) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Dropbox не настроен в переменных окружения' }) };
      }
      const accessToken = await getAccessToken();
      const dbx = new Dropbox({ accessToken, fetch });

      // Получаем путь из query string
      const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
      const folderPath = url.searchParams.get('path') || '';
      const recursive = url.searchParams.get('recursive') === 'true';

      // Получаем все папки рекурсивно
      const allFolders = [];
      
      // Функция для получения папок с поддержкой пагинации
      async function listFolders(path, cursor = null) {
        let response;
        
        if (cursor) {
          response = await dbx.filesListFolderContinue({ cursor });
        } else {
          response = await dbx.filesListFolder({ path, limit: 100, recursive });
        }
        
        // Добавляем папки из текущего ответа
        const folders = response.result.entries
          .filter(entry => entry['.tag'] === 'folder')
          .map(entry => ({
            id: entry.id,
            name: entry.name,
            path: entry.path_lower,
            isFolder: true
          }));
        
        allFolders.push(...folders);
        
        // Если есть еще результаты, продолжаем запрашивать
        if (response.result.has_more) {
          await listFolders(path, response.result.cursor);
        }
      }
      
      // Запускаем получение папок
      await listFolders(folderPath);

      return { statusCode: 200, headers, body: JSON.stringify(allFolders) };
    } catch (error) {
      console.error('Error getting folders:', error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ошибка получения папок: ' + error.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Метод не поддерживается' }) };
}; 