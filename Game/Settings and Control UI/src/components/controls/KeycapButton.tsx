import React from 'react';
import { clsx } from 'clsx';
import { Lock, Mouse, Gamepad2, Keyboard, AlertCircle } from 'lucide-react';
import { InputDevice } from '@/types/settings';
import { soundEngine } from '@/services/audioService';

export interface KeycapButtonProps {
  glyph: string;
  device?: InputDevice;
  isListening?: boolean;
  isConflicted?: boolean;
  conflictText?: string;
  isModified?: boolean;
  isReserved?: boolean;
  slotLabel?: string; // 'PRIMARY' | 'SECONDARY'
  onClick?: () => void;
  onClear?: (e: React.MouseEvent) => void;
}

export const KeycapButton: React.FC<KeycapButtonProps> = ({
  glyph,
  device = 'keyboard',
  isListening = false,
  isConflicted = false,
  conflictText,
  isModified = false,
  isReserved = false,
  slotLabel,
  onClick,
  onClear,
}) => {
  const getDeviceIcon = () => {
    if (isReserved) return <Lock className="w-3 h-3 text-slate-400" />;
    if (device === 'mouse') return <Mouse className="w-3 h-3 text-cyan-400" />;
    if (device === 'gamepad') return <Gamepad2 className="w-3 h-3 text-emerald-400" />;
    return <Keyboard className="w-3 h-3 text-slate-400" />;
  };

  const handleMouseEnter = () => {
    if (!isReserved) {
      soundEngine.playHoverTick();
    }
  };

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        type="button"
        disabled={isReserved}
        onMouseEnter={handleMouseEnter}
        onClick={onClick}
        className={clsx(
          'relative min-w-[120px] max-w-[170px] h-9 px-3 py-1.5 flex items-center justify-between gap-2 rounded border font-mono text-xs font-semibold select-none transition-all duration-150 outline-none',
          // Reserved state
          isReserved && 'bg-[#12151D] border-slate-800 text-slate-500 opacity-60 cursor-not-allowed',
          // Listening state
          isListening && 'bg-amber-950/60 border-amber-400 text-amber-200 ring-2 ring-amber-400/80 shadow-glow-amber animate-pulse',
          // Conflict state
          isConflicted && 'bg-red-950/70 border-red-500 text-red-100 ring-1 ring-red-500 shadow-glow-crimson animate-shake',
          // Default idle & hover state
          !isReserved && !isListening && !isConflicted && [
            'bg-[#1A202C] hover:bg-[#232B3B] border-slate-700 hover:border-slate-500 text-[#F8FAFC]',
            'hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98]',
            isModified ? 'border-emerald-500/60' : '',
          ]
        )}
      >
        {/* Device Icon indicator */}
        <span className="flex-shrink-0 flex items-center">{getDeviceIcon()}</span>

        {/* Display Content */}
        <span className="truncate flex-1 text-center font-bold tracking-wider">
          {isListening ? (
            <span className="text-amber-300 font-extrabold tracking-widest text-[11px] animate-pulse">
              [ PRESS ANY KEY ]
            </span>
          ) : (
            glyph || '[UNBOUND]'
          )}
        </span>

        {/* Altered status badge dot */}
        {isModified && !isListening && !isConflicted && (
          <span
            title="Modified from factory preset"
            className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-glow-emerald flex-shrink-0"
          />
        )}

        {/* Slot label watermark */}
        {slotLabel && !isListening && (
          <span className="absolute -top-2 left-2 px-1 text-[8px] font-mono tracking-tighter uppercase rounded bg-[#0C0E14] text-slate-500 border border-[#1E2538]">
            {slotLabel}
          </span>
        )}
      </button>

      {/* Floating Conflict Warning Badge */}
      {isConflicted && conflictText && (
        <div className="absolute top-10 left-0 z-30 flex items-center gap-1.5 px-2 py-1 bg-red-950 border border-red-500 text-red-200 text-[10px] font-sans rounded shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <span>{conflictText}</span>
        </div>
      )}
    </div>
  );
};
