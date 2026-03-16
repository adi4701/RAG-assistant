'use client';
import React from 'react';
import { useAuth } from './AuthContext';
import { Lock } from 'lucide-react';

export default function ProtectedRoute({ children, onShowLogin }: { children: React.ReactNode, onShowLogin: () => void }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600">
        <div className="text-center text-white p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <Lock className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Please log in to access LexRAG</h2>
          <p className="text-blue-100 mb-6 text-sm">You will be redirected to the login page</p>
          <button onClick={onShowLogin} className="lex-btn-primary w-full bg-white text-blue-900 hover:bg-blue-50">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
