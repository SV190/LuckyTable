// Dropbox Storage Service
export class DropboxStorageService {
  constructor() {
    this.clientId = '8nw2cgvlalf08um'; // Dropbox App Key
    this.redirectUri = window.location.origin + '/';
    this.dbx = null;
    this.accessToken = null;
    this.isAuthenticated = false;
    this.userInfo = null;
    this.Dropbox = null; // Будет загружен динамически
  }

  // Определяем базовый URL API в зависимости от окружения
  getApiBaseUrl() {
    if (import.meta.env.DEV) {
      return 'http://localhost:3000/api'
    }
    // В production используем текущий домен
    return window.location.origin + '/api'
  }

  // Динамическая загрузка Dropbox SDK
  async loadDropboxSDK() {
    if (this.Dropbox) {
      return this.Dropbox;
    }

    try {
      const dropboxModule = await import('dropbox');
      this.Dropbox = dropboxModule.Dropbox;
      return this.Dropbox;
    } catch (error) {
      console.error('Ошибка загрузки Dropbox SDK:', error);
      throw new Error('Не удалось загрузить Dropbox SDK: ' + error.message);
    }
  }

  // Создание экземпляра Dropbox с проверкой
  async createDropboxInstance(options) {
    const Dropbox = await this.loadDropboxSDK();
    
    try {
      const instance = new Dropbox(options);
      return instance;
    } catch (error) {
      console.error('Ошибка создания экземпляра Dropbox:', error);
      throw error;
    }
  }

