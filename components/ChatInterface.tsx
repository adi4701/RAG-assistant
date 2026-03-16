'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { streamQuery } from '@/lib/api-client';
import { useToast } from './Toast';
import { Send, LogOut, Scale, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Copy, FileWarning } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: any[] | null;
  cached: boolean | null;
  timestamp: Date;
}

function CitationChip({ uuid, citations }: { uuid: string, citations: any[] | null }) {
  const citation = citations?.find(c => c.uuid === uuid);
  const shortUuid = uuid.substring(0, 8);
  
  if (citation?.verified) {
    return (
      <span className="citation-verified mx-1">
        <CheckCircle className="w-3 h-3" />
        {shortUuid}
      </span>
    );
  }
  
  return (
    <span className="citation-unverified mx-1">
      <AlertTriangle className="w-3 h-3" />
      {shortUuid} [UNVERIFIED]
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const { showToast } = useToast();
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    showToast('Copied to clipboard', 'info');
  };

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] shadow-sm">
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  if (msg.content === "Insufficient documentary evidence in the provided context.") {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] shadow-sm flex items-start gap-3">
          <FileWarning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm">No relevant documents found. Upload documents in the sidebar first.</p>
        </div>
      </div>
    );
  }

  // Parse citations
  const parts = msg.content.split(/(\[SOURCE:\s*[a-f0-9]{32}\])/g);

  return (
    <div className="flex justify-start mb-4 group">
      <div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] shadow-sm relative">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {parts.map((part, i) => {
            const match = part.match(/\[SOURCE:\s*([a-f0-9]{32})\]/);
            if (match) {
              return <CitationChip key={i} uuid={match[1]} citations={msg.citations} />;
            }
            return <span key={i}>{part}</span>;
          })}
          {msg.id === 'streaming' && <span className="animate-pulse ml-1">▋</span>}
        </div>

        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button 
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {sourcesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Sources ({msg.citations.length})
            </button>
            
            {sourcesOpen && (
              <div className="mt-2 space-y-1.5">
                {msg.citations.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-1.5 rounded">
                    {c.verified ? <CheckCircle className="w-3 h-3 text-green-600" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                    <span className="font-mono text-[10px] text-gray-400">{c.uuid.substring(0,8)}</span>
                    <span className="truncate">{c.filename || 'Unknown source'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            {msg.cached && <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">⚡ cached</span>}
          </div>
          <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'offline'>('connected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Mock health check
        setApiStatus('connected');
      } catch (e) {
        setApiStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || streaming || !user) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      citations: null,
      cached: null,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setStreaming(true);

    const placeholderMsg: Message = {
      id: 'streaming',
      role: 'assistant',
      content: '',
      citations: null,
      cached: null,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, placeholderMsg]);

    let currentContent = '';

    streamQuery({
      query: userMsg.content,
      token: user.access_token,
      onToken: (token: string) => {
        currentContent += token;
        setMessages(prev => prev.map(m => m.id === 'streaming' ? { ...m, content: currentContent } : m));
      },
      onCitations: (citations: any[], cached: boolean) => {
        setMessages(prev => prev.map(m => m.id === 'streaming' ? { ...m, citations, cached, id: Date.now().toString() } : m));
      },
      onDone: () => {
        setStreaming(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      onError: (err: any) => {
        showToast('Query failed. Please try again.', 'error');
        setStreaming(false);
        setMessages(prev => prev.filter(m => m.id !== 'streaming'));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    analyst: 'bg-blue-100 text-blue-800 border-blue-200',
    readonly: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <Scale className="w-5 h-5" />
            LexRAG
          </div>
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
            Tenant: {user?.tenant_id}
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              {apiStatus === 'connected' ? 'Connected' : 'API Offline'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2 py-1 rounded border ${roleColors[user?.role || 'readonly']}`}>
            {user?.role}
          </span>
          <span className="text-sm font-medium text-gray-700">{user?.username}</span>
          <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
              <Scale className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ask anything about your legal documents</h2>
            <p className="text-sm text-gray-500 mb-8">LexRAG securely searches your tenant&apos;s documents and provides cited answers.</p>
            
            <div className="flex flex-col gap-2 w-full">
              {[
                "What are the confidentiality carve-outs?",
                "Summarise the termination clauses",
                "What is the governing law in these agreements?"
              ].map((q, i) => (
                <button 
                  key={i}
                  onClick={() => setInputValue(q)}
                  className="text-sm text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder="Ask about your legal documents…"
              className="w-full resize-none border border-gray-300 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[52px] max-h-[120px] shadow-sm"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || streaming}
              className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {streaming ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            LexRAG cites every claim. Always verify with source documents.
          </p>
        </div>
      </div>
    </div>
  );
}
