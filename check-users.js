const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kkroxincdsmtrdlfdlri.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrcm94aW5jZHNtdHJkbGZkbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ5NDQsImV4cCI6MjA2Njg4MDk0NH0.cajC9VABapdd5e1ggLAkiT8VEdssZfFWFkZp3phog68';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('Проверка пользователей в таблице users...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Ошибка получения пользователей:', error);
      return;
    }
    
    console.log('Пользователи в таблице users:');
    data.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Admin: ${user.is_admin}`);
      console.log(`  Created: ${user.created_at}`);
      console.log('---');
    });
    
    if (data.length === 0) {
      console.log('Таблица users пуста!');
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkUsers(); 