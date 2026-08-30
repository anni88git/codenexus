import React from 'react';
import { motion } from 'framer-motion';
import { X, Code } from 'lucide-react';

export default function CustomCodeModal({ value, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col h-[60vh]">
        <div className="shrink-0 p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Submit Custom Code/Trace</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 p-4 bg-slate-950 min-h-0">
          <textarea
            className="w-full h-full bg-transparent border-none resize-none text-xs font-mono text-slate-300 focus:outline-none placeholder:text-slate-700"
            placeholder="Paste your stack trace or broken code here..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="shrink-0 p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900/50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={() => onSubmit(value)} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-cyan-900/50">
            Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
}
