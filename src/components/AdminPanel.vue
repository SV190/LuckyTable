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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Вернуться к приложению
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Выйти
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
                Создать пользователя
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
                <div class="table-cell">{{ user.login }}</div>
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
                <!-- ВРЕМЕННО: выводим весь объект пользователя для отладки -->
                
                <div class="table-cell">
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
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Создать пользователя</h3>
          <button @click="showCreateModal = false" class="close-btn">
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
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">Пароль</label>
            <input 
              id="newPassword"
              v-model="newUser.password" 
              type="password" 
              placeholder="Введите пароль"
              required
            />
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newUser.is_admin" />
              <span class="checkmark"></span>
              Администратор
            </label>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="cancel-btn">
              Отмена
            </button>
            <button type="submit" class="submit-btn" :disabled="isLoading">
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
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Подключить Dropbox</h3>
          <button @click="showDropboxModal = false" class="close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-content-body">
          <div class="dropbox-setup-section">
            <h4>Введите refresh token для подключения пользователя к Dropbox</h4>
            <div class="form-group">
              <label for="dropboxRefreshToken">Refresh Token</label>
              <input 
                id="dropboxRefreshToken"
                v-model="dropboxConfig.refreshToken" 
                type="text" 
                placeholder="Введите refresh token"
                class="token-input"
              />
            </div>
            <div class="form-group">
              <label for="userSelect">Пользователь</label>
              <select id="userSelect" v-model="selectedUserId">
                <option v-for="user in users.filter(u => !u.is_admin)" :key="user.id" :value="user.id">
                  {{ user.login }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showDropboxModal = false" class="cancel-btn">
              Отмена
            </button>
            <button @click="saveDropboxConfig" class="submit-btn" :disabled="isLoading">
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
import.meta.env;
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
const activeUsers = computed(() => users.value.filter(u => !u.is_blocked).length)
const blockedUsers = computed(() => users.value.filter(u => u.is_blocked).length)
const connectedUsersCount = computed(() => users.value.filter(u => u.dropboxRefreshToken).length)
const dropboxRefreshToken = computed(() => DROPBOX_REFRESH_TOKEN || dropboxConfig.value.refreshToken)

const fetchUsers = async () => {
  try {
    isLoading.value = true
    const token = getToken()
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('Ошибка загрузки пользователей')
    const data = await response.json()
    users.value = data
    
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
  isLoading.value = true
  try {
    const token = getToken()
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        login: newUser.value.login,
        password: newUser.value.password,
        role: newUser.value.is_admin ? 'admin' : 'user'
      })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Ошибка создания пользователя')
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

const toggleBlock = async (user) => {
  isLoading.value = true
  try {
    const token = getToken()
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: user.id,
        is_blocked: !user.is_blocked
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
  --accent: #6366f1;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;
  --info: #2563eb;
  --gray-bg: #f8fafc;
}
.admin-panel {
  background: #fff;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}
.admin-header {
  background: #eef2ff;
  color: var(--accent);
  border-bottom: 1px solid #e0e0e0;
  padding: 18px 0 12px 0;
  margin-bottom: 18px;
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 18px;
}
.logo h1 {
  font-size: 1.4rem;
  font-weight: bold;
  margin-left: 8px;
  color: var(--accent);
}
.header-actions .back-link {
  color: var(--accent);
  background: none;
  border-radius: 4px;
  padding: 6px 12px;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid var(--accent);
  transition: background 0.2s, color 0.2s;
}
.header-actions .back-link:hover {
  background: #e0e7ff;
  color: #222;
}
.admin-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 12px;
}
.dashboard {
  background: #fff;
  border-radius: 0;
  box-shadow: none;
  padding: 18px 0 24px 0;
}
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.welcome-section h2 {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 2px;
  color: var(--accent);
}
.welcome-section p {
  color: #666;
  font-size: 0.98rem;
}
.logout-btn {
  background: none;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 7px 16px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.logout-btn:hover {
  background: #e0e7ff;
  color: #222;
}
.dashboard-content {
  padding: 0 12px;
}
.stats-grid {
  display: flex;
  gap: 18px;
  margin-bottom: 18px;
}
.stat-card {
  flex: 1;
  background: #f5f7ff;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  align-items: center;
  padding: 12px 14px;
  min-width: 0;
  border: 1px solid #e0e0e0;
}
.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: var(--accent);
}
.stat-info h3 {
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0;
  color: var(--accent);
}
.stat-info p {
  color: #666;
  font-size: 0.98rem;
  margin: 0;
}
.users-section {
  margin-top: 18px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.section-header h3 {
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
  color: var(--accent);
}
.create-btn {
  background: none;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 7px 16px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s, color 0.2s;
}
.create-btn:hover {
  background: #e0e7ff;
  color: #222;
}
.users-table {
  background: #fff;
  border-radius: 0;
  box-shadow: none;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
}
.table-header, .table-row {
  display: flex;
  align-items: center;
  min-width: 700px;
}
.table-header {
  background: #eef2ff;
  font-weight: bold;
  color: var(--accent);
  border-radius: 0;
  padding: 8px 0;
}
.table-row {
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.15s;
}
.table-row:hover {
  background: #f5f7ff;
}
.table-cell {
  flex: 1;
  padding: 8px 6px;
  font-size: 1rem;
  text-align: left;
}
.role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 2px;
  font-size: 0.95em;
  font-weight: 600;
}
.role-badge.admin {
  background: #fffbe6;
  color: #b45309;
  border: 1px solid #fde68a;
}
.role-badge.user {
  background: #e0e7ff;
  color: var(--info);
  border: 1px solid #a5b4fc;
}
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 2px;
  font-size: 0.95em;
  font-weight: 600;
}
.status-badge.active {
  background: #d1fae5;
  color: var(--success);
  border: 1px solid #6ee7b7;
}
.status-badge.blocked {
  background: #fee2e2;
  color: var(--danger);
  border: 1px solid #fecaca;
}
.status-badge.connected {
  background: #e0f2fe;
  color: var(--info);
  border: 1px solid #bae6fd;
}
.status-badge.disconnected {
  background: #f3f4f6;
  color: #64748b;
  border: 1px solid #e5e7eb;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--accent);
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background: none;
  color: var(--accent);
  margin-right: 6px;
  transition: background 0.18s, color 0.18s, border 0.18s;
}
.action-btn.block {
  border-color: var(--danger);
  color: var(--danger);
}
.action-btn.unblock {
  border-color: var(--success);
  color: var(--success);
}
.action-btn.connect {
  border-color: var(--info);
  color: var(--info);
}
.action-btn:hover {
  background: #eef2ff;
  color: #222;
}
.empty-state {
  text-align: center;
  color: #64748b;
  padding: 24px 0;
}
</style> 