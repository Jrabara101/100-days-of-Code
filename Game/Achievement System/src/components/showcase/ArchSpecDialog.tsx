import React from 'react';
import { Terminal, ShieldCheck, Cpu, GitBranch, Key } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface ArchSpecDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchSpecDialog: React.FC<ArchSpecDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/20 text-primary">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle>Voxel DAG Architecture & Anti-Spoofing Spec</DialogTitle>
            <DialogDescription className="text-xs">
              Fastify event-sourcing pipeline & server-authoritative cryptographic ledger.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-3.5 mt-2 max-h-[60vh] overflow-y-auto pr-1 text-xs font-mono text-slate-300">
        {/* Anti Spoofing Overview */}
        <div className="p-3 rounded-xl bg-surface-container border border-slate-700/80">
          <div className="flex items-center gap-2 text-primary font-bold mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Server-Authoritative Anti-Spoofing</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            Achievement criteria are never unlocked via direct client-side state manipulation. The frontend
            emits telemetry packets to the backend evaluator. The Fastify engine independently confirms:
            <br />
            1. All parent nodes in the Directed Acyclic Graph (DAG) are unlocked.
            <br />
            2. Criteria counters reach or exceed targets.
            <br />
            3. Mints an immutable HMAC-SHA256 timestamped unlock token broadcasted over WebSockets.
          </p>
        </div>

        {/* REST & WebSocket Schema */}
        <div className="p-3 rounded-xl bg-[#090c12] border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
            <Terminal className="w-4 h-4" />
            <span>1. Telemetry Ingestion API (POST /api/telemetry/event)</span>
          </div>
          <pre className="text-[10px] text-primary bg-black/60 p-2 rounded-lg overflow-x-auto">
{`{
  "event": "SIPHON_EXTRACT",
  "count": 250,
  "targetNode": "node_depths_siphon",
  "metadata": { "biome": "crystal_depths", "device": "web_gl" }
}`}
          </pre>
        </div>

        {/* Deterministic DAG Evaluator Routine */}
        <div className="p-3 rounded-xl bg-[#090c12] border border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
            <GitBranch className="w-4 h-4" />
            <span>2. Deterministic DAG Evaluator Engine</span>
          </div>
          <pre className="text-[10px] text-emerald-400 bg-black/60 p-2 rounded-lg overflow-x-auto">
{`async function evaluateDAG(operator, achievementId) {
  const node = CodexDAG.get(achievementId);
  // Verify strict DAG parent criteria
  if (!node.parents.every(p => operator.unlocked.has(p))) {
    return { status: 'PREREQ_LOCKED' };
  }
  // Idempotent criteria check
  if (operator.metrics[node.metricKey] >= node.target) {
    const claimToken = hmacSha256(operator.id, node.id, Date.now());
    return { status: 'UNLOCKED', token: claimToken };
  }
  return { status: 'PROGRESS' };
}`}
          </pre>
        </div>

        {/* Cryptographic Ledger Stamp */}
        <div className="p-3 rounded-xl bg-[#090c12] border border-slate-800">
          <div className="flex items-center gap-2 text-pink-400 font-bold mb-1">
            <Key className="w-4 h-4" />
            <span>3. WebSocket Event Broadcast Format</span>
          </div>
          <pre className="text-[10px] text-yellow-300 bg-black/60 p-2 rounded-lg overflow-x-auto">
{`{
  "type": "ACHIEVEMENT_UNLOCKED",
  "achievementId": "node_depths_siphon",
  "token": "0x332DE1A099C2",
  "pulsePath": ["node_depths_geode", "node_depths_siphon"],
  "totalPoints": 14850
}`}
          </pre>
        </div>
      </div>
    </Dialog>
  );
};
