import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Scale, Copy, FileWarning } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { useStreamQuery } from '../hooks/useStreamQuery';
import CitationPanel from './CitationPanel';

const CITE_REGEX = /\[SOURCE:\s*([a-f0-9]{32})\]/gi;

function renderContent(content, citations) {
  const parts = [];
  let last = 0, match;
  CITE_REGEX.lastIndex = 0;
  while ((match = CITE_REGEX.exec(content)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: content.slice(last, match.index) });
    const uuid = match[1];
    const cit  = citations?.find(c => c.uuid.toLowerCase() === uuid.toLowerCase());
    parts.push({ type: 'cite', uuid, verified: cit?.verified ?? null });
    last = match.index + match[0].length;
  }
  if (last < content.length) parts.push({ type: 'text', value: content.slice(last) });
  return parts.map((p, i) =>
    p.type === 'text'
      ? <span key={i}>{p.value}</span>
      : <span key={i} className={p.verified === false ? 'citation-unverified' : 'citation-verified'} title={p.uuid}>
          [{p.uuid.slice(0,8)}]
        </span>
  );
}

const EXAMPLES = [
  'What are the confidentiality carve-outs?',
  'Summarise the termination clauses.',
  'What is the governing law in these agreements?',
  'List all indemnification obligations.',
];

function EmptyState({ onExample }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-5 animate-pulse-gold">
        <Scale size={28} className="text-gold-400" />
      </div>
      <h2 className="font-display text-2xl font-bold text-platinum-100 mb-2">Ask LexRAG</h2>
      <p className="text-sm text-platinum-400 mb-8 max-w-xs">
        Every answer is grounded in your uploaded documents with verified citations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {EXAMPLES.map((e, i) => (
          <motion.button key={i} onClick={() => onExample(e)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="glass-card px-4 py-3 text-left text-sm text-platinum-300 hover:text-gold-400 transition-colors">
            "{e}"
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ msg }) {
  const { showToast } = useToast();
  const isUser   = msg.role === 'user';
  const isInsuff = msg.content === 'Insufficient documentary evidence in the provided context.';
  const isError  = msg.error;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>

      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 mt-1 mr-2.5">
          <Scale size={14} className="text-gold-400" />
        </div>
      )}

      <div className={`max-w-[80%] md:max-w-[70%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 relative ${
          isUser    ? 'bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 rounded-tr-sm text-platinum-100'
          : isInsuff ? 'bg-amber-500/10 border border-amber-500/20 rounded-tl-sm'
          : isError  ? 'bg-red-500/10 border border-red-500/20 rounded-tl-sm text-red-300'
                     : 'glass-card rounded-tl-sm text-platinum-200'
        }`}>

          {isInsuff ? (
            <div className="flex items-start gap-2 text-sm">
              <FileWarning size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-300 mb-0.5">No relevant documents found</p>
                <p className="text-xs text-amber-400/80">Upload documents in the sidebar then try again.</p>
              </div>
            </div>
          ) : (
            <p className="lex-prose text-sm leading-relaxed whitespace-pre-wrap">
              {renderContent(msg.content, msg.citations)}
              {msg.streaming && <span className="stream-cursor ml-0.5" />}
            </p>
          )}

          {!isUser && !msg.streaming && msg.content && !isInsuff && (
            <button
              onClick={() => { navigator.clipboard.writeText(msg.content); showToast('Copied','info'); }}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-obsidian-800 border border-white/10 flex items-center justify-center text-platinum-400 hover:text-gold-400 transition-all">
              <Copy size={11} />
            </button>
          )}
        </div>

        {!isUser && msg.citations && (
          <div className="px-1">
            <CitationPanel citations={msg.citations} cached={msg.cached} />
          </div>
        )}

        <span className="text-xs text-platinum-400/40 px-1 font-mono">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

export default function ChatInterface() {
  const { user }    = useAuth();
  const { send, isStreaming, messages, clearMessages } = useStreamQuery(user?.access_token);
  const [input, setInput] = useState('');
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput('');
    send(q);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6 flex flex-col gap-4">
        {messages.length === 0
          ? <EmptyState onExample={q => { setInput(q); setTimeout(() => textareaRef.current?.focus(), 50); }} />
          : messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        }
        <div ref={bottomRef} />
      </div>

      <div className="gold-line mx-4" />

      <div className="px-4 py-3 shrink-0">
        <div className="flex gap-3 items-end">
          <textarea ref={textareaRef} value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            disabled={isStreaming} rows={2}
            placeholder="Ask about your legal documents… (Enter to send, Shift+Enter for newline)"
            className="lex-input flex-1 resize-none leading-relaxed"
            style={{ minHeight: '60px', maxHeight: '140px' }}
          />
          <div className="flex flex-col gap-2">
            <motion.button onClick={handleSend} disabled={!input.trim() || isStreaming}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              className="w-11 h-11 rounded-xl btn-gold flex items-center justify-center disabled:opacity-40">
              {isStreaming
                ? <div className="w-4 h-4 border-2 border-obsidian-950/50 border-t-obsidian-950 rounded-full animate-spin" />
                : <Send size={16} />}
            </motion.button>
            {messages.length > 0 && (
              <motion.button onClick={clearMessages}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                className="w-11 h-11 rounded-xl glass-card flex items-center justify-center text-platinum-400 hover:text-red-400 transition-colors"
                title="Clear chat">
                <Trash2 size={15} />
              </motion.button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-platinum-400/40 mt-2 font-mono">
          Every claim is cited · Verify all outputs with source documents
        </p>
      </div>
    </div>
  );
}
