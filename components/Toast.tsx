'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => {
      const newToasts = [...prev, { id, message, type }];
      if (newToasts.length > 5) return newToasts.slice(newToasts.length - 5);
      return newToasts;
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => {
          const colors = {
            success: 'border-green-500 bg-green-50 text-green-800',
            error: 'border-red-500 bg-red-50 text-red-800',
            info: 'border-blue-500 bg-blue-50 text-blue-800',
            warning: 'border-yellow-500 bg-yellow-50 text-yellow-800'
          };
          const Icons = {
            success: CheckCircle,
            error: XCircle,
            info: Info,
            warning: AlertTriangle
          };
          const Icon = Icons[toast.type];
          
          return (
            <div key={toast.id} className={`flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-md transition-all animate-in slide-in-from-right-full ${colors[toast.type]}`}>
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="ml-auto text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
