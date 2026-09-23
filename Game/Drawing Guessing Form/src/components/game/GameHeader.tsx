import React from 'react';
import {
  BookOpen,
  Coffee,
  Users,
  Feather,
  Volume2,
  VolumeX,
  Smartphone,
  SlidersHorizontal,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SteamIndicator } from '@/components/react-bits/SteamIndicator';
import { cn } from '@/lib/utils';

interface GameHeaderProps {
  roomId: string;
  round: { current: number; total: number };
  hiddenWord: string;
  categoryHint: string;
  timeLeft: number;
  maxTime: number;
  totalPlayers: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onTogglePlayersDrawer: () => void;
  onOpenPairingModal: () => void;
  onOpenModifiersModal: () => void;
  isArtist: boolean;
  targetWord: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roomId,
  round,
  hiddenWord,
  categoryHint,
  timeLeft,
  maxTime,
  totalPlayers,
  isSoundEnabled,
  onToggleSound,
  onTogglePlayersDrawer,
  onOpenPairingModal,
  onOpenModifiersModal,
  isArtist,
  targetWord,
}) => {
  const progressRatio = (timeLeft / maxTime) * 100;
  const isCrunchTime = timeLeft <= 15;

  return (
    <>
      <header className="bg-[#2E1E16]/95 backdrop-blur-md border-b border-[#523A2B] px-3 sm:px-4 py-2 flex items-center justify-between z-30 shrink-0 shadow-md">
        {/* Left: Cozy Room Badge & Round info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wax seal / Room Tag */}
          <button
            onClick={onOpenPairingModal}
            className="flex items-center gap-1.5 bg-[#442F24] hover:bg-[#573D2F] border border-[#6B4D3B] px-2.5 py-1 rounded-full shadow-inner transition cursor-pointer"
            title="Room Pairing & QR Code"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/40 animate-pulse" />
            <span className="text-xs font-hand text-amber-200 text-sm tracking-wide">
              Den #{roomId}
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#DEC8BA]">
            <BookOpen className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="font-serif italic">
              Round {round.current} of {round.total} • Afternoon Sketch
            </span>
          </div>
        </div>

        {/* Center: Handwritten Masked Word & Category Hint */}
        <div className="flex flex-col items-center">
          <div
            className="font-hand text-xl sm:text-2xl tracking-[0.25em] sm:tracking-[0.35em] font-bold text-[#FFF6E9] flex items-center gap-1 drop-shadow-sm"
            id="masked-word-display"
          >
            {isArtist ? (
              <span className="text-amber-200">{targetWord}</span>
            ) : (
              hiddenWord.split(' ').map((char, i) => (
                <span key={i} className="inline-block min-w-[12px] text-center">
                  {char}
                </span>
              ))
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] font-medium text-amber-200/90 flex items-center gap-1">
            <Feather className="w-3 h-3 text-studio-siennaLight" />
            <span>Hint: {categoryHint} ({targetWord.length} letters)</span>
          </div>
        </div>

        {/* Right: Controls, Tea Mug & Timer */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 sm:p-2 rounded-xl bg-[#442F24] hover:bg-[#573D2F] border border-[#6B4D3B] text-amber-200 transition shadow-sm"
            title={isSoundEnabled ? 'Mute Heartbeat & Sounds' : 'Enable Heartbeat & Sounds'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>

          {/* Dual-Screen / Phone Stylus Pairing */}
          <button
            onClick={onOpenPairingModal}
            className="p-1.5 sm:p-2 rounded-xl bg-[#442F24] hover:bg-[#573D2F] border border-[#6B4D3B] text-amber-200 transition shadow-sm"
            title="Dual-Screen & Mobile Stylus Pad"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Party Modifiers Toggle */}
          <button
            onClick={onOpenModifiersModal}
            className="p-1.5 sm:p-2 rounded-xl bg-[#442F24] hover:bg-[#573D2F] border border-[#6B4D3B] text-amber-200 transition shadow-sm"
            title="Party Modifiers & Word Decks"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Steaming Tea Mug & Timer */}
          <div
            className={cn(
              'flex items-center gap-2 bg-[#442F24] border border-[#6B4D3B] px-2.5 sm:px-3 py-1 rounded-xl text-amber-100 shadow-inner transition-all',
              isCrunchTime && 'ring-2 ring-rose-500/80 bg-[#54201A]'
            )}
            title="Tea Timer"
          >
            <div className="relative flex items-center justify-center">
              <Coffee className={cn('w-4 h-4', isCrunchTime ? 'text-rose-400 animate-bounce' : 'text-amber-300')} />
              <SteamIndicator />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span
                className={cn(
                  'text-[8px] sm:text-[9px] uppercase tracking-wider font-bold',
                  isCrunchTime ? 'text-rose-300' : 'text-amber-300/80'
                )}
              >
                {isCrunchTime ? 'Frenzy!' : 'Tea Timer'}
              </span>
              <span
                className={cn(
                  'font-mono font-extrabold text-xs sm:text-sm',
                  isCrunchTime ? 'text-rose-100' : 'text-amber-100'
                )}
              >
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Players Drawer Trigger */}
          <button
            onClick={onTogglePlayersDrawer}
            className="relative p-1.5 sm:p-2 rounded-xl bg-[#442F24] hover:bg-[#573D2F] border border-[#6B4D3B] text-amber-200 transition-colors shadow-sm flex items-center gap-1"
            title="Artists in Den"
          >
            <Users className="w-4 h-4" />
            <span className="text-xs font-hand font-bold hidden sm:inline">Artists</span>
            <span className="absolute -top-1 -right-1 bg-studio-sienna text-[9px] font-bold px-1.5 py-0.2 rounded-full text-white ring-2 ring-[#2E1E16]">
              {totalPlayers}
            </span>
          </button>
        </div>
      </header>

      {/* Progress Bar Timer with dynamic color transitions */}
      <div className="w-full bg-[#241710] h-1.5 relative overflow-hidden shrink-0 border-b border-[#4A3222]">
        <Progress value={progressRatio} className="h-full rounded-none" />
      </div>
    </>
  );
};
