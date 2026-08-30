import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalSquare, Bell, CheckCircle2, XCircle, RefreshCw, Wifi, GitMerge, GitPullRequest, Shield, Zap } from 'lucide-react';

// ─── Static Webhook feed items ────────────────────────────────────────────────
const WEBHOOK_ITEMS = [
  { id: 1, app: 'CodeNexus Bot',    color: '#06b6d4', icon: '🤖', time: '0s ago',  msg: 'AI patch pipeline triggered.' },
  { id: 2, app: 'Security Scanner', color: '#a855f7', icon: '🛡️', time: '2s ago',  msg: 'OWASP scan complete — severity downgraded.' },
  { id: 3, app: 'Slack',            color: '#eab308', icon: '💬', time: '4s ago',  msg: '#eng-alerts: Null pointer fixed in OrderController.js' },
  { id: 4, app: 'GitHub PR Bot',    color: '#34d399', icon: '🔀', time: '6s ago',  msg: 'PR #15 Merged → main · CI passed ✓' },
  { id: 5, app: 'Datadog',          color: '#f97316', icon: '📊', time: '8s ago',  msg: 'Error rate dropped from 4.2% → 0.1%' },
];

// ─── Test row component ───────────────────────────────────────────────────────
function TestRow({ test, isRunning, isComplete }) {
  const cls = {
    header:  'text-emerald-400 font-semibold',
    pass:    'text-emerald-300',
    fail:    'text-red-400',
    summary: 'text-cyan-300',
    time:    'text-slate-500',
    blank:   'text-transparent',
  };
  return (
    <div className={`flex items-start gap-2 leading-relaxed text-[11px] font-mono ${cls[test.type] || 'text-slate-400'}`}>
      {test.type === 'pass' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />}
      {test.type === 'fail' && <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />}
      {test.type !== 'pass' && test.type !== 'fail' && <span className="w-3 shrink-0" />}
      <span>{test.text || '\u00A0'}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SandboxView
// ═══════════════════════════════════════════════════════════════════════════════
export default function SandboxView({
  scenario, language, isFixing, pipelineComplete,
  activeNode, logs, showSlack, onToggleSlack, activeRun,
}) {
  const [visibleTests, setVisibleTests] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [webhookFeed, setWebhookFeed] = useState([]);
  const logRef = useRef(null);
  const animatedRef = useRef(false);

  const testOutput = scenario?.testOutput || [];
  const passCount  = testOutput.filter(t => t.type === 'pass').length;
  const failCount  = testOutput.filter(t => t.type === 'fail').length;
  const totalCount = passCount + failCount;
  const pct = totalCount ? Math.round((visibleTests.filter(t => t.type === 'pass').length / totalCount) * 100) : 0;

  // ── Animate test rows when pipeline completes ──────────────────────────────
  useEffect(() => {
    if (!pipelineComplete && !isFixing) { animatedRef.current = false; setVisibleTests([]); setCursorVisible(false); return; }
    if (animatedRef.current || !testOutput.length) return;
    animatedRef.current = true;
    setVisibleTests([]); setCursorVisible(true);
    const timers = testOutput.map((t, i) =>
      setTimeout(() => setVisibleTests(p => [...p, t]), 150 + i * 180)
    );
    timers.push(setTimeout(() => setCursorVisible(false), 150 + testOutput.length * 180 + 600));
    return () => timers.forEach(clearTimeout);
  }, [pipelineComplete, isFixing]);

  // ── Webhook feed animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!pipelineComplete) { setWebhookFeed([]); return; }
    setWebhookFeed([]);
    WEBHOOK_ITEMS.forEach((item, i) =>
      setTimeout(() => setWebhookFeed(p => [...p, item]), i * 700)
    );
  }, [pipelineComplete]);

  // ── Auto-scroll logs ───────────────────────────────────────────────────────
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  return (
    <div className="h-full flex flex-col gap-5 pb-12">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <TerminalSquare className="w-4 h-4 text-pink-400" />
            Sandbox & DevOps
          </h2>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">
            {language?.testCmd || 'vitest run'} · {activeRun?.fileName ? `tests/${activeRun.fileName}` : (scenario?.testFile || 'tests/')}
          </p>
        </div>
        <button onClick={onToggleSlack}
          className={`flex items-center gap-2 text-[10px] font-mono px-3 py-2 rounded-xl border transition-all ${
            showSlack ? 'bg-amber-950/30 border-amber-500/20 text-amber-300' : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
          }`}>
          <Bell className="w-3.5 h-3.5" /> Webhook Feed
        </button>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">

        {/* ── LEFT: Test runner ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Suite stats */}
          <div className="shrink-0 grid grid-cols-3 gap-3">
            {[
              { label: 'Passed',    value: String(pipelineComplete ? passCount : '—'), color: 'text-emerald-400', bg: 'bg-emerald-950/25 border-emerald-500/15' },
              { label: 'Failed',    value: String(pipelineComplete ? failCount : '—'), color: 'text-red-400',     bg: 'bg-red-950/25 border-red-500/15' },
              { label: 'Coverage',  value: pipelineComplete ? `${pct}%` : '—',         color: 'text-cyan-400',    bg: 'bg-cyan-950/25 border-cyan-500/15' },
            ].map(s => (
              <div key={s.label} className={`p-3 rounded-xl border text-center ${s.bg}`}>
                <div className={`text-xl font-black font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[8px] font-mono text-slate-600 mt-0.5 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {(isFixing && activeNode >= 4 || pipelineComplete) && (
            <div className="shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-600">
                <span>Test suite progress</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Terminal box */}
          <div className="flex-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-0">
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-mono text-slate-400 font-semibold">SANDBOX RUNNER</span>
                {isFixing && activeNode >= 4 && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-amber-400">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Running…
                  </span>
                )}
              </div>
              {pipelineComplete && (
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> All Passed
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-0.5 min-h-0"
              style={{ background: 'linear-gradient(180deg, #030810 0%, #020508 100%)' }}>
              {!isFixing && !pipelineComplete ? (
                <div className="text-slate-700 text-center py-10 text-xs">
                  Run the pipeline to see test output…
                </div>
              ) : (
                <>
                  {visibleTests.map((t, i) => <TestRow key={i} test={t} isRunning={isFixing} isComplete={pipelineComplete} />)}
                  {cursorVisible && <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse" />}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Logs + Webhook feed ────────────────────────────────────── */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Stdout log stream */}
          <div className="flex-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-0">
            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50 bg-slate-900/40">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Agent Log Stream</span>
              <span className="ml-auto text-[8px] font-mono text-slate-800">{logs.length} lines</span>
            </div>
            <div ref={logRef}
              className="flex-1 p-4 font-mono text-[10.5px] overflow-y-auto min-h-0 space-y-0.5"
              style={{ background: 'linear-gradient(180deg, #020810 0%, #020508 100%)' }}>
              {logs.map(l => (
                <div key={l.id} className="flex gap-2 min-h-[18px] leading-relaxed">
                  <span className="text-cyan-900 select-none shrink-0">❯</span>
                  <span className={l.isError ? 'text-red-400' : 'text-slate-500'}>{l.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook feed */}
          <AnimatePresence>
            {showSlack && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="shrink-0 bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Live Webhook Feed</span>
                  <span className="ml-auto flex items-center gap-1 text-[8px] font-mono text-emerald-500">
                    <Wifi className="w-2.5 h-2.5" /> Live
                  </span>
                </div>
                <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
                  <AnimatePresence>
                    {webhookFeed.length === 0 ? (
                      <div className="text-[10px] font-mono text-slate-700 py-4 text-center">
                        Waiting for pipeline to complete…
                      </div>
                    ) : (
                      webhookFeed.map(item => (
                        <motion.div key={item.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 p-2.5 bg-slate-800/30 border border-slate-700/25 rounded-xl"
                        >
                          <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: item.color }} />
                          <div className="text-base shrink-0 mt-0.5">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] font-mono font-bold" style={{ color: item.color }}>{item.app}</span>
                              <span className="text-[8px] font-mono text-slate-700">{item.time}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 leading-relaxed">{item.msg}</div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
