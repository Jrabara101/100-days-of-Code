import React from 'react';
import {
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { formatBigNumber, NotationType } from '../lib/bigNumber';
import { OfflineGainSummary } from '../hooks/useIdleSimulation';

interface OfflineModalProps {
  data: OfflineGainSummary | null;
  onClose: () => void;
  notation: NotationType;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  data,
  onClose,
  notation,
}) => {
  if (!data) return null;

  const seconds = data.offlineSeconds;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const timeString = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${remainingSeconds}s`;

  return (
    <Dialog open={Boolean(data)} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-production-mint mb-1">
          <Clock className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Sub-Space Temporal Briefing
          </span>
        </div>
        <DialogTitle className="text-2xl text-white">
          Welcome Back, Commander
        </DialogTitle>
        <DialogDescription>
          Your automated drones and cosmic harvesters continued continuous synthesis while you were away.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        {/* Offline Time Telemetry */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">
                Authoritative Monotonic Duration
              </span>
              <div className="text-lg font-mono font-bold text-white">
                {timeString}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Time-Lock Verified</span>
          </div>
        </div>

        {/* Generated Flux Highlight */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-950 border border-amber-500/30 shadow-glow-gold text-center space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Passive Synthetic Yield
          </span>
          <div className="text-4xl font-mono font-extrabold text-amber-300 tracking-tight">
            +{formatBigNumber(data.offlineGains, notation)}
          </div>
          <p className="text-xs font-mono text-slate-400">
            Calculated server-side using your active generator array & upgrade synergies.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="mint"
          size="lg"
          onClick={onClose}
          className="w-full font-mono text-sm font-bold py-3 flex items-center justify-center gap-2 shadow-glow-mint"
        >
          <Zap className="w-4 h-4" />
          <span>INITIALIZE CORE WITH HARVESTED FLUX</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
