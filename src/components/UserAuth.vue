<template>
  <div class="auth-bg">
    <div class="auth-center">
      <div class="auth-card">
        <div class="auth-logo-row">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span class="auth-title">LuckySheet</span>
        </div>
        <div class="auth-subtitle">Вход в систему</div>
        <form @submit.prevent="handleLogin" class="auth-form-strict">
          <div class="auth-field">
            <label for="login">Логин</label>
            <input
              id="login"
              v-model="loginInput"
              type="text"
              placeholder="Введите логин"
              required
              autocomplete="username"
              class="auth-input"
            />
          </div>
          <div class="auth-field">
            <label for="password">Пароль</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              required
              autocomplete="current-password"
              class="auth-input"
            />
          </div>
          <button type="submit" class="auth-btn">
            Войти
          </button>
          <div v-if="error" class="auth-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useRouter } from 'vue-router'
import { initializeDropboxIfNeeded } from '../composables/useDropboxInit.js'

const { login } = useAuth()
const loginInput = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  error.value = ''
  try {
    await login(loginInput.value, password.value)
    initializeDropboxIfNeeded() // не await!
    router.push('/')
  } catch (err) {
    // Обрабатываем специальную ошибку блокировки
    if (err.message.includes('blocked') || err.message.includes('Account is blocked')) {
      error.value = 'Ваш аккаунт заблокирован администратором. Обратитесь к администратору для разблокировки.'
    } else {
      error.value = err.message
    }
  }
}
</script>

<style scoped>
.auth-bg {
  min-height: 100vh;
  background: linear-gradient(120deg, #f8fafc 0%, #e5eaf3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-center {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 32px 0 rgba(0,0,0,0.08);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  min-width: 340px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border: 1.5px solid #e5eaf3;
}
.auth-logo-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.2rem;
  justify-content: center;
}
.auth-title {
  font-size: 1.7rem;
  font-weight: 700;
  color: #23272f;
  letter-spacing: 0.5px;
}
.auth-subtitle {
  color: #6b7280;
  text-align: center;
  font-size: 1.05rem;
  margin-bottom: 2.2rem;
  font-weight: 500;
}
.auth-form-strict {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
}
.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.auth-field label {
  color: #6b7280;
  font-size: 0.98rem;
  font-weight: 500;
  margin-bottom: 0.1rem;
  letter-spacing: 0.1px;
}
.auth-input {
  background: #f8fafc;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  color: #23272f;
  font-size: 1.08rem;
  padding: 0.7rem 1rem;
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
}
.auth-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.13);
}
.auth-btn {
  background: #3b82f6;
  color: #fff;
  font-size: 1.13rem;
  font-weight: 600;
  border: none;
  border-radius: 7px;
  padding: 0.85rem 0;
  margin-top: 0.2rem;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(59,130,246,0.13);
  letter-spacing: 0.2px;
  transition: background 0.2s, box-shadow 0.2s;
  position: relative;
}
.auth-btn:hover {
  background: #2563eb;
  box-shadow: 0 4px 18px rgba(59,130,246,0.18);
}
.auth-error {
  margin-top: 1.1rem;
  color: #ff4d4f;
  background: #fff0f0;
  border-radius: 6px;
  padding: 0.7rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.01rem;
  font-weight: 500;
  border: 1.2px solid #ff4d4f22;
  box-shadow: 0 2px 8px 0 rgba(255,77,79,0.07);
}
</style> 