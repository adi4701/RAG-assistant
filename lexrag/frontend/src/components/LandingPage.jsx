import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Scale, Shield, Zap, Search, FileCheck, Lock,
  ChevronRight, ArrowRight, CheckCircle,
  Building2, Users, FileText, BarChart3,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

function TypedText({ strings, className }) {
  const el = useRef(null);
  useEffect(() => {
    const current = el.current;
    if (!current) return;
    let i = 0, si = 0, deleting = false;
    const tick = () => {
      const word = strings[si % strings.length];
      current.textContent = deleting ? word.slice(0, i--) : word.slice(0, i++);
      let delay = deleting ? 60 : 100;
      if (!deleting && i > word.length) { delay = 2000; deleting = true; }
      if (deleting && i < 0) { i = 0; si++; deleting = false; delay = 400; }
      setTimeout(tick, delay);
    };
    tick();
  }, [strings]);
  return (
    <span className={className}>
      <span ref={el} />
      <span className="stream-cursor" />
    </span>
  );
}

export default function LandingPage({ onGetStarted }) {
  const heroRef     = useRef(null);
  const statsRef    = useRef(null);
  const featuresRef = useRef(null);
  const stepsRef    = useRef(null);
  const ctaRef      = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Hero stagger entrance
      gsap.from('.hero-child', {
        opacity: 0, y: 50,
        stagger: 0.12, duration: 1,
        ease: 'power3.out', delay: 0.2,
      });

      // Decorative orbiting rings
      gsap.to('.hero-ring-1', { rotation: 360,  duration: 20, repeat: -1, ease: 'none' });
      gsap.to('.hero-ring-2', { rotation: -360, duration: 30, repeat: -1, ease: 'none' });

      // Stats reveal
      gsap.from('.stat-card', {
        scrollTrigger: { trigger: statsRef.current, start: 'top 80%' },
        opacity: 0, y: 40, stagger: 0.1, duration: 0.7, ease: 'power2.out',
      });

      // Features reveal
      gsap.from('.feature-card', {
        scrollTrigger: { trigger: featuresRef.current, start: 'top 75%' },
        opacity: 0, y: 50, stagger: 0.08, duration: 0.8, ease: 'power2.out',
      });

      // How-it-works steps slide in
      gsap.from('.step-item', {
        scrollTrigger: { trigger: stepsRef.current, start: 'top 75%' },
        opacity: 0, x: -50, stagger: 0.15, duration: 0.7, ease: 'power2.out',
      });

      // Gold line expand
      gsap.from('.gold-expand-line', {
        scrollTrigger: { trigger: '.gold-expand-line', start: 'top 90%' },
        scaleX: 0, transformOrigin: 'left center',
        duration: 1.2, ease: 'power3.out',
      });

      // CTA pop in
      gsap.from('.cta-box', {
        scrollTrigger: { trigger: ctaRef.current, start: 'top 80%' },
        opacity: 0, scale: 0.95, y: 30,
        duration: 0.9, ease: 'back.out(1.2)',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-950 overflow-x-hidden noise-overlay">

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: 'rgba(7,7,12,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-gold-400" />
          <span className="font-display text-xl font-bold text-platinum-100">
            Lex<span className="text-gold-400">RAG</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-platinum-400">
          <a href="#features"     className="hover:text-gold-400 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gold-400 transition-colors">How It Works</a>
          <a href="#security"     className="hover:text-gold-400 transition-colors">Security</a>
        </div>
        <motion.button onClick={onGetStarted}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="btn-gold text-sm px-5 py-2.5">
          Get Started
        </motion.button>
      </nav>

      {/* ── HERO ───────────────────────────────────────── */}
      <section ref={heroRef}
        className="relative min-h-screen flex items-center justify-center grid-bg pt-20 pb-10">

        {/* Ambient glow + orbiting rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
            style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)' }} />
          <div className="hero-ring-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-dashed opacity-20"
            style={{ borderColor: 'rgba(212,160,23,0.4)' }} />
          <div className="hero-ring-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-dashed opacity-10"
            style={{ borderColor: 'rgba(212,160,23,0.3)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          {/* Live badge */}
          <div className="hero-child inline-flex items-center gap-2 glass-card px-4 py-2 text-xs text-gold-400 mb-8 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            IEEE 2025 · 87.4% Answer Accuracy · 94.1% Citation Precision
          </div>

          {/* Heading */}
          <h1 className="hero-child font-display text-5xl md:text-7xl font-black text-platinum-100 leading-tight mb-6">
            Legal AI That<span className="block italic text-gold-400">Cites Its Sources.</span>
          </h1>

          {/* Typed subtitle */}
          <div className="hero-child text-xl md:text-2xl text-platinum-400 mb-4 h-8">
            <TypedText
              strings={['Analyse NDAs in seconds.','Retrieve exact clause references.','Zero hallucinated citations.','Multi-tenant. Enterprise-ready.']}
              className="font-display italic text-platinum-300"
            />
          </div>

          <p className="hero-child text-base text-platinum-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            LexRAG combines GPT-4o generation with metadata-predicate vector retrieval
            and cryptographic citation validation — every answer is traceable to its source.
          </p>

          {/* CTA buttons */}
          <div className="hero-child flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button onClick={onGetStarted}
              className="btn-gold text-base px-8 py-3.5 flex items-center gap-2"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              Start Analysing <ArrowRight size={18} />
            </motion.button>
            <motion.a href="#how-it-works"
              className="btn-ghost text-base flex items-center gap-2"
              whileHover={{ scale: 1.02 }}>
              How It Works <ChevronRight size={16} />
            </motion.a>
          </div>

          <p className="hero-child text-xs text-platinum-400 mt-6 opacity-50">
            Supports PDF · DOCX · NDAs · Employment Contracts · Board Resolutions · Shareholder Agreements
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-platinum-400 font-mono tracking-widest">SCROLL</span>
          <motion.div animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-gold-500 to-transparent" />
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────── */}
      <section ref={statsRef} className="py-20 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '87.4%',  label: 'Answer Accuracy',    icon: BarChart3    },
            { value: '94.1%',  label: 'Citation Precision', icon: CheckCircle  },
            { value: '4.2%',   label: 'Hallucination Rate', icon: Shield       },
            { value: '<400ms', label: 'Time to First Token', icon: Zap         },
          ].map((s, i) => (
            <div key={i} className="stat-card glass-card p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-3">
                <s.icon size={20} className="text-gold-400" />
              </div>
              <div className="font-display text-3xl font-bold text-gold-400 mb-1">{s.value}</div>
              <div className="text-sm text-platinum-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section id="features" ref={featuresRef} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-gold-500 tracking-[0.3em] uppercase mb-3">Capabilities</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-platinum-100 mb-4">
              Three Core Innovations
            </h2>
            <div className="gold-expand-line w-32 h-px mx-auto"
              style={{ background: 'linear-gradient(90deg,transparent,#d4a017,transparent)' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {[
              { icon: Search,    title: 'Semantic Retrieval',      color: 'text-gold-400',    bg: 'bg-gold-500/10',    border: 'border-gold-500/20',
                desc: 'Recursive chunking (1000-token windows, 150-token overlap) preserves clause co-references. 1536-dim dense embeddings surface semantically identical language regardless of surface form.' },
              { icon: Lock,      title: 'Zero-Trust Multi-Tenancy', color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/20',
                desc: 'JWT-anchored metadata predicates enforced at ChromaDB HNSW layer — not application code. Mathematically guaranteed tenant isolation with zero per-tenant index overhead.' },
              { icon: FileCheck, title: 'Verifiable Citations',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
                desc: 'Every generated claim is tagged with a SHA-256 chunk UUID cross-validated against the retrieved set. Hallucinated citations are flagged [UNVERIFIED] before reaching you.' },
            ].map((f, i) => (
              <motion.div key={i} className={`feature-card glass-card p-6 border ${f.border} relative overflow-hidden group`}
                whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-4`}>
                  <f.icon size={24} className={f.color} />
                </div>
                <h3 className="font-display text-xl font-semibold text-platinum-100 mb-2">{f.title}</h3>
                <p className="text-sm text-platinum-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap,       label: 'Redis Semantic Cache',  sub: '34% cache hit rate'              },
              { icon: Users,     label: 'Role-Based Access',     sub: 'Admin · Analyst · Read-only'     },
              { icon: FileText,  label: 'PDF & DOCX Ingestion',  sub: 'Up to 20MB per file'             },
              { icon: Building2, label: 'Enterprise Ready',      sub: 'SOC 2 aligned architecture'      },
            ].map((f, i) => (
              <div key={i} className="feature-card glass-card p-4 flex flex-col gap-2 group">
                <f.icon size={20} className="text-gold-400 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-semibold text-platinum-200">{f.label}</div>
                <div className="text-xs text-platinum-400">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section id="how-it-works" ref={stepsRef} className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-xs font-mono text-gold-500 tracking-[0.3em] uppercase mb-3">Process</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-platinum-100 mb-6 leading-tight">
              From Document<span className="block text-gold-400 italic">to Verified Answer</span>
            </h2>
            <p className="text-platinum-400 leading-relaxed mb-8">
              Three-layer pipeline ingests, indexes, and retrieves legal documents
              with cryptographic precision — every answer carries a verifiable paper trail.
            </p>
            <motion.button onClick={onGetStarted}
              className="btn-gold flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              Try It Now <ArrowRight size={16} />
            </motion.button>
          </div>
          <div>
            {[
              { title: 'Upload Your Documents',
                desc: 'Drag-drop PDFs or DOCX. LexRAG extracts text, applies recursive chunking, and stores 1536-dim embeddings in ChromaDB with your tenant metadata.' },
              { title: 'Query in Natural Language',
                desc: 'Ask anything about your contracts. JWT claims define document access — enforced at the vector database layer before any similarity search begins.' },
              { title: 'Receive Cited Answers',
                desc: 'GPT-4o streams answers grounded exclusively in retrieved chunks. Every claim carries a [SOURCE: uuid] tag validated against the retrieved chunk set.' },
              { title: 'Verify and Review',
                desc: 'Each citation shows filename, page number, and similarity score. Unverified citations are flagged before they reach you — never silently presented.' },
            ].map((s, i, arr) => (
              <div key={i} className="step-item flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center shrink-0">
                    <span className="font-mono text-gold-400 text-sm font-bold">{String(i+1).padStart(2,'0')}</span>
                  </div>
                  {i < arr.length - 1 &&
                    <div className="w-px flex-1 mt-2 bg-gradient-to-b from-gold-500/30 to-transparent min-h-[40px]" />}
                </div>
                <div className="pb-8">
                  <h4 className="font-display text-lg font-semibold text-platinum-100 mb-1">{s.title}</h4>
                  <p className="text-sm text-platinum-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ───────────────────────────────────── */}
      <section id="security" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-gold-500 tracking-[0.3em] uppercase mb-3">Trust</p>
            <h2 className="font-display text-4xl font-bold text-platinum-100 mb-4">
              Built for Professional Responsibility
            </h2>
            <p className="text-platinum-400 max-w-xl mx-auto text-sm">
              Designed in direct response to the Mata v. Avianca failure mode —
              where fabricated citations were submitted to a federal court.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: Shield,    color: 'text-gold-400',    bg: 'bg-gold-500/10',    border: 'border-gold-500/20',
                title: 'ABA Model Rule 1.1', body: 'Every response includes validated citations the reviewing attorney can independently verify in the source document.' },
              { icon: Lock,      color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',
                title: 'Zero Cross-Tenant Leakage', body: 'Mathematically enforced at ChromaDB HNSW. Isolation is a database-level guarantee, not application-layer policy.' },
              { icon: FileCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
                title: '[UNVERIFIED] Flagging', body: 'Citation UUIDs absent from the retrieved set are explicitly flagged before delivery — never silently equated with verified ones.' },
              { icon: BarChart3, color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',
                title: 'Audit-Ready Logging', body: 'Every unverified citation is logged to PostgreSQL with query, user, and timestamp — ready for compliance review.' },
            ].map((c, i) => (
              <motion.div key={i} className={`glass-card p-6 border ${c.border}`}
                whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                  <c.icon size={20} className={c.color} />
                </div>
                <h3 className="font-display text-lg font-semibold text-platinum-100 mb-2">{c.title}</h3>
                <p className="text-sm text-platinum-400 leading-relaxed">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section ref={ctaRef} className="py-24 px-6 border-t border-white/5">
        <div className="cta-box max-w-3xl mx-auto text-center glass-card-gold p-12 md:p-16">
          <div className="text-5xl mb-6">⚖️</div>
          <h2 className="font-display text-4xl md:text-5xl font-black text-platinum-100 mb-4 leading-tight">
            Ready to Analyse<span className="block text-gold-400 italic">Your Legal Corpus?</span>
          </h2>
          <p className="text-platinum-400 mb-10 leading-relaxed">
            Upload your first document in under 60 seconds. No prompting expertise required.
          </p>
          <motion.button onClick={onGetStarted}
            className="btn-gold text-lg px-10 py-4 flex items-center gap-3 mx-auto"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            Launch LexRAG <ArrowRight size={20} />
          </motion.button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scale size={14} className="text-gold-400" />
          <span className="font-display font-bold text-platinum-100">
            Lex<span className="text-gold-400">RAG</span>
          </span>
        </div>
        <p className="text-xs text-platinum-400 opacity-40">
          IEEE 2025 · Amity University, Noida · GPT-4o + ChromaDB + Redis
        </p>
      </footer>
    </div>
  );
}
