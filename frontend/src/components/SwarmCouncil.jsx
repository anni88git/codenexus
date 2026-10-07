import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bot, CheckCircle2, Code, Shield, Network, BrainCircuit, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';

SyntaxHighlighter.registerLanguage('jsx', jsx);

const AGENTS = [
  { id: 'Frontend Dev', role: 'an expert Frontend Developer focusing on UI/UX, React, state management, and aesthetics', color: 'from-pink-500 to-rose-500', icon: Code },
  { id: 'Backend Dev', role: 'an expert Backend Developer focusing on APIs, performance, database queries, and clean architecture', color: 'from-emerald-500 to-teal-500', icon: Network },
  { id: 'Cybersecurity', role: 'an expert Cybersecurity Penetration Tester focusing on securing inputs, preventing XSS/SQLi, and safety', color: 'from-amber-500 to-orange-500', icon: Shield },
  { id: 'QA Engineer', role: 'an expert QA Engineer focusing on edge cases, testability, and bulletproof reliability', color: 'from-indigo-500 to-violet-500', icon: CheckCircle2 }
];

export default function SwarmCouncil({ activeRun, onApplyCode }) {
  const [turns, setTurns] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [finalCode, setFinalCode] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, isRunning]);

  const startSwarm = async () => {
    if (!activeRun || !activeRun.originalCode) return;
    setIsRunning(true);
    setTurns([]);
    setFinalCode(null);

    let currentCode = activeRun.originalCode;
    let chatHistory = [];
    let localTurns = [];

    for (let i = 0; i < AGENTS.length; i++) {
      setActiveAgentIndex(i);
      const agent = AGENTS[i];

      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/swarm-turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentCode,
            chatHistory,
            agentId: agent.id,
            agentRole: agent.role,
            language: activeRun.language || 'javascript'
          })
        });

        const data = await res.json();
        
        // Artificial delay for UI realism
        await new Promise(r => setTimeout(r, 2000));

        currentCode = data.code || currentCode;
        chatHistory.push({ role: agent.id, message: data.message });
        
        const newTurn = { agent: agent.id, message: data.message, code: currentCode };
        localTurns.push(newTurn);
        setTurns([...localTurns]);

      } catch (err) {
        console.error(err);
        const errorTurn = { agent: agent.id, message: "I encountered a network error while reviewing the code.", code: currentCode };
        localTurns.push(errorTurn);
        setTurns([...localTurns]);
        break;
      }
    }

    setActiveAgentIndex(-1);
    setIsRunning(false);
    setFinalCode(currentCode);
  };

  if (!activeRun) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full bg-slate-950">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 flex items-center justify-center mb-5">
          <Users className="w-7 h-7 text-cyan-400/25" />
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-600 mb-1">No Active Workspace</div>
          <div className="text-xs text-slate-700 max-w-xs">Select a scenario from the Patching Workspace to convene the Swarm Council.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0 mb-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Swarm Council
          </h1>
          <p className="text-xs text-slate-500 mt-1">Multi-agent consensus protocol for code hardening.</p>
        </div>
        {!isRunning && !finalCode && (
          <button onClick={startSwarm} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Commence Swarm Review
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800 pb-20 pr-4">
          
          <AnimatePresence>
            {turns.map((turn, i) => {
              const agentDef = AGENTS.find(a => a.id === turn.agent);
              const Icon = agentDef?.icon || Bot;
              
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden shadow-lg">
                  <div className={`px-4 py-2 bg-gradient-to-r ${agentDef?.color || 'from-slate-700 to-slate-600'} flex items-center gap-2 opacity-90`}>
                    <Icon className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{turn.agent}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-slate-200 mb-4">{turn.message}</p>
                    <div className="rounded-xl overflow-hidden border border-slate-800">
                      <div className="bg-slate-950 px-3 py-1.5 text-[9px] text-slate-500 font-mono uppercase border-b border-slate-800 flex justify-between">
                        <span>Code Iteration {i+1}</span>
                      </div>
                      <SyntaxHighlighter
                        children={turn.code}
                        style={vscDarkPlus}
                        language={activeRun?.language || 'javascript'}
                        PreTag="div"
                        customStyle={{ margin: 0, padding: '16px', background: '#09090b', fontSize: '11px' }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isRunning && activeAgentIndex >= 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
              <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
              <div className="text-xs text-slate-400">
                <strong className="text-slate-200">{AGENTS[activeAgentIndex].id}</strong> is auditing the codebase...
              </div>
            </motion.div>
          )}

          {finalCode && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 border-2 border-emerald-500/30 rounded-2xl overflow-hidden bg-slate-900/80 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
              <div className="p-6 text-center border-b border-slate-800">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Consensus Reached</h2>
                <p className="text-xs text-slate-400">All agents have agreed on this final implementation.</p>
              </div>
              <div className="p-4 bg-slate-950">
                 <SyntaxHighlighter
                    children={finalCode}
                    style={vscDarkPlus}
                    language={activeRun?.language || 'javascript'}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: '16px', background: 'transparent', fontSize: '11px' }}
                  />
              </div>
              <div className="p-4 border-t border-slate-800 flex justify-center bg-slate-900">
                <button 
                  onClick={() => onApplyCode?.(finalCode)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2">
                  <Code className="w-4 h-4" /> Apply to Canvas
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
