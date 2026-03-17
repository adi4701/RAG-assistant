import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, ChevronDown, Copy } from 'lucide-react';
import { useToast } from './Toast';

export default function CitationPanel({ citations, cached }) {
  const [open]       = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  if (!citations || citations.length === 0) return null;
  const verified = citations.filter(c => c.verified).length;

  return (
    <div className="mt-2">
      <button onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-platinum-400 hover:text-gold-400 transition-colors">
        <CheckCircle size={12} className="text-emerald-400" />
        <span>{verified}/{citations.length} sources verified</span>
        {cached && (
          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 font-mono">
            ⚡ cached
          </span>
        )}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }} className="ml-1">
          <ChevronDown size={12} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="mt-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto chat-scroll pr-1">
              {citations.map((c, i) => (
                <div key={i}
                  className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                    c.verified ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-red-500/5 border border-red-500/10'
                  }`}>
                  {c.verified
                    ? <CheckCircle  size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    : <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono text-xs truncate ${c.verified ? 'text-emerald-400' : 'text-red-400'}`}>
                      {c.uuid.slice(0,16)}…
                    </div>
                    {c.verified  && <div className="text-platinum-400 mt-0.5 truncate">{c.filename} · pg {c.page_number}</div>}
                    {!c.verified && <div className="text-red-400/70 mt-0.5">[UNVERIFIED]</div>}
                  </div>
                  {c.verified && (
                    <button onClick={() => { navigator.clipboard.writeText(c.uuid); showToast('UUID copied','info'); }}
                      className="text-platinum-400 hover:text-gold-400 transition-colors shrink-0">
                      <Copy size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
