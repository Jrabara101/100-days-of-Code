import React, { useState, useEffect } from 'react';
import { Smile, Zap, Flame, ShieldAlert, CheckCircle2, Trophy } from 'lucide-react';
import { useHubStore, type FloatingEmote } from '../../store/useHubStore';
import { cn } from '../../lib/utils';

const EMOTE_LIST = [
  { label: 'SYNC!', icon: Zap, text: '⚡ SYNC!' },
  { label: 'NICE!', icon: CheckCircle2, text: '🎯 NICE!' },
  { label: 'ALERT', icon: ShieldAlert, text: '🚨 ALERT' },
  { label: 'FIRE', icon: Flame, text: '🔥 ON FIRE' },
  { label: 'GG', icon: Trophy, text: '👑 GG' },
];

export const EmoteWheel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const activeEmote = useHubStore((s) => s.activeEmote);
  const triggerEmote = useHubStore((s) => s.triggerEmote);
  const playerRole = useHubStore((s) => s.playerRole);
  const [displayedEmotes, setDisplayedEmotes] = useState<(FloatingEmote & { key: number })[]>([]);

  useEffect(() => {
    if (!activeEmote) return;
    const item = { ...activeEmote, key: activeEmote.id };
    setDisplayedEmotes((prev) => [...prev, item]);

    const timer = setTimeout(() => {
      setDisplayedEmotes((prev) => prev.filter((e) => e.key !== item.key));
    }, 2400);

    return () => clearTimeout(timer);
  }, [activeEmote]);

  return (
    <>
      {/* Floating Holographic Emotes in World */}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center items-center gap-4">
        {displayedEmotes.map((item) => {
          const isP1 = item.role === 'P1';
          return (
            <div
              key={item.key}
              className={cn(
                'animate-bounce px-4 py-2 rounded-xl border backdrop-blur-lg shadow-2xl flex items-center gap-2 transform transition-all',
                isP1
                  ? 'border-[#58A6FF] bg-[#161B22]/95 text-[#58A6FF] shadow-[0_0_20px_#58A6FF]'
                  : 'border-[#D29922] bg-[#161B22]/95 text-[#D29922] shadow-[0_0_20px_#D29922]'
              )}
            >
              <span className="text-sm font-black font-mono tracking-widest">{item.emote}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                ({item.role === 'P1' ? 'P1' : 'P2'})
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Emote Bar Trigger */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#161B22] text-xs text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
          title="Tactical Emote Quick Bar"
        >
          <Smile className="w-4 h-4 text-emerald-400" />
          <span className="font-bold tracking-wider uppercase text-[10px]">Emotes</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 left-0 z-50 flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-700 bg-[#11161D]/95 backdrop-blur-md shadow-2xl">
            {EMOTE_LIST.map((em) => {
              const Icon = em.icon;
              return (
                <button
                  key={em.label}
                  onClick={() => {
                    triggerEmote(em.text, playerRole);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#161B22] hover:border-[#58A6FF] hover:bg-[#58A6FF]/10 text-xs text-slate-200 hover:text-[#58A6FF] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px] font-bold">{em.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
