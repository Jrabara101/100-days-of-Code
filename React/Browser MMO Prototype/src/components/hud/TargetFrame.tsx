import React from 'react';
import type { MMOGameState } from '../../types/mmo.js';
import { X, ArrowRightLeft, MessageSquare, Eye, ShieldAlert } from 'lucide-react';

interface TargetFrameProps {
  state: MMOGameState;
  onClose: () => void;
  onTrade: (targetId: string) => void;
  onWhisper: (targetName: string, targetId: string) => void;
  onInspect: (targetId: string) => void;
}

export const TargetFrame: React.FC<TargetFrameProps> = ({
  state,
  onClose,
  onTrade,
  onWhisper,
  onInspect,
}) => {
  const targetId = state.selectedTargetId;
  if (!targetId) return null;

  const target = state.players[targetId];
  if (!target) return null;

  const hp = target.hp ?? 100;
  const maxHp = target.maxHp ?? 100;
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 select-none animate-in fade-in slide-in-from-left-4 duration-200">
      <div className="relative flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F19]/90 backdrop-blur-md border border-amber-500/50 shadow-2xl min-w-[270px]">
        {/* Target Avatar with Level Badge */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-lg text-white shadow border border-white/20"
            style={{ backgroundColor: target.avatarColor || '#F59E0B' }}
          >
            {target.username.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-slate-300">
            Lv.{target.level}
          </div>
        </div>

        {/* Target Info & HP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-100 truncate">
              {target.username}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-amber-400 font-medium block truncate -mt-0.5 mb-1">
            &lt;{target.title || (target.isBot ? 'Citizen' : 'Adventurer')}&gt;
          </span>

          {/* Health Bar */}
          <div className="relative w-full h-2.5 bg-slate-900 rounded border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-200"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onInspect(target.id)}
          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B0F19]/90 border border-slate-700 hover:border-cyan-400 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition active:scale-95 shadow"
        >
          <Eye className="w-3 h-3 text-cyan-400" />
          <span>Inspect</span>
        </button>

        <button
          onClick={() => onWhisper(target.username, target.id)}
          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B0F19]/90 border border-slate-700 hover:border-fuchsia-400 text-xs font-semibold text-slate-200 hover:text-fuchsia-300 transition active:scale-95 shadow"
        >
          <MessageSquare className="w-3 h-3 text-fuchsia-400" />
          <span>Whisper</span>
        </button>

        {!target.isBot && (
          <button
            onClick={() => onTrade(target.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B0F19]/90 border border-slate-700 hover:border-amber-400 text-xs font-semibold text-slate-200 hover:text-amber-300 transition active:scale-95 shadow"
          >
            <ArrowRightLeft className="w-3 h-3 text-amber-400" />
            <span>Trade</span>
          </button>
        )}
      </div>
    </div>
  );
};
