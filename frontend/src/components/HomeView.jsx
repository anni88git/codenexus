import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, GitPullRequest, Activity, ChevronRight, Play, Network } from 'lucide-react';

function FeatureTypingTerminal() {
  const features = [
    "Initializing Neural Weave...",
    "Routing payload to Swarm Council...",
    "Building AST Graph Mesh...",
    "Running Security & Sandbox tests...",
    "Triggering 1-Click Git Auto-Push...",
    "Many minds, one solution."
  ];
  
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const current = features[idx];
    let timeout;
    
    if (isDeleting) {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(current.substring(0, text.length - 1)), 25);
      } else {
        setIsDeleting(false);
        setIdx((idx + 1) % features.length);
      }
    } else {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.substring(0, text.length + 1)), 60);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2500);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [text, isDeleting, idx]);
  
  return (
    <div className="mt-8 flex items-center gap-3 p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl font-mono text-xs shadow-inner">
      <span className="text-slate-600 font-bold shrink-0">agent@weave:~$</span>
      <span className="text-cyan-400">{text}</span>
      <span className="w-1.5 h-3 bg-cyan-400 animate-pulse shrink-0" />
    </div>
  );
}

const SCENARIO_CARDS = [
  {
    id: 'null_pointer',
    icon: '🛒',
    title: 'Null Pointer',
    category: 'Data Integrity',
    lang: 'Node.js',
    severity: 'CRITICAL',
    desc: 'Undefined property access on nested order object causes runtime crash at checkout.',
    accentColor: '#06b6d4',
    accentBg: 'rgba(6,182,212,0.08)',
  },
  {
    id: 'sql_injection',
    icon: '💉',
    title: 'SQL Injection',
    category: 'Auth Security',
    lang: 'Python',
    severity: 'CRITICAL',
    desc: 'Unsanitized user input directly interpolated into raw SQL query string.',
    accentColor: '#a855f7',
    accentBg: 'rgba(168,85,247,0.08)',
  },
  {
    id: 'memory_leak',
    icon: '🧠',
    title: 'Memory Leak',
    category: 'Performance',
    lang: 'Golang',
    severity: 'HIGH',
    desc: 'Goroutine leak in HTTP handler — channel never drained causing OOM over time.',
    accentColor: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
  },
  {
    id: 'deadlock',
    icon: '🔒',
    title: 'Deadlock',
    category: 'Concurrency',
    lang: 'Rust',
    severity: 'HIGH',
    desc: 'Mutex double-lock in async task causes thread starvation under concurrent load.',
    accentColor: '#f43f5e',
    accentBg: 'rgba(244,63,94,0.08)',
  },
];

const STATS = [
  { label: 'Patches Applied', value: '24', icon: Zap,            color: 'text-cyan-400',    bg: 'bg-cyan-950/25 border-cyan-500/15' },
  { label: 'PRs Merged',      value: '8',  icon: GitPullRequest, color: 'text-emerald-400', bg: 'bg-emerald-950/25 border-emerald-500/15' },
  { label: 'Vulns Fixed',     value: '19', icon: Shield,         color: 'text-purple-400',  bg: 'bg-purple-950/25 border-purple-500/15' },
  { label: 'Pipelines Run',   value: '31', icon: Activity,       color: 'text-amber-400',   bg: 'bg-amber-950/25 border-amber-500/15' },
];

const severityStyle = {
  CRITICAL: 'bg-red-950/40 text-red-300 border-red-500/25',
  HIGH:     'bg-amber-950/40 text-amber-300 border-amber-500/25',
  MEDIUM:   'bg-yellow-950/40 text-yellow-300 border-yellow-500/25',
};

export default function HomeView({ scenarios, activeScenario, onSelect, onTrigger, onGetStarted }) {
  const displayScenarios = scenarios?.length ? scenarios : SCENARIO_CARDS.map(c => ({
    ...c,
    shortLabel: c.title,
    filename: `${c.id}.js`,
    stackTrace: c.desc,
    owasp: { prePatch: { severity: c.severity } },
  }));

  return (
    <div className="min-h-full space-y-8 p-6 pb-36">

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden mb-8 p-8 bg-black/80 border border-slate-800 rounded-2xl backdrop-blur-md shadow-2xl">
        {/* Ambient orbs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(#06b6d4, transparent)' }} />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(#a855f7, transparent)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-black bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                The Weave
              </div>
              <div className="text-[10px] font-mono text-slate-600 tracking-widest">AUTONOMOUS CODE SWARM v2</div>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400">AGENT ACTIVE</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 max-w-xl leading-relaxed mb-6">
            Select a bug scenario below, paste your code into the prompt bar, and let the Multi-Agent Swarm Council triage, patch, and verify your code — automatically.
          </p>

          {/* How it works steps */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { n: '01', label: 'Triage',    desc: 'Error classified & priority routed', color: '#06b6d4' },
              { n: '02', label: 'AST Index', desc: 'Dependency graph built & indexed',    color: '#a855f7' },
              { n: '03', label: 'AI Patch',  desc: 'Codestral streams patch diff to disk', color: '#34d399' },
              { n: '04', label: 'Auto-Push', desc: 'Sandbox tests run & PR auto-created', color: '#f59e0b' },
            ].map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-3 rounded-xl border border-slate-800/50 bg-slate-900/40"
              >
                <div className="text-2xl font-black font-mono mb-1.5" style={{ color: s.color, textShadow: `0 0 12px ${s.color}40` }}>{s.n}</div>
                <div className="text-[11px] font-bold text-slate-200 mb-0.5">{s.label}</div>
                <div className="text-[9px] text-slate-600 leading-relaxed">{s.desc}</div>
              </motion.div>
            ))}
          </div>

          <FeatureTypingTerminal />

          <div className="mt-10 flex justify-center">
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-lg bg-black hover:bg-slate-900 text-white font-semibold text-xs tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] border border-cyan-500/30 hover:border-cyan-400/80"
            >
              Click to get started <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>



      {/* Removed Scenario Launcher Cards per user request */}
    </div>
  );
}
