import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

export default function ExplainDrawer({ fix, filename, onClose }) {
  const isObject = typeof fix === 'object' && fix !== null;
  const rootCause = isObject ? fix.rootCause : fix;
  const securityImpact = isObject ? fix.securityImpact : null;
  const lines = isObject ? fix.lines : [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50"
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
      >
        <div className="shrink-0 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">AI Explanation</h2>
              <p className="text-xs font-mono text-slate-500">{filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          <section className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Root Cause Analysis
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {rootCause || "The AI detected an anomaly and generated a patch based on standard best practices."}
            </p>
          </section>

          {securityImpact && (
            <section className="bg-red-950/20 border border-red-500/20 rounded-xl p-4">
              <h3 className="flex items-center gap-2 text-xs font-mono font-semibold text-red-400 mb-3 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" /> Security Impact
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {securityImpact}
              </p>
            </section>
          )}

          {lines && lines.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 mb-4 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" /> Line-by-Line Changes
              </h3>
              <div className="space-y-4">
                {lines.map((l, i) => (
                  <div key={i} className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-500">
                      Line {l.line}
                    </div>
                    <div className="p-3 text-xs font-mono">
                      <div className="text-red-400/80 line-through mb-1.5">- {l.before}</div>
                      <div className="text-emerald-400/90">+ {l.after}</div>
                    </div>
                    <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800/50 text-xs text-slate-400">
                      {l.reason}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </>
  );
}
