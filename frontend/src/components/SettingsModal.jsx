import React from 'react';
import { motion } from 'framer-motion';
import { X, Settings2, Save } from 'lucide-react';

export default function SettingsModal({ customInstructions, setCustomInstructions, onClose }) {
  const handleSave = () => {
    localStorage.setItem('nexus_agent_rules', customInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Agent Settings & Prompt Engineering</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">System Instructions</h3>
            <p className="text-xs text-slate-400">Define strict rules for how the multi-agent swarm should write code. These rules will be injected directly into the core system prompt.</p>
          </div>
          
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g. Always write JSDoc comments. Never use 'var'. Prefer functional programming over classes."
            className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-300 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none"
          />

          <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Swarm Architecture Active</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The Window uses a 3-agent swarm model. Your instructions will be passed to the <strong>Lead Coder Agent</strong>, which synthesizes vulnerability reports from the <strong>Security Auditor Agent</strong> and Big-O optimizations from the <strong>Performance Architect Agent</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-cyan-900/20">
            <Save className="w-4 h-4" />
            Save Rules
          </button>
        </div>
      </motion.div>
    </div>
  );
}
