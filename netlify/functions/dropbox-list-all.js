const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN || '';
const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID || '';
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET || '';

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

exports.handler = async function(event) {
  // Настройка CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Обработка preflight запросов
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Проверка наличия токена
  const token = event.headers.authorization?.split(' ')[1];
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Неверный токен' })
    };
  }

  if (event.httpMethod === 'GET') {
    try {
      const accessToken = await getAccessToken();
      const dbx = new Dropbox({ accessToken, fetch });
      
      // Получаем все файлы и папки рекурсивно
      const allItems = [];
      
      async function listAllItems(cursor = null) {
        let response;
        
        if (cursor) {
          response = await dbx.filesListFolderContinue({ cursor });
        } else {
          response = await dbx.filesListFolder({
            path: '',
            recursive: true,
            include_deleted: false,
            limit: 2000
          });
        }
        
        // Добавляем элементы из текущего ответа
        const items = response.result.entries.map(entry => ({
          id: entry.id,
          name: entry.name,
          path: entry.path_lower,
          updatedAt: entry.server_modified,
          size: entry.size,
          isFolder: entry['.tag'] === 'folder',
          tag: entry['.tag']
        }));
        
        allItems.push(...items);
        
        // Если есть еще результаты, продолжаем запрашивать
        if (response.result.has_more) {
          await listAllItems(response.result.cursor);
        }
      }
      
      // Запускаем получение всех элементов
      await listAllItems();
      
      // Разделяем на папки и файлы
      const folders = allItems.filter(item => item.isFolder);
      const files = allItems.filter(item => !item.isFolder);
      
      console.log(`Получено ${folders.length} папок и ${files.length} файлов из Dropbox`);
      
      // Строим дерево папок
      const folderTree = buildFolderTree(folders);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          folders,
          files,
          folderTree,
          total: allItems.length
        })
      };
    } catch (error) {
      console.error('Error listing all items:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Ошибка получения данных: ' + error.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Метод не поддерживается' })
  };
};

// Функция для построения дерева папок
function buildFolderTree(folders) {
  const map = {};
  const roots = [];
  
  // Сначала создаем все узлы
  folders.forEach(folder => {
    map[folder.path] = { ...folder, children: [] };
  });
  
  // Добавляем корневую папку
  map[''] = { id: 'root', name: 'Корневая папка', path: '', isFolder: true, children: [] };
  
  // Затем строим связи
  folders.forEach(folder => {
    const path = folder.path;
    const lastSlashIndex = path.lastIndexOf('/');
    
    if (lastSlashIndex === -1) {
      // Папка в корне
      map[''].children.push(map[path]);
    } else {
      // Вложенная папка
      const parentPath = path.substring(0, lastSlashIndex);
      if (map[parentPath]) {
        map[parentPath].children.push(map[path]);
      } else {
        // Если родительская папка не найдена, добавляем в корень
        map[''].children.push(map[path]);
      }
    }
  });
  
  return map[''];
}