import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUserProfile, UserProfile } from '../services/userProfiles';

type AuthUser = {
  id: string;
  email: string | null;
  profile?: UserProfile | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>; 
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>; 
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getCurrentUserProfile();
      return profile;
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      return null;
    }
  }, []);

  const loadInitialSession = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.user) {
      const profile = await loadUserProfile(data.session.user.id);
      setUser({ 
        id: data.session.user.id, 
        email: data.session.user.email ?? null,
        profile 
      });
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [loadUserProfile]);

  useEffect(() => {
    loadInitialSession();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadUserProfile(session.user.id);
        setUser({ 
          id: session.user.id, 
          email: session.user.email ?? null,
          profile 
        });
      } else {
        setUser(null);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadInitialSession, loadUserProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshSession = useCallback(async () => {
    await supabase.auth.getSession();
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user?.id) {
      const profile = await loadUserProfile(user.id);
      setUser(prev => prev ? { ...prev, profile } : null);
    }
  }, [user?.id, loadUserProfile]);

  const value = useMemo(
    () => ({ user, isLoading, signInWithEmail, signUpWithEmail, signOut, refreshSession, refreshUserProfile }),
    [user, isLoading, signInWithEmail, signUpWithEmail, signOut, refreshSession, refreshUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};


