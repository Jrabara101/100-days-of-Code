import React, { useState } from 'react';
import { Sliders, X, Plus, Sparkles, Ban, RotateCcw, ChevronDown, ChevronUp, Check, ShieldCheck } from 'lucide-react';
import { useGenreAlchemy } from '../hooks/useGenreAlchemy';
import { useStore } from '../lib/store';
import { Slider } from './ui/Slider';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

export const COMMON_GENRES = [
  'Tactical',
  'Roguelike',
  'Cozy',
  'Base-Builder',
  'Deckbuilder',
  'Soulslike',
  'Sci-Fi',
  'Automation',
  'Horror',
  'Metroidvania',
  'Action',
  'Open World',
  'Co-Op',
  'Multiplayer',
  'RPG',
  'Strategy',
];

export const COMMON_EXCLUDES = [
  'Microtransactions',
  'Early Access',
  'PvP',
  'Gacha',
  'Permadeath',
  'Difficult',
];

export function GenreAlchemistBar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const {
    alchemyTags,
    excludeTags,
    totalWeight,
    updateAlchemyTag,
    addAlchemyTag,
    removeAlchemyTag,
    toggleExcludeTag,
    applyPreset,
    resetAlchemy,
    presets,
  } = useGenreAlchemy();

  const deckVerifiedOnly = useStore((s) => s.deckVerifiedOnly);
  const setDeckVerifiedOnly = useStore((s) => s.setDeckVerifiedOnly);
  const maxPriceCents = useStore((s) => s.maxPriceCents);
  const setMaxPriceCents = useStore((s) => s.setMaxPriceCents);

  return (
    <div className="w-full glass-panel rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6 bg-[#101622]/90 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                GENRE ALCHEMIST // Multi-Axis DNA Tuner
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#38BDF8] border border-[#06B6D4]/30 font-semibold hidden sm:inline">
                Cosine Similarity Engine
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Blend tag weight percentages to re-rank the catalog with vector cosine similarity.
            </p>
          </div>
        </div>

        {/* Quick Toggles & Collapse Button */}
        <div className="flex items-center gap-3">
          {/* Deck Verified Only Switch */}
          <button
            onClick={() => setDeckVerifiedOnly(!deckVerifiedOnly)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all',
              deckVerifiedOnly
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-[#192234] text-[#94A3B8] border-white/5 hover:text-white hover:bg-white/5'
            )}
          >
            <ShieldCheck className={cn('w-4 h-4', deckVerifiedOnly ? 'text-emerald-400' : 'text-[#94A3B8]')} />
            <span>Deck Verified Only</span>
          </button>

          {/* Under $15 Price Clamp */}
          <button
            onClick={() => setMaxPriceCents(maxPriceCents === 1500 ? null : 1500)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all',
              maxPriceCents === 1500
                ? 'bg-[#84CC16]/20 text-[#84CC16] border-[#84CC16]/50 shadow-sm font-bold'
                : 'bg-[#192234] text-[#94A3B8] border-white/5 hover:text-white hover:bg-white/5'
            )}
          >
            Under $15
          </button>

          {/* Reset Button */}
          <button
            onClick={resetAlchemy}
            title="Reset to default weights"
            className="p-2 rounded-xl bg-[#192234] text-[#94A3B8] hover:text-white border border-white/5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-[#192234] text-[#94A3B8] hover:text-white border border-white/5 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls Bay */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Preset Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#94A3B8] font-bold mr-1">PRESETS:</span>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className="text-xs font-mono px-3 py-1 rounded-lg bg-[#192234] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white border border-white/5 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Multi-Axis Weight Sliders (Up to 3 Genres) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {alchemyTags.map((tag) => (
              <div
                key={tag.name}
                className="p-4 rounded-xl bg-[#101622] border border-white/10 flex flex-col justify-between gap-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                    <span className="font-display font-bold text-sm text-white tracking-wide">
                      {tag.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-[#38BDF8]">
                      {tag.weight}%
                    </span>
                    {alchemyTags.length > 1 && (
                      <button
                        onClick={() => removeAlchemyTag(tag.name)}
                        className="p-1 rounded text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove tag"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <Slider
                  value={tag.weight}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(val) => updateAlchemyTag(tag.name, val)}
                  accentColor={
                    tag.weight > 60
                      ? 'from-[#06B6D4] to-[#3B82F6]'
                      : 'from-[#0284C7] to-[#06B6D4]'
                  }
                />
              </div>
            ))}

            {/* Add Tag Slot if under 3 tags */}
            {alchemyTags.length < 3 && (
              <div className="relative flex flex-col justify-center">
                <button
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="h-full min-h-[90px] border-2 border-dashed border-white/15 hover:border-[#06B6D4]/50 rounded-xl flex items-center justify-center gap-2 text-sm font-mono text-[#94A3B8] hover:text-[#38BDF8] transition-colors bg-[#101622]/40"
                >
                  <Plus className="w-4 h-4 text-[#06B6D4]" />
                  <span>Blend Another Axis ({alchemyTags.length}/3)</span>
                </button>

                {/* Available Genres Dropdown */}
                {isAddMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-40 p-3 bg-[#192234] border border-white/10 rounded-xl shadow-2xl grid grid-cols-2 gap-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto">
                    {COMMON_GENRES.filter(
                      (g) => !alchemyTags.some((t) => t.name.toLowerCase() === g.toLowerCase())
                    ).map((genre) => (
                      <button
                        key={genre}
                        onClick={() => {
                          addAlchemyTag(genre, 50);
                          setIsAddMenuOpen(false);
                        }}
                        className="text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
                      >
                        + {genre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Strict Exclude Section */}
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
              <Ban className="w-3.5 h-3.5" />
              <span>STRICT EXCLUDE:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_EXCLUDES.map((exTag) => {
                const isExcluded = excludeTags.includes(exTag);
                return (
                  <button
                    key={exTag}
                    onClick={() => toggleExcludeTag(exTag)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border transition-all',
                      isExcluded
                        ? 'bg-rose-950/70 text-rose-300 border-rose-500/50 shadow-sm'
                        : 'bg-[#192234]/60 text-[#94A3B8] border-white/5 hover:border-white/20 hover:text-white'
                    )}
                  >
                    <span>{exTag}</span>
                    {isExcluded && <Check className="w-3 h-3 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
