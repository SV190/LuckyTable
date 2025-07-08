import { ref } from 'vue';
import { Dropbox } from 'dropbox';

const accessToken = ref(null);
const dbx = ref(null);
const userInfo = ref(null);
const folders = ref([]);
const error = ref(null);

export function useDropbox() {
  // Авторизация Dropbox (OAuth 2.0 PKCE flow)
  const authorize = () => {
    const CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID;
    const REDIRECT_URI = window.location.origin + '/dropbox-auth';
    const url = `https://www.dropbox.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = url;
  };

  // Установить access token (после редиректа)
  const setToken = (token) => {
    accessToken.value = token;
    dbx.value = new Dropbox({ accessToken: token });
  };

  // Получить информацию о пользователе
  const fetchUserInfo = async () => {
    error.value = null;
    if (!dbx.value) return null;
    try {
      const res = await dbx.value.usersGetCurrentAccount();
      userInfo.value = res.result;
      return userInfo.value;
    } catch (err) {
      error.value = err.message;
      return null;
    }
  };

  // Получить список папок/файлов
  const fetchFolders = async (path = '') => {
    error.value = null;
    if (!dbx.value) return null;
    try {
      const res = await dbx.value.filesListFolder({ path });
      folders.value = res.result.entries;
      return folders.value;
    } catch (err) {
      error.value = err.message;
      return null;
    }
  };

  return {
    accessToken,
    userInfo,
    folders,
    error,
    authorize,
    setToken,
    fetchUserInfo,
    fetchFolders
  };
} 