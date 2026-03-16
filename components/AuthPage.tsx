'use client';
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { loginUser, registerUser } from '@/lib/api-client';
import { useToast } from './Toast';
import { Scale } from 'lucide-react';

export default function AuthPage({ onSuccess }: { onSuccess: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [role, setRole] = useState('readonly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await loginUser({ username, password });
        login(res);
        showToast('Welcome back!', 'success');
        onSuccess();
      } else {
        const res = await registerUser({ username, password, tenant_id: tenantId, role });
        login(res);
        showToast('Account created successfully', 'success');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-800 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">LexRAG</h1>
          <p className="text-gray-500 mt-1">Corporate Legal AI Assistant</p>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${tab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('login')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${tab === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('register')}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="lex-input"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="lex-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {tab === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
                <input
                  type="text"
                  required
                  className="lex-input"
                  placeholder="e.g. acme-corp"
                  value={tenantId}
                  onChange={e => setTenantId(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">All users with the same Tenant ID share documents</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="lex-input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="readonly">readonly - Can query NDA documents only</option>
                  <option value="analyst">analyst - Can query & upload NDA, Employment, Shareholder docs</option>
                  <option value="admin">admin - Full access to all document types</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="lex-btn-primary w-full mt-6">
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800 text-center">
            <strong>Demo credentials:</strong> Register with any username. Use tenant ID &apos;demo-corp&apos; to share documents with teammates.
          </p>
        </div>
      </div>
    </div>
  );
}
