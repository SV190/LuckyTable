const fetch = require('node-fetch');
const { Dropbox } = require('dropbox');

async function getAccessToken() {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const clientId = process.env.DROPBOX_CLIENT_ID;
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET;

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

exports.handler = async function(event) {
  try {
    const body = event.body || '{}';
    console.log('Request body:', body);
    const { path } = JSON.parse(body);
    if (!path) {
      console.log('Path not provided!');
      return { statusCode: 400, body: 'Неверные параметры' };
    }
    const accessToken = await getAccessToken();
    const dbx = new Dropbox({ accessToken });
    const result = await dbx.filesDeleteV2({ path });
    console.log('Delete result:', result);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    console.error('Error in dropbox-delete:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message, stack: e.stack }) };
  }
}; 