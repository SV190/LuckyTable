import { ref } from 'vue';

export const accessToken = ref(null);
export const dbx = ref(null);
export const userInfo = ref(null);
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
  console.log('loadDropboxFolders вызван, isDropboxAuthenticated:', isDropboxAuthenticated.value);
  try {
    const userToken = localStorage.getItem('user_token');
    // Новый endpoint и структура
    const response = await fetch('/.netlify/functions/dropbox-folders?path=', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    if (!response.ok) {
      console.log('loadDropboxFolders: response not ok');
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
    console.log('folders после загрузки:', folders.value);
  } catch (e) {
    folders.value = [{ id: 'root', name: 'Мои файлы', path: '' }];
    console.log('loadDropboxFolders: ошибка', e);
  } finally {
    isLoadingFolders = false;
  }
};

const loadDropboxFiles = async (path = '') => {
  if (!isDropboxAuthenticated.value) return;
  console.log('loadDropboxFiles вызван, isDropboxAuthenticated:', isDropboxAuthenticated.value, 'path:', path);
  try {
    const userToken = localStorage.getItem('user_token');
    const url = path ? `/.netlify/functions/dropbox?path=${encodeURIComponent(path)}` : '/.netlify/functions/dropbox';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    if (!response.ok) {
      console.log('loadDropboxFiles: response not ok');
      return;
    }
    const dropboxFiles = await response.json();
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
    console.log('files после загрузки:', files.value);
  } catch (e) {
    files.value = [];
    console.log('loadDropboxFiles: ошибка', e);
  }
};

// Новая функция для одновременной загрузки папок и файлов
const loadDropboxData = async () => {
  console.log('loadDropboxData вызван');
  console.log('folders до loadDropboxFolders:', folders.value);
  await loadDropboxFolders();
  console.log('folders после loadDropboxFolders:', folders.value);
  console.log('files до loadDropboxFiles:', files.value);
  await loadDropboxFiles();
  console.log('files после loadDropboxFiles:', files.value);
};

export function useDropbox() {
  return {
    accessToken,
    userInfo,
    folders,
    files,
    error,
    isDropboxAuthenticated,
    initializeDropbox,
    loadDropboxFolders,
    loadDropboxFiles,
    loadDropboxData
  };
} 