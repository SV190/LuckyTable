const fetch = require('node-fetch');
const { getUserFromToken, getDropboxAccessToken } = require('./dropbox-admin');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    const userToken = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(userToken);
    if (!user || !user.dropboxRefreshToken) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Нет Dropbox refresh token для пользователя' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    let bodyObj;
    try {
      bodyObj = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in body' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    const { from_path, to_path } = bodyObj;
    if (!from_path || !to_path) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'from_path и to_path обязательны' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Получаем access token по refresh token
    const accessToken = await getDropboxAccessToken(user.dropboxRefreshToken);
    if (!accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Не удалось получить access token Dropbox' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Вызов Dropbox API для перемещения
    const moveResp = await fetch('https://api.dropboxapi.com/2/files/move_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_path,
        to_path,
        autorename: true
      })
    });
    const moveData = await moveResp.json();
    if (!moveResp.ok) {
      return {
        statusCode: moveResp.status,
        body: JSON.stringify({ error: moveData.error_summary || 'Ошибка Dropbox API' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(moveData),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('dropbox-move error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 