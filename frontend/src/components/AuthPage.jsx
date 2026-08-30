import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, MessageSquare, Zap,
} from 'lucide-react';

// Inline GitHub SVG (lucide-react dropped this export in v0.300+)
function GithubIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

// ── Animated floating particle for visual flair ───────────────────────────────
function FloatingOrb({ size, x, y, color, duration }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%`, background: color, filter: 'blur(60px)', opacity: 0.18 }}
      animate={{ y: [-16, 16, -16], x: [-8, 8, -8] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Animated input field ──────────────────────────────────────────────────────
function AnimatedInput({ icon: Icon, type = 'text', placeholder, value, onChange, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-slate-800/60 backdrop-blur-sm transition-all duration-300 ${
        focused ? 'border-cyan-500/60 shadow-[0_0_0_3px_rgba(6,182,212,0.12)]' : 'border-slate-700/60 hover:border-slate-600/80'
      }`}
      animate={focused ? { scale: 1.005 } : { scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Icon className={`w-4 h-4 shrink-0 transition-colors ${focused ? 'text-cyan-400' : 'text-slate-500'}`} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
      />
      {rightSlot}
    </motion.div>
  );
}

// ── Main AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage({ onAuthenticated }) {
  const [tab, setTab]             = useState('signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    // Simulate auth round-trip
    setTimeout(() => {
      setLoading(false);
      onAuthenticated({
        name: name.trim() || email.split('@')[0],
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(email)}`,
      });
    }, 1400);
  };

  const handleOAuth = (provider) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthenticated({
        name: `${provider} User`,
        email: `${provider.toLowerCase()}@oauth.dev`,
        avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${provider}`,
      });
    }, 900);
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-slate-950">

      {/* ═══ LEFT PANEL — 60% Video Showcase ════════════════════════════════ */}
      <div className="relative hidden lg:block" style={{ width: '60%' }}>
        {/* Background video */}
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-and-code-41539-large.mp4"
            type="video/mp4"
          />
          {/* Fallback if video blocked */}
          <source src="/bg.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" style={{ height: '50%', bottom: 0, top: 'auto' }} />

        {/* Ambient orbs */}
        <FloatingOrb size={400} x={10}  y={15} color="rgba(6,182,212,1)"   duration={9} />
        <FloatingOrb size={300} x={60}  y={60} color="rgba(168,85,247,1)"  duration={11} />
        <FloatingOrb size={250} x={30}  y={75} color="rgba(52,211,153,1)"  duration={7} />

        {/* Scan-line overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%)', backgroundSize: '100% 4px', zIndex: 1 }} />

        {/* Top logo badge */}
        <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Cpu className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-[0.2em] text-white">CODENEXUS</div>
            <div className="text-[9px] font-mono text-cyan-400/70 tracking-widest">AI STUDIO</div>
          </div>
        </div>

        {/* Live feature pills */}
        <div className="absolute top-8 right-8 z-10 flex flex-col gap-2">
          {['AST Indexing', 'Codestral AI', 'Auto PR'].map((pill, i) => (
            <motion.div key={pill} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.15 }}
              className="flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-300">{pill}</span>
            </motion.div>
          ))}
        </div>

        {/* Bottom-left brand copy */}
        <motion.div
          className="absolute bottom-12 left-10 z-10 max-w-sm"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">Autonomous Engine</span>
          </div>
          <h1 className="text-4xl font-black leading-tight bg-gradient-to-br from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-3">
            CodeNexus<br />AI Studio
          </h1>
          <p className="text-sm text-slate-300/70 leading-relaxed">
            Autonomous Code Healing & AST Analysis.<br />
            Let the AI find, patch, and ship fixes — you review.
          </p>

          {/* Stat row */}
          <div className="flex items-center gap-6 mt-6">
            {[['98.6%', 'Patch Accuracy'], ['< 2s', 'Avg Latency'], ['4-Node', 'AI Pipeline']].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="text-lg font-bold text-cyan-300 font-mono">{val}</div>
                <div className="text-[10px] text-slate-500 font-mono">{lbl}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══ RIGHT PANEL — 40% Auth Form ════════════════════════════════════ */}
      <div className="flex-1 lg:w-[40%] flex flex-col justify-center items-center p-8 lg:p-12 bg-slate-950 relative overflow-y-auto">

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />

        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Mobile logo (shown only on small screens) */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-widest text-white">CODENEXUS STUDIO</span>
          </div>

          {/* Auth Card */}
          <div className="p-8 space-y-6 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md">

            {/* Card header */}
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Welcome to CodeNexus</h2>
              <p className="text-sm text-slate-400 mt-1">Sign in to access the autonomous patching dashboard.</p>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
              {['signin', 'signup'].map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 text-xs font-mono py-2 rounded-lg transition-all ${
                    tab === t ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/25 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  {t === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOAuth('GitHub')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700/70 bg-slate-800/50 text-slate-300 text-xs font-mono hover:border-slate-600 hover:bg-slate-800 transition-all active:scale-[0.97]">
                <GithubIcon className="w-3.5 h-3.5" /> GitHub
              </button>
              <button onClick={() => handleOAuth('Discord')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700/70 bg-slate-800/50 text-slate-300 text-xs font-mono hover:border-slate-600 hover:bg-slate-800 transition-all active:scale-[0.97]">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Discord
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700/50" />
              <span className="text-[10px] text-slate-600 font-mono">or continue with email</span>
              <div className="flex-1 h-px bg-slate-700/50" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {tab === 'signup' && (
                  <motion.div key="name-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                    <AnimatedInput icon={Zap} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatedInput
                icon={Mail}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <AnimatedInput
                icon={Lock}
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightSlot={
                  <button type="button" onClick={() => setShowPass(!showPass)} className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 font-mono bg-red-950/20 border border-red-500/20 px-3 py-2 rounded-lg">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  loading
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-purple-600 text-white shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:brightness-110'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    {tab === 'signin' ? 'Sign In' : 'Create Account'} — Launch Studio
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <p className="text-center text-[10px] text-slate-600 font-mono leading-relaxed">
              By continuing you agree to the CodeNexus{' '}
              <button className="text-cyan-500/70 hover:text-cyan-400 underline">Terms of Service</button>
              {' '}and{' '}
              <button className="text-cyan-500/70 hover:text-cyan-400 underline">Privacy Policy</button>.
            </p>
          </div>

          {/* Below-card trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {['256-bit TLS', 'SOC 2 Ready', 'Zero-log Policy'].map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                {b}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
