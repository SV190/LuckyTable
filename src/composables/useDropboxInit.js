import { dropboxStorage } from '../utils/dropboxStorage.js'

export function initializeDropboxIfNeeded() {
  console.log('initializeDropboxIfNeeded вызван');
  // Не await — не блокируем интерфейс
  dropboxStorage.initialize()
    .then(isAuth => {
      if (isAuth) {
        dropboxStorage.getFolders('')
        dropboxStorage.getUserFiles('')
      }
    })
    .catch(e => {
      // Ошибка — Dropbox не подключён или не настроен
      console.error('Ошибка инициализации Dropbox:', e)
    })
} 