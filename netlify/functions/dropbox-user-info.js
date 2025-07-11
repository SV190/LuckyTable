const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Получить refresh token пользователя из базы (userId = 1)
async function getUserRefreshToken(userId) {
  const dbPath = path.join(__dirname, 'users.db');
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.get('SELECT dropboxRefreshToken FROM User WHERE id = ?', [userId], (err, row) => {
      db.close();
      if (err) reject(err);
      else resolve(row ? row.dropboxRefreshToken : null);
    });
  });
}

// Обменять refresh token на access token
async function getAccessToken(refreshToken, clientId, clientSecret) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error('Failed to get access token from Dropbox: ' + text);
  }
  const data = await response.json();
  return data.access_token;
}

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event));
    // userId временно жёстко 1
    const userId = 1;
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Dropbox client_id/client_secret not set in env' })
      };
    }
    const refreshToken = await getUserRefreshToken(userId);
    if (!refreshToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No Dropbox refresh token for user' })
      };
    }
    const accessToken = await getAccessToken(refreshToken, clientId, clientSecret);
    console.log('Got access token:', accessToken ? accessToken.substring(0, 6) + '...' : 'undefined');

    // Получаем email и id
    const accountRes = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const accountText = await accountRes.text();
    let account;
    try {
      account = JSON.parse(accountText);
    } catch (e) {
      console.error('Failed to parse account response:', accountText);
      throw new Error('Invalid JSON from Dropbox (account)');
    }
    console.log('Account response:', account);
    if (!account.email || !account.account_id) {
      console.error('Dropbox account error:', account);
      return {
        statusCode: accountRes.status,
        body: JSON.stringify({ error: 'Failed to get Dropbox account info', details: account })
      };
    }

    // Получаем информацию о хранилище
    const spaceRes = await fetch('https://api.dropboxapi.com/2/users/get_space_usage', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const spaceText = await spaceRes.text();
    let space;
    try {
      space = JSON.parse(spaceText);
    } catch (e) {
      console.error('Failed to parse space response:', spaceText);
      throw new Error('Invalid JSON from Dropbox (space)');
    }
    console.log('Space response:', space);
    if (!space.used || !space.allocation || !space.allocation.allocated) {
      console.error('Dropbox space error:', space);
      return {
        statusCode: spaceRes.status,
        body: JSON.stringify({ error: 'Failed to get Dropbox space info', details: space })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        email: account.email,
        account_id: account.account_id,
        spaceUsed: space.used,
        spaceTotal: space.allocation.allocated
      })
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
}; 