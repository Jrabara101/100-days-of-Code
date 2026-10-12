import React, { useState } from 'react';
import { EventCategory, ReplayEventMarker } from '../types/replay';
import { formatTime, formatTick, getCategoryColor } from '../lib/utils';
import { X, Search, Filter, Sparkles, Crosshair, Skull, Zap, Flag, ExternalLink } from 'lucide-react';

interface EventLogSheetProps {
  isOpen: boolean;
  markers: ReplayEventMarker[];
  currentTick: number;
  onClose: () => void;
  onSeekToTick: (tick: number) => void;
}

const CATEGORIES: { label: string; value: 'all' | EventCategory; icon: React.ReactNode }[] = [
  { label: 'All Events', value: 'all', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { label: 'Kills', value: 'kill', icon: <Crosshair className="w-3.5 h-3.5" /> },
  { label: 'Deaths', value: 'death', icon: <Skull className="w-3.5 h-3.5" /> },
  { label: 'Abilities', value: 'ability', icon: <Zap className="w-3.5 h-3.5" /> },
  { label: 'Checkpoints', value: 'checkpoint', icon: <Flag className="w-3.5 h-3.5" /> },
];

export const EventLogSheet: React.FC<EventLogSheetProps> = ({
  isOpen,
  markers,
  currentTick,
  onClose,
  onSeekToTick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');

  if (!isOpen) return null;

  const filtered = markers.filter(m => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesQuery =
      m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(m.tick).includes(searchTerm);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#141C30]/95 backdrop-blur-2xl border-l border-slate-800 z-50 shadow-2xl flex flex-col animation-slide-left">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="font-sans font-bold text-sm text-slate-100">
              CLIMAX RADAR &amp; EVENT FEED
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              {markers.length} Deterministic Bookmarks Tagged
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3 bg-slate-950/40">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search milestones, clutch plays, kills..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat.value
                  ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Event Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
            <Filter className="w-6 h-6 opacity-40" />
            <span>No events match the selected criteria</span>
          </div>
        ) : (
          filtered.map(marker => {
            const isCurrent = Math.abs(marker.tick - currentTick) <= 15;
            const style = getCategoryColor(marker.category);

            return (
              <div
                key={marker.id}
                onClick={() => {
                  onSeekToTick(marker.tick);
                }}
                className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isCurrent
                    ? `${style.bg} ${style.border} shadow-lg shadow-cyan-950/50 scale-[1.01]`
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left Colored Accent Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: style.color }}
                />

                <div className="flex items-start justify-between gap-3 pl-1.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase"
                        style={{
                          backgroundColor: `${style.color}22`,
                          color: style.color,
                        }}
                      >
                        {marker.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatTick(marker.tick)}
                      </span>
                    </div>

                    <h4 className="font-sans font-semibold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {marker.label}
                    </h4>

                    {marker.metadata && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        {Object.entries(marker.metadata).map(([k, v]) => (
                          <span key={k} className="bg-slate-950/60 px-1.5 py-0.2 rounded border border-slate-800">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Jump CTA & Timestamp */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {formatTime(marker.timestampMs)}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      JUMP <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] font-mono text-slate-500 text-center">
        Tip: Click any event to warp the playhead directly to that frame.
      </div>
    </div>
  );
};
