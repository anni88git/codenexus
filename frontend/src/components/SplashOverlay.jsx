import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Ambient particle ───────────────────────────────────────────────────────────
function Particle({ x, y, size, color, delay }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color, filter: 'blur(40px)', opacity: 0 }}
      animate={{ opacity: [0, 0.22, 0.08, 0.2, 0], scale: [0.8, 1.3, 0.9, 1.1, 0.8] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Hex grid background ────────────────────────────────────────────────────────
function HexGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath d='M15 0L30 8.66V26L15 34.64L0 26V8.66L15 0ZM45 0L60 8.66V26L45 34.64L30 26V8.66L45 0ZM30 26L45 34.64V52L30 60.62L15 52V34.64L30 26Z' fill='none' stroke='%2306b6d4' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 52px',
      }}
    />
  );
}

// ── Digital Loom Animated SVG ──────────────────────────────────────────────────
function DigitalLoom() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Outer rings */}
      <motion.div
        className="absolute w-40 h-40 rounded-full border-[1.5px] border-cyan-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-32 h-32 rounded-full border border-purple-500/30 border-dashed"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Weaving Grid Core */}
      <div className="relative w-20 h-20 overflow-hidden rounded-xl border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)] bg-[#0a0a0a]/60 backdrop-blur-md">
        {/* Vertical Threads (Warp) */}
        {[15, 32.5, 50, 67.5, 85].map((pos, i) => (
          <div key={`v-${i}`} className="absolute top-0 bottom-0 w-[1px] bg-cyan-500/30" style={{ left: `${pos}%` }} />
        ))}
        
        {/* Horizontal Shuttles (Weft) */}
        {[20, 40, 60, 80].map((pos, i) => (
          <motion.div
            key={`h-${i}`}
            className="absolute h-[2px] rounded-full shadow-[0_0_8px_#a855f7]"
            style={{ 
              top: `${pos}%`, 
              background: 'linear-gradient(90deg, transparent, #a855f7, #06b6d4, transparent)',
              width: '60px',
              left: '-60px'
            }}
            animate={{ left: ['-60px', '100%'] }}
            transition={{ 
              duration: 0.9, 
              delay: i * 0.22, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
          />
        ))}

        {/* Central Pulse */}
        <motion.div
          className="absolute inset-0 bg-cyan-400/10 mix-blend-screen"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Orbiting data nodes */}
      {[0, 120, 240].map((deg, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]"
          style={{ originX: 0, originY: 0, left: '50%', top: '50%' }}
          initial={{ rotate: deg, x: 75 }}
          animate={{ rotate: deg + 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SplashOverlay
// ═══════════════════════════════════════════════════════════════════════════════
export default function SplashOverlay({ onComplete }) {
  useEffect(() => {
    // 1. Play pure Web Audio API synthesis startup sound (no external files needed)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Sweep up sound
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(150, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.5);

      // Tech beep confirmation
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.4);
      osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.5);
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.03, ctx.currentTime + 0.4);
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio playback prevented by browser policy');
    }

    // 2. Unmount overlay after 2.5 seconds (reduced latency)
    const t = setTimeout(onComplete, 2500);
    return () => clearTimeout(t);
  }, [onComplete]);

  const chars = "LET'S GET PATCHING...".split('');

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.06) 0%, rgba(168,85,247,0.04) 40%, #020408 80%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.35 }}
    >
      {/* Hex grid */}
      <HexGrid />

      {/* Ambient orbs */}
      <Particle x={20} y={25} size={280} color="rgba(6,182,212,1)"   delay={0} />
      <Particle x={70} y={65} size={320} color="rgba(168,85,247,1)"  delay={0.6} />
      <Particle x={50} y={10} size={200} color="rgba(52,211,153,1)"  delay={1.2} />

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.025) 50%)', backgroundSize: '100% 3px' }} />

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-8 z-10">

        {/* Logo */}
        <motion.div
          className="flex items-center gap-3 mb-2"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="text-[11px] font-extrabold tracking-[0.25em] text-white">The Weave STUDIO</div>
        </motion.div>

        {/* Animated Digital Loom */}
        <DigitalLoom />

        {/* Glowing title — letter by letter */}
        <div className="flex items-center gap-0 overflow-hidden">
          {chars.map((ch, i) => (
            <motion.span
              key={i}
              className="text-2xl font-black tracking-wider"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: ch === '.' ? '#a855f7' : '#06b6d4',
                textShadow: ch === '.' ? '0 0 16px rgba(168,85,247,0.7)' : '0 0 16px rgba(6,182,212,0.7)',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.045, duration: 0.25, ease: 'easeOut' }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </motion.span>
          ))}
        </div>

        {/* Typing subtext for features */}
        <div className="mt-4 flex items-center justify-center h-4">
          <style>{`
            @keyframes splashTyping { from { max-width: 0 } to { max-width: 600px } }
            @keyframes splashBlink { 50% { border-color: transparent } }
            .splash-typing-effect {
              overflow: hidden;
              white-space: nowrap;
              border-right: 2px solid #22d3ee;
              max-width: 0;
              animation: splashTyping 1.2s steps(40, end) 0.3s forwards, splashBlink 0.5s step-end infinite;
              display: inline-block;
            }
          `}</style>
          <div className="splash-typing-effect text-[9px] font-mono text-cyan-500/80 tracking-widest uppercase">
            Init: Swarm Council • AST Healing • Git Auto-Push...
          </div>
        </div>

        {/* Progress bar */}
        <motion.div
          className="w-64 h-[2px] bg-slate-800/80 rounded-full overflow-hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #06b6d4, #a855f7)' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.65, duration: 1.25, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
