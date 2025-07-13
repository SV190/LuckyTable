<template>
  <div class="admin-panel">
    <div class="admin-header">
      <div class="header-content">
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <h1>Админ-панель</h1>
        </div>
        <div class="header-actions">
          <a href="/" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Вернуться к приложению</span>
          </a>
        </div>
      </div>
    </div>

    <div class="admin-content">
      <!-- Основная панель -->
      <div class="dashboard">
        <div class="dashboard-header">
          <div class="welcome-section">
            <h2>Добро пожаловать, администратор!</h2>
            <p>Управляйте пользователями и настройками системы</p>
          </div>
          <button @click="logout" class="logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Выйти</span>
          </button>
        </div>

        <div class="dashboard-content">
          <!-- Статистика -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon users-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3>{{ users.length }}</h3>
                <p>Всего пользователей</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon active-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3>{{ activeUsers }}</h3>
                <p>Активных пользователей</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon blocked-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="stat-info">
                <h3>{{ blockedUsers }}</h3>
                <p>Заблокированных</p>
              </div>
            </div>
          </div>

          <!-- Список пользователей -->
          <div class="users-section">
            <div class="section-header">
              <h3>Управление пользователями</h3>
              <button @click="showCreateModal = true" class="create-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Создать пользователя</span>
              </button>
            </div>
            <div v-if="users.length === 0" class="empty-state">Нет пользователей</div>
            <div v-else class="users-table">
              <div class="table-header">
                <div class="table-cell">ID</div>
                <div class="table-cell">Логин</div>
                <div class="table-cell">Роль</div>
                <div class="table-cell">Статус</div>
                <div class="table-cell">Dropbox</div>
                <div class="table-cell">Действия</div>
              </div>
              <div v-for="user in users" :key="user.id" class="table-row">
                <div class="table-cell">{{ user.id }}</div>
                <div class="table-cell">{{ user.username }}</div>
                <div class="table-cell">
                  <span :class="['role-badge', user.role === 'admin' ? 'admin' : 'user']">
                    {{ user.role === 'admin' ? 'Админ' : 'Пользователь' }}
                  </span>
                </div>
                <div class="table-cell">
                  <span :class="['status-badge', user.is_blocked ? 'blocked' : 'active']">
                    {{ user.is_blocked ? 'Заблокирован' : 'Активен' }}
                  </span>
                </div>
                <div class="table-cell">
                  <span v-if="user.dropboxRefreshToken && typeof user.dropboxRefreshToken === 'string' && user.dropboxRefreshToken.length > 10" class="status-badge connected">
                    Подключен
                  </span>
                  <span v-else class="status-badge disconnected">
                    Не подключен
                  </span>
                </div>
                <div class="table-cell actions-cell">
                  <button 
                    v-if="user.id !== currentUserId && user.role !== 'admin'" 
                    @click="toggleBlock(user)"
                    :class="['action-btn', user.is_blocked ? 'unblock' : 'block']"
                    :disabled="isLoading"
                  >
                    {{ user.is_blocked ? 'Разблокировать' : 'Заблокировать' }}
                  </button>
                  <button 
                    v-if="!user.dropboxRefreshToken" 
                    @click="autoConnectDropbox(user)"
                    class="action-btn connect"
                    :disabled="isLoading"
                  >
                    Подключить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания пользователя -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self.stop>
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Создать пользователя</h3>
          <button @click="showCreateModal = false" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="createUser" class="modal-form">
          <div class="form-group">
            <label for="newLogin">Логин</label>
            <input 
              id="newLogin"
              v-model="newUser.login" 
              type="text" 
              placeholder="Введите логин"
              required
              @input="clearCreateError"
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">Пароль</label>
            <input 
              id="newPassword"
              v-model="newUser.password" 
              type="password" 
              placeholder="Введите пароль"
              autocomplete="new-password"
              required
              @input="clearCreateError"
            />
          </div>
          
          <div class="form-group">
            <div class="form-checkbox">
              <input type="checkbox" id="isAdmin" v-model="newUser.is_admin" />
              <label for="isAdmin">Администратор</label>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else>Создать</span>
            </button>
          </div>
          
          <div v-if="createError" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {{ createError }}
          </div>
          
          <div v-if="createSuccess" class="success-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            Пользователь успешно создан!
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно настройки Dropbox -->
    <div v-if="showDropboxModal" class="modal-overlay" @click="showDropboxModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Подключить Dropbox</h3>
          <button @click="showDropboxModal = false" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-form">
          <div class="form-group">
            <label for="dropboxRefreshToken">Refresh Token</label>
            <input 
              id="dropboxRefreshToken"
              v-model="dropboxConfig.refreshToken" 
              type="text" 
              placeholder="Введите refresh token"
            />
          </div>
          <div class="form-group">
            <label for="userSelect">Пользователь</label>
            <select id="userSelect" v-model="selectedUserId">
                              <option v-for="user in (Array.isArray(users) ? users : []).filter(u => !u.is_admin)" :key="user.id" :value="user.id">
                {{ user.username }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showDropboxModal = false" class="btn btn-secondary">
              Отмена
            </button>
            <button @click="saveDropboxConfig" class="btn btn-primary" :disabled="isLoading">
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else>Подключить</span>
            </button>
          </div>
          <div v-if="dropboxError" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {{ dropboxError }}
          </div>
          <div v-if="dropboxSuccess" class="success-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            Dropbox успешно подключен!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useRouter } from 'vue-router'
// import.meta.env;
import axios from 'axios';

const router = useRouter()
const { user, logout: authLogout, getToken } = useAuth()

const currentUserId = ref(null)
if (user && user.value && user.value.id) {
  currentUserId.value = user.value.id
}

const users = ref([])
const isLoading = ref(false)
const createError = ref('')
const createSuccess = ref(false)
const showCreateModal = ref(false)
const showDropboxModal = ref(false)
const newUser = ref({ login: '', password: '', is_admin: false })

// Dropbox настройки
const dropboxConfig = ref({
  refreshToken: ''
})
const selectedUserId = ref(null)
const dropboxError = ref('')
const dropboxSuccess = ref(false)

const DROPBOX_REFRESH_TOKEN = import.meta.env.VITE_DROPBOX_REFRESH_TOKEN || import.meta.env.DROPBOX_REFRESH_TOKEN || '';

// Вычисляемые свойства для статистики
const activeUsers = computed(() => (Array.isArray(users.value) ? users.value : []).filter(u => !u.is_blocked).length)
const blockedUsers = computed(() => (Array.isArray(users.value) ? users.value : []).filter(u => u.is_blocked).length)
const connectedUsersCount = computed(() => (Array.isArray(users.value) ? users.value : []).filter(u => u.dropboxRefreshToken).length)
const dropboxRefreshToken = computed(() => DROPBOX_REFRESH_TOKEN || dropboxConfig.value.refreshToken)

const fetchUsers = async () => {
  try {
    isLoading.value = true
    const token = getToken()
    const response = await fetch('/.netlify/functions/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('Ошибка загрузки пользователей')
    const data = await response.json()
    
    // Проверяем, что data является массивом
    if (Array.isArray(data)) {
      users.value = data
    } else if (data && Array.isArray(data.users)) {
      users.value = data.users
    } else {
      console.error('Invalid users data format:', data)
      users.value = []
    }
    
    // Проверяем статус Dropbox подключений
    await checkDropboxStatus()
  } catch (e) {
    console.error('Error fetching users:', e)
    users.value = []
  } finally {
    isLoading.value = false
  }
}

const logout = () => {
  authLogout()
  router.push('/login')
}

const createUser = async () => {
  createError.value = ''
  createSuccess.value = false
  
  // Валидация на фронтенде
  if (!newUser.value.login.trim()) {
    createError.value = 'Введите логин'
    return
  }
  
  if (!newUser.value.password.trim()) {
    createError.value = 'Введите пароль'
    return
  }
  
  // Проверяем, не существует ли уже пользователь с таким логином
  const existingUser = Array.isArray(users.value) ? users.value.find(u => u.username === newUser.value.login.trim()) : null
  if (existingUser) {
    createError.value = 'Пользователь с таким логином уже существует'
    return
  }
  
  isLoading.value = true
  try {
    const token = getToken()
    const response = await fetch('/.netlify/functions/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: newUser.value.login.trim(),
        password: newUser.value.password,
        role: newUser.value.is_admin ? 'admin' : 'user'
      })
    })
    const data = await response.json()
    if (!response.ok) {
      // Обрабатываем специальную ошибку о существующем пользователе
      if (response.status === 409) {
        throw new Error('Пользователь с таким логином уже существует')
      } else if (response.status === 400) {
        throw new Error(data.error || 'Не все поля заполнены')
      } else {
        throw new Error(data.error || 'Ошибка создания пользователя')
      }
    }
    createSuccess.value = true
    newUser.value = { login: '', password: '', is_admin: false }
    showCreateModal.value = false
    await fetchUsers()
  } catch (e) {
    createError.value = e.message
  } finally {
    isLoading.value = false
  }
}

