import React from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, LayoutDashboard, Code2, Network, TerminalSquare, LogOut, ChevronRight, Shield, Settings2, GitBranch, Users
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home',      icon: LayoutDashboard, label: 'Home',              sub: 'Banner Showcase' },
  { id: 'workspace', icon: Code2,           label: 'Patching Workspace', sub: 'Diff + Graph' },
  { id: 'swarm',     icon: Users,           label: 'Swarm Council',     sub: 'Multi-Agent Consensus' },
  { id: 'git',       icon: GitBranch,       label: 'Git Repository',    sub: 'Auto Push & PRs' },
  { id: 'ast',       icon: Network,         label: 'AST Graph Mesh',    sub: 'Node 02 Visualizer' },
  { id: 'security',  icon: Shield,          label: 'Security Audit',    sub: 'Vuln Prevention' },
  { id: 'sandbox',   icon: TerminalSquare,  label: 'Sandbox & DevOps',  sub: 'Terminal + Alerts' },
];

export default function Sidebar({ activeTab, onTabChange, user, onSettings, onSignOut }) {
  return (
    <aside className="shrink-0 w-64 h-full flex flex-col bg-black/90 border-r border-slate-800/80 overflow-hidden">

      {/* ─── Brand ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-6 pb-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#111111] border border-slate-800 flex items-center justify-center shrink-0">
            <Network className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 leading-tight tracking-wide">
              The Weave
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">Autonomous Fabric</div>
          </div>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-1.5 mt-4 bg-emerald-950/25 border border-emerald-500/15 rounded-lg px-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[9px] font-mono text-emerald-400">AUTONOMOUS AGENT ACTIVE</span>
        </div>
      </div>

      {/* ─── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
        <div className="text-[8px] font-mono text-slate-700 uppercase tracking-[0.2em] px-2 mb-3">Navigation</div>

        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: isActive ? 0 : 3 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                isActive
                  ? 'bg-[#1e1e1e] border-transparent'
                  : 'border border-transparent hover:bg-[#151515]'
              }`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.3 }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full"
                />
              )}

              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                isActive ? 'bg-transparent' : 'bg-transparent'
              }`}>
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium leading-tight truncate transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.label}
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">{item.sub}</div>
              </div>

              {/* Chevron */}
              <ChevronRight className={`w-3 h-3 shrink-0 transition-all ${isActive ? 'text-cyan-400 opacity-100' : 'text-slate-700 opacity-0 group-hover:opacity-60'}`} />
            </motion.button>
          );
        })}


      </nav>

      {/* ─── Bottom User Card ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-slate-800/60 flex gap-2">
        <button
          onClick={onSettings}
          title="Agent Settings"
          className="flex-1 shrink-0 p-3 rounded-xl bg-[#111111]/60 border border-slate-800/50 flex items-center justify-center hover:bg-slate-800 hover:border-cyan-500/25 transition-all group"
        >
          <Settings2 className="w-5 h-5 text-slate-500 group-hover:text-cyan-400" />
          <span className="ml-2 text-xs font-semibold text-slate-400 group-hover:text-cyan-400">Agent Rules</span>
        </button>

        <button
          onClick={onSignOut}
          title="Sign out"
          className="shrink-0 p-3 rounded-xl bg-[#111111]/60 border border-slate-800/50 flex items-center justify-center hover:bg-red-950/40 hover:border-red-500/25 transition-all"
        >
          <LogOut className="w-5 h-5 text-slate-500 hover:text-red-400" />
        </button>
      </div>
    </aside>
  );
}
