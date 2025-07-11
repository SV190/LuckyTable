const { Dropbox } = require('dropbox');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');

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

exports.handler = async (event) => {
  try {
    // Логируем входящие данные
    console.log('=== dropbox-download.js function called ===');
    console.log('HTTP METHOD:', event.httpMethod);
    console.log('HEADERS:', JSON.stringify(event.headers));
    console.log('BODY RAW:', event.body);

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Allow': 'POST', 'Access-Control-Allow-Origin': '*' },
        body: 'Method Not Allowed',
      };
    }

    const parsed = JSON.parse(event.body || '{}');
    const filePath = parsed.path || parsed.filePath;
    if (!filePath) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No file path provided' }),
      };
    }

    // Используем refreshToken, clientId и clientSecret для авторизации
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Dropbox credentials are not configured' }),
      };
    }

    const dbx = new Dropbox({
      clientId,
      clientSecret,
      refreshToken,
      fetch
    });

    const file = await dbx.filesDownload({ path: filePath });
    const fileContents = file.result.fileBinary;
    const fileName = file.result.name || 'file.xlsx';

    // Определяем тип файла по расширению
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const isJson = ['json', 'luckysheet', 'txt'].includes(ext);

    if (isJson) {
      // Для текстовых/JSON файлов возвращаем строку
      const text = Buffer.from(fileContents).toString('utf-8');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Access-Control-Allow-Origin': '*',
        },
        body: text,
      };
    } else {
      // Для бинарных файлов возвращаем base64
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Access-Control-Allow-Origin': '*',
        },
        body: Buffer.from(fileContents).toString('base64'),
        isBase64Encoded: true,
      };
    }
  } catch (e) {
    console.error('dropbox-download error:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
}; 