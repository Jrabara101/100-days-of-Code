import React from 'react';
import { Flame, Clock, ArrowRight, Zap } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { useLotCountdown } from '../hooks/useServerClockSync';
import { formatCents } from '../utils/formatters';
import { LotItem } from '../types/auction';

const TickerItem: React.FC<{
  lot: LotItem;
  onSelect: (lotId: string) => void;
  isSelected: boolean;
}> = ({ lot, onSelect, isSelected }) => {
  const { formatted, isOvertime, isExpired } = useLotCountdown(lot.endsAt);

  return (
    <button
      onClick={() => onSelect(lot.id)}
      className={`shrink-0 flex items-center gap-3 px-3.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
        isSelected
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
          : isOvertime
          ? 'bg-amber-500/10 border-amber-500/40 text-[#111315] dark:text-[#F8FAFC] hover:border-amber-400'
          : 'bg-[#FFFFFF] dark:bg-[#12141A] border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-[#F8FAFC] hover:border-neutral-400 dark:hover:border-neutral-600'
      }`}
    >
      {/* Thumbnail */}
      <img
        src={lot.mediaGallery[0]?.thumbnailUrl || lot.mediaGallery[0]?.url}
        alt={lot.title}
        className="w-8 h-8 rounded object-cover border border-neutral-300 dark:border-neutral-700"
      />

      {/* Lot Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-[#646870] dark:text-[#8E96A8] font-bold">
            {lot.lotNumber}
          </span>
          {lot.reserveStatus === 'no_reserve' && (
            <span className="px-1 py-0.2 rounded bg-sky-500/10 text-sky-500 text-[9px] font-mono font-bold">
              NO RESERVE
            </span>
          )}
          {lot.reserveStatus === 'reserve_near' && (
            <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 text-[9px] font-mono font-bold">
              RESERVE NEAR
            </span>
          )}
        </div>
        <span className="text-xs font-medium truncate max-w-[130px] text-[#111315] dark:text-[#F8FAFC]">
          {lot.title}
        </span>
      </div>

      {/* Bid & Countdown */}
      <div className="flex flex-col items-end pl-2 border-l border-neutral-200 dark:border-neutral-800">
        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {formatCents(lot.currentBidCents)}
        </span>
        <div className="flex items-center gap-1">
          {isOvertime ? (
            <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-500 animate-pulse">
              <Zap className="w-3 h-3 text-amber-500" />
              {formatted}
            </span>
          ) : isExpired ? (
            <span className="font-mono text-[10px] text-neutral-400">CLOSED</span>
          ) : (
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#646870] dark:text-[#8E96A8]">
              <Clock className="w-2.5 h-2.5" />
              {formatted}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export const EndingSoonTicker: React.FC = () => {
  const { lots, selectedLotId, setSelectedLotId, setActiveView } = useAuction();

  // Lots ending within 2 hours or in overtime
  const endingSoonLots = [...lots].sort((a, b) => {
    return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
  });

  const handleSelect = (lotId: string) => {
    setSelectedLotId(lotId);
    setActiveView('portal');
  };

  return (
    <div className="bg-[#F3F2EE] dark:bg-[#12141A] border-b border-[#E5E3DC] dark:border-[#252934] py-2 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-[#E5E3DC] dark:border-[#252934]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            CLOSING STAGE
          </span>
        </div>

        {/* Scrollable Track */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
          {endingSoonLots.map(lot => (
            <TickerItem
              key={lot.id}
              lot={lot}
              onSelect={handleSelect}
              isSelected={selectedLotId === lot.id}
            />
          ))}
        </div>

        {/* Fast Jump Link to Terminal */}
        <button
          onClick={() => setActiveView('terminal')}
          className="hidden md:flex items-center gap-1 shrink-0 ml-auto pl-3 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          <span>Multi-Terminal View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