// Функция для очистки ошибки при изменении логина
const clearCreateError = () => {
  createError.value = ''
  createSuccess.value = false
}

const toggleBlock = async (user) => {
  isLoading.value = true
  try {
    const token = getToken()
    const response = await fetch('/.netlify/functions/block-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user.id,
        isBlocked: !user.is_blocked
      })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Ошибка блокировки')
    await fetchUsers()
  } catch (e) {
    console.error('Ошибка блокировки:', e)
  } finally {
    isLoading.value = false
  }
}

const connectDropbox = async (user) => {
  if (!DROPBOX_REFRESH_TOKEN) {
    alert('Токен Dropbox не задан в .env');
    return;
  }
  isLoading.value = true;
  try {
    const token = getToken();
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: user.id,
        dropboxRefreshToken: DROPBOX_REFRESH_TOKEN
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка подключения Dropbox');
    await fetchUsers();
  } catch (e) {
    alert(e.message);
  } finally {
    isLoading.value = false;
  }
};

const saveDropboxConfig = async () => {
  dropboxError.value = '';
  dropboxSuccess.value = false;
  isLoading.value = true;
  
  try {
    if (!dropboxConfig.value.refreshToken) {
      throw new Error('Refresh token обязателен');
    }
    if (!selectedUserId.value) {
      throw new Error('Выберите пользователя');
    }
    
    const token = getToken();
    
    const response = await fetch('/.netlify/functions/dropbox-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        refreshToken: dropboxConfig.value.refreshToken,
        userIds: [selectedUserId.value]
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.details || 'Ошибка подключения Dropbox');
    }
    
    dropboxSuccess.value = true;
    selectedUserId.value = null;
    dropboxConfig.value.refreshToken = '';
    await fetchUsers();
    
    // Закрываем модальное окно через 2 секунды
    setTimeout(() => {
      showDropboxModal.value = false;
      dropboxSuccess.value = false;
    }, 2000);
    
  } catch (e) {
    dropboxError.value = e.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchUsers()
})

