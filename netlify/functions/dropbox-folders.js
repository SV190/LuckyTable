const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');

async function getAccessToken(refreshToken) {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
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

async function getUserRefreshToken(userId) {
  try {
    const usersPath = path.join(__dirname, 'users.json');
    if (!fs.existsSync(usersPath)) {
      console.log('users.json not found');
      return null;
    }
    
    const usersData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(usersData);
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

  // Проверка токена (аналогично dropbox.js)
  const token = event.headers.authorization?.split(' ')[1];
  if (!token || token !== 'test-token-123') {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Неверный токен' }) };
  }

  if (event.httpMethod === 'GET') {
    try {
      const userId = 1;
      const refreshToken = await getUserRefreshToken(userId);
      if (!refreshToken) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Dropbox не подключен' }) };
      }
      const accessToken = await getAccessToken(refreshToken);
      const dbx = new Dropbox({ accessToken });

      // Получаем путь из query string
      const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
      const folderPath = url.searchParams.get('path') || '';

      const response = await dbx.filesListFolder({ path: folderPath, limit: 100 });
      const folders = response.result.entries
        .filter(entry => entry['.tag'] === 'folder')
        .map(entry => ({
          id: entry.id,
          name: entry.name,
          path: entry.path_lower,
          isFolder: true
        }));

      return { statusCode: 200, headers, body: JSON.stringify(folders) };
    } catch (error) {
      console.error('Error getting folders:', error);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ошибка получения папок' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Метод не поддерживается' }) };
}; 