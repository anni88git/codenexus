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

// ── Hammer + shield animated SVG ───────────────────────────────────────────────
function ShieldHammer() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring pulse */}
      <motion.div
        className="absolute w-36 h-36 rounded-full border-2 border-cyan-500/30"
        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute w-36 h-36 rounded-full border border-purple-500/20"
        animate={{ scale: [1, 1.9, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 1.8, delay: 0.4, repeat: Infinity, ease: 'easeOut' }}
      />

      {/* Glass shield */}
      <motion.div
        className="relative w-28 h-28 flex items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(168,85,247,0.10) 100%)',
          border: '1.5px solid rgba(6,182,212,0.35)',
          boxShadow: '0 0 40px rgba(6,182,212,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
        initial={{ scale: 0.5, opacity: 0, rotateY: -30 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Shield SVG */}
        <svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M24 2L4 10V28C4 40 24 54 24 54C24 54 44 40 44 28V10L24 2Z"
            stroke="url(#shieldGrad)" strokeWidth="2.5" fill="rgba(6,182,212,0.08)"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="shieldGrad" x1="4" y1="2" x2="44" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06b6d4" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Hammer overlay — impact animation */}
        <motion.div
          className="absolute"
          initial={{ rotate: -40, x: 12, y: -12, opacity: 0 }}
          animate={{ rotate: [-40, -40, 0, -15, 0], x: [12, 12, 0, 4, 0], y: [-12, -12, 0, -4, 0], opacity: [0, 1, 1, 1, 1] }}
          transition={{ duration: 0.7, delay: 0.8, times: [0, 0.1, 0.5, 0.75, 1], ease: 'easeInOut' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M15.5 4.5L8 12l-4 8 8-4 7.5-7.5-4-4zM2 22l4-8"
              stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
            <motion.rect
              x="13" y="2" width="8" height="6" rx="1.5"
              fill="url(#hammerGrad)" stroke="#a855f7" strokeWidth="1"
              transform="rotate(45 17 5)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            />
            <defs>
              <linearGradient id="hammerGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#06b6d4" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Neon impact sparks */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 rounded-full"
            style={{
              height: '12px',
              background: i % 2 === 0 ? '#06b6d4' : '#a855f7',
              transformOrigin: 'bottom center',
              rotate: `${deg}deg`,
              left: '50%', top: '50%',
              marginLeft: '-1px',
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 1.1 + i * 0.04 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SplashOverlay
// ═══════════════════════════════════════════════════════════════════════════════
export default function SplashOverlay({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 3000);
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
          <div className="text-[11px] font-extrabold tracking-[0.25em] text-white">CODENEXUS STUDIO</div>
        </motion.div>

        {/* Animated shield + hammer */}
        <ShieldHammer />

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

        {/* Subtext */}
        <motion.p
          className="text-[11px] font-mono text-slate-500 tracking-widest text-center max-w-xs leading-loose"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.5 }}
        >
          Initializing Codestral Engine & AST Graph Mesh...
        </motion.p>

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
