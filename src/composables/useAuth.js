import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'

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

// Проверка текущей сессии при инициализации
supabase.auth.getUser().then(({ data, error: err }) => {
  if (data?.user) {
    user.value = data.user
    isAuthenticated.value = true
  }
})

// Слушаем изменения состояния аутентификации
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    user.value = session.user
    isAuthenticated.value = true
  } else if (event === 'SIGNED_OUT') {
    user.value = null
    isAuthenticated.value = false
  }
})

export function useAuth() {
  const router = useRouter()

  // Проверяем, является ли пользователь администратором
  const isAdmin = computed(() => {
    return user.value?.is_admin === true
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

  // Логин
  const login = async (email, password) => {
    isLoading.value = true
    error.value = null
    
    console.log('Попытка входа с:', { email, password: password ? '***' : 'undefined' })
    
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      
      if (err) {
        console.error('Ошибка входа:', err)
        error.value = err.message
        user.value = null
      } else {
        console.log('Успешный вход:', data.user)
        user.value = data.user
        isAuthenticated.value = true
      }
    } catch (e) {
      console.error('Исключение при входе:', e)
      error.value = e.message
      user.value = null
    }
    
    isLoading.value = false
    return { user: user.value, error: error.value }
  }

  // Регистрация
  const register = async (email, password) => {
    isLoading.value = true
    error.value = null
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) {
      error.value = err.message
      user.value = null
    } else {
      user.value = data.user
      isAuthenticated.value = true
    }
    isLoading.value = false
    return { user: user.value, error: error.value }
  }

  // Выход
  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    isAuthenticated.value = false
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
    checkTokenValidity
  }
} 