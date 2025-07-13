<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuth } from './composables/useAuth.js'

const { initAuth, checkUserBlockStatus, isAuthenticated } = useAuth()

// Интервал для проверки статуса блокировки (каждые 30 секунд)
let blockStatusInterval = null

// Функция для запуска периодической проверки
const startBlockStatusCheck = () => {
  if (blockStatusInterval) {
    clearInterval(blockStatusInterval)
  }
  
  blockStatusInterval = setInterval(async () => {
    if (isAuthenticated.value) {
      await checkUserBlockStatus()
    }
  }, 30000) // Проверяем каждые 30 секунд
}

// Функция для остановки проверки
const stopBlockStatusCheck = () => {
  if (blockStatusInterval) {
    clearInterval(blockStatusInterval)
    blockStatusInterval = null
  }
}

onMounted(() => {
  initAuth()
  startBlockStatusCheck()
})

onUnmounted(() => {
  stopBlockStatusCheck()
})
</script>

<style>
/* Глобальные стили */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

#app {
  height: 100vh;
}
</style>
