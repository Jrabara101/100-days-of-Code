import React from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { FSMPhase } from '../engine/types';

interface LiveCrowdChatProps {
  phase: FSMPhase;
  tierIndex: number;
}

const AVATARS = [
  { name: 'NeoPixel', icon: '👾', color: 'border-pink-500 bg-pink-500/20 text-pink-300' },
  { name: 'ByteMaster', icon: '⚡', color: 'border-cyan-400 bg-cyan-400/20 text-cyan-300' },
  { name: 'WizKey', icon: '🕹️', color: 'border-amber-400 bg-amber-400/20 text-amber-300' },
  { name: 'Dr.Vance', icon: '🚀', color: 'border-purple-400 bg-purple-400/20 text-purple-300' },
  { name: 'Sinclair', icon: '💾', color: 'border-rose-400 bg-rose-400/20 text-rose-300' },
  { name: 'C64Fan', icon: '⭐', color: 'border-emerald-400 bg-emerald-400/20 text-emerald-300' },
  { name: 'Tokyo88', icon: '🏆', color: 'border-white/50 bg-white/10 text-white' }
];

const CHAT_MESSAGES: Record<FSMPhase, string[]> = {
  INTRO: [
    "GlitchBoy: 'Tier bounty is getting juicy! Don't blink!'",
    "BBS_SysOp: 'Synchronizing network clock deltas...'",
    "ArcadeQueen: 'Careful with the distractors this round!'"
  ],
  COUNTDOWN: [
    "LaserJoe: 'Clock is decaying! Trust your instinct!'",
    "C64Fan: 'Burn a lifeline if you're not 100% sure!!'",
    "CyberGhost: 'Sub-second answer gets max bounty multiplier!'"
  ],
  LOCKED: [
    "Tokyo88: 'Ooooh choice locked in! Tension is peaking!'",
    "WizKey: 'Listen to that suspense drone...'",
    "PixelKnight: 'Did they pick the right one?!'"
  ],
  REVEAL: [
    "RetroGuru: 'Great call on that algorithmic complexity!'",
    "SynthWave84: 'Streak combo is compounding nicely!'",
    "NeoAdmin: 'Safe haven floor locked. Onward!'"
  ],
  GAME_OVER: [
    "ColosseumHost: 'Tough break! Safe haven payout credited to account.'",
    "Audience: 'GG contender! Insert coin to run it back!'"
  ],
  VICTORY: [
    "ALL_CHAT: '🏆 ALL 10 TIERS CONQUERED! GRAND TOURNAMENT CHAMPION!! 🏆'",
    "ColosseumHost: 'APEX ARENA IMMORTALITY ACHIEVED!'"
  ]
};

export const LiveCrowdChat: React.FC<LiveCrowdChatProps> = ({ phase, tierIndex }) => {
  const currentMessages = CHAT_MESSAGES[phase] || CHAT_MESSAGES.COUNTDOWN;
  const activeMessage = currentMessages[tierIndex % currentMessages.length];

  return (
    <div className="w-full max-w-7xl mx-auto glass-panel rounded-2xl p-3 md:p-4 border-purple-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Avatars */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-arcade text-[9px] text-cyan-300 shrink-0">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>SPECTATOR DECK:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {AVATARS.map((av, i) => (
            <div key={i} className="flex flex-col items-center group cursor-pointer shrink-0">
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs shadow-md transition-transform group-hover:scale-110 ${av.color}`}
              >
                {av.icon}
              </div>
              <span className="font-crt text-[11px] text-slate-400 truncate max-w-[50px]">
                {av.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Chat Ticker */}
      <div className="w-full md:w-auto flex-1 max-w-xl bg-[#090a1a] px-3 py-2 rounded-xl border border-purple-900/60 flex items-center justify-between gap-3 text-xs font-crt">
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <MessageSquare className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <span className="text-slate-300 truncate">{activeMessage}</span>
        </div>
        <span className="font-arcade text-[8px] text-amber-400 shrink-0">LIVE</span>
      </div>
    </div>
  );
};
