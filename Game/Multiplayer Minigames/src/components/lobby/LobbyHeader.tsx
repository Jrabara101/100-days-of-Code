import React from 'react';
import { Volume2, VolumeX, Tv, Settings2, Puzzle, Swords, Gauge } from 'lucide-react';
import { useHubStore, type GameId } from '../../store/useHubStore';
import { cn } from '../../lib/utils';

interface LobbyHeaderProps {
  onOpenMatchmaker: () => void;
}

const GAMES: { id: GameId; label: string; tag: string; icon: any }[] = [
  { id: 'SHARED_PUZZLE', label: 'Shared Puzzle Room', tag: 'CO-OP', icon: Puzzle },
  { id: 'GRID_BATTLER', label: 'Grid Battler', tag: 'PVP TACTICS', icon: Swords },
  { id: 'REACTION_ARENA', label: 'Reaction Arena', tag: 'REFLEX QTE', icon: Gauge },
];

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({ onOpenMatchmaker }) => {
  const activeGame = useHubStore((s) => s.activeGame);
  const selectGame = useHubStore((s) => s.selectGame);
  const gameMode = useHubStore((s) => s.gameMode);
  const roomCode = useHubStore((s) => s.roomCode);
  const soundMuted = useHubStore((s) => s.soundMuted);
  const toggleSound = useHubStore((s) => s.toggleSound);
  const crtFilterEnabled = useHubStore((s) => s.crtFilterEnabled);
  const toggleCRT = useHubStore((s) => s.toggleCRT);
  const isConnected = useHubStore((s) => s.isConnected);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0D1117]/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#58A6FF] to-[#D29922] p-0.5 shadow-[0_0_15px_rgba(88,166,255,0.4)]">
              <div className="w-full h-full bg-[#0D1117] rounded-[6px] flex items-center justify-center font-mono font-black text-xs text-white">
                CR
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest uppercase text-white font-mono flex items-center gap-2">
                CONTROL ROOM <span className="text-[10px] text-[#58A6FF] font-mono">HUB v1.0</span>
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  )}
                />
                <span>MODE: {gameMode.replace('_', ' ')}</span>
                {gameMode === 'ONLINE' && (
                  <span className="text-slate-500">| ROOM: {roomCode}</span>
                )}
              </div>
            </div>
          </div>

          {/* Matchmaker Settings Button */}
          <button
            onClick={onOpenMatchmaker}
            className="flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#161B22] text-xs font-mono text-slate-300 hover:text-white"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Minigame Switcher Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#161B22]/90 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
          {GAMES.map((game) => {
            const Icon = game.icon;
            const isActive = activeGame === game.id;
            return (
              <button
                key={game.id}
                onClick={() => selectGame(game.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-r from-[#58A6FF]/20 to-[#D29922]/20 border border-[#58A6FF]/50 text-white shadow-[0_0_15px_rgba(88,166,255,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-[#58A6FF]' : 'text-slate-500')} />
                <span>{game.label}</span>
                <span
                  className={cn(
                    'text-[9px] px-1.5 py-0.2 rounded',
                    isActive ? 'bg-[#58A6FF]/20 text-[#58A6FF]' : 'bg-slate-800 text-slate-500'
                  )}
                >
                  {game.tag}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Tactical Controls & Audio */}
        <div className="hidden md:flex items-center gap-2">
          {/* Matchmaker Trigger */}
          <button
            onClick={onOpenMatchmaker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#161B22] text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase text-[11px] font-bold tracking-wider">
              {gameMode === 'ONLINE' ? roomCode : 'Lobby'}
            </span>
          </button>

          {/* CRT Overlay Toggle */}
          <button
            onClick={toggleCRT}
            title={crtFilterEnabled ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            className={cn(
              'p-2 rounded-lg border transition-all cursor-pointer',
              crtFilterEnabled
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-800 bg-[#161B22] text-slate-500 hover:text-slate-300'
            )}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Audio Synthesizer Mute Toggle */}
          <button
            onClick={toggleSound}
            title={soundMuted ? 'Unmute Web Audio' : 'Mute Web Audio'}
            className={cn(
              'p-2 rounded-lg border transition-all cursor-pointer',
              !soundMuted
                ? 'border-[#58A6FF]/50 bg-[#58A6FF]/10 text-[#58A6FF]'
                : 'border-slate-800 bg-[#161B22] text-slate-500 hover:text-slate-300'
            )}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
