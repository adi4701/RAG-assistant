import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ToastProvider } from './components/Toast';
import LandingPage    from './components/LandingPage';
import AuthPage       from './components/AuthPage';
import Navbar         from './components/Navbar';
import DocumentSidebar from './components/DocumentSidebar';
import ChatInterface  from './components/ChatInterface';

function AppShell() {
  const { user }  = useAuth();
  const [view,    setView]    = useState('landing');
  const [sidebar, setSidebar] = useState(true);
  const [key,     setKey]     = useState(0);

  const effective = user ? 'app' : view;

  return (
    <AnimatePresence mode="wait">

      {effective === 'landing' && (
        <motion.div key="landing"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}>
          <LandingPage onGetStarted={() => setView('auth')} />
        </motion.div>
      )}

      {effective === 'auth' && (
        <motion.div key="auth"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          <LandingPage onGetStarted={() => {}} />
          <AuthPage
            onSuccess={() => setView('app')}
            onBack={() => setView('landing')}
          />
        </motion.div>
      )}

      {effective === 'app' && user && (
        <motion.div key="app"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col h-screen bg-obsidian-950 overflow-hidden">

          <Navbar sidebarOpen={sidebar} onToggleSidebar={() => setSidebar(o => !o)} />

          <div className="flex flex-1 overflow-hidden">
            <AnimatePresence>
              {sidebar && (
                <motion.aside key="sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{    width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden shrink-0 border-r border-white/5"
                  style={{ background: 'rgba(10,10,16,0.95)' }}>
                  <div className="w-[280px] h-full">
                    <DocumentSidebar key={key} onDocumentUploaded={() => setKey(k => k+1)} />
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            <main className="flex-1 overflow-hidden">
              <ChatInterface />
            </main>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
