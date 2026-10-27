import React, { useState } from 'react';
import { Swords, Dice5, Shield, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  onJoin: (username: string, color: string) => void;
  defaultShard: string;
}

const RANDOM_NAMES = [
  'Aethelgard', 'Lyra', 'Roland', 'Kaelen', 'Vael', 'Elowen',
  'Sylas', 'Theron', 'Morwen', 'Baelor', 'Zephyr', 'Orin'
];

const AVATAR_COLORS = [
  '#38BDF8', '#F59E0B', '#10B981', '#A855F7', '#EC4899', '#6366F1'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onJoin, defaultShard }) => {
  const [name, setName] = useState(() => {
    return localStorage.getItem('mmo_username') || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  });

  const [color, setColor] = useState(() => {
    return localStorage.getItem('mmo_color') || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  });

  const randomize = () => {
    setName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]);
    setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Wanderer';
    localStorage.setItem('mmo_username', finalName);
    localStorage.setItem('mmo_color', color);
    onJoin(finalName, color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0B0F19]/95 border border-slate-700/80 shadow-[0_0_60px_rgba(0,0,0,0.9)] p-6 flex flex-col text-center">
        {/* Banner Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
          <Swords className="w-8 h-8" />
        </div>

        <h1 className="font-display font-extrabold text-2xl text-slate-100 tracking-wider">
          AETHERIAL FRONTIER
        </h1>
        <p className="text-xs text-amber-400/90 font-mono mt-1">
          Browser-Native Persistent Micro-MMO Sandbox
        </p>

        {/* Shard Indicator */}
        <div className="inline-flex items-center gap-1.5 mx-auto my-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Entering Shard:</span>
          <span className="text-cyan-400 font-bold">#{defaultShard}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left mt-2">
          {/* Avatar Preview */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-3xl shadow-xl border-2 border-white/30"
              style={{ backgroundColor: color }}
            >
              {(name.trim() || '?').charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={randomize}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300 transition active:scale-95 shadow"
            >
              <Dice5 className="w-4 h-4 text-amber-400" />
              <span>Randomize</span>
            </button>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Adventurer Handle:
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              placeholder="e.g. Kaelen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Color Palette Picker */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Silhouette Sigil Color:
            </label>
            <div className="flex items-center justify-between gap-2">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-9 h-9 rounded-xl transition-transform active:scale-90 ${
                    color === c ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-extrabold text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer mt-2"
          >
            Drop Into The Realm
          </button>
        </form>
      </div>
    </div>
  );
};
