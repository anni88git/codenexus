import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Zap, CheckCircle2 } from 'lucide-react';

// ─── Fallback shape used only when backend returns no nodes ───────────────────
const FALLBACK_NODES = [
  { id: 'TargetFile',  x: 250, y: 55,  broken: true,  deps: ['Service'] },
  { id: 'Service',     x: 250, y: 170, broken: false, deps: ['Database'] },
  { id: 'Database',    x: 130, y: 285, broken: false, deps: [] },
];

// ─── Map backend flat node list to SVG-positional format ─────────────────────
function positionNodes(rawNodes = []) {
  if (!rawNodes.length) return FALLBACK_NODES;

  // If the nodes already have x/y (from scenario astNodes), use them
  if (rawNodes[0]?.x !== undefined) return rawNodes;

  // Map backend { id, label, status, type } format into positioned nodes
  const typeToY = { primary: 55, dependency: 170, middleware: 170, store: 285 };
  const xs = [130, 250, 370, 460];
  let xIdx = 0;
  return rawNodes.map((n, i) => ({
    id: n.label || n.id || `Node${i}`,
    x: xs[i % xs.length] || 250,
    y: typeToY[n.type] || (55 + i * 115),
    broken: n.status === 'PATCHED' || i === 0,   // first node is the patched target
    deps: i < rawNodes.length - 1 ? [rawNodes[i + 1]?.label || rawNodes[i + 1]?.id] : [],
  }));
}

export default function AstMeshView({ scenario, activeNode, pipelineComplete, activeRun, compact = false }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Priority: live backend nodes → scenario astNodes → fallback
  const rawNodes = activeRun?.nodes?.length
    ? activeRun.nodes
    : scenario?.astNodes?.length
    ? scenario.astNodes
    : null;

  const nodes = useMemo(() => positionNodes(rawNodes), [rawNodes]);

  const VW = 500;
  const VH = 340;

  const getX = (n) => (n.x / 500) * VW;
  const getY = (n) => (n.y / 360) * VH;

  const getNodeColor = (n, idx) => {
    if (pipelineComplete) return '#34d399';
    // First node is the "broken/target" node being patched
    if (n.broken || idx === 0) return activeNode >= 2 ? '#06b6d4' : '#f87171';
    return activeNode >= 2 ? 'rgba(6,182,212,0.6)' : '#475569';
  };

  const fileLabel = activeRun?.fileName || scenario?.filename || 'No file loaded';
  const nodeCount = nodes.length;

  return (
    <div className={`flex flex-col h-full ${compact ? 'gap-2' : 'gap-4 pb-8'}`}>
      {!compact && (
        <div className="shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              AST Graph Mesh
              <span className="text-[9px] font-mono text-slate-600 border border-slate-700/40 px-2 py-0.5 rounded-full">Node 02 Visualizer</span>
            </h2>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              {fileLabel} · {nodeCount} nodes indexed
              {activeRun?.nodes?.length ? (
                <span className="ml-2 text-cyan-500/60">● Live from backend</span>
              ) : (
                <span className="ml-2 text-slate-700">● Fallback layout</span>
              )}
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4">
            {[
              { label: 'Broken',  color: 'bg-red-400' },
              { label: 'Scanning', color: 'bg-cyan-400' },
              { label: 'Patched', color: 'bg-emerald-400' },
              { label: 'Clean',   color: 'bg-slate-600' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                <span className={`w-2 h-2 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Canvas Card */}
      <div className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden relative min-h-[220px]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full">
          <defs>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <marker id="arrowCyan" markerWidth="6" markerHeight="6" refX="20" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(6,182,212,0.8)" />
            </marker>
            <marker id="arrowGray" markerWidth="6" markerHeight="6" refX="20" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(71,85,105,0.6)" />
            </marker>
          </defs>

          {/* Edges */}
          {nodes.map((n) =>
            (n.deps || []).map((depId) => {
              const t = nodes.find((x) => x.id === depId);
              if (!t) return null;
              const active = activeNode >= 2;
              return (
                <motion.line
                  key={`${n.id}-${depId}`}
                  x1={getX(n)} y1={getY(n)}
                  x2={getX(t)} y2={getY(t)}
                  stroke={active ? 'rgba(6,182,212,0.45)' : 'rgba(51,65,85,0.4)'}
                  strokeWidth="1.5"
                  strokeDasharray={active && !pipelineComplete ? '5 3' : undefined}
                  markerEnd={active ? 'url(#arrowCyan)' : 'url(#arrowGray)'}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              );
            })
          )}

          {/* Nodes */}
          {nodes.map((n, idx) => {
            const color = getNodeColor(n, idx);
            const cx = getX(n);
            const cy = getY(n);
            const isTarget = n.broken || idx === 0;
            const displayLabel = (n.id || '').length > 10 ? `${(n.id || '').slice(0, 9)}…` : (n.id || '');

            return (
              <g
                key={n.id || idx}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* Pulse ring on broken/target node */}
                {isTarget && !pipelineComplete && (
                  <circle cx={cx} cy={cy} r="30" fill="none" stroke={color} strokeWidth="1" className="animate-ping opacity-20" />
                )}

                {/* Node circle */}
                <motion.circle
                  cx={cx} cy={cy} r="22"
                  fill="#030712"
                  stroke={color}
                  strokeWidth={isTarget ? 2 : 1.5}
                  filter="url(#nodeGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                />

                {/* Checkmark when complete */}
                {pipelineComplete && isTarget && (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#34d399" fontSize="13">✓</text>
                )}

                {/* Node label */}
                {!(pipelineComplete && isTarget) && (
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="central"
                    fill={color} fontSize="7.5" fontFamily="monospace" fontWeight="600"
                  >
                    {displayLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredNode && (() => {
            const n = nodes.find((x) => x.id === hoveredNode);
            if (!n) return null;
            return (
              <motion.div
                key="tooltip"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-2 right-2 bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg text-[9px] font-mono text-slate-200 z-10 shadow-2xl"
              >
                <div className="font-bold text-[10px] text-slate-100 mb-1">{n.id}</div>
                <div className={`flex items-center gap-1 ${
                  pipelineComplete && (n.broken || nodes.indexOf(n) === 0)
                    ? 'text-emerald-400'
                    : (n.broken || nodes.indexOf(n) === 0)
                    ? 'text-red-400'
                    : 'text-slate-400'
                }`}>
                  {pipelineComplete && (n.broken || nodes.indexOf(n) === 0)
                    ? <><CheckCircle2 className="w-2.5 h-2.5" /> PATCHED</>
                    : (n.broken || nodes.indexOf(n) === 0)
                    ? '● BROKEN / TARGET'
                    : '● CLEAN'
                  }
                </div>
                {n.deps?.length > 0 && (
                  <div className="text-slate-600 mt-1">deps: {n.deps.join(', ')}</div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Empty state */}
        {!activeRun?.nodes?.length && !scenario?.astNodes?.length && !pipelineComplete && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-700 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Run a patch to generate live AST topology
          </div>
        )}
      </div>
    </div>
  );
}