import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  getCurrentUserProfiles, 
  UserProfiles, 
  CustomerProfile, 
  ProfessionalProfile, 
  StoreProfile,
  upsertCustomerProfile 
} from '../services/userProfiles';

type AuthUser = {
  id: string;
  email: string | null;
  customer_profile: CustomerProfile;
  professional_profile?: ProfessionalProfile | null;
  store_profile?: StoreProfile | null;
  profile?: any;
  user_profiles?: ProfessionalProfile[];
  store_profiles?: StoreProfile[];
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isCustomer: boolean;
  isProfessional: boolean;
  isSeller: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>; 
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>; 
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  createProfessionalProfile: () => Promise<ProfessionalProfile | null>;
  createStoreProfile: () => Promise<StoreProfile | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  const loadUserProfiles = useCallback(async (userId: string) => {
    try {
      console.log('📊 Carregando perfis para o usuário:', userId);
      const profiles = await getCurrentUserProfiles();
      console.log('✅ Perfis carregados com sucesso:', profiles);
      return profiles;
    } catch (error) {
      console.error('❌ Erro ao carregar perfis do usuário:', error);
      return null;
    }
  }, []);

  const transformToAuthUser = useCallback((profiles: UserProfiles): AuthUser => {
    return {
      id: profiles.id,
      email: profiles.email,
      customer_profile: profiles.customer_profile,
      professional_profile: profiles.professional_profile,
      store_profile: profiles.store_profile,
      profile: {
        id: profiles.id,
        email: profiles.email,
        name: profiles.customer_profile.name || profiles.professional_profile?.name || null,
        user_type: profiles.professional_profile ? 'professional' : 'customer',
        user_profiles: profiles.professional_profile ? [profiles.professional_profile] : [],
        store_profiles: profiles.store_profile ? [profiles.store_profile] : [],
      },
      user_profiles: profiles.professional_profile ? [profiles.professional_profile] : [],
      store_profiles: profiles.store_profile ? [profiles.store_profile] : [],
    };
  }, []);

  // Função melhorada para verificar e renovar sessão
  const checkAndRefreshSession = useCallback(async () => {
    try {
      console.log('🔄 Verificando sessão atual...');
      
      // Primeiro, tenta buscar a sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro ao buscar sessão:', sessionError);
        return null;
      }

      const session = sessionData.session;
      
      if (!session) {
        console.log('⚠️ Nenhuma sessão encontrada');
        return null;
      }

      // Verifica se o token está próximo do vencimento (15 minutos antes)
      const now = Math.round(Date.now() / 1000);
      const tokenExpiry = session.expires_at || 0;
      const timeUntilExpiry = tokenExpiry - now;
      
      console.log('⏰ Token expira em:', timeUntilExpiry, 'segundos');

      // Se o token expira em menos de 15 minutos, tenta renovar
      if (timeUntilExpiry < 900) { // 15 minutos
        console.log('🔄 Token próximo do vencimento, renovando...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Erro ao renovar sessão:', refreshError);
          return null;
        }
        
        console.log('✅ Sessão renovada com sucesso');
        return refreshData.session;
      }

      return session;
    } catch (error) {
      console.error('❌ Erro na verificação de sessão:', error);
      return null;
    }
  }, []);

  const loadInitialSession = useCallback(async () => {
    if (initialized) return;
    
    console.log('🚀 Inicializando AuthContext...');
    setIsLoading(true);
    
    try {
      // Primeiro, tenta buscar a sessão diretamente
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log('📊 Session data:', sessionData);
      console.log('❌ Session error:', sessionError);
      
      if (sessionError) {
        console.error('❌ Erro ao buscar sessão:', sessionError);
        setUser(null);
        return;
      }

      const session = sessionData.session;
      
      if (session?.user) {
        console.log('👤 Usuário encontrado na sessão:', session.user.id);
        
        // Verificar se o token não está expirado
        const now = Math.round(Date.now() / 1000);
        const tokenExpiry = session.expires_at || 0;
        
        if (tokenExpiry > now) {
          console.log('✅ Token ainda válido');
          const profiles = await loadUserProfiles(session.user.id);
          
          if (profiles) {
            const authUser = transformToAuthUser(profiles);
            setUser(authUser);
            console.log('✅ Usuário logado com sucesso');
          } else {
            console.log('⚠️ Perfis não encontrados');
            setUser(null);
          }
        } else {
          console.log('⏰ Token expirado, tentando renovar...');
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.log('❌ Não foi possível renovar a sessão');
            await supabase.auth.signOut();
            setUser(null);
          } else {
            console.log('✅ Sessão renovada');
            const profiles = await loadUserProfiles(refreshData.session.user.id);
            
            if (profiles) {
              const authUser = transformToAuthUser(profiles);
              setUser(authUser);
              console.log('✅ Usuário logado após renovação');
            } else {
              setUser(null);
            }
          }
        }
      } else {
        console.log('❌ Nenhum usuário na sessão');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar sessão inicial:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  }, [initialized, loadUserProfiles, transformToAuthUser]);

  // Hook para monitorar mudanças de autenticação
  useEffect(() => {
    loadInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Usuário logou');
          if (session?.user) {
            const profiles = await loadUserProfiles(session.user.id);
            if (profiles) {
              setUser(transformToAuthUser(profiles));
            }
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 Usuário deslogou');
          setUser(null);
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token renovado automaticamente');
          // Mantém o usuário atual, apenas o token foi renovado
          break;
          
        case 'USER_UPDATED':
          console.log('📝 Dados do usuário atualizados');
          if (session?.user && user) {
            // Recarrega perfis se necessário
            const profiles = await loadUserProfiles(session.user.id);
            if (profiles) {
              setUser(transformToAuthUser(profiles));
            }
          }
          break;
          
        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadInitialSession, loadUserProfiles, transformToAuthUser, user]);

  // Verificação periódica da sessão (a cada 10 minutos)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        console.log('⏰ Verificação periódica da sessão...');
        const session = await checkAndRefreshSession();
        
        if (!session) {
          console.log('❌ Sessão inválida, deslogando usuário');
          setUser(null);
          await supabase.auth.signOut();
        }
      }
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, [user, checkAndRefreshSession]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔑 Tentando fazer login...');
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ Erro no login:', error.message);
        return { error: error.message };
      }
      
      console.log('✅ Login realizado com sucesso');
      return { user: data.user };
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      return { error: 'Erro inesperado ao fazer login' };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      console.log('📝 Tentando criar conta...');
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ Erro no cadastro:', error.message);
        return { error: error.message };
      }
      
      console.log('✅ Conta criada com sucesso');
      return { user: data.user };
    } catch (error) {
      console.error('❌ Erro inesperado no cadastro:', error);
      return { error: 'Erro inesperado ao criar conta' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('👋 Fazendo logout...');
      await supabase.auth.signOut();
      setUser(null);
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Forçando refresh da sessão...');
      await checkAndRefreshSession();
    } catch (error) {
      console.error('❌ Erro ao refresh da sessão:', error);
    }
  }, [checkAndRefreshSession]);

  const refreshUserProfile = useCallback(async () => {
    if (user?.id) {
      console.log('📊 Atualizando perfil do usuário...');
      const profiles = await loadUserProfiles(user.id);
      if (profiles) {
        setUser(transformToAuthUser(profiles));
        console.log('✅ Perfil atualizado');
      }
    }
  }, [user?.id, loadUserProfiles, transformToAuthUser]);

  const createProfessionalProfile = useCallback(async (): Promise<ProfessionalProfile | null> => {
    if (!user?.id) return null;
    
    try {
      const { upsertProfessionalProfile } = await import('../services/userProfiles');
      const newProfile = await upsertProfessionalProfile({
        user_id: user.id,
        user_type: 'professional',
        name: user.customer_profile.name,
        email: user.email,
        document: null,
        date_of_birth: null,
        phone_number: null,
        user_picture: null,
        document_picture: null,
        description: null,
        legal_representative: null,
        company_type: null,
      });
      
      await refreshUserProfile();
      return newProfile;
    } catch (error) {
      console.error('❌ Erro ao criar perfil profissional:', error);
      return null;
    }
  }, [user, refreshUserProfile]);

  const createStoreProfile = useCallback(async (): Promise<StoreProfile | null> => {
    if (!user?.id) return null;
    
    try {
      const { upsertStoreProfile } = await import('../services/userProfiles');
      const newProfile = await upsertStoreProfile({
        user_id: user.id,
        name: user.customer_profile.name,
        document: null,
        company_type: 'MEI',
        phone: null,
        legal_representative: null,
        cpf_legal_representative: null,
        company_name: null,
        rg_legal_representative: null,
        contrato_social: null,
        status: 'pending',
        picture: null,
        description: null,
      });
      
      await refreshUserProfile();
      return newProfile;
    } catch (error) {
      console.error('❌ Erro ao criar perfil de loja:', error);
      return null;
    }
  }, [user, refreshUserProfile]);

  const isCustomer = useMemo(() => !!user?.customer_profile, [user]);
  const isProfessional = useMemo(() => !!user?.professional_profile, [user]);
  const isSeller = useMemo(() => !!user?.store_profile, [user]);

  const value = useMemo(
    () => ({ 
      user, 
      isLoading, 
      isCustomer,
      isProfessional,
      isSeller,
      signInWithEmail, 
      signUpWithEmail, 
      signOut, 
      refreshSession, 
      refreshUserProfile,
      createProfessionalProfile,
      createStoreProfile,
    }),
    [
      user, 
      isLoading, 
      isCustomer,
      isProfessional,
      isSeller,
      signInWithEmail, 
      signUpWithEmail, 
      signOut, 
      refreshSession, 
      refreshUserProfile,
      createProfessionalProfile,
      createStoreProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};