'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

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
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setWorkspace: (ws: Workspace) => void;
  refreshWorkspace: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspace = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
      setWorkspaceState(res.data.workspace);
      return res.data.workspace;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('bl_token');
    if (storedToken) {
      setToken(storedToken);
      refreshWorkspace().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshWorkspace]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('bl_token', t);
    setToken(t);
    setUser(u);
    return await refreshWorkspace();
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('bl_token', t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('bl_token');
    localStorage.removeItem('bl_user');
    setToken(null);
    setUser(null);
    setWorkspaceState(null);
    window.location.href = '/';
  };

  const setWorkspace = (ws: Workspace) => {
    setWorkspaceState(ws);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, token, loading, login, register, logout, setWorkspace, refreshWorkspace }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
