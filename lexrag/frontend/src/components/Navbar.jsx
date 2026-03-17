import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, LogOut, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useAuth } from './AuthContext';
import { checkHealth } from '../api/client';

const BADGE = {
  admin:    { label: 'Admin',     cls: 'badge-admin'    },
  analyst:  { label: 'Analyst',   cls: 'badge-analyst'  },
  readonly: { label: 'Read-only', cls: 'badge-readonly' },
};

export default function Navbar({ sidebarOpen, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState('checking');
  const badge = BADGE[user?.role] || BADGE.readonly;

  useEffect(() => {
    const check = async () => {
      try   { await checkHealth(); setStatus('online');  }
      catch { setStatus('offline'); }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0"
      style={{ background: 'rgba(7,7,12,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>

      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-platinum-400 hover:text-gold-400 hover:bg-gold-500/10 transition-all">
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-gold-400" />
          <span className="font-display font-bold text-platinum-100">
            Lex<span className="text-gold-400">RAG</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
          style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
          <span className="text-gold-400">{user?.tenant_id}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          {status === 'online'   && <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400">Connected</span></>}
          {status === 'offline'  && <><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-red-400">Offline</span></>}
          {status === 'checking' && <><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-amber-400">Checking…</span></>}
        </div>
        <div className="h-4 w-px bg-white/10" />
        <span className={`role-badge ${badge.cls}`}>{badge.label}</span>
        <span className="text-xs text-platinum-400 hidden md:block">{user?.username}</span>
        <motion.button onClick={logout}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-platinum-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Log out">
          <LogOut size={16} />
        </motion.button>
      </div>
    </header>
  );
}
