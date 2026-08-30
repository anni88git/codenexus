import React from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, LayoutDashboard, Code2, Network, TerminalSquare, LogOut, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home',      icon: LayoutDashboard, label: 'Home',              sub: 'Banner Showcase' },
  { id: 'workspace', icon: Code2,           label: 'Patching Workspace', sub: 'Diff + Graph' },
  { id: 'ast',       icon: Network,         label: 'AST Graph Mesh',    sub: 'Node 02 Visualizer' },
  { id: 'sandbox',   icon: TerminalSquare,  label: 'Sandbox & DevOps',  sub: 'Terminal + Alerts' },
];

export default function Sidebar({ activeTab, onTabChange, user, onSignOut }) {
  return (
    <aside className="shrink-0 w-64 h-full flex flex-col bg-slate-950/90 border-r border-slate-800/80 overflow-hidden">

      {/* ─── Brand ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-6 pb-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-[0.14em] bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
              CODENEXUS
            </div>
            <div className="text-[8px] font-mono text-slate-600 tracking-[0.2em] mt-0.5">AI STUDIO v2</div>
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
                  ? 'bg-cyan-950/50 border border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'border border-transparent hover:bg-slate-800/50 hover:border-slate-700/40'
              }`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.3 }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-r-full"
                />
              )}

              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                isActive
                  ? 'bg-gradient-to-tr from-cyan-600/30 to-purple-600/20 border border-cyan-500/25'
                  : 'bg-slate-800/60 border border-slate-700/30 group-hover:border-slate-600/50'
              }`}>
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold leading-tight truncate transition-colors ${isActive ? 'text-cyan-100' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.label}
                </div>
                <div className="text-[9px] font-mono text-slate-600 truncate mt-0.5">{item.sub}</div>
              </div>

              {/* Chevron */}
              <ChevronRight className={`w-3 h-3 shrink-0 transition-all ${isActive ? 'text-cyan-400 opacity-100' : 'text-slate-700 opacity-0 group-hover:opacity-60'}`} />
            </motion.button>
          );
        })}

        {/* Divider */}
        <div className="border-t border-slate-800/50 my-4" />

        {/* Quick stats */}
        <div className="text-[8px] font-mono text-slate-700 uppercase tracking-[0.2em] px-2 mb-2">Engine Stats</div>
        <div className="space-y-1 px-1">
          {[
            { label:'Pipeline Runs', value:'24', color:'text-cyan-400' },
            { label:'Patches Applied', value:'19', color:'text-emerald-400' },
            { label:'PRs Merged', value:'8', color:'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/40">
              <span className="text-[9px] text-slate-600 font-mono">{s.label}</span>
              <span className={`text-[10px] font-bold font-mono ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* ─── Bottom User Card ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-slate-800/60">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=devlead`}
              alt="avatar"
              className="w-9 h-9 rounded-xl border border-cyan-500/25 bg-slate-800"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Dev Lead'}</div>
            <div className="text-[9px] font-mono text-cyan-500/70 truncate">{user?.email || 'dev@codenexus.ai'}</div>
          </div>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            title="Sign out"
            className="shrink-0 w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center hover:bg-red-950/40 hover:border-red-500/25 transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
