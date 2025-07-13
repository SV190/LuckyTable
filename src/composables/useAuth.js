import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const user = ref(null)
const isAuthenticated = ref(false)
const isLoading = ref(false)
const error = ref(null)

// Определяем базовый URL API в зависимости от окружения
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api'
  }
  return '/api'
}

// Автоматически инициализируем авторизацию при загрузке модуля
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('user_token');
  const userInfo = localStorage.getItem('user_info');
  if (token && userInfo) {
    try {
      const parsedUser = JSON.parse(userInfo);
      user.value = parsedUser;
      isAuthenticated.value = true;
    } catch (e) {
      user.value = null;
      isAuthenticated.value = false;
    }
  }
}

export function useAuth() {
  const router = useRouter()

  // Проверяем, является ли пользователь администратором
  const isAdmin = computed(() => {
    return user.value?.role === 'admin'
  })

  // Инициализация состояния авторизации
  const initAuth = () => {
    const token = localStorage.getItem('user_token')
    const userInfo = localStorage.getItem('user_info')
    
    if (token && userInfo) {
      try {
        user.value = JSON.parse(userInfo)
        isAuthenticated.value = true
      } catch (error) {
        logout()
      }
    }
  }

  // Проверка статуса блокировки пользователя
  const checkUserBlockStatus = async () => {
    if (!user.value || !user.value.id) return false
    
    try {
      const response = await fetch(`/.netlify/functions/check-user-status?userId=${user.value.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to check user status');
        return false;
      }
      
      const data = await response.json();
      
      if (data.success && data.isBlocked) {
        // Пользователь заблокирован - выходим из аккаунта
        console.log('User is blocked, logging out...');
        
        // Показываем уведомление пользователю
        if (typeof window !== 'undefined' && window.alert) {
          alert('Ваш аккаунт был заблокирован администратором. Вы вышли из системы.');
        }
        
        await logout();
        router.push('/login');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking user block status:', error);
      return false;
    }
  }

  // Логин
  const login = async (loginValue, password) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginValue, password })
      });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = {};
      }
      if (!response.ok) {
        error.value = data.error || 'Ошибка входа';
        user.value = null;
        isAuthenticated.value = false;
        throw new Error(error.value);
      } else {
        // Используем данные пользователя, полученные при входе
        user.value = data.user;
        isAuthenticated.value = true;
        // Сохраняем токен и инфу о пользователе в localStorage
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(data.user));
      }
    } catch (e) {
      error.value = e.message;
      user.value = null;
      isAuthenticated.value = false;
      throw e;
    }
    isLoading.value = false;
    return { user: user.value, error: error.value };
  }

  // Заглушка регистрации (реализуйте при необходимости)
  const register = async (login, password) => {
    throw new Error('Регистрация не реализована');
  }

  // Выход
  const logout = async () => {
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
  }

  // Проверка авторизации для защищенных маршрутов
  const requireAuth = (to, from, next) => {
    if (!isAuthenticated.value) {
      next('/login')
    } else {
      next()
    }
  }

  // Проверка прав администратора
  const requireAdmin = (to, from, next) => {
    if (!isAuthenticated.value) {
      next('/login')
    } else if (!isAdmin.value) {
      next('/')
    } else {
      next()
    }
  }

  // Получение токена для API запросов
  const getToken = () => {
    return localStorage.getItem('user_token')
  }

  // Проверка валидности токена
  const checkTokenValidity = async () => {
    const token = getToken()
    if (!token) return false
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        logout()
        return false
      }
      
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  return {
    user: computed(() => user.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    isAdmin,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    initAuth,
    login,
    register,
    logout,
    requireAuth,
    requireAdmin,
    getToken,
    checkTokenValidity,
    checkUserBlockStatus
  }
} 