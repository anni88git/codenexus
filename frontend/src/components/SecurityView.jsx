import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';

export default function SecurityView({ activeRun, isFixing, pipelineComplete }) {
  const suggestions = activeRun?.securitySuggestions || [];

  if (isFixing && !pipelineComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-slate-400 border-r-slate-400 rounded-full animate-spin"></div>
          <Shield className="w-8 h-8 text-slate-400 animate-pulse" />
        </div>
        <div className="text-sm font-mono text-slate-400 animate-pulse">Running Deep Security Audit...</div>
      </div>
    );
  }

  if (!activeRun) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-sm">
        No active run. Please initiate a fix.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-800/60 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Security Audit Report</h2>
          <div className="text-xs font-mono text-slate-400">Live AI Vulnerability Scan</div>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111] border border-slate-700">
             <span className="text-[10px] font-mono text-slate-400">Total Findings:</span>
             <span className="text-[11px] font-bold text-slate-200">{suggestions.length}</span>
          </div>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <motion.div initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y: 0 }} className="p-8 rounded-2xl border border-[#333] bg-[#1a1a1a] flex flex-col items-center justify-center space-y-4 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-400" />
          <div>
            <div className="text-lg font-bold text-slate-300">No Critical Vulnerabilities Found</div>
            <div className="text-xs text-slate-400 mt-1 max-w-md">The agent analyzed the file and did not find any obvious SQL injection, XSS, memory leaks, or common CWE vectors.</div>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {suggestions.map((s, i) => {
              const isHigh = s.severity === 'high' || s.severity === 'critical';
              const colorClass = 'text-slate-300';
              const bgClass = 'bg-[#1a1a1a]';
              const borderClass = 'border-[#333]';

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-5 rounded-2xl border ${borderClass} ${bgClass} flex gap-4 items-start`}
                >
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full border ${borderClass} flex items-center justify-center bg-[#0a0a0a]/50`}>
                    {isHigh ? <ShieldAlert className={`w-4 h-4 ${colorClass}`} /> : <Info className={`w-4 h-4 ${colorClass}`} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-bold ${colorClass}`}>{s.title}</h3>
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${borderClass} ${colorClass}`}>
                        {s.severity || 'Medium'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {s.description}
                    </p>
                    {s.fix && (
                      <div className="mt-2 bg-[#0a0a0a]/50 border border-[#333] rounded-lg p-3">
                        <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> Recommended Fix Implemented
                        </div>
                        <code className="text-[11px] font-mono text-slate-300">{s.fix}</code>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
