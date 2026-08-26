import React from 'react';
import { X, Cpu, Layers, Zap, Shield, Database, Activity } from 'lucide-react';

export const TelemetryModal = ({ isOpen, onClose, telemetry, engine }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] glass-panel-glow rounded-2xl border border-sky-500/30 flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-cyber-border/30 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-100 uppercase tracking-wider">
                Staff Systems Architecture & Mathematical Foundations
              </h2>
              <p className="text-xs font-mono text-slate-400">
                HEADLESS 3D SPATIAL HASHING // STRUCT-OF-ARRAYS (SoA) PIPELINE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs font-mono text-slate-300">
          {/* Active Runtime Metrics Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block">ACTIVE BOIDS</span>
              <strong className="text-sm text-sky-400">{telemetry.boids} agents</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block">VIEWPORT FPS</span>
              <strong className="text-sm text-emerald-400">{telemetry.fps} FPS</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block">AVG VELOCITY</span>
              <strong className="text-sm text-purple-400">{telemetry.avgSpeed} u/s</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block">KERNEL DURATION</span>
              <strong className="text-sm text-amber-400">{telemetry.stepMs || '0.4'} ms</strong>
            </div>
          </section>

          {/* Core Architectural Pillars */}
          <section className="space-y-4">
            <h3 className="text-sky-300 font-bold uppercase tracking-wider text-xs border-b border-white/10 pb-2">
              Computational Architecture Pillars
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-sky-500/20 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <Database className="w-4 h-4" />
                  <span>3D Spatial Hash Grid</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Bins 3D space into discrete buckets with cell size <code className="text-sky-300">S_cell = r_neighbor</code>. Queries only the 27 surrounding buckets ($3 \times 3 \times 3$) to eliminate the $O(N^2)$ pairwise sensory bottleneck down to $O(N)$.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Layers className="w-4 h-4" />
                  <span>Struct-of-Arrays (SoA)</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Replaces fragmented JavaScript object arrays with continuous contiguous <code className="text-emerald-300">Float32Array</code> buffers (posX, posY, posZ, velX, velY, velZ) to achieve zero heap garbage collection (GC) pauses during animation loops.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>GPU Instanced Batching</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Calculates forward orientation quaternions <code className="text-purple-300">q = fromUnitVectors((0,0,1), v_hat)</code> and updates instance matrices on a single <code className="text-purple-300">THREE.InstancedMesh</code> in 1 GPU draw call.
                </p>
              </div>
            </div>
          </section>

          {/* Mathematical Formulations */}
          <section className="space-y-4">
            <h3 className="text-sky-300 font-bold uppercase tracking-wider text-xs border-b border-white/10 pb-2">
              Craig Reynolds 3D Steering Formulations
            </h3>

            <div className="space-y-3 text-[11px] bg-slate-950/80 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-sky-400 font-bold">1. Separation Force (Inverse Distance Squared):</span>
                <p className="text-slate-400 mt-1">
                  Prevents crowding by steering away with quadratic falloff:
                </p>
                <div className="bg-slate-900/90 p-2 rounded mt-1 text-slate-200 border border-white/5">
                  F_sep = Σ (p_i - p_j) / ||p_i - p_j||² for all j ∈ N_i with ||r_ij|| &lt; r_sep
                </div>
              </div>

              <div>
                <span className="text-emerald-400 font-bold">2. Alignment Force (Velocity Matching):</span>
                <p className="text-slate-400 mt-1">
                  Steers toward the mean velocity heading of surrounding flockmates:
                </p>
                <div className="bg-slate-900/90 p-2 rounded mt-1 text-slate-200 border border-white/5">
                  v_avg = (1/K) Σ v_j &nbsp;⇒&nbsp; F_ali = (v_avg / ||v_avg||) * v_max - v_i
                </div>
              </div>

              <div>
                <span className="text-purple-400 font-bold">3. Cohesion Force (Center of Mass):</span>
                <p className="text-slate-400 mt-1">
                  Steers toward the localized center of mass of neighbors:
                </p>
                <div className="bg-slate-900/90 p-2 rounded mt-1 text-slate-200 border border-white/5">
                  c_avg = (1/K) Σ p_j &nbsp;⇒&nbsp; F_coh = Steer(c_avg - p_i)
                </div>
              </div>

              <div>
                <span className="text-amber-400 font-bold">4. Soft Boundary Restoration:</span>
                <p className="text-slate-400 mt-1">
                  Applies quadratic inward restorative repulsion near cubic domain margins [-B, B]³:
                </p>
                <div className="bg-slate-900/90 p-2 rounded mt-1 text-slate-200 border border-white/5">
                  F_bound = ± ((|p_k| - (B - margin)) / margin)² * e_k when |p_k| &gt; B - margin
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyber-border/30 bg-slate-950/60 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>HIGH PERFORMANCE AGENTIC SIMULATION</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
