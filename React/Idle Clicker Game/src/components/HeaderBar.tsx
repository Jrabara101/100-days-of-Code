import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Trophy,
  Activity,
  Edit2,
  Check,
  Zap,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { NotationType } from '../lib/bigNumber';

interface HeaderBarProps {
  playerHandle: string;
  onUpdateHandle: (newHandle: string) => void;
  serverStatus: 'ONLINE' | 'OFFLINE' | 'SYNCED';
  soundEnabled: boolean;
  onToggleSound: () => void;
  notation: NotationType;
  onChangeNotation: (n: NotationType) => void;
  onOpenLeaderboard: () => void;
  onOpenUpgrades: () => void;
  onOpenConstellation: () => void;
  activeAnnouncement: string | null;
  purchasedUpgradesCount: number;
  totalUpgradesCount: number;
  prestigeShards: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  playerHandle,
  onUpdateHandle,
  serverStatus,
  soundEnabled,
  onToggleSound,
  notation,
  onChangeNotation,
  onOpenLeaderboard,
  onOpenUpgrades,
  onOpenConstellation,
  activeAnnouncement,
  purchasedUpgradesCount,
  totalUpgradesCount,
  prestigeShards,
}) => {
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [tempHandle, setTempHandle] = useState(playerHandle);

  const handleSaveHandle = () => {
    setIsEditingHandle(false);
    if (tempHandle.trim()) {
      onUpdateHandle(tempHandle.trim());
    }
  };

  const nextNotation = () => {
    if (notation === 'standard') onChangeNotation('scientific');
    else if (notation === 'scientific') onChangeNotation('engineering');
    else onChangeNotation('standard');
  };

  return (
    <header className="w-full glass-panel border-b border-border-subtle px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      {/* Brand & Telemetry Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-cyan-500/20 border border-amber-500/40 shadow-glow-gold">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-wider font-display bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              QUANTUM FOUNDRY
            </h1>
            <Badge variant="mint" className="text-[10px] px-1.5 py-0">
              v1.0 MONOTONIC
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus === 'SYNCED'
                    ? 'bg-emerald-400 shadow-[0_0_6px_#10B981]'
                    : serverStatus === 'ONLINE'
                    ? 'bg-cyan-400'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] text-slate-400">{serverStatus}</span>
            </span>
            <span className="text-slate-600">•</span>
            {isEditingHandle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempHandle}
                  onChange={(e) => setTempHandle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveHandle()}
                  className="bg-slate-900 border border-slate-700 text-xs px-1.5 py-0.5 rounded text-white font-mono w-28 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <button onClick={handleSaveHandle} className="text-emerald-400 hover:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempHandle(playerHandle);
                  setIsEditingHandle(true);
                }}
                className="group flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-300 transition-colors"
                title="Edit Pilot Call-Sign"
              >
                <span>{playerHandle}</span>
                <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live announcement / Cosmic alert */}
      {activeAnnouncement && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs font-mono animate-in fade-in duration-300">
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="truncate max-w-md">{activeAnnouncement}</span>
        </div>
      )}

      {/* Navigation & Controls */}
      <div className="flex items-center gap-2">
        {/* Tech Tree Modal Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenUpgrades}
          className="relative text-xs font-mono"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 mr-1" />
          <span>Tech Tree</span>
          <span className="ml-1.5 px-1 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {purchasedUpgradesCount}/{totalUpgradesCount}
          </span>
        </Button>

        {/* Constellation Modal Trigger */}
        <Button
          variant="purple"
          size="sm"
          onClick={onOpenConstellation}
          className="text-xs font-mono"
        >
          <Activity className="w-3.5 h-3.5 mr-1" />
          <span>Ascension</span>
          {prestigeShards > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 text-[10px] font-bold">
              {prestigeShards}
            </span>
          )}
        </Button>

        {/* Leaderboard Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLeaderboard}
          className="text-xs font-mono"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 mr-1" />
          <span>Rankings</span>
        </Button>

        {/* Notation Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={nextNotation}
          className="font-mono text-xs text-slate-400 hover:text-white"
          title="Toggle number notation (Standard / Scientific / Engineering)"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            [{notation.slice(0, 3)}]
          </span>
        </Button>

        {/* Audio Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSound}
          className="text-slate-400 hover:text-white"
          title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </Button>
      </div>
    </header>
  );
};
