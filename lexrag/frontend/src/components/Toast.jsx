import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle  size={16} className="text-emerald-400 shrink-0" />,
  error:   <XCircle      size={16} className="text-red-400    shrink-0" />,
  info:    <Info         size={16} className="text-blue-400   shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
};

const LEFT_BORDER = {
  success: 'border-l-emerald-500',
  error:   'border-l-red-500',
  info:    'border-l-blue-500',
  warning: 'border-l-amber-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1   }}
              exit={   { opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 glass-card border-l-4 ${LEFT_BORDER[t.type]} px-4 py-3 min-w-[280px] max-w-[360px]`}
            >
              {ICONS[t.type]}
              <p className="text-sm text-platinum-200 flex-1 leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)}
                className="text-platinum-400 hover:text-platinum-200 transition-colors mt-0.5">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
