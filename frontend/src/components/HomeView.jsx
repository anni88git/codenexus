import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, GitPullRequest, Activity, ChevronRight, Play, Code } from 'lucide-react';

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

export default function HomeView({ scenarios, activeScenario, onSelect, onTrigger }) {
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
      <div className="relative overflow-hidden mb-8 p-8 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md shadow-2xl">
        {/* Ambient orbs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(#06b6d4, transparent)' }} />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(#a855f7, transparent)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-black bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                CodeNexus Studio
              </div>
              <div className="text-[10px] font-mono text-slate-600 tracking-widest">AUTONOMOUS AI PATCHING ENGINE v2</div>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400">AGENT ACTIVE</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 max-w-xl leading-relaxed mb-6">
            Select a bug scenario below, paste your code into the prompt bar, and let the 4-node AI pipeline triage, patch, and verify your code — automatically.
          </p>

          {/* How it works steps */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { n: '01', label: 'Triage',    desc: 'Error classified & priority routed', color: '#06b6d4' },
              { n: '02', label: 'AST Index', desc: 'Dependency graph built & indexed',    color: '#a855f7' },
              { n: '03', label: 'AI Patch',  desc: 'Codestral streams patch diff to disk', color: '#34d399' },
              { n: '04', label: 'Verify',    desc: 'Sandbox tests run & PR auto-created', color: '#f59e0b' },
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
        </div>
      </div>

      {/* ── AI Agent Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className={`p-4 rounded-2xl border flex items-center gap-4 ${s.bg}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-700/40 flex items-center justify-center shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Scenario Launcher Cards ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.22em]">Quick Scenario Launcher</div>
          <div className="text-[9px] font-mono text-slate-700">{displayScenarios.length} scenarios loaded</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayScenarios.map((s, i) => {
            const isActive = activeScenario?.id === s.id;
            const accent = s.accentColor || '#06b6d4';
            const sev = s.owasp?.prePatch?.severity || s.severity || 'MEDIUM';
            return (
              <motion.button
                key={s.id}
                onClick={() => onSelect(s)}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className={`text-left p-6 rounded-2xl border transition-all group relative overflow-hidden ${
                  isActive
                    ? 'border-cyan-500/35 bg-slate-800/70 shadow-[0_0_20px_rgba(6,182,212,0.08)]'
                    : 'border-slate-800/60 bg-slate-900/50 hover:border-slate-700/70 hover:bg-slate-800/50'
                }`}
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-[0.07] group-hover:opacity-[0.14] transition-opacity"
                  style={{ background: accent, filter: 'blur(30px)', transform: 'translate(40%, -40%)' }} />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-100">{s.shortLabel || s.title}</div>
                        <div className="text-[9px] font-mono mt-0.5" style={{ color: accent }}>
                          {s.category} · {s.lang || s.language || 'JS'}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 font-mono bg-slate-950/35 border border-slate-800/35 rounded-lg p-2">
                      {s.stackTrace?.split('\n')[0] || s.desc}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className={`text-[8px] font-mono font-bold px-2 py-1 rounded-full border ${severityStyle[sev] || severityStyle.MEDIUM}`}>
                      {sev}
                    </span>
                    {isActive && (
                      <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Launch button strip */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}60` }} />
                    <span className="text-[9px] font-mono text-slate-600">{s.filename || `${s.id}.js`}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onSelect(s); onTrigger && onTrigger(); }}
                    className="flex items-center gap-1.5 text-[9px] font-mono font-bold px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-950/40 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" /> Launch
                  </button>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