// Функция для проверки статуса Dropbox подключений
const checkDropboxStatus = async () => {
  try {
    const token = getToken();
    const response = await fetch('/.netlify/functions/dropbox-admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Проверяем, что data.users существует и является массивом
      const dropboxUsers = data.users || [];
      
      // Обновляем информацию о пользователях с статусом Dropbox
      if (Array.isArray(users.value)) {
        users.value = users.value.map(user => {
          const dropboxUser = dropboxUsers.find(d => d.id === user.id);
          if (dropboxUser) {
            return {
              ...user,
              dropboxConnected: dropboxUser.dropboxConnected,
              dropboxError: dropboxUser.dropboxError
            };
          }
          return user;
        });
      }
    }
  } catch (error) {
    console.error('Error checking Dropbox status:', error);
  }
};

// В methods добавить функцию autoConnectDropbox
const autoConnectDropbox = async (user) => {
  try {
    isLoading.value = true;
    const token = getToken();
    const response = await axios.post(
      '/.netlify/functions/dropbox-admin',
      {
        userIds: [user.id],
        autoConnect: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = response.data;
    if (!response.status || response.status >= 400) throw new Error(data.error || 'Ошибка автоподключения Dropbox');
    await fetchUsers();
  } catch (e) {
    alert('Ошибка автоподключения Dropbox: ' + (e.message || e));
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
:root {
  --accent: #1f2937;
  --danger: #dc2626;
  --success: #059669;
  --warning: #d97706;
  --info: #2563eb;
  --gray-bg: #f9fafb;
  --border: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
}

.admin-panel {
  background: #ffffff;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.admin-header {
  background: #1f2937;
  color: white;
  border-bottom: 1px solid #374151;
  padding: 20px 0;
  margin-bottom: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: white;
  letter-spacing: -0.025em;
}

.header-actions .back-link {
  color: #d1d5db;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px 16px;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions .back-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.header-actions .back-link svg {
  flex-shrink: 0;
}

.header-actions .back-link span {
  white-space: nowrap;
}

.logout-btn {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout-btn:hover {
  background: #b91c1c;
}

.logout-btn svg {
  flex-shrink: 0;
}

.logout-btn span {
  white-space: nowrap;
}

.admin-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.dashboard {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.welcome-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.welcome-section p {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
  font-weight: 400;
}

.dashboard-content {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: var(--text-secondary);
}

.stat-info h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: var(--text-primary);
}

.stat-info p {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
  font-weight: 400;
}

.users-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.section-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.create-btn {
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.create-btn:hover {
  background: #374151;
}

.create-btn svg {
  flex-shrink: 0;
}

.create-btn span {
  white-space: nowrap;
}

.users-table {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid var(--border);
}

.table-header, .table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 120px 200px;
  align-items: center;
  min-width: 100%;
  gap: 16px;
}

.table-header {
  background: #f9fafb;
  font-weight: 600;
  color: var(--text-primary);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}



.table-row {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 8px 12px;
  font-size: 0.875rem;
  text-align: left;
  font-weight: 400;
  color: var(--text-primary);
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.role-badge.user {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.status-badge.blocked {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.status-badge.connected {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.status-badge.disconnected {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  background: white;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  min-width: fit-content;
}

.action-btn.block {
  border-color: #dc2626;
  color: #dc2626;
}

.action-btn.block:hover {
  background: #dc2626;
  color: white;
}

.action-btn.unblock {
  border-color: #059669;
  color: #059669;
}

.action-btn.unblock:hover {
  background: #059669;
  color: white;
}

.action-btn.connect {
  border-color: #2563eb;
  color: #2563eb;
}

.action-btn.connect:hover {
  background: #2563eb;
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px 16px;
  font-size: 0.875rem;
  font-weight: 400;
}

/* Модальные окна */
.modal-overlay {
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

.modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f3f4f6;
  color: var(--text-primary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1f2937;
  box-shadow: 0 0 0 2px rgba(31, 41, 55, 0.1);
}

.form-group input[type="text"],
.form-group input[type="password"] {
  background: #1f2937 !important;
  color: #fff !important;
  border: 2px solid #374151;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 0 0 1.5px #2563eb22;
}
.form-group input[type="text"]::placeholder,
.form-group input[type="password"]::placeholder {
  color: #cbd5e1;
  opacity: 1;
}
.form-group input[type="text"]:focus,
.form-group input[type="password"]:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #2563eb44;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-checkbox input {
  width: 16px;
  height: 16px;
  margin: 0;
}

.form-checkbox label {
  margin: 0;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #1f2937;
  color: white;
  border-color: #1f2937;
}

.btn-primary:hover {
  background: #374151;
  border-color: #374151;
}

.btn-secondary {
  background: white;
  color: var(--text-primary);
  border-color: var(--border);
}

.btn-secondary:hover {
  background: #f9fafb;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message,
.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.success-message {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.error-message svg,
.success-message svg {
  flex-shrink: 0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .admin-header {
    padding: 12px 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .logo {
    flex-direction: row;
    gap: 8px;
  }
  
  .logo h1 {
    font-size: 1.25rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .back-link {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
  }
  
  .admin-content {
    padding: 12px;
  }
  
  .dashboard {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .welcome-section h2 {
    font-size: 1.25rem;
  }
  
  .welcome-section p {
    font-size: 0.875rem;
  }
  
  .logout-btn {
    width: 100%;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-info h3 {
    font-size: 1.5rem;
  }
  
  .users-section {
    margin-top: 20px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .create-btn {
    width: 100%;
    justify-content: center;
  }
  
  .users-table {
    overflow-x: auto;
  }
  
  .table-header, .table-row {
    grid-template-columns: 100px 1fr 100px 100px 120px 140px;
    min-width: 700px;
    gap: 16px;
  }
  
  .table-cell {
    padding: 10px 8px;
    font-size: 0.75rem;
  }
  
  .actions-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .action-btn {
    padding: 4px 8px;
    font-size: 0.7rem;
    margin: 0;
  }
  
  .modal {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }
  
  .modal-header {
    padding: 12px 16px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .modal-form {
    gap: 12px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .admin-header {
    padding: 8px 12px;
  }
  
  .logo h1 {
    font-size: 1.125rem;
  }
  
  .admin-content {
    padding: 8px;
  }
  
  .dashboard {
    padding: 8px;
  }
  
  .welcome-section h2 {
    font-size: 1.125rem;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .stat-info h3 {
    font-size: 1.25rem;
  }
  
  .table-header, .table-row {
    grid-template-columns: 80px 1fr 90px 90px 100px 120px;
    min-width: 600px;
    gap: 12px;
  }
  
  .table-cell {
    padding: 8px 6px;
    font-size: 0.7rem;
  }
  
  .action-btn {
    padding: 3px 6px;
    font-size: 0.65rem;
  }
  
  .modal {
    margin: 8px;
    max-width: calc(100vw - 16px);
  }
  
  .modal-header {
    padding: 8px 12px;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .modal-form {
    gap: 8px;
  }
  
  .form-group label {
    font-size: 0.8rem;
  }
  
  .form-group input,
  .form-group select {
    padding: 6px 8px;
    font-size: 0.8rem;
  }
}

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card, .users-table {
  animation: fadeIn 0.3s ease-out;
}

/* Скроллбар */
.users-table::-webkit-scrollbar {
  height: 6px;
}

.users-table::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.users-table::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.users-table::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style> 