  // Получение URL для авторизации (authorization code flow)
  async getAuthUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      token_access_type: 'offline', // чтобы получить refresh token
    });
    const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
    return authUrl;
  }

  // Обработка ответа от OAuth (authorization code flow)
  async handleAuthResponse() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    if (error) {
      console.error('Ошибка OAuth Dropbox:', error);
      throw new Error(`Ошибка авторизации: ${error}`);
    }
    if (code) {
      // Отправляем code на сервер для обмена на refresh token
      try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/.netlify/functions/dropbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ code, redirect_uri: this.redirectUri })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка сохранения refresh token');
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
        this.isAuthenticated = true;
        return true;
      } catch (e) {
        throw new Error('Ошибка обмена кода на refresh token: ' + e.message);
      }
    }
    return false;
  }

  // Инициализация сервиса
  async initialize() {
    if (this.isAuthenticated) {
      return true;
    }
    try {
      // Проверяем, есть ли сохраненные токены
      const userToken = localStorage.getItem('user_token');
      if (!userToken) {
        return false;
      }

      // Проверяем подключение к Dropbox через сервер
      try {
        const response = await fetch('/.netlify/functions/dropbox', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        if (response.ok) {
          this.isAuthenticated = true;
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    } catch (error) {
      console.error('Error initializing Dropbox service:', error);
      return false;
    }
  }

  // Аутентификация пользователя
  async authenticate() {
    if (this.isAuthenticated) {
      return true;
    }
    const authUrl = await this.getAuthUrl();
    window.location.href = authUrl;
  }

  // Получение информации о пользователе
  async getUserInfo() {
    try {
      const userToken = localStorage.getItem('user_token');
      const response = await fetch('/.netlify/functions/dropbox-user-info', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (response.ok) {
        const userInfo = await response.json();
        // Унифицируем структуру для фронта
        let spaceUsed = userInfo.spaceUsed || userInfo.used || userInfo.used_space || 0;
        let spaceTotal = userInfo.spaceTotal || userInfo.allocation?.allocated || userInfo.total || userInfo.allocation || 0;
        // Если allocation — объект, ищем allocated
        if (typeof spaceTotal === 'object' && spaceTotal.allocated) {
          spaceTotal = spaceTotal.allocated;
        }
        // Логируем для диагностики
        if (!spaceUsed || !spaceTotal) {
          console.warn('Dropbox userInfo: структура не совпадает, userInfo =', userInfo);
        }
        this.userInfo = { ...userInfo, spaceUsed, spaceTotal };
        return this.userInfo;
      } else {
        throw new Error('Failed to get user info');
      }
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  // Получение списка файлов (через сервер)
  async getUserFiles(path = '', retryCount = 0) {
    try {
      const userToken = localStorage.getItem('user_token');
      const url = path ? `/.netlify/functions/dropbox?path=${encodeURIComponent(path)}` : '/.netlify/functions/dropbox';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        // Попытка получить подробную ошибку
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { error: 'Ошибка получения файлов' };
        }
        // Обработка ошибки 429 (Too Many Requests)
        if (response.status === 429 && error && error.error && error.error.retry_after && retryCount < 3) {
          const waitTime = error.error.retry_after * 1000;
          await new Promise(res => setTimeout(res, waitTime));
          return this.getUserFiles(path, retryCount + 1);
        }
        throw new Error(error.error || 'Ошибка получения файлов');
      }
      
      const files = await response.json();
      return files;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }

  // Получение папок
  async getFolders(parentPath = '') {
    try {
      const userToken = localStorage.getItem('user_token');
      const response = await fetch(`/.netlify/functions/dropbox-folders?path=${encodeURIComponent(parentPath)}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка получения папок');
      }
      
      const folders = await response.json();
      return folders.filter(f => f.isFolder);
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  }

  // Загрузка файла
  async downloadFile(filePath) {
    try {
      const userToken = localStorage.getItem('user_token');
      const body = JSON.stringify({ path: filePath });
      const response = await fetch('/.netlify/functions/dropbox-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body
      });
      if (!response.ok) {
        throw new Error('Ошибка загрузки файла: ' + response.status);
      }
      let text = await response.text();
      // Если ответ похож на JSON (начинается с { или [), парсим и возвращаем как есть
      const isJson = text.trim().startsWith('{') || text.trim().startsWith('[');
      if (isJson) {
        try {
          const data = JSON.parse(text);
          return data;
        } catch (e) {
          console.error('Ошибка парсинга JSON:', e);
          throw new Error('Ошибка парсинга JSON');
        }
      }
      // Иначе — декодируем как base64
      let base64 = text.replace(/^"|"$/g, '').replace(/\s+/g, '');
      function base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
      return base64ToArrayBuffer(base64);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Загрузка файла на Dropbox
  async uploadFile(filePath, fileData) {
    try {
      const userToken = localStorage.getItem('user_token');
      const body = JSON.stringify({ path: filePath, data: fileData });
      const response = await fetch('/.netlify/functions/dropbox-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка загрузки файла');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Удаление файла
  async deleteFile(filePath) {
    try {
      const userToken = localStorage.getItem('user_token');
      const response = await fetch('/.netlify/functions/dropbox-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ path: filePath })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления файла');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Создание папки
  async createFolder(folderPath) {
    try {
      const userToken = localStorage.getItem('user_token');
      const response = await fetch('/.netlify/functions/dropbox-create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ path: folderPath })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания папки');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // Перемещение файла или папки
  async moveFile(fromPath, toPath) {
    try {
      const userToken = localStorage.getItem('user_token');
      const response = await fetch('/.netlify/functions/dropbox-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ from_path: fromPath, to_path: toPath })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка перемещения файла или папки');
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error moving file or folder:', error);
      throw error;
    }
  }

  // Выход из Dropbox
  logout() {
    this.isAuthenticated = false;
    this.userInfo = null;
    this.accessToken = null;
    this.dbx = null;
  }

  // Проверка конфигурации
  checkConfiguration() {
    return {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      isAuthenticated: this.isAuthenticated
    };
  }

  // Получение информации о пользователе синхронно
  getUserInfoSync() {
    return this.userInfo;
  }

  // Получение всего содержимого (файлы и папки) в корне Dropbox
  async getAllRootContents() {
    try {
      const userToken = localStorage.getItem('user_token');
      const response = await fetch('/.netlify/functions/dropbox-folders?path=', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка получения содержимого');
      }
      const folders = await response.json();
      // Теперь получаем файлы
      const filesResponse = await fetch('/.netlify/functions/dropbox', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (!filesResponse.ok) {
        const error = await filesResponse.json();
        throw new Error(error.error || 'Ошибка получения файлов');
      }
      const files = await filesResponse.json();
      // Логируем всё содержимое
      console.log('ВСЕ ПАПКИ В КОРНЕ:', folders);
      console.log('ВСЕ ФАЙЛЫ В КОРНЕ:', files);
      // Возвращаем объединённый массив
      return { folders, files };
    } catch (error) {
      console.error('Ошибка получения всего содержимого корня Dropbox:', error);
      throw error;
    }
  }
}

// Экспортируем экземпляр сервиса
export const dropboxStorage = new DropboxStorageService(); 