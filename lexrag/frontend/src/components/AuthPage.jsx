import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, User, Lock, Building2, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';

const ROLES = [
  { value: 'admin',    label: 'Admin',     desc: 'Full access · All document types · Can upload' },
  { value: 'analyst',  label: 'Analyst',   desc: 'NDA · Employment · Shareholder · Can upload'   },
  { value: 'readonly', label: 'Read-only', desc: 'NDA documents only · Query only'               },
];

function InputField({ icon: Icon, label, type = 'text', value, onChange, placeholder, toggleable }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-platinum-400 font-medium tracking-wide">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-platinum-400" />
        <input
          type={toggleable ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="lex-input pl-9 pr-9"
        />
        {toggleable && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-platinum-400 hover:text-gold-400 transition-colors">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage({ onSuccess, onBack }) {
  const { login }      = useAuth();
  const { showToast }  = useToast();
  const [tab, setTab]  = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [siUser, setSiUser] = useState('');
  const [siPass, setSiPass] = useState('');

  const [regUser,   setRegUser]   = useState('');
  const [regPass,   setRegPass]   = useState('');
  const [regTenant, setRegTenant] = useState('');
  const [regRole,   setRegRole]   = useState('admin');

  const handleSignIn = async () => {
    if (!siUser || !siPass) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const data = await loginUser({ username: siUser, password: siPass });
      login(data);
      showToast(`Welcome back, ${data.username}!`, 'success');
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!regUser || !regPass || !regTenant) { setError('Please fill in all fields.'); return; }
    if (regPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const data = await registerUser({ username: regUser, password: regPass, tenant_id: regTenant, role: regRole });
      login(data);
      showToast(`Account created! Welcome, ${data.username}.`, 'success');
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,7,12,0.96)', backdropFilter: 'blur(20px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,160,23,0.05) 0%, transparent 70%)' }} />

      <motion.div
        className="glass-card-gold w-full max-w-md relative"
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1,   y: 0,  opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <button onClick={onBack}
          className="absolute top-5 left-5 flex items-center gap-1 text-xs text-platinum-400 hover:text-gold-400 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="p-8 pt-12">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-3 animate-pulse-gold">
              <Scale size={26} className="text-gold-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-platinum-100">
              Lex<span className="text-gold-400">RAG</span>
            </h1>
            <p className="text-xs text-platinum-400 mt-1">Corporate Legal AI Platform</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-0 glass-card p-1 mb-6">
            {['signin','register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab === t ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-platinum-400 hover:text-platinum-200'
                }`}>
                {t === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'signin' ? (
              <motion.div key="signin"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }} className="flex flex-col gap-4">
                <InputField icon={User} label="Username" value={siUser} onChange={setSiUser} placeholder="your-username" />
                <InputField icon={Lock} label="Password" value={siPass} onChange={setSiPass} placeholder="••••••••" toggleable />
                {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button onClick={handleSignIn} disabled={loading}
                  className="btn-gold w-full flex items-center justify-center gap-2 mt-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
                </button>
              </motion.div>
            ) : (
              <motion.div key="register"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }} className="flex flex-col gap-4">
                <InputField icon={User}      label="Username"  value={regUser}   onChange={setRegUser}   placeholder="your-username" />
                <InputField icon={Lock}      label="Password"  value={regPass}   onChange={setRegPass}   placeholder="min. 6 characters" toggleable />
                <InputField icon={Building2} label="Tenant ID" value={regTenant} onChange={setRegTenant} placeholder="e.g. acme-corp" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-platinum-400 font-medium tracking-wide">Access Role</label>
                  <div className="flex flex-col gap-2">
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setRegRole(r.value)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                          regRole === r.value ? 'border-gold-500/50 bg-gold-500/10' : 'border-white/5 hover:border-white/10'
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                          regRole === r.value ? 'border-gold-400 bg-gold-400' : 'border-platinum-400'
                        }`}>
                          {regRole === r.value && <div className="w-1.5 h-1.5 rounded-full bg-obsidian-950" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-platinum-200">{r.label}</div>
                          <div className="text-xs text-platinum-400 mt-0.5">{r.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button onClick={handleRegister} disabled={loading}
                  className="btn-gold w-full flex items-center justify-center gap-2 mt-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
                </button>
                <p className="text-center text-xs text-platinum-400 leading-relaxed">
                  All users sharing the same <span className="text-gold-400">Tenant ID</span> share the same document corpus.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
