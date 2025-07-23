import { ref } from 'vue';

export const accessToken = ref(null);
export const dbx = ref(null);
export const dropboxUserInfo = ref(null);
export const folders = ref([]);
export const files = ref([]);
export const error = ref(null);
export const isDropboxAuthenticated = ref(false);
let isLoadingFolders = false;

const initializeDropbox = async () => {
  try {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      isDropboxAuthenticated.value = false;
      return false;
    }
    const response = await fetch('/.netlify/functions/dropbox', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    if (response.ok) {
      isDropboxAuthenticated.value = true;
      return true;
    } else {
      isDropboxAuthenticated.value = false;
      return false;
    }
  } catch (e) {
    isDropboxAuthenticated.value = false;
    return false;
  }
};

const loadDropboxFolders = async () => {
  if (!isDropboxAuthenticated.value || isLoadingFolders) return;
  isLoadingFolders = true;
  try {
    const userToken = localStorage.getItem('user_token');
    // Запрашиваем все папки рекурсивно
    const response = await fetch('/.netlify/functions/dropbox-folders?path=&recursive=true', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    if (!response.ok) {
      return;
    }
    let dropboxFolders = await response.json();
    // dropboxFolders — это уже массив папок с isFolder: true
    let folderArr = [
      { id: 'root', name: 'Мои файлы', path: '' },
      ...dropboxFolders.map(f => ({
        id: f.id,
        name: f.name,
        path: f.path,
        isFolder: true
      }))
    ];
    if (!folderArr.find(f => f.id === 'root')) {
      folderArr.unshift({ id: 'root', name: 'Мои файлы', path: '' });
    }
    folders.value = folderArr;
    console.log('Загружено папок:', folderArr.length);
  } catch (e) {
    console.error('Ошибка загрузки папок:', e);
    folders.value = [{ id: 'root', name: 'Мои файлы', path: '' }];
  } finally {
    isLoadingFolders = false;
  }
};

const loadDropboxFiles = async (path = '') => {
  if (!isDropboxAuthenticated.value) return;
  try {
    const userToken = localStorage.getItem('user_token');
    // Загружаем все файлы рекурсивно
    const url = path ? 
      `/.netlify/functions/dropbox?path=${encodeURIComponent(path)}&recursive=true` : 
      '/.netlify/functions/dropbox?recursive=true';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    if (!response.ok) {
      console.error('Ошибка загрузки файлов:', response.status, response.statusText);
      return;
    }
    
    const dropboxFiles = await response.json();
    console.log('Загружено файлов:', dropboxFiles.length);
    
    files.value = dropboxFiles
      .filter(f => !f.isFolder && (f['.tag'] === 'file' || f.isFolder === false))
      .map(f => ({
        id: f.id,
        name: f.name,
        path: f.path || f.path_display || f.path_lower,
        updatedAt: f.updatedAt || f.server_modified,
        size: f.size,
        type: 'cloud',
      }));
  } catch (e) {
    console.error('Ошибка загрузки файлов:', e);
    files.value = [];
  }
};

// Функция для загрузки всех файлов и папок из Dropbox
const loadAllDropboxData = async () => {
  try {
    const userToken = localStorage.getItem('user_token');
    const response = await fetch('/.netlify/functions/dropbox-list-all', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    if (!response.ok) {
      console.error('Ошибка загрузки данных:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Загружено данных:', data.total, 'элементов');
    
    // Обновляем папки
    let folderArr = [
      { id: 'root', name: 'Мои файлы', path: '' },
      ...data.folders.map(f => ({
        id: f.id,
        name: f.name,
        path: f.path,
        isFolder: true
      }))
    ];
    folders.value = folderArr;
    
    // Обновляем файлы
    files.value = data.files.map(f => ({
      id: f.id,
      name: f.name,
      path: f.path,
      updatedAt: f.updatedAt,
      size: f.size,
      type: 'cloud',
    }));
    
    console.log('Папки:', folders.value.length);
    console.log('Файлы:', files.value.length);
  } catch (e) {
    console.error('Ошибка загрузки всех данных:', e);
  }
};

// Функция для одновременной загрузки папок и файлов
const loadDropboxData = async () => {
  try {
    // Сначала пробуем загрузить все данные сразу
    await loadAllDropboxData();
  } catch (e) {
    console.error('Ошибка загрузки всех данных, пробуем последовательно:', e);
    // Если не получилось, загружаем последовательно
    await loadDropboxFolders();
    await loadDropboxFiles();
  }
};

export function useDropbox() {
  return {
    accessToken,
    dropboxUserInfo,
    folders,
    files,
    error,
    isDropboxAuthenticated,
    initializeDropbox,
    loadDropboxFolders,
    loadDropboxFiles,
    loadDropboxData,
    loadAllDropboxData
  };
} 