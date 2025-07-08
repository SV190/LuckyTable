const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kkroxincdsmtrdlfdlri.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrcm94aW5jZHNtdHJkbGZkbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ5NDQsImV4cCI6MjA2Njg4MDk0NH0.cajC9VABapdd5e1ggLAkiT8VEdssZfFWFkZp3phog68';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  try {
    console.log('Создание пользователя admin@example.com...');
    
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (error) {
      console.error('Ошибка создания пользователя:', error);
      return;
    }
    
    console.log('Пользователь создан успешно!');
    console.log('ID пользователя:', data.user.id);
    console.log('Email:', data.user.email);
    
    // Добавляем пользователя в таблицу users
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: 'admin@example.com',
        is_admin: true,
        created_at: new Date().toISOString()
      });
    
    if (dbError) {
      console.error('Ошибка добавления в таблицу users:', dbError);
    } else {
      console.log('Пользователь добавлен в таблицу users');
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

createUser(); 