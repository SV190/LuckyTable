<template>
  <div id="app">
    <div class="app-container">
      <!-- Навигационная панель -->
      <nav class="navbar">
        <div class="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>LuckySheet</span>
        </div>
        <div class="nav-user">
          <span class="user-email">{{ user?.email }}</span>
          <button v-if="isAdmin" @click="goToAdmin" class="admin-btn">
            Админ панель
          </button>
          <button @click="handleLogout" class="logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Выйти
          </button>
        </div>
      </nav>
      
      <div class="main-layout">
        <div class="main-content">
          <FileManager @openFile="openFile" />
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
    <div v-if="currentFile" class="editor-container">
      <EditorToolbar 
        :fileName="currentFile.name"
        @save="saveFile"
        @close="closeFile"
      />
      <LuckySheet 
        :data="currentFile.data"
        @update="updateFileData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import FileManager from './FileManager.vue'
import LuckySheet from './LuckySheet.vue'
import EditorToolbar from './EditorToolbar.vue'

const router = useRouter()
const { user, isAdmin, logout } = useAuth()

const showSettings = ref(false)
const storageType = ref('local')
const currentFile = ref(null)

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

const goToAdmin = () => {
  router.push('/admin')
}

const openFile = (file) => {
  currentFile.value = file
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
    currentFile.value.data = data
  }
}
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

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.25rem;
  color: #3b82f6;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  color: #6b7280;
  font-size: 0.875rem;
}

.admin-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.admin-btn:hover {
  background: #059669;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: #dc2626;
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
</style> 