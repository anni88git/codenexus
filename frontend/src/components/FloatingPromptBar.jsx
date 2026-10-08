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
  onClearCustomCode,
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

  // Auto-resize textarea when prompt changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '24px'; // Reset first
      if (prompt) {
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
      } else {
        inputRef.current.scrollLeft = 0;
        inputRef.current.scrollTop = 0;
      }
    }
  }, [prompt]);

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
      const hasCode = Boolean(customCode?.trim() || activeEditorCode?.trim());
      if (!prompt.trim() && hasCode && onClearCustomCode) {
        onClearCustomCode();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl z-50 px-2 transition-all duration-300 ease-out ${focused || prompt.trim() || customCode?.trim() || activeEditorCode?.trim() ? 'scale-[1.04] -translate-y-2' : 'hover:scale-[1.02] hover:-translate-y-1'}`}>
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

      {/* ── Top-bar Hints ───────────────────────────────────────────── */}
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-2 text-[10px] font-mono">
        <div className="flex items-center gap-2 opacity-60">
          <span className="text-slate-400"><kbd className="bg-[#1e1e1e] border border-[#2a2a2a] px-1 rounded text-slate-300">Enter</kbd> run</span>
          <span className="text-slate-400"><kbd className="bg-[#1e1e1e] border border-[#2a2a2a] px-1 rounded text-slate-300">Shift+Enter</kbd> new line</span>
        </div>
        {(customCode?.trim() || activeEditorCode?.trim()) && (
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Workspace code loaded</span>
            <span className="text-slate-500 text-[9px] font-mono tracking-wide">
              Press Enter (empty) to clear
            </span>
          </div>
        )}
      </div>

      {/* ── Main Bar Container ─────────────────────────────────────── */}
      <div
        className="relative flex items-center gap-2.5 p-2 rounded-2xl transition-all duration-300 shadow-xl"
        style={{
          background: focused ? '#2a2a2a' : '#1a1a1a',
          border: error ? '1px solid #ef4444' : focused ? '1px solid #fff' : '1px solid #424242',
        }}
      >


        {/* Input Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex items-center gap-2 relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(false);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe bug, paste stack trace, or press Generate (Auto-pushes fix to Git)..."
            disabled={isFixing}
            rows={1}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-2 py-1 disabled:opacity-50 font-mono resize-none overflow-auto"
            style={{ minHeight: '24px', lineHeight: '24px' }}
          />

          {!prompt && !focused && !isFixing && scenario?.stackTrace && (
            <button
              type="button"
              onClick={() => {
                setPrompt(scenario.stackTrace.split('\n')[0]);
                inputRef.current?.focus();
              }}
              className="hidden lg:flex shrink-0 items-center gap-1 text-[9px] font-mono text-slate-400 hover:text-cyan-400 border border-slate-800 bg-[#111111]/80 px-2 py-1 rounded-lg transition-all"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Load trace
            </button>
          )}
        </form>

        <div className="shrink-0 w-px h-6 bg-slate-800" />

        {/* Custom Code Button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenCustomModal}
            disabled={isFixing}
            title="View/Edit attached code snippet"
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
              (customCode?.trim() || activeEditorCode?.trim())
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
                : 'bg-[#111111]/60 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400'
            }`}
          >
            <FileCode className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isFixing || (!prompt.trim() && !customCode?.trim() && !activeEditorCode?.trim())}
          className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:bg-[#424242] disabled:text-slate-500 transition-all flex items-center justify-center"
        >
          {isFixing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Removed old sub-bar hints to fix overflow issues */}
    </div>
  );
}
