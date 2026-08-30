import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, FileCode, Sparkles, RefreshCw, AlertCircle, X, Check } from 'lucide-react';

const LANGUAGES = [
  { id: 'auto',   label: 'Auto',    color: '#a855f7', bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.4)' },
  { id: 'nodejs', label: 'Node.js', color: '#68a063', bg: 'rgba(104,160,99,0.18)', border: 'rgba(104,160,99,0.4)' },
  { id: 'python', label: 'Python',  color: '#3b82f6', bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.4)' },
  { id: 'golang', label: 'Go',      color: '#06b6d4', bg: 'rgba(6,182,212,0.18)',  border: 'rgba(6,182,212,0.4)' },
  { id: 'rust',   label: 'Rust',    color: '#f97316', bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.4)' },
  { id: 'cpp',    label: 'C++',     color: '#f43f5e', bg: 'rgba(244,63,94,0.18)',  border: 'rgba(244,63,94,0.4)' },
  { id: 'java',   label: 'Java',    color: '#eab308', bg: 'rgba(234,179,8,0.18)',  border: 'rgba(234,179,8,0.4)' },
  { id: 'sql',    label: 'SQL',     color: '#10b981', bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.4)' },
];

export default function FloatingPromptBar({
  language,
  onLanguageChange,
  onTrigger,
  isFixing,
  onOpenCustomModal,
  scenario,
  customCode,
  activeEditorCode, // Pass active editor content as fallback
}) {
  const [prompt, setPrompt] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setPrompt('');
    setError(false);
  }, [scenario]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isFixing) return;

    const activeCode = customCode || activeEditorCode;
    const hasPrompt = Boolean(prompt.trim());
    const hasCode = Boolean(activeCode && activeCode.trim());

    // Allow submission if prompt exists OR active code exists in workspace
    if (!hasPrompt && !hasCode) {
      setError(true);
      const t = setTimeout(() => setError(false), 3200);
      return () => clearTimeout(t);
    }

    setError(false);
    onTrigger({
      errorTrace: prompt.trim() || scenario?.stackTrace || null,
      customCode: activeCode || null,
      language: language?.label || 'Auto-Detect',
    });
    setPrompt('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 px-2 select-none">
      {/* ── Error Toast ───────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-950/95 border border-red-500/50 text-red-300 text-xs font-mono px-4 py-2 rounded-xl shadow-2xl backdrop-blur-xl whitespace-nowrap z-50"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            No code or error trace detected in active workspace.
            <button onClick={() => setError(false)} className="ml-2 text-red-400 hover:text-red-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Outer Glow Halo ────────────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
        style={{
          background: focused
            ? 'radial-gradient(ellipse at 50% 100%, rgba(6,182,212,0.2) 0%, transparent 70%)'
            : error
            ? 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.2) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 100%, rgba(6,182,212,0.08) 0%, transparent 70%)',
        }}
      />

      {/* ── Main Bar Container ─────────────────────────────────────── */}
      <div
        className="relative flex items-center gap-2.5 p-2 rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(6, 10, 22, 0.95)',
          border: error
            ? '1px solid rgba(239,68,68,0.5)'
            : focused
            ? '1px solid rgba(6,182,212,0.55)'
            : '1px solid rgba(6,182,212,0.28)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(6,182,212,0.12)',
        }}
      >
        {/* Language Selector Container */}
        <div className="shrink-0 flex items-center gap-1 bg-slate-900/90 rounded-xl p-1 border border-slate-800/80 overflow-x-auto max-w-[180px] sm:max-w-[240px] md:max-w-[300px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onLanguageChange(l)}
              disabled={isFixing}
              className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg transition-all shrink-0 disabled:opacity-40"
              style={
                language?.id === l.id
                  ? { background: l.bg, border: `1px solid ${l.border}`, color: l.color }
                  : { border: '1px solid transparent', color: '#64748b' }
              }
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 w-px h-6 bg-slate-800" />

        {/* Input Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex items-center gap-2 relative">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(false);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe bug, paste stack trace, or press Generate..."
            disabled={isFixing}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-2 py-1 disabled:opacity-50 font-mono"
          />

          {!prompt && !focused && !isFixing && scenario?.stackTrace && (
            <button
              type="button"
              onClick={() => {
                setPrompt(scenario.stackTrace.split('\n')[0]);
                inputRef.current?.focus();
              }}
              className="hidden lg:flex shrink-0 items-center gap-1 text-[9px] font-mono text-slate-400 hover:text-cyan-400 border border-slate-800 bg-slate-900/80 px-2 py-1 rounded-lg transition-all"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Load trace
            </button>
          )}
        </form>

        <div className="shrink-0 w-px h-6 bg-slate-800" />

        {/* Custom Code Button */}
        <button
          type="button"
          onClick={onOpenCustomModal}
          disabled={isFixing}
          title="Paste custom code snippet"
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
            customCode?.trim()
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400'
          }`}
        >
          <FileCode className="w-4 h-4" />
        </button>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isFixing}
          className="shrink-0 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {isFixing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>RUNNING…</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">GENERATE AI FIX</span>
              <span className="sm:hidden">FIX</span>
            </>
          )}
        </button>
      </div>

      {/* Sub-bar Hints */}
      <div className="flex items-center justify-center gap-3 mt-1.5">
        <span className="text-[9px] font-mono text-slate-500">
          <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400">Enter</kbd> run ·{' '}
          <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400">Shift+Enter</kbd> new line
          {(customCode?.trim() || activeEditorCode?.trim()) && (
            <span className="ml-2 text-cyan-400 font-semibold">✓ Workspace code ready</span>
          )}
        </span>
      </div>
    </div>
  );
}