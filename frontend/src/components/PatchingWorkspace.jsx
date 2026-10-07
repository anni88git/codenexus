import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Code, FileCode, Columns, AlignJustify, GitPullRequest,
  BookOpen, Bell, RotateCcw, Layers, Activity, CheckCircle2,
  RefreshCw, Shield, ChevronRight, Terminal, Network, Sparkles, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
function computeDiff(a = '', b = '') {
  if (!a && !b) return [];
  const aL = a.split('\n'), bL = b.split('\n');
  const m = aL.length, n = bL.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = aL[i-1] === bL[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const diff = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aL[i-1] === bL[j-1]) { diff.unshift({ type:'unchanged', line:aL[i-1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { diff.unshift({ type:'added', line:bL[j-1] }); j--; }
    else { diff.unshift({ type:'removed', line:aL[i-1] }); i--; }
  }
  return diff;
}

function DiffLine({ e, lineNum }) {
  const pfx = e.type === 'removed' ? '−' : e.type === 'added' ? '+' : ' ';
  const rowBg = e.type === 'removed' ? 'bg-red-950/30' : e.type === 'added' ? 'bg-emerald-950/30' : '';
  const txt = e.type === 'removed' ? 'text-red-300' : e.type === 'added' ? 'text-emerald-300' : 'text-slate-400';
  return (
    <div className={`flex items-start min-h-[20px] ${rowBg}`}>
      <span className="select-none w-10 text-right pr-3 text-slate-700 text-[10px] font-mono shrink-0 leading-5">
        {e.type !== 'blank' && lineNum != null ? lineNum : ''}
      </span>
      <span className={`w-4 text-center text-[10px] select-none shrink-0 font-mono leading-5 ${e.type === 'blank' ? 'opacity-0' : e.type === 'removed' ? 'text-red-500' : e.type === 'added' ? 'text-emerald-500' : 'text-slate-700'}`}>
        {e.type === 'blank' ? ' ' : pfx}
      </span>
      <span className={`flex-1 text-[11.5px] leading-5 whitespace-pre ${txt} font-mono px-1`}>{e.line || ' '}</span>
    </div>
  );
}

export default function PatchingWorkspace({
  scenario, language, showDiff, pipelineComplete,
  activeNode, isFixing, pipelineSteps,
  logs, rollbackStep, onRollback,
  onOpenPR, onExplain, showSlack, onSlack, onReport,
  activeRun,
}) {
  const [rightTab, setRightTab] = useState('pipeline');
  const [viewMode, setViewMode] = useState('split');

  const diff = useMemo(() => computeDiff(activeRun?.originalCode || '', activeRun?.patchedCode || ''), [activeRun]);
  const added = diff.filter(d => d.type === 'added').length;
  const removed = diff.filter(d => d.type === 'removed').length;

  return (
    <div className="grid grid-cols-12 gap-6 min-h-[600px] h-full">
      {/* LEFT: Code Diff Viewer (7 cols) */}
      <div className="col-span-7 flex flex-col gap-4 min-h-0">
        <div className="flex-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-0">
          <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/40 px-3 py-1.5 rounded-xl">
                <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs font-mono font-semibold text-slate-200">{activeRun?.fileName || scenario?.filename || 'solution.src'}</span>
              </div>
              {showDiff && (
                <>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/50 border border-red-500/20 text-red-300">−{removed}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-emerald-300">+{added}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onOpenPR} disabled={!pipelineComplete}
                className={`flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  pipelineComplete 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                    : 'bg-slate-800/20 border-slate-700/30 text-slate-500 cursor-not-allowed'
                }`}>
                <GitPullRequest className="w-3.5 h-3.5" /> Push Code
              </button>
              <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
                {[['split','Split',Columns], ['unified','Unified',AlignJustify]].map(([m, lbl, Icon]) => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`flex items-center gap-1.5 text-[10px] font-mono px-3 py-1 rounded-lg transition-all ${
                      viewMode === m ? 'bg-cyan-600/20 text-cyan-200 border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
                    }`}>
                    <Icon className="w-3 h-3" /> {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!showDiff ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 flex items-center justify-center">
                <Code className="w-7 h-7 text-cyan-400/25" />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-600 mb-1">No Diff Generated Yet</div>
                <div className="text-xs text-slate-700 max-w-xs">Enter a stack trace or paste code in the prompt bar below to trigger the AI patch pipeline.</div>
              </div>

            </div>
          ) : viewMode === 'split' ? (
            <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800/60 overflow-hidden min-h-0">
              <div className="flex flex-col min-h-0">
                <div className="shrink-0 sticky top-0 flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 bg-red-950/10 backdrop-blur-sm z-10">
                  <FileCode className="w-3 h-3 text-red-400" />
                  <span className="text-[9px] font-mono text-red-300/60 uppercase tracking-wider">Original (Broken)</span>
                </div>
                <div className="flex-1 overflow-auto bg-slate-950/50">
                  <pre className="p-4 text-xs font-mono text-slate-300"><code>{activeRun?.originalCode}</code></pre>
                </div>
              </div>
              <div className="flex flex-col min-h-0">
                <div className="shrink-0 sticky top-0 flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 bg-emerald-950/10 backdrop-blur-sm z-10">
                  <FileCode className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-mono text-emerald-300/60 uppercase tracking-wider">Patched (Fixed)</span>
                </div>
                <div className="flex-1 overflow-auto bg-slate-950/50">
                  <pre className="p-4 text-xs font-mono text-emerald-400"><code>{activeRun?.patchedCode}</code></pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              {diff.map((e, idx) => <DiffLine key={idx} e={e} lineNum={idx + 1} />)}
            </div>
          )}
        </div>

        <AnimatePresence>
          {pipelineComplete && activeRun?.explanation && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 p-4 bg-purple-950/25 border border-purple-500/15 rounded-2xl">
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] font-mono text-purple-500/70 uppercase tracking-wider mb-1">AI Explanation</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{activeRun.explanation}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Intelligence Panel (5 cols) */}
      <div className="col-span-5 flex flex-col min-h-0 gap-4">
        <div className="shrink-0 flex gap-2 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-1.5 shadow-xl">
          {[
            { id:'pipeline', label:'Pipeline & AST Mesh', icon: Activity },
            { id:'chat', label:'AI Chat', icon: Sparkles },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setRightTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                rightTab === id ? 'bg-cyan-950/50 border border-cyan-500/25 text-cyan-200' : 'text-slate-500 hover:text-slate-300'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {rightTab === 'pipeline' ? (
            <motion.div key="pipeline" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pb-4">
              <div className="shrink-0 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-600 uppercase tracking-wider mb-3">
                  <Activity className="w-3 h-3 text-cyan-400" /> Execution Pipeline
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {pipelineSteps.map(s => {
                    const isActive = isFixing && activeNode === s.node;
                    const isDone = (pipelineComplete && activeNode >= s.node) || (!isFixing && activeNode > s.node);
                    return (
                      <div key={s.node} className={`p-3 rounded-xl border text-center transition-all ${
                        isActive ? 'bg-cyan-950/40 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : isDone ? 'bg-emerald-950/20 border-emerald-500/20'
                        : 'bg-slate-800/25 border-slate-700/25'
                      }`}>
                        <div className={`w-7 h-7 rounded-xl mx-auto mb-1.5 flex items-center justify-center text-[9px] font-mono font-bold ${
                          isActive ? 'bg-cyan-600/25 text-cyan-300 border border-cyan-500/25'
                          : isDone ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/15'
                          : 'bg-slate-700/25 text-slate-600 border border-slate-700/20'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : `0${s.node}`}
                        </div>
                        <div className={`text-[9px] font-semibold ${isActive ? 'text-cyan-200' : isDone ? 'text-slate-300' : 'text-slate-600'}`}>{s.name}</div>
                        <div className={`text-[8px] mt-0.5 ${isActive ? 'text-cyan-500/60' : isDone ? 'text-slate-600' : 'text-slate-700'}`}>{s.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>



              <div className="shrink-0 flex gap-2">
                <button onClick={onExplain} disabled={!pipelineComplete}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold py-2.5 rounded-xl border transition-all ${
                    pipelineComplete ? 'bg-purple-950/30 border-purple-500/20 text-purple-300 hover:bg-purple-900/30' : 'bg-slate-800/25 border-slate-700/25 text-slate-700 cursor-not-allowed'
                  }`}>
                  <BookOpen className="w-3 h-3" /> Explain Fix
                </button>

                <button onClick={onSlack}
                  className={`flex items-center gap-1 text-[10px] font-mono px-3 py-2.5 rounded-xl border transition-all ${
                    showSlack ? 'bg-amber-950/30 border-amber-500/20 text-amber-300' : 'bg-slate-800/25 border-slate-700/25 text-slate-500 hover:text-slate-300'
                  }`}>
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>

              <button onClick={onReport} disabled={!pipelineComplete}
                className={`shrink-0 flex items-center justify-center gap-2 text-[11px] font-mono font-bold py-3.5 rounded-xl border transition-all ${
                  pipelineComplete 
                    ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:border-cyan-400/60 hover:from-cyan-900 hover:to-blue-900' 
                    : 'bg-slate-800/25 border-slate-700/25 text-slate-700 cursor-not-allowed'
                }`}>
                <FileText className={`w-4 h-4 ${pipelineComplete ? 'text-cyan-400' : ''}`} /> Download Post-Mortem Report
              </button>

              {scenario?.rollbackCheckpoints && (
                <div className="shrink-0 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                      <Layers className="w-3 h-3 text-cyan-400" /> Rollback Checkpoints
                    </div>
                    {pipelineComplete && (
                      <button onClick={onRollback}
                        className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-lg bg-red-950/25 border border-red-500/15 text-red-300 hover:bg-red-900/30 transition-colors">
                        <RotateCcw className="w-2.5 h-2.5" /> Rollback
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {scenario?.rollbackCheckpoints?.map((cp, idx) => (
                      <div key={cp} className={`text-[10px] font-mono px-2.5 py-2 rounded-lg border flex items-center gap-2 ${
                        idx <= rollbackStep ? 'bg-cyan-950/30 border-cyan-500/20 text-cyan-300' : 'bg-slate-800/25 border-slate-700/25 text-slate-600'
                      }`}>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] shrink-0 ${idx <= rollbackStep ? 'bg-cyan-600/25 text-cyan-300' : 'bg-slate-700/25 text-slate-700'}`}>
                          {idx < rollbackStep ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                        </span>
                        {cp}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : rightTab === 'logs' ? (
            <motion.div key="logs" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
              {scenario?.owasp && (
                <div className="shrink-0 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-600 uppercase tracking-wider mb-3">
                    <Shield className="w-3 h-3 text-cyan-400" /> OWASP Security Scorecard
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/25 border border-red-500/15">
                      <span className="text-[9px] font-mono text-red-400 font-bold w-10 shrink-0">PRE</span>
                      <span className="text-[10px] font-mono text-red-300 truncate">{scenario?.owasp?.prePatch?.code} — {scenario?.owasp?.prePatch?.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-700 mx-auto" />
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                      pipelineComplete ? 'bg-emerald-950/25 border-emerald-500/15' : 'bg-slate-800/25 border-slate-700/25'
                    }`}>
                      <span className={`text-[9px] font-mono font-bold w-10 shrink-0 ${pipelineComplete ? 'text-emerald-400' : 'text-slate-700'}`}>POST</span>
                      <span className={`text-[10px] font-mono truncate ${pipelineComplete ? 'text-emerald-300' : 'text-slate-700'}`}>
                        {pipelineComplete ? scenario?.owasp?.postPatch?.label : 'Awaiting patch…'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-0">
                <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50">
                  <Terminal className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Stdout Log Stream</span>
                  <span className="ml-auto text-[8px] font-mono text-slate-800">{logs.length} lines</span>
                </div>
                <LogBox logs={logs} />
              </div>
            </motion.div>
          ) : rightTab === 'chat' ? (
            <motion.div key="chat" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex-1 flex flex-col min-h-0">
              <ChatBox activeRun={activeRun} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ASTMiniGraph({ nodes = [], activeNode, pipelineComplete }) {
  if (!nodes.length) return <div className="h-36 flex items-center justify-center text-slate-700 text-[10px] font-mono">No AST data</div>;
  const W = 360, H = 140;
  const nodeColor = (n) => pipelineComplete ? '#34d399' : n.broken && activeNode < 2 ? '#f87171' : activeNode >= 2 ? '#06b6d4' : '#334155';

  return (
    <div className="w-full relative" style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
        {nodes.map(n => (n.deps || []).map(depId => {
          const t = nodes.find(x => x.id === depId);
          if (!t) return null;
          const x1 = (n.x / 500) * W, y1 = (n.y / 300) * H;
          const x2 = (t.x / 500) * W, y2 = (t.y / 300) * H;
          return (
            <line key={`${n.id}-${depId}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={activeNode >= 2 ? 'rgba(6,182,212,0.35)' : 'rgba(51,65,85,0.4)'}
              strokeWidth="1.5" strokeDasharray={activeNode === 2 ? '4 3' : undefined}
            />
          );
        }))}
        {nodes.map(n => {
          const color = nodeColor(n);
          const cx = (n.x / 500) * W;
          const cy = (n.y / 300) * H;
          return (
            <g key={n.id}>
              {n.broken && !pipelineComplete && <circle cx={cx} cy={cy} r="22" fill={`${color}15`} />}
              <circle cx={cx} cy={cy} r="16"
                fill="rgba(2,8,20,0.95)" stroke={color} strokeWidth={n.broken ? 2 : 1.5}
                style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
              />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                fill={color} fontSize="7" fontFamily="monospace" fontWeight="600">
                {(n.id || '').slice(0, 8)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LogBox({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div ref={ref} className="flex-1 min-h-0 overflow-y-auto font-mono text-xs bg-slate-950 text-emerald-400 p-4 border-t border-slate-800/40">
      {logs.map(l => (
        <div key={l.id} className="flex gap-2 leading-relaxed min-h-[18px]">
          <span className="text-cyan-900 select-none shrink-0">❯</span>
          <span className={l.isError ? 'text-red-400' : 'text-emerald-400/80'}>{l.text}</span>
        </div>
      ))}
    </div>
  );
}

function ChatBox({ activeRun }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'How can I help you with this code?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          contextCode: `ORIGINAL CODE:\n${activeRun?.originalCode || ''}\n\nPATCHED CODE:\n${activeRun?.patchedCode || ''}`,
          language: activeRun?.language
        })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', content: data.text }]);
    } catch (err) {
      setMessages([...newMsgs, { role: 'assistant', content: 'Error connecting to AI...' }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">AI Code Chat</span>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-[11px] leading-relaxed overflow-hidden ${
              m.role === 'user' ? 'bg-indigo-600/40 text-indigo-100 border border-indigo-500/30' : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
            }`}>
              {m.role === 'user' ? (
                m.content
              ) : (
                <ReactMarkdown
                  className="prose prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-0 prose-code:text-[10px]"
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <div className="my-2 rounded-lg overflow-hidden border border-slate-700/50">
                          <div className="bg-slate-900 px-3 py-1 text-[9px] text-slate-400 font-mono uppercase border-b border-slate-700/50">
                            {match[1]}
                          </div>
                          <SyntaxHighlighter
                            {...props}
                            children={String(children).replace(/\n$/, '')}
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, padding: '12px', background: '#0f172a', fontSize: '10px' }}
                          />
                        </div>
                      ) : (
                        <code {...props} className="bg-slate-900/60 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 text-slate-400 border border-slate-700/50 rounded-xl px-3 py-2 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-slate-800/50 bg-slate-900/40">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI about this patch..."
          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
        />
      </div>
    </div>
  );
}