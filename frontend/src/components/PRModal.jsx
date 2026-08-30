import React from 'react';
import { motion } from 'framer-motion';
import { X, GitPullRequest, GitMerge } from 'lucide-react';

export default function PRModal({ pr, onClose }) {
  if (!pr) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">Pull Request Created</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-xl font-bold text-slate-100">{pr.title}</div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 rounded-md">Open</span>
            <span className="text-slate-400">codenexus/core-api#{pr.number}</span>
          </div>
          <div className="mt-4 p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-3">
            <GitMerge className="w-4 h-4 text-purple-400" />
            <div className="text-xs text-slate-300">
              Branch <span className="font-mono text-purple-300">{pr.branch}</span> successfully pushed to origin.
            </div>
          </div>
          <button onClick={onClose} className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors">
            View on GitHub
          </button>
        </div>
      </motion.div>
    </div>
  );
}
