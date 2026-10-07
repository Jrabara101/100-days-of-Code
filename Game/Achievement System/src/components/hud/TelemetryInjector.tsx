import React, { useState } from 'react';
import { Send, RotateCcw, Zap, Play, Terminal, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface TelemetryInjectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTelemetry: (event: string, count?: number, targetNode?: string) => Promise<any>;
  onResetMatrix: () => Promise<void>;
  lastTelemetryMsg: string | null;
}

export const TelemetryInjector: React.FC<TelemetryInjectorProps> = ({
  isOpen,
  onClose,
  onSendTelemetry,
  onResetMatrix,
  lastTelemetryMsg,
}) => {
  const [customEvent, setCustomEvent] = useState('SIPHON_EXTRACT');
  const [customCount, setCustomCount] = useState(250);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Drill Borehole (+1)', event: 'DRILL_BOREHOLE', count: 1, color: 'text-emerald-400' },
    { label: 'Smelt Titan Ingots (+50)', event: 'SMELT_TITAN_INGOT', count: 50, color: 'text-emerald-300' },
    { label: 'Refine Magma Slag (+200L)', event: 'REFINE_MAGMA', count: 200, color: 'text-orange-400' },
    { label: 'Carve Obsidian Core (+10)', event: 'CARVE_OBSIDIAN', count: 10, color: 'text-orange-300' },
    { label: 'Siphon Crystal Voxels (+250)', event: 'SIPHON_EXTRACT', count: 250, color: 'text-purple-400' },
    { label: 'Defeat Abyssal Leviathan (+1)', event: 'DEFEAT_LEVIATHAN', count: 1, color: 'text-purple-300' },
    { label: 'Harmonize Prismatic Core (+1)', event: 'HARMONIZE_PRISMATIC', count: 1, color: 'text-pink-400' },
    { label: 'Deploy Solar Sails (+2)', event: 'DEPLOY_SOLAR_SAIL', count: 2, color: 'text-yellow-400' },
    { label: 'Build Aether Citadel (+2,500)', event: 'CONSTRUCT_AETHER_CITADEL', count: 2500, color: 'text-yellow-300' },
  ];

  const handleQuickAction = async (action: { event: string; count: number }) => {
    setIsLoading(true);
    await onSendTelemetry(action.event, action.count);
    setIsLoading(false);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEvent) return;
    setIsLoading(true);
    await onSendTelemetry(customEvent, Number(customCount) || 1);
    setIsLoading(false);
  };

  return (
    <div className="absolute bottom-6 left-20 z-40 w-96 rounded-2xl bg-surface/95 border border-slate-700 p-4 shadow-2xl backdrop-blur-2xl transition-all select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-white font-display uppercase tracking-wider">
            Telemetry Event Injector
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onResetMatrix}
            className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
            title="Reset matrix to initial state"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Live Ticker Box */}
      {lastTelemetryMsg && (
        <div className="my-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 leading-snug flex items-start gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span className="truncate">{lastTelemetryMsg}</span>
        </div>
      )}

      {/* Quick Ingestion Buttons Grid */}
      <div className="mt-2.5 flex flex-col gap-1.5">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
          Simulate Game Action Events
        </span>
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {quickActions.map((act) => (
            <button
              key={act.event}
              disabled={isLoading}
              onClick={() => handleQuickAction(act)}
              className="flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-high border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex flex-col min-w-0 pr-1">
                <span className={`text-[11px] font-bold ${act.color} truncate`}>
                  {act.label}
                </span>
                <span className="text-[9px] font-mono text-slate-400 truncate">
                  {act.event}
                </span>
              </div>
              <Play className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Custom Event Injection Bar */}
      <form onSubmit={handleCustomSubmit} className="mt-3 pt-2.5 border-t border-slate-800 flex gap-1.5">
        <Input
          value={customEvent}
          onChange={(e) => setCustomEvent(e.target.value.toUpperCase())}
          placeholder="EVENT_NAME"
          className="h-8 text-xs font-mono uppercase flex-1 bg-surface-container"
        />
        <Input
          type="number"
          value={customCount}
          onChange={(e) => setCustomCount(Number(e.target.value))}
          placeholder="Qty"
          className="h-8 w-16 text-xs font-mono bg-surface-container"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={isLoading}
          className="h-8 px-2.5 text-xs font-bold"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
};
