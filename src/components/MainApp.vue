<template>
  <div id="app">
    <div class="app-container">
      
      <div class="main-layout">
        <div class="main-content">
          <FileManager @openFile="openFile" @logout="handleLogout" @goToAdmin="goToAdmin" />
        </div>
      </div>
      <div v-if="showSettings" class="settings-modal" @click="showSettings = false">
        <div class="settings-content" @click.stop>
          <h3>Настройки</h3>
          <div class="settings-section">
            <h4>Хранилище</h4>
            <div class="storage-options">
              <label>
                <input type="radio" v-model="storageType" value="local" />
                Локальное хранилище
              </label>
              <label>
                <input type="radio" v-model="storageType" value="dropbox" />
                Dropbox
              </label>
            </div>
          </div>
          <button @click="showSettings = false" class="close-btn">Закрыть</button>
        </div>
      </div>
    </div>
    <div v-if="currentFile" class="editor-container" :class="{ fullscreen: isFullscreen }">
      <EditorToolbar 
        :fileName="currentFile.name"
        @backToFiles="handleBackToFiles"
        @saveToCloud="handleSaveToCloud"
        @fullscreen="toggleFullscreen"
      />
      <LuckySheet 
        :fileData="currentFile"
        @update:fileData="updateFileData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import FileManager from './FileManager.vue'
import LuckySheet from './LuckySheet.vue'
import EditorToolbar from './EditorToolbar.vue'
import { dropboxStorage } from '../utils/dropboxStorage.js'
import { initializeDropboxIfNeeded } from '../composables/useDropboxInit.js'

const router = useRouter()
const { user, isAdmin, logout, isAuthenticated } = useAuth()

const showSettings = ref(false)
const storageType = ref('local')
const currentFile = ref(null)
const isFullscreen = ref(false)

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

const goToAdmin = () => {
  router.push('/admin')
}

const openFile = (file) => {
  currentFile.value = {
    name: file.name,
    path: file.path, // <-- обязательно!
    data: file.data,
    isNew: file.isNew || false
  }
}

const closeFile = () => {
  currentFile.value = null
}

const saveFile = (data) => {
  if (currentFile.value) {
    currentFile.value.data = data
    // Здесь можно добавить логику сохранения
  }
}

const updateFileData = (data) => {
  if (currentFile.value) {
    currentFile.value.data = data.data || data;
  }
}

// === Новые обработчики ===
const handleBackToFiles = () => {
  currentFile.value = null
}

const handleSaveToCloud = async () => {
  console.log('=== Сохранение файла ===');
  console.log('currentFile:', currentFile.value);
  if (currentFile.value && currentFile.value.path && currentFile.value.data) {
    const filePath = currentFile.value.path; // сохраняем по исходному пути
    console.log('Путь к файлу:', filePath);
    console.log('Данные для сохранения:', currentFile.value.data);
    try {
      const jsonString = JSON.stringify(currentFile.value.data);
      const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
      console.log('base64Data (первые 200 символов):', base64Data.slice(0, 200));
      const result = await dropboxStorage.uploadFile(filePath, base64Data);
      console.log('Результат ответа от сервера:', result);
      alert('Файл успешно сохранён в Dropbox!');
    } catch (e) {
      console.error('Ошибка при сохранении в Dropbox:', e);
      alert('Ошибка при сохранении в Dropbox: ' + (e.message || e));
    }
  } else {
    console.warn('Нет данных для сохранения или не указан путь файла!', currentFile.value);
    alert('Нет данных для сохранения или не указан путь файла!');
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  const editor = document.querySelector('.editor-container')
  if (isFullscreen.value) {
    if (editor.requestFullscreen) {
      editor.requestFullscreen()
    } else if (editor.webkitRequestFullscreen) {
      editor.webkitRequestFullscreen()
    } else if (editor.mozRequestFullScreen) {
      editor.mozRequestFullScreen()
    } else if (editor.msRequestFullscreen) {
      editor.msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
}

onMounted(() => {
  if (isAuthenticated.value) {
    // initializeDropboxIfNeeded() // УДАЛЕНО
  }
})
</script>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-layout {
  display: flex;
  flex: 1;
  height: 100%;
  flex-direction: row;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
}

.settings-section {
  margin: 24px 0;
}

.settings-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.storage-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.storage-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.close-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.close-btn:hover {
  background: #2563eb;
}

.editor-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: white;
}

.editor-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: white;
  width: 100vw;
  height: 100vh;
}
</style> 