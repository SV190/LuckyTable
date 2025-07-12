import { ref } from 'vue';
import { supabase } from '../utils/supabase';

const usersList = ref([]);
const loading = ref(false);
const error = ref(null);

export function useUsers() {
  // Получить всех пользователей
  const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    const { data, error: err } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (err) {
      error.value = err.message;
      usersList.value = [];
    } else {
      usersList.value = data;
    }
    loading.value = false;
    return usersList.value;
  };

  // Создать пользователя
  const createUser = async (email, password, username = null, isAdmin = false) => {
    error.value = null;
    // Сначала создаём пользователя в Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) {
      error.value = authErr.message;
      return null;
    }
    // Затем добавляем запись в таблицу users (если нужно)
    const { data, error: dbErr } = await supabase.from('users').insert([
      { email, username, is_admin: isAdmin, auth_id: authData.user?.id }
    ]);
    if (dbErr) {
      error.value = dbErr.message;
      return null;
    }
    await fetchUsers();
    return data;
  };

  // Блокировка/разблокировка пользователя
  const setBlocked = async (userId, isBlocked) => {
    error.value = null;
    const { error: err } = await supabase.from('users').update({ is_blocked: isBlocked }).eq('id', userId);
    if (err) {
      error.value = err.message;
      return false;
    }
    await fetchUsers();
    return true;
  };

  return {
    users: usersList,
    loading,
    error,
    fetchUsers,
    createUser,
    setBlocked
  };
} 