'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  language?: string;
}

const getSubdomainLanguage = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.startsWith('fi.')) return 'fi';
    if (host.startsWith('nl.')) return 'nl';
  }
  return 'en';
};

interface Workspace {
  id: string;
  domain: string;
  websiteName: string;
  description: string;
  niche?: string;
  country?: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<any>;
  logout: (redirectUrlOrEvent?: string | any) => void;
  setWorkspace: (ws: Workspace) => void;
  refreshWorkspace: () => Promise<any>;
  updateUserLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(null); // Kept for backwards compatibility if any components rely on it, but it will just be 'secure_cookie'
  const [loading, setLoading] = useState(true);

  const refreshWorkspace = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
      setWorkspaceState(res.data.workspace);
      return { user: res.data.user, workspace: res.data.workspace };
    } catch {
      return { user: null, workspace: null };
    }
  }, []);

  useEffect(() => {
    // Attempt to refresh workspace automatically via secure HttpOnly cookie session
    refreshWorkspace().then((data) => {
      if (data.user) setToken('secure_cookie');
    }).finally(() => setLoading(false));
  }, [refreshWorkspace]);

  const login = async (email: string, password: string) => {
    const language = getSubdomainLanguage();
    const res = await api.post('/api/auth/login', { email, password, language });
    const { user: u } = res.data;
    setToken('secure_cookie');
    setUser(u);
    return await refreshWorkspace();
  };

  const register = async (email: string, password: string, name?: string) => {
    const language = getSubdomainLanguage();
    const res = await api.post('/api/auth/register', { name: name || email.split('@')[0], email, password, language });
    const { user: u } = res.data;
    setToken('secure_cookie');
    setUser(u);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bl_just_signed_up', '1');
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const language = getSubdomainLanguage();
    const res = await api.post('/api/auth/google', { credential, language });
    const { user: u } = res.data;
    setToken('secure_cookie');
    setUser(u);
    return await refreshWorkspace();
  };

  const updateUserLanguage = async (lang: string) => {
    const res = await api.patch('/api/auth/language', { language: lang });
    const { user: u } = res.data;
    setUser(u);
  };

  const logout = async (redirectUrlOrEvent?: string | any) => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    }
    
    setToken(null);
    setUser(null);
    setWorkspaceState(null);
    const url = typeof redirectUrlOrEvent === 'string' ? redirectUrlOrEvent : '/';
    window.location.href = url;
  };

  const setWorkspace = (ws: Workspace) => {
    setWorkspaceState(ws);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, token, loading, login, register, loginWithGoogle, logout, setWorkspace, refreshWorkspace, updateUserLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
