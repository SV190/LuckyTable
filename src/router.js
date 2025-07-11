import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './composables/useAuth.js'
import MainApp from './components/MainApp.vue'
import AdminPanel from './components/AdminPanel.vue'
import UserAuth from './components/UserAuth.vue'

const routes = [
  {
    path: '/',
    name: 'MainApp',
    component: MainApp,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/login',
    name: 'UserAuth',
    component: UserAuth,
    meta: { requiresGuest: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Навигационные хуки
router.beforeEach(async (to, from, next) => {
  const { user, isAuthenticated } = useAuth()
  
  // Проверяем требования маршрута
  if (to.meta.requiresAuth && to.meta.requiresAdmin) {
    if (!isAuthenticated.value) {
      next('/login')
    } else if (user.value?.role !== 'admin') {
      next('/')
    } else {
      next()
    }
  } else if (to.meta.requiresAuth) {
    if (!isAuthenticated.value) {
      next('/login')
    } else {
      next()
    }
  } else if (to.meta.requiresGuest) {
    // Если пользователь уже авторизован, перенаправляем на главную
    if (isAuthenticated.value) {
      next('/')
    } else {
      next()
    }
  } else {
    // Для всех остальных маршрутов перенаправляем на главную
    next('/')
  }
})

export default router 