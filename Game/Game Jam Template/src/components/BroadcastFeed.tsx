import { useState } from 'react';
import type { AnnouncementItem, AnnouncementPriority } from '../types/jam';
import { soundFx } from '../lib/soundFx';
import { 
  Radio, 
  AlertTriangle, 
  Tv, 
  Dices, 
  Info, 
  ExternalLink, 
  Clock 
} from 'lucide-react';

interface BroadcastFeedProps {
  announcements: AnnouncementItem[];
}

export const BroadcastFeed = ({ announcements }: BroadcastFeedProps) => {
  const [filter, setFilter] = useState<'all' | AnnouncementPriority>('all');

  const filteredItems = announcements.filter(item => {
    if (filter === 'all') return true;
    return item.priority === filter;
  });

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'critical':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'CRITICAL SIREN',
          cardBorder: 'border-rose-500/60 ring-1 ring-rose-500/40 bg-gradient-to-r from-rose-950/20 to-[#171D2F]',
          badgeStyle: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
        };
      case 'important':
        return {
          icon: <Tv className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'STREAM & SCHEDULE',
          cardBorder: 'border-cyan-500/40 bg-[#171D2F]',
          badgeStyle: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
        };
      case 'wildcard':
        return {
          icon: <Dices className="w-3.5 h-3.5 text-purple-400" />,
          label: 'WILDCARD DROP',
          cardBorder: 'border-purple-500/40 bg-[#171D2F]',
          badgeStyle: 'bg-purple-500/20 text-purple-400 border-purple-500/40'
        };
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-slate-400" />,
          label: 'INTEL UPDATE',
          cardBorder: 'border-[#222B42] bg-[#171D2F]',
          badgeStyle: 'bg-slate-500/20 text-slate-400 border-slate-500/40'
        };
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'JUST NOW';
    }
  };

  return (
    <div className="bg-[#0F121C] border border-[#222B42] rounded-xl p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222B42] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white tracking-wide">
              LIVE TRANSMISSION FEED
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Priority-tiered broadcast radar. Audio alerts & screen bloom on critical deadlines.
            </p>
          </div>
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#08090D] p-1 rounded-lg border border-[#222B42]">
          <button
            onClick={() => { setFilter('all'); soundFx.playUiClick(700); }}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              filter === 'all' ? 'bg-[#171D2F] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL ({announcements.length})
          </button>
          <button
            onClick={() => { setFilter('critical'); soundFx.playUiClick(700); }}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1 ${
              filter === 'critical' ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50' : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" /> CRITICAL
          </button>
          <button
            onClick={() => { setFilter('important'); soundFx.playUiClick(700); }}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1 ${
              filter === 'important' ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            <Tv className="w-3 h-3 text-cyan-400" /> STREAMS
          </button>
          <button
            onClick={() => { setFilter('wildcard'); soundFx.playUiClick(700); }}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors flex items-center gap-1 ${
              filter === 'wildcard' ? 'bg-purple-950/40 text-purple-300 border border-purple-800/50' : 'text-slate-400 hover:text-purple-400'
            }`}
          >
            <Dices className="w-3 h-3 text-purple-400" /> WILDCARDS
          </button>
        </div>
      </div>

      {/* Announcements Stack */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            NO TRANSMISSIONS MATCHING SELECTED FILTER
          </div>
        ) : (
          filteredItems.map((item) => {
            const badge = getPriorityBadge(item.priority);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.008] ${badge.cardBorder}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${badge.badgeStyle}`}>
                      {badge.icon} {badge.label}
                    </span>
                    <h4 className="font-display font-bold text-sm text-white">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>

                <p className="text-slate-300 text-xs font-sans leading-relaxed">
                  {item.content}
                </p>

                {item.actionUrl && (
                  <div className="mt-3 pt-2 border-t border-slate-700/40 flex justify-end">
                    <a
                      href={item.actionUrl}
                      onClick={() => soundFx.playUiClick(800)}
                      className="text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      OPEN DISPATCH <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
