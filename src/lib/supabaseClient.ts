import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bssiovkeezfhavfisals.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDM1NjAsImV4cCI6MjA3MTcxOTU2MH0.Ne_L8SZJn5Lg3_DY1i_2RVHABGLlQrcma7JkW3TkNgc'; // ⚠️ Substitua pela chave anon real!

export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'react-native-mercafly',
    },
  },
});

// Função para debug da configuração
export const debugSupabaseAuth = async () => {
  console.log('🔍 DEBUG SUPABASE AUTH');
  console.log('========================');
  
  try {
    // 1. Verificar sessão atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('📱 Sessão atual:', sessionData.session ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    
    if (sessionError) {
      console.log('❌ Erro na sessão:', sessionError.message);
    }
    
    // 2. Verificar usuário
    if (sessionData.session) {
      console.log('👤 User ID:', sessionData.session.user.id);
      console.log('📧 Email:', sessionData.session.user.email);
      console.log('⏰ Token expira em:', new Date(sessionData.session.expires_at! * 1000));
      
      // 3. Testar chamada autenticada
      const { data: profileData, error: profileError } = await supabase
        .from('customer_profile')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .single();
        
      console.log('👤 Customer Profile:', profileData ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (profileError) {
        console.log('❌ Erro no profile:', profileError.message);
      }
    }
    
  } catch (error) {
    console.log('💥 Erro geral:', error);
  }
  
  console.log('========================');
};

export type SupabaseClientType = typeof supabase;