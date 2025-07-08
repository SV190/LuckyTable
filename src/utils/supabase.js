import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kkroxincdsmtrdlfdlri.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrcm94aW5jZHNtdHJkbGZkbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ5NDQsImV4cCI6MjA2Njg4MDk0NH0.cajC9VABapdd5e1ggLAkiT8VEdssZfFWFkZp3phog68';

// Проверяем, что переменные окружения загружены
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL не найден в переменных окружения');
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY не найден в переменных окружения');
  throw new Error('VITE_SUPABASE_ANON_KEY is required');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 