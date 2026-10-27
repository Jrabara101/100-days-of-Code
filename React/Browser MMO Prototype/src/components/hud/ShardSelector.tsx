import React, { useState } from 'react';
import { Globe, Users, ArrowRight, X } from 'lucide-react';

interface ShardSelectorProps {
  currentShard: string;
  onSelectShard: (shardId: string) => void;
  onClose: () => void;
}

const POPULAR_SHARDS = [
  { id: 'REALM', name: 'Prime Realm', desc: 'Central town hub of Olde Haven' },
  { id: 'EDEN', name: 'Eden Sanctuary', desc: 'Serene forest crossroads and trade bazaar' },
  { id: 'NOVA', name: 'Nova Frontier', desc: 'High-speed combat and testing grounds' },
  { id: 'VALE', name: 'Whispering Vale', desc: 'Quiet outskirts for explorers' },
];

export const ShardSelector: React.FC<ShardSelectorProps> = ({
  currentShard,
  onSelectShard,
  onClose,
}) => {
  const [customShard, setCustomShard] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customShard.trim()) {
      onSelectShard(customShard.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0B0F19]/95 border border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100">
                Dimensional Shard Gate
              </h3>
              <p className="text-xs text-slate-400">Warp into shared player instances</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Popular Shards */}
        <div className="space-y-2 mb-4">
          {POPULAR_SHARDS.map(s => {
            const isCurrent = s.id === currentShard;
            return (
              <div
                key={s.id}
                onClick={() => {
                  if (!isCurrent) {
                    onSelectShard(s.id);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isCurrent
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-default'
                    : 'bg-slate-900/60 border-slate-800 hover:border-cyan-400/60 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">{s.name}</span>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                      #{s.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>

                {isCurrent ? (
                  <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    ACTIVE
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Shard Code Input */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-800">
          <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
            Or enter custom 4-character friend shard code:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customShard}
              onChange={e => setCustomShard(e.target.value.toUpperCase())}
              placeholder="e.g. A4F2"
              maxLength={8}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 uppercase"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow"
            >
              Warp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
