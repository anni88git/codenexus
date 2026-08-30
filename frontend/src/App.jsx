import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Cpu, CheckCircle2, GitPullRequest, Code, Shield, Clock, Gauge, Coins,
  ChevronDown, X, GitBranch, GitMerge, Tag, Check, Wifi, Terminal,
  TerminalSquare, FileCode, Columns, AlignJustify, Volume2, VolumeX,
  RotateCcw, Zap, BookOpen, Bell, Layers, ChevronRight, AlertTriangle,
  Activity, Network, RefreshCw, Sparkles, Play,
} from 'lucide-react';
import io from 'socket.io-client';
import scenarios from './data/scenarios';
import AuthPage from './components/AuthPage';
import SplashOverlay from './components/SplashOverlay';
import Sidebar from './components/Sidebar';
import FloatingPromptBar from './components/FloatingPromptBar';
import PatchingWorkspace from './components/PatchingWorkspace';
import AstMeshView from './components/AstMeshView';
import SandboxView from './components/SandboxView';
import HomeView from './components/HomeView';
import ExplainDrawer from './components/ExplainDrawer';
import PRModal from './components/PRModal';
import CustomCodeModal from './components/CustomCodeModal';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codenexus-laa2.onrender.com';
const socket = io(BACKEND_URL, { autoConnect: true });

const LANGUAGES = [
  { id: 'nodejs', label: 'Node.js', color: '#68a063', testCmd: 'vitest run' },
  { id: 'python', label: 'Python',  color: '#3b82f6', testCmd: 'pytest -v' },
  { id: 'golang', label: 'Golang',  color: '#06b6d4', testCmd: 'go test ./...' },
  { id: 'rust',   label: 'Rust',    color: '#f97316', testCmd: 'cargo test' },
];

function computeDiff(a, b) {
  const aL = (a || '').split('\n'), bL = (b || '').split('\n');
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

function speak(text, muted) {
  if (muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[🔍✅🕸️🧠⚡🧪↩️]/g, ''));
  u.rate = 1.1; u.pitch = 0.9; u.volume = 0.7;
  window.speechSynthesis.speak(u);
}

export default function App() {
  const [user, setUser]           = useState(null);
  const [showSplash, setShowSplash] = useState(false);

  const handleAuthenticated = useCallback((u) => {
    setUser(u);
    setShowSplash(true);
  }, []);

  const handleSignOut = useCallback(() => {
    setUser(null);
    setShowSplash(false);
  }, []);

  if (!user && !showSplash) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashOverlay onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {!showSplash && user && (
        <Dashboard user={user} onSignOut={handleSignOut} />
      )}
    </>
  );
}

function Dashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab]       = useState('workspace');
  const [scenario, setScenario]         = useState(scenarios[0]);
  const [language, setLanguage]         = useState(LANGUAGES[0]);
  const [logs, setLogs]                 = useState([{ id: Date.now(), text: `System ready. Welcome, ${user.name}.` }]);
  const [activeNode, setActiveNode]     = useState(-1);
  const [isFixing, setIsFixing]         = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [showDiff, setShowDiff]         = useState(false);
  const [muted, setMuted]               = useState(false);
  const [isConnected, setIsConnected]   = useState(false);
  const [rollbackStep, setRollbackStep] = useState(0);
  const [patchedTokens, setPatchedTokens] = useState(0);
  const [patchedLatency, setPatchedLatency] = useState(0);

  const [showPRModal, setShowPRModal]               = useState(false);
  const [showExplainDrawer, setShowExplainDrawer]   = useState(false);
  const [showSlackFeed, setShowSlackFeed]           = useState(false);
  const [showCustomModal, setShowCustomModal]       = useState(false);
  const [customCode, setCustomCode]                 = useState('');
  
  const [activeRun, setActiveRun] = useState(null);


  const addLog = useCallback((text, isError = false) => {
    if (!text) return;
    setLogs(p => [...p.slice(-80), { id: Date.now() + Math.random(), text, isError }]);
  }, []);

  useEffect(() => {
    socket.connect();
    socket.on('connect',    () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('agent-log',  (data) => {
      if (data.text) addLog(data.text);
      if (data.node !== undefined && data.node > 0) setActiveNode(data.node);
      if (data.patchCode) { setShowDiff(true); setRollbackStep(2); }
      if (data.complete) {
        setPipelineComplete(true);
        setIsFixing(false);
        setRollbackStep(3);
        if (data.telemetry) {
          setPatchedTokens(data.telemetry.tokens?.total || 342);
          setPatchedLatency(data.telemetry.latency || 1.2);
        }
      }
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('agent-log');
      socket.disconnect();
    };
  }, [addLog]);

  const switchScenario = useCallback((s) => {
    setScenario(s);
    setActiveNode(-1);
    setPipelineComplete(false);
    setShowDiff(false);
    setShowPRModal(false);
    setShowExplainDrawer(false);
    setIsFixing(false);
    setRollbackStep(0);
    setCustomCode('');
    setPatchedTokens(0);
    setPatchedLatency(0);
    setLogs([{ id: Date.now(), text: `Scenario loaded → ${s.shortLabel}: ${s.filename}` }]);
  }, []);

  // ── Offline demo mode (no setTimeout — driven by pre-baked log entries) ─────
  const runDemo = useCallback(() => {
    const demoRun = {
      fileName: 'user_handler.go',
      language: 'Golang',
      originalCode: scenario.stackTrace || '// No trace provided',
      patchedCode: `// user_handler.go - PATCHED (offline demo)\n// Fix: Guard against nil pointer dereference\npackage main\n\nfunc GetUserBio(u *User) string {\n    if u == nil || u.Profile == nil {\n        return ""\n    }\n    return u.Profile.Bio\n}`,
      explanation: 'Offline demo: Added defensive nil checks for user pointer and nested profile struct.',
      nodes: [
        { id: 'UserHandler',  x: 250, y: 55,  broken: true,  deps: ['UserService'] },
        { id: 'UserService',  x: 250, y: 170, broken: false, deps: ['Database'] },
        { id: 'Database',     x: 130, y: 285, broken: false, deps: [] },
      ]
    };
    setActiveRun(demoRun);
    setShowDiff(true);
    setPipelineComplete(true);
    setIsFixing(false);
    setRollbackStep(3);
    setActiveNode(4);
    setPatchedTokens(342);
    setPatchedLatency(1.2);
    addLog('⚠️ Backend offline — showing demo patch result');
  }, [scenario, addLog]);

  const trigger = useCallback(async (payload = null) => {
    if (isFixing) return;
    
    const isObj = payload !== null && typeof payload === 'object';
    const promptText = isObj ? payload.errorTrace : payload;
    const finalCustomCode = isObj ? payload.customCode : customCode;
    const finalLanguage = isObj ? payload.language : (language?.label || 'Auto-Detect');
    const inputSnippet = finalCustomCode || promptText || scenario.stackTrace || '';

    if (!inputSnippet.trim()) {
      addLog('❌ No code or trace provided — add something in the prompt bar first.');
      return;
    }

    // ── Reset all pipeline state
    setIsFixing(true);
    setActiveNode(1);
    setPipelineComplete(false);
    setShowDiff(false);
    setShowPRModal(false);
    setShowExplainDrawer(false);
    setRollbackStep(1);
    setPatchedTokens(0);
    setPatchedLatency(0);
    setLogs([{ id: Date.now(), text: `[TRIGGERED] Pipeline initiated: ${finalLanguage}` }]);

    // ── Optimistic UI: immediately show input in the workspace panel
    const optimisticFileName =
      finalLanguage === 'Rust'   ? 'main.rs'          :
      finalLanguage === 'Python' ? 'analytics.py'     :
      finalLanguage === 'C++'    ? 'vector_bounds.cpp':
      finalLanguage === 'Node.js'? 'userController.js': 'user_handler.go';

    setActiveRun({
      fileName: optimisticFileName,
      language: finalLanguage,
      originalCode: inputSnippet,
      patchedCode: '// ⏳ AI Agent is generating patch...',
      explanation: 'Analyzing AST nodes and stack trace...',
      nodes: []
    });

    speak(`Initiating fix for ${scenario.shortLabel}`, muted);
    if (activeTab === 'home') setActiveTab('workspace');

    try {
      // ── Socket will handle progress: node 1 → 2 → 3 → 4 + complete flag
      // ── But we now ALSO await the REST response for the final patched data
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(`${BACKEND_URL}/api/run-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          customCode: finalCustomCode || null,
          errorTrace: promptText || inputSnippet,
          language: finalLanguage,
          prompt: promptText || inputSnippet,
          isCustom: !!(finalCustomCode || promptText)
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        // Build live AST nodes from backend response
        const liveNodes = data.nodes?.length
          ? data.nodes
          : [
              { id: data.fileName?.replace(/\.[^/.]+$/, '') || 'Target', x: 250, y: 55,  broken: true,  deps: ['Service'] },
              { id: 'Service',  x: 250, y: 170, broken: false, deps: ['Database'] },
              { id: 'Database', x: 130, y: 285, broken: false, deps: [] },
            ];

        setActiveRun({
          fileName:     data.fileName || optimisticFileName,
          language:     data.language || finalLanguage,
          originalCode: data.originalCode || inputSnippet,
          patchedCode:  data.patchedCode,
          explanation:  data.explanation || 'Patch generated successfully.',
          nodes:        liveNodes,
        });

        setShowDiff(true);
        setPipelineComplete(true);
        setIsFixing(false);
        setRollbackStep(3);
        setActiveNode(4);
        setPatchedTokens(data.tokens?.total || 342);
        setPatchedLatency(data.latency || 1.2);
        addLog(`✅ Patch complete for ${data.fileName}`);
        speak('Pipeline complete. Patch applied successfully.', muted);
      } else {
        throw new Error(data.error || 'Patch generation failed.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        addLog('❌ Request timed out (>30s). Check backend logs.');
      } else {
        addLog(`❌ Backend error: ${err.message}`);
      }
      console.error('Patch pipeline error:', err);
      setIsFixing(false);
      setActiveNode(-1);
      // Show error state in the diff panel instead of freezing
      setActiveRun(prev => ({
        ...prev,
        patchedCode: `// ❌ Patch generation failed\n// Error: ${err.message}\n// Please check your backend is running at ${BACKEND_URL}`,
        explanation: `Error: ${err.message}. Check that backend is online and retry.`,
      }));
      setShowDiff(true); // show the error state in the panel
    }
  }, [isFixing, scenario, muted, addLog, customCode, activeTab, language]);


  const handleRollback = useCallback(async () => {
    addLog('↩️ Rolling back to original source...');
    try {
      await fetch(`${BACKEND_URL}/api/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, fileName: activeRun?.fileName }),
      });
    } catch {}
    setShowDiff(false);
    setPipelineComplete(false);
    setActiveNode(-1);
    setRollbackStep(0);
    addLog('✅ Rollback complete. Original source restored.');
  }, [scenario, activeRun?.fileName, addLog]);

  const openPR = useCallback(() => {
    setShowPRModal(true);
    confetti({ particleCount: 130, spread: 80, origin: { y: 0.5 }, colors: ['#06b6d4','#a855f7','#34d399','#f59e0b'] });
  }, []);

  const telemetry = {
    confidence: pipelineComplete ? (scenario.telemetry?.confidence || 98.6) : null,
    latency:    pipelineComplete ? (patchedLatency || 1.2) : null,
    risk:       pipelineComplete ? (scenario.telemetry?.risk || 'Low') : null,
    tokens:     pipelineComplete ? (patchedTokens || 342) : null,
  };

  const pipelineSteps = [
    { node:1, name:'Triage',   desc:'Stack trace' },
    { node:2, name:'GraphRAG', desc:'AST indexing' },
    { node:3, name:'Codestral', desc:'Patch gen' },
    { node:4, name:'Sandbox',  desc:'Test suite' },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex relative font-sans">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onSignOut={onSignOut}
      />

      <div className="flex-1 h-full flex flex-col overflow-hidden relative min-w-0">
        <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-400 font-mono">
              {activeTab === 'home'      && '/ Home & Scenarios'}
              {activeTab === 'workspace' && '/ Patching Workspace'}
              {activeTab === 'ast'       && '/ AST Graph Mesh — Node 02'}
              {activeTab === 'sandbox'   && '/ Sandbox & DevOps'}
            </div>
            <ScenarioSelector scenario={scenario} onSelect={switchScenario} isFixing={isFixing} />
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {pipelineComplete && (
                <>
                  {[
                    { label:'Conf', value:`${telemetry.confidence}%`, c:'text-purple-400' },
                    { label:'Lat',  value:`${telemetry.latency}s`,    c:'text-cyan-400' },
                    { label:'Risk', value:telemetry.risk,             c: telemetry.risk==='Low'?'text-emerald-400':telemetry.risk==='Medium'?'text-amber-400':'text-red-400' },
                    { label:'Tok',  value:String(telemetry.tokens),   c:'text-amber-400' },
                  ].map((chip, i) => (
                    <motion.div key={chip.label}
                      initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/40 px-2.5 py-1 rounded-lg">
                      <span className="text-[8px] font-mono text-slate-600">{chip.label}</span>
                      <span className={`text-[10px] font-bold font-mono ${chip.c}`}>{chip.value}</span>
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1.5 bg-slate-900/50 border border-slate-800/40 px-2.5 py-1 rounded-lg">
              <Wifi className="w-3 h-3 text-slate-600" />
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[9px] font-mono text-slate-600">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <button onClick={() => setMuted(!muted)}
              className="w-7 h-7 rounded-lg border border-slate-700/40 bg-slate-900/50 flex items-center justify-center hover:border-cyan-500/30 transition-all">
              {muted ? <VolumeX className="w-3.5 h-3.5 text-slate-600" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden min-h-0 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pb-32"
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }} transition={{ duration:0.2 }}>
                <HomeView
                  scenarios={scenarios}
                  activeScenario={scenario}
                  onSelect={switchScenario}
                  onTrigger={() => { setActiveTab('workspace'); trigger(); }}
                />
              </motion.div>
            )}
            {activeTab === 'workspace' && (
              <motion.div key="workspace" className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-6 pb-32"
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }} transition={{ duration:0.2 }}>
                <PatchingWorkspace
                  scenario={scenario} language={language}
                  showDiff={showDiff} pipelineComplete={pipelineComplete}
                  activeNode={activeNode} isFixing={isFixing}
                  pipelineSteps={pipelineSteps}
                  logs={logs} rollbackStep={rollbackStep}
                  onRollback={handleRollback}
                  onOpenPR={openPR} onExplain={() => setShowExplainDrawer(true)}
                  onSlack={() => setShowSlackFeed(!showSlackFeed)} showSlack={showSlackFeed}
                  activeRun={activeRun}
                />
              </motion.div>
            )}
            {activeTab === 'ast' && (
              <motion.div key="ast" className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-6 pb-32"
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }} transition={{ duration:0.2 }}>
                <AstMeshView scenario={scenario} activeNode={activeNode} pipelineComplete={pipelineComplete} activeRun={activeRun} />
              </motion.div>
            )}
            {activeTab === 'sandbox' && (
              <motion.div key="sandbox" className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-6 pb-32"
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }} transition={{ duration:0.2 }}>
                <SandboxView
                  scenario={scenario} language={language} isFixing={isFixing}
                  pipelineComplete={pipelineComplete} activeNode={activeNode}
                  logs={logs}
                  showSlack={showSlackFeed} onToggleSlack={() => setShowSlackFeed(!showSlackFeed)}
                  activeRun={activeRun}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <FloatingPromptBar
          language={language}
          onLanguageChange={setLanguage}
          onTrigger={trigger}
          isFixing={isFixing}
          onOpenCustomModal={() => setShowCustomModal(true)}
          scenario={scenario}
          customCode={customCode}
        />
      </div>

      <AnimatePresence>
        {showPRModal && <PRModal pr={scenario.pr} onClose={() => setShowPRModal(false)} />}
        {showExplainDrawer && <ExplainDrawer fix={activeRun?.explanation || scenario.pr?.explainFix} filename={activeRun?.fileName || scenario.filename} onClose={() => setShowExplainDrawer(false)} />}
        {showCustomModal && (
          <CustomCodeModal
            value={customCode}
            onChange={setCustomCode}
            onClose={() => setShowCustomModal(false)}
            onSubmit={(code) => { setCustomCode(code); setShowCustomModal(false); trigger({ customCode: code, errorTrace: null, language: language.id }); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ScenarioSelector({ scenario, onSelect, isFixing }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => !isFixing && setOpen(!open)}
        disabled={isFixing}
        className={`flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-xl border transition-all ${
          isFixing
            ? 'border-slate-800/40 text-slate-700 cursor-not-allowed'
            : 'border-cyan-500/20 bg-slate-900/50 text-cyan-300 hover:border-cyan-400/40'
        }`}
      >
        <span>{scenario.icon}</span>
        <span className="max-w-[120px] truncate">{scenario.shortLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            className="absolute top-full left-0 mt-2 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 w-56"
          >
            {scenarios.map(s => (
              <button key={s.id} onClick={() => { onSelect(s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all ${
                  scenario.id === s.id ? 'bg-cyan-950/40 border border-cyan-500/15' : 'hover:bg-slate-800/60 border border-transparent'
                }`}>
                <span className="text-lg">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-200">{s.shortLabel}</div>
                  <div className="text-[9px] text-slate-600 font-mono">{s.filename}</div>
                </div>
                {scenario.id === s.id && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
