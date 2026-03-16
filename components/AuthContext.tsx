'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  access_token: string;
  token_type: string;
  role: string;
  tenant_id: string;
  username: string;
  permitted_doc_types: string[];
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lexrag_user');
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('lexrag_user', JSON.stringify(userData));
    localStorage.setItem('lexrag_token', userData.access_token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lexrag_user');
    localStorage.removeItem('lexrag_token');
  };

  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
