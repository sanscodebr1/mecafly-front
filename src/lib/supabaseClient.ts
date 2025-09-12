import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bssiovkeezfhavfisals.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0MzU2MCwiZXhwIjoyMDcxNzE5NTYwfQ.iMHDwxj-su_WK-seSGWVNpIi2f2xmV0JpO0VK76tHkE';

// PROBLEMA IDENTIFICADO: Você está usando service_role key em vez de anon key!
// A service_role key não deve ser usada no cliente, apenas no servidor
const CORRECT_ANON_KEY = 'sua_anon_key_aqui'; // Você precisa pegar a chave anon correta

// Storage customizado para debug
const debugStorage = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`📥 GET [${key}]:`, value ? 'FOUND' : 'NOT_FOUND');
      return value;
    } catch (error) {
      console.error(`❌ GET ERROR [${key}]:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`📤 SET [${key}]: SUCCESS`);
    } catch (error) {
      console.error(`❌ SET ERROR [${key}]:`, error);
      throw error;
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ REMOVE [${key}]: SUCCESS`);
    } catch (error) {
      console.error(`❌ REMOVE ERROR [${key}]:`, error);
      throw error;
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // CRÍTICO: Usar AsyncStorage com configuração correta
    storage: debugStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Chave de storage consistente
    storageKey: 'sb-bssiovkeezfhavfisals-auth-token',
    // Flow type para mobile
    flowType: 'pkce',
    // Debug em desenvolvimento
    debug: __DEV__,
  },
  global: {
    headers: {
      'X-Client-Info': 'react-native-app',
    },
  },
});

// Função para verificar a configuração
export const verifySupabaseConfig = async () => {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO SUPABASE');
  console.log('====================================');
  
  // 1. Verificar se AsyncStorage funciona
  try {
    await AsyncStorage.setItem('test-key', 'test-value');
    const testValue = await AsyncStorage.getItem('test-key');
    await AsyncStorage.removeItem('test-key');
    console.log('📱 AsyncStorage:', testValue === 'test-value' ? '✅ OK' : '❌ ERRO');
  } catch (error) {
    console.log('📱 AsyncStorage: ❌ ERRO -', error);
  }
  
  // 2. Verificar configuração do cliente
  console.log('🌐 URL:', SUPABASE_URL);
  console.log('🔑 Key tipo:', SUPABASE_ANON_KEY.includes('service_role') ? '⚠️ SERVICE_ROLE (PROBLEMA!)' : '✅ ANON');
  
  // 3. Testar conexão
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('🔌 Conexão:', error ? '❌ ERRO' : '✅ OK');
    console.log('👤 Sessão:', data.session ? '✅ ENCONTRADA' : '❌ NÃO ENCONTRADA');
  } catch (error) {
    console.log('🔌 Conexão: ❌ ERRO -', error);
  }
  
  console.log('====================================');
};

export type SupabaseClientType = typeof supabase;