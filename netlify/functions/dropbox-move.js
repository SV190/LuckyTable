const fetch = require('node-fetch');
const { getUserFromToken, getDropboxAccessToken } = require('./dropbox-admin');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid Authorization header' })
      };
    }
    const userToken = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(userToken);
    if (!user || !user.dropboxRefreshToken) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Нет Dropbox refresh token для пользователя' })
      };
    }

    let bodyObj;
    try {
      bodyObj = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in body' })
      };
    }
    const { from_path, to_path } = bodyObj;
    if (!from_path || !to_path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'from_path и to_path обязательны' })
      };
    }

    // Получаем access token по refresh token
    const accessToken = await getDropboxAccessToken(user.dropboxRefreshToken);
    if (!accessToken) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Не удалось получить access token Dropbox' })
      };
    }

    // Вызов Dropbox API для перемещения
    const moveResp = await fetch('https://api.dropbox.com/2/files/move_v2', {
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
        headers,
        body: JSON.stringify({ error: moveData.error_summary || 'Ошибка Dropbox API' })
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(moveData)
    };
  } catch (error) {
    console.error('dropbox-move error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};