import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Play, 
  Clock, 
  Sparkles, 
  Radio, 
  ArrowRight,
  Volume2
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';
import { SpokenWordSearchResult } from '../types';

export const SpokenWordSearchModal: React.FC = () => {
  const { 
    isSearchModalOpen, 
    setIsSearchModalOpen, 
    episodes, 
    playEpisode 
  } = usePodcast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpokenWordSearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  // Index search across all episodes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(w => w.length >= 3);
    const matches: SpokenWordSearchResult[] = [];

    for (const ep of episodes) {
      for (const blk of ep.transcript) {
        for (const sent of blk.sentences) {
          const sentLower = sent.text.toLowerCase();
          const blkLower = blk.text.toLowerCase();
          
          const isExactMatch = sentLower.includes(q) || blkLower.includes(q);
          const isWordMatch = words.length > 0 && words.some(w => sentLower.includes(w) || blkLower.includes(w));

          if (isExactMatch || isWordMatch) {
            const speaker = ep.speakers.find(s => s.id === sent.speakerId);
            matches.push({
              episodeId: ep.id,
              episodeTitle: ep.title,
              episodeNumber: ep.number,
              coverUrl: ep.coverUrl,
              speakerName: speaker?.name || 'Speaker',
              startTimeSec: sent.startTimeSec,
              endTimeSec: sent.endTimeSec,
              matchedText: sent.text,
              surroundingContext: blk.text
            });
            if (matches.length >= 12) break;
          }
        }
        if (matches.length >= 12) break;
      }
      if (matches.length >= 12) break;
    }

    setResults(matches);
  }, [query, episodes]);

  if (!isSearchModalOpen) return null;

  const quickPills = [
    'pricing psychology',
    'freemium',
    'support debt',
    'websockets',
    'state machine',
    'reverse trial'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-modal rounded-3xl border border-[var(--border-hairline-strong)] p-6 shadow-2xl space-y-5">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-amber-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spoken words across all 140+ episodes (e.g. 'pricing psychology')..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] focus:outline-none focus:border-amber-500 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors"
          />
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="absolute right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        {!query && (
          <div className="space-y-2">
            <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Popular Spoken Concepts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPills.map(tag => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1 rounded-full text-xs font-mono-tabular bg-[var(--canvas-stage)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-[440px] overflow-y-auto space-y-3 pr-1">
          {query && results.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="text-sm">No spoken audio matched "{query}".</p>
              <p className="text-xs mt-1">Try a different keyword or browse our curated tracks.</p>
            </div>
          ) : (
            results.map((res, idx) => {
              const startMins = Math.floor(res.startTimeSec / 60);
              const startSecs = (res.startTimeSec % 60).toString().padStart(2, '0');

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/40 transition-all group space-y-2.5"
                >
                  {/* Top metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src={res.coverUrl} 
                        alt={res.episodeTitle}
                        className="w-6 h-6 rounded-md object-cover border border-[var(--border-hairline)]" 
                      />
                      <span className="font-mono-tabular text-xs font-bold text-amber-500">
                        EP {res.episodeNumber}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">•</span>
                      <span className="text-xs text-[var(--text-secondary)] font-medium truncate max-w-[240px]">
                        {res.episodeTitle}
                      </span>
                    </div>

                    <span className="font-mono-tabular text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                      [{startMins}:{startSecs}]
                    </span>
                  </div>

                  {/* Matched sentence snippet with highlight */}
                  <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed italic">
                    "{res.matchedText}"
                  </p>

                  {/* Action jump */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-hairline)] text-xs">
                    <span className="text-[var(--text-muted)]">
                      Spoken by <strong className="text-[var(--text-secondary)]">{res.speakerName}</strong>
                    </span>

                    <button
                      onClick={() => {
                        playEpisode(res.episodeId, res.startTimeSec);
                        setIsSearchModalOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-colors shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play 20s Audio Snippet</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-xs text-[var(--text-muted)] font-mono-tabular">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--canvas-stage)] text-[var(--text-secondary)]">ESC</kbd> to close
        </div>

      </div>
    </div>
  );
};
