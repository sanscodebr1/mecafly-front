import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configurações de produção
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY não encontrada. Verifique suas variáveis de ambiente.');
}

// Storage customizado para React Native
const storage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Erro ao buscar item do storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Erro ao salvar item no storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Erro ao remover item do storage:', error);
    }
  },
};

export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'sb-bssiovkeezfhavfisals-auth-token',
    flowType: 'pkce',
    debug: __DEV__, // Só ativa debug em desenvolvimento
  },
  global: {
    headers: {
      'X-Client-Info': 'mecafly-react-native',
    },
  },
});

export type SupabaseClientType = typeof supabase;