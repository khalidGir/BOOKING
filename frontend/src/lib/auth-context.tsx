'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { mockApi } from './mock-api';
import type { User } from './mock-data';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('demo_auth');
    if (saved) {
      try {
        const { user: u, token: t } = JSON.parse(saved);
        setUser(u); setToken(t);
      } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await mockApi.login(email, password);
    setUser(data.user);
    setToken(data.token);
    sessionStorage.setItem('demo_auth', JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('demo_auth');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
