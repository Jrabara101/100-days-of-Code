import React from 'react';
import { RotateCcw } from 'lucide-react';
import { ControlBinding } from '@/types/settings';
import { KeycapButton } from './KeycapButton';

export interface KeybindRowProps {
  binding: ControlBinding;
  isListeningPrimary?: boolean;
  isListeningSecondary?: boolean;
  isConflictedPrimary?: boolean;
  isConflictedSecondary?: boolean;
  conflictTextPrimary?: string;
  conflictTextSecondary?: string;
  onBindPrimary: () => void;
  onBindSecondary: () => void;
  onResetSingle: () => void;
}

export const KeybindRow: React.FC<KeybindRowProps> = ({
  binding,
  isListeningPrimary = false,
  isListeningSecondary = false,
  isConflictedPrimary = false,
  isConflictedSecondary = false,
  conflictTextPrimary,
  conflictTextSecondary,
  onBindPrimary,
  onBindSecondary,
  onResetSingle,
}) => {
  return (
    <div className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 rounded-lg bg-[#131722] hover:bg-[#161B28] border border-[#1E2538] hover:border-slate-700 transition-all duration-150 gap-3">
      {/* Left side: Action Label, Description, and Modified Status Pip */}
      <div className="flex items-start gap-3 max-w-md">
        <div className="pt-1">
          {binding.isModified ? (
            <span
              title="Custom modification active"
              className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-glow-emerald"
            />
          ) : (
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#F8FAFC] tracking-wide font-sans">
              {binding.actionLabel}
            </span>
            {binding.reserved && (
              <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-mono text-[9px] font-bold">
                SYSTEM RESERVED
              </span>
            )}
            {binding.isModified && (
              <button
                type="button"
                onClick={onResetSingle}
                title="Rollback action to factory default"
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-amber-400 transition-opacity px-1.5 py-0.5 rounded bg-[#1C2232] border border-[#1E2538]"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                ROLLBACK
              </button>
            )}
          </div>
          {binding.description && (
            <span className="text-xs text-[#64748B] mt-0.5 leading-snug">
              {binding.description}
            </span>
          )}
        </div>
      </div>

      {/* Right side: Dual Keycap Bindings (Primary & Secondary) */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <KeycapButton
          glyph={binding.primary.displayGlyph}
          device={binding.primary.device}
          slotLabel="PRIMARY"
          isListening={isListeningPrimary}
          isConflicted={isConflictedPrimary}
          conflictText={conflictTextPrimary}
          isModified={binding.isModified}
          isReserved={binding.reserved}
          onClick={onBindPrimary}
        />

        <KeycapButton
          glyph={binding.secondary ? binding.secondary.displayGlyph : '[NONE]'}
          device={binding.secondary ? binding.secondary.device : 'keyboard'}
          slotLabel="SECONDARY"
          isListening={isListeningSecondary}
          isConflicted={isConflictedSecondary}
          conflictText={conflictTextSecondary}
          isModified={binding.isModified && !!binding.secondary}
          isReserved={binding.reserved}
          onClick={onBindSecondary}
        />
      </div>
    </div>
  );
};
