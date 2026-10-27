import React, { useState } from 'react';
import type { MMOGameState } from '../../types/mmo.js';
import { Volume2, VolumeX, Copy, Check, Shield } from 'lucide-react';
import { sound } from '../../engine/sound.js';

interface UnitFrameProps {
  state: MMOGameState;
  onOpenCharacter: () => void;
  onOpenShardModal: () => void;
}

export const UnitFrame: React.FC<UnitFrameProps> = ({
  state,
  onOpenCharacter,
  onOpenShardModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const myPlayer = state.myPlayerId ? state.players[state.myPlayerId] : null;
  const username = myPlayer?.username || 'Adventurer';
  const title = myPlayer?.title || 'Wanderer';
  const level = myPlayer?.level || 1;
  const hp = myPlayer?.hp ?? 100;
  const maxHp = myPlayer?.maxHp ?? 100;
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  const copyShardLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?shard=${state.shardId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="pointer-events-auto flex flex-col gap-2 select-none">
      {/* Adventurer Glassmorphic Unit Card */}
      <div
        onClick={onOpenCharacter}
        className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F19]/80 backdrop-blur-md border border-slate-700/60 shadow-2xl hover:border-amber-400/50 transition-all cursor-pointer min-w-[280px]"
      >
        {/* Avatar Portrait with Level Badge */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center font-display font-bold text-xl text-white shadow-inner border border-white/20"
            style={{ backgroundColor: myPlayer?.avatarColor || '#38BDF8' }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          {/* Level Pill */}
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-900 border border-amber-400/60 text-[10px] font-mono font-bold text-amber-300 shadow">
            Lv.{level}
          </div>
        </div>

        {/* Character Info & Segmented Vitals */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-sm text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                {username}
              </span>
              <span className="text-[11px] text-amber-400/80 font-medium truncate">
                &lt;{title}&gt;
              </span>
            </div>
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Health Bar (Segmented Look) */}
          <div className="relative w-full h-3.5 bg-slate-900/90 rounded border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-200"
              style={{ width: `${hpPercent}%` }}
            />
            {/* Grid Segments Overlay */}
            <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
              <div className="w-[1px] h-full bg-slate-950" />
              <div className="w-[1px] h-full bg-slate-950" />
              <div className="w-[1px] h-full bg-slate-950" />
              <div className="w-[1px] h-full bg-slate-950" />
            </div>
            {/* Text Value */}
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow">
              {hp} / {maxHp} HP
            </span>
          </div>

          {/* Stamina Bar */}
          <div className="relative w-full h-1.5 bg-slate-900/90 rounded border border-slate-800 mt-1 overflow-hidden">
            <div className="h-full bg-cyan-400 w-full" />
          </div>
        </div>
      </div>

      {/* Shard Code Capsule & Invite Link */}
      <div className="flex items-center gap-2">
        <div
          onClick={onOpenShardModal}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B0F19]/80 backdrop-blur-md border border-slate-700/60 shadow text-xs font-mono text-slate-300 hover:border-cyan-400 transition cursor-pointer"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 font-sans font-semibold">SHARD</span>
          <span className="text-cyan-400 font-bold">#{state.shardId}</span>
        </div>

        <button
          onClick={copyShardLink}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B0F19]/80 backdrop-blur-md border border-slate-700/60 shadow text-[11px] font-sans text-slate-300 hover:text-white hover:border-slate-500 transition active:scale-95"
          title="Copy direct invite link to this shard"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
          <span>{copied ? 'Link Copied!' : 'Invite'}</span>
        </button>
      </div>
    </div>
  );
};
