import React from 'react';
import type { WorldPlayerEntity } from '../../types/mmo.js';
import { Eye, Shield, Swords, Zap, Heart, ArrowRightLeft, MessageSquare, X } from 'lucide-react';

interface PlayerInspectorModalProps {
  target: WorldPlayerEntity;
  onClose: () => void;
  onTrade: (targetId: string) => void;
  onWhisper: (targetName: string, targetId: string) => void;
}

export const PlayerInspectorModal: React.FC<PlayerInspectorModalProps> = ({
  target,
  onClose,
  onTrade,
  onWhisper,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0B0F19]/95 border border-cyan-500/50 shadow-[0_0_40px_rgba(56,189,248,0.2)] p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-xl text-white shadow border border-white/20"
              style={{ backgroundColor: target.avatarColor || '#38BDF8' }}
            >
              {target.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100">
                {target.username}
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                Level {target.level} &lt;{target.title || (target.isBot ? 'Town Citizen' : 'Adventurer')}&gt;
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper-Doll Visual Sockets of Target */}
        <div className="py-2 flex flex-col items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Equipped Gear Artifacts:</span>
          <div className="flex flex-wrap justify-center gap-2 max-w-xs">
            {Object.entries(target.equippedVisuals).length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2">No visible relics equipped.</div>
            ) : (
              Object.entries(target.equippedVisuals).map(([slot, templateId]) => (
                <div
                  key={slot}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 capitalize flex items-center gap-1.5"
                >
                  <span className="text-cyan-400 font-bold">{slot.replace('_', ' ')}:</span>
                  <span>{templateId.replace(/_/g, ' ')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-2 gap-2 p-2.5 my-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1 text-slate-300">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Health:</span>
            <span className="font-bold text-white ml-auto">{target.hp} / {target.maxHp}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Faction:</span>
            <span className="font-bold text-emerald-400 ml-auto">Free Realm</span>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onWhisper(target.username, target.id);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition active:scale-95 shadow"
          >
            <MessageSquare className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Whisper</span>
          </button>

          {!target.isBot && (
            <button
              onClick={() => {
                onTrade(target.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Invite to Trade</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
