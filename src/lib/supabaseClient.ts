import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';

// Use as variáveis providas pelo usuário
const SUPABASE_URL = 'https://bssiovkeezfhavfisals.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0MzU2MCwiZXhwIjoyMDcxNzE5NTYwfQ.iMHDwxj-su_WK-seSGWVNpIi2f2xmV0JpO0VK76tHkE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export type SupabaseClientType = typeof supabase;


