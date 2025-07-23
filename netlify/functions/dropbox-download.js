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

exports.handler = async (event) => {
  // Определяем заголовки на верхнем уровне функции
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  try {
    // Логируем входящие данные
    console.log('=== dropbox-download.js function called ===');
    console.log('HTTP METHOD:', event.httpMethod);
    console.log('HEADERS:', JSON.stringify(event.headers));
    console.log('BODY RAW:', event.body);

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Проверка наличия токена авторизации
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Неверный токен' }),
      };
    }

    const parsed = JSON.parse(event.body || '{}');
    const filePath = parsed.path || parsed.filePath;
    if (!filePath) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file path provided' }),
      };
    }

    // Используем глобальный refresh token вместо пользовательского
    const refreshToken = DROPBOX_REFRESH_TOKEN;
    if (!refreshToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Dropbox не настроен в переменных окружения' }),
      };
    }

    const accessToken = await getAccessToken(refreshToken);
    const dbx = new Dropbox({ accessToken, fetch });

    let file, fileContents, fileName;
    try {
      file = await dbx.filesDownload({ path: filePath });
      fileContents = file.result.fileBinary;
      fileName = file.result.name || 'file.xlsx';
    } catch (downloadError) {
      console.error('Error downloading file from Dropbox:', downloadError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Файл не найден: ${filePath}`, details: downloadError.message }),
      };
    }

    // Определяем тип файла по расширению
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    
    // Для Excel файлов и других бинарных файлов возвращаем данные в base64
    if (ext === 'xlsx' || ext === 'xls' || 
        ext === 'pdf' || ext === 'doc' || ext === 'docx' || 
        ext === 'ppt' || ext === 'pptx' || ext === 'zip' || 
        ext === 'rar' || ext === 'png' || ext === 'jpg' || 
        ext === 'jpeg' || ext === 'gif') {
      
      // Преобразуем бинарные данные в base64
      const base64Data = Buffer.from(fileContents).toString('base64');
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: base64Data,
          fileName: fileName,
          isBase64: true,
          mimeType: getMimeType(ext)
        }),
        isBase64Encoded: false
      };
    } 
    // Для текстовых файлов возвращаем текст
    else if (ext === 'json' || ext === 'txt' || ext === 'csv' || ext === 'html' || ext === 'css' || ext === 'js') {
      const text = fileContents.toString('utf-8');
      return {
        statusCode: 200,
        headers,
        body: text,
      };
    } 
    // Для всех остальных файлов возвращаем base64 по умолчанию
    else {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: Buffer.from(fileContents).toString('base64'),
          fileName: fileName,
          isBase64: true,
          mimeType: 'application/octet-stream'
        }),
        isBase64Encoded: false
      };
    }
  } catch (e) {
    console.error('dropbox-download error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message }),
    };
  }
};

// Функция для определения MIME-типа по расширению файла
function getMimeType(ext) {
  const mimeTypes = {
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}