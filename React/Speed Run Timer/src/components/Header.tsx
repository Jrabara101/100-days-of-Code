import React from 'react';
import { 
  Zap, 
  Volume2, 
  VolumeX, 
  Wifi, 
  Tv, 
  Gauge, 
  LayoutList, 
  Keyboard, 
  Flame,
  Radio
} from 'lucide-react';
import { Badge, Button } from './ui/primitives';
import { ViewportMode, RaceStatus } from '../types/race';

interface HeaderProps {
  roomCode: string;
  gameTitle: string;
  categoryName: string;
  raceStatus: RaceStatus;
  pingRttMs: number;
  viewportMode: ViewportMode;
  onSelectViewport: (mode: ViewportMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHotkeysModal: () => void;
  onOpenTemplatesModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  gameTitle,
  categoryName,
  raceStatus,
  pingRttMs,
  viewportMode,
  onSelectViewport,
  isMuted,
  onToggleMute,
  onOpenHotkeysModal,
  onOpenTemplatesModal,
}) => {
  const getStatusBadge = () => {
    switch (raceStatus) {
      case 'LOBBY':
        return <Badge variant="slate">LOBBY STANDBY</Badge>;
      case 'STARTING_COUNTDOWN':
        return <Badge variant="gold" className="animate-pulse">COUNTDOWN 3..2..1</Badge>;
      case 'RACING':
        return (
          <Badge variant="emerald" className="animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-emerald animate-ping mr-1" />
            LIVE // RACING
          </Badge>
        );
      case 'RACE_FINISHED':
        return <Badge variant="purple">RACE COMPLETE</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="h-14 border-b border-obsidian-border bg-obsidian-base/95 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-[4px] bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/50 flex items-center justify-center shadow-glow-cyan/20">
            <Zap className="h-4 w-4 text-neon-cyan animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm tracking-wider bg-gradient-to-r from-neon-cyan via-slate-100 to-neon-gold bg-clip-text text-transparent">
                SPEED//SYNC
              </span>
              <span className="text-[10px] font-mono text-neon-cyan/60 font-semibold px-1 rounded border border-neon-cyan/20">
                PRO ESPORTS
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-slate-200 font-semibold truncate max-w-[140px] md:max-w-[200px]">{gameTitle}</span>
              <span className="text-slate-600">/</span>
              <span className="text-neon-cyan/80">{categoryName}</span>
            </div>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-obsidian-border">
          <span className="text-[10px] font-mono text-slate-400">ROOM:</span>
          <span className="font-mono font-bold text-xs text-neon-gold tracking-widest bg-neon-gold/10 px-2 py-0.5 rounded border border-neon-gold/30">
            {roomCode}
          </span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Center: Viewport Switcher */}
      <div className="hidden md:flex items-center bg-obsidian-void p-0.5 rounded-[4px] border border-obsidian-border">
        <button
          onClick={() => onSelectViewport('RUNNER')}
          className={`px-3 py-1 text-xs font-mono font-medium rounded-[3px] flex items-center gap-1.5 transition-all ${
            viewportMode === 'RUNNER'
              ? 'bg-neon-cyan text-obsidian-void font-bold shadow-glow-cyan/30'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Gauge className="h-3.5 w-3.5" />
          Runner HUD
        </button>
        <button
          onClick={() => onSelectViewport('CASTER')}
          className={`px-3 py-1 text-xs font-mono font-medium rounded-[3px] flex items-center gap-1.5 transition-all ${
            viewportMode === 'CASTER'
              ? 'bg-neon-purple text-slate-100 font-bold shadow-glow-purple/30'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Tv className="h-3.5 w-3.5" />
          Caster Broadcast
        </button>
        <button
          onClick={() => onSelectViewport('SPLIT_BOARD')}
          className={`px-3 py-1 text-xs font-mono font-medium rounded-[3px] flex items-center gap-1.5 transition-all ${
            viewportMode === 'SPLIT_BOARD'
              ? 'bg-obsidian-surface text-neon-cyan font-bold border border-neon-cyan/40'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Full Board
        </button>
      </div>

      {/* Right Controls: NTP Ping, Audio, Hotkeys, Templates */}
      <div className="flex items-center gap-2">
        {/* NTP Latency Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-obsidian-void border border-obsidian-border text-[11px] font-mono">
          <Wifi className={`h-3 w-3 ${pingRttMs < 50 ? 'text-neon-emerald' : pingRttMs < 120 ? 'text-neon-gold' : 'text-neon-ruby'}`} />
          <span className="text-slate-300 font-bold">{pingRttMs}ms</span>
          <span className="text-[9px] text-slate-400 uppercase hidden lg:inline">NTP-SYNC</span>
        </div>

        {/* Templates Modal Button */}
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onOpenTemplatesModal}
          title="Game Categories & Split Templates"
          className="hidden sm:inline-flex"
        >
          Splits / LSS
        </Button>

        {/* Hotkeys Cheat Sheet */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onOpenHotkeysModal}
          title="Keyboard Hotkey Bindings"
        >
          <Keyboard className="h-4 w-4" />
        </Button>

        {/* Audio Mute Toggle */}
        <Button 
          variant={isMuted ? 'outline' : 'secondary'} 
          size="icon" 
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Surge' : 'Mute Audio Surge'}
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4 text-neon-cyan" />}
        </Button>
      </div>
    </header>
  );
};
