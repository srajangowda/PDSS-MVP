import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../services/api';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithDemo: (role: 'parent' | 'health_worker' | 'specialist') => Promise<void>;
  loginWithSupabase: (email: string, pass: string) => Promise<void>;
  registerWithSupabase: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pedipulse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('pedipulse_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch (err) {
        console.warn('Session verification failed, clearing token');
        localStorage.removeItem('pedipulse_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const loginWithDemo = async (role: 'parent' | 'health_worker' | 'specialist') => {
    setIsLoading(true);
    try {
      const { token, user } = await api.demoLogin(role);
      localStorage.setItem('pedipulse_token', token);
      setToken(token);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSupabase = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        if (data.session) {
          localStorage.setItem('pedipulse_token', data.session.access_token);
          setToken(data.session.access_token);
          const { user } = await api.getMe();
          setUser(user);
          return;
        }
      }
      // Demo mock fallback if Supabase not connected
      if (email.includes('worker') || email.includes('asha')) {
        await loginWithDemo('health_worker');
      } else if (email.includes('specialist') || email.includes('dr')) {
        await loginWithDemo('specialist');
      } else {
        await loginWithDemo('parent');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithSupabase = async (name: string, email: string, pass: string, role: UserRole) => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { name, role },
          },
        });
        if (error) throw error;
        if (data.session) {
          localStorage.setItem('pedipulse_token', data.session.access_token);
          setToken(data.session.access_token);
          const { user } = await api.getMe();
          setUser(user);
          return;
        }
      }
      // Demo auto-registration fallback
      await loginWithDemo(role === 'specialist' ? 'specialist' : role === 'health_worker' ? 'health_worker' : 'parent');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('pedipulse_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithDemo,
        loginWithSupabase,
        registerWithSupabase,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

