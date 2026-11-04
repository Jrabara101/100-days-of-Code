import React, { useState } from 'react';
import { 
  Terminal as TerminalIcon, 
  Volume2, 
  VolumeX, 
  Grid2X2, 
  Grid3X3, 
  List, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Flame, 
  ExternalLink,
  ChevronRight,
  Gavel
} from 'lucide-react';
import { LotItem } from '../types/auction';
import { useAuction } from '../context/AuctionContext';
import { useLotCountdown } from '../hooks/useServerClockSync';
import { formatCents } from '../utils/formatters';

const TerminalCard: React.FC<{
  lot: LotItem;
  onOpenStage: (lotId: string) => void;
}> = ({ lot, onOpenStage }) => {
  const { 
    currentUser, 
    userProxyCeilings, 
    placeBid, 
    simulateRivalBid, 
    lastOutbidLotId,
    lastPopcornExtendedLotId
  } = useAuction();

  const isUserLeading = lot.leadingBidderId === currentUser.id;
  const isOutbid = !isUserLeading && lastOutbidLotId === lot.id;
  const isPopcornSurge = lastPopcornExtendedLotId === lot.id;
  const proxyCeiling = userProxyCeilings[lot.id];

  const { formatted, isOvertime, isExpired } = useLotCountdown(lot.endsAt);

  const handleQuickCounterBid = (e: React.MouseEvent) => {
    e.stopPropagation();
    placeBid(lot.id, lot.nextMinBidCents);
  };

  const handleSimulateChallenge = (e: React.MouseEvent) => {
    e.stopPropagation();
    simulateRivalBid(lot.id);
  };

  return (
    <div
      onClick={() => onOpenStage(lot.id)}
      className={`rounded-2xl border-2 p-4 flex flex-col justify-between transition-all duration-300 bg-[#FFFFFF] dark:bg-[#12141A] shadow-md hover:shadow-xl cursor-pointer ${
        isOutbid
          ? 'border-rose-500 shadow-rose-500/20 animate-outbid-shake'
          : isUserLeading
          ? 'border-emerald-500 shadow-emerald-500/15'
          : isOvertime
          ? 'border-amber-500 shadow-amber-500/15 animate-popcorn-surge'
          : 'border-[#E5E3DC] dark:border-[#252934] hover:border-neutral-400 dark:hover:border-neutral-600'
      }`}
    >
      <div>
        {/* Header: Thumbnail + Lot Number + Reserve Badge */}
        <div className="flex items-start gap-3 mb-3">
          <img
            src={lot.mediaGallery[0]?.thumbnailUrl || lot.mediaGallery[0]?.url}
            alt={lot.title}
            className="w-14 h-11 rounded-lg object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {lot.lotNumber}
              </span>
              {isUserLeading ? (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black font-mono text-[9px] font-bold">
                  WINNING
                </span>
              ) : isOutbid ? (
                <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[9px] font-bold">
                  OUTBID
                </span>
              ) : null}
            </div>
            <h4 className="text-xs font-semibold text-[#111315] dark:text-[#F8FAFC] truncate">
              {lot.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#646870] dark:text-[#8E96A8]">
              <span>{lot.category}</span>
              {lot.reserveStatus === 'no_reserve' && (
                <span className="text-sky-500 font-bold">• NO RESERVE</span>
              )}
            </div>
          </div>
        </div>

        {/* Center Telemetry: Current Bid, Proxy Ceiling, Countdown */}
        <div className="p-3 rounded-xl bg-[#F3F2EE] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] mb-3 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#646870] dark:text-[#8E96A8] uppercase">
              Current Bid
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatCents(lot.currentBidCents)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] text-[#646870] dark:text-[#8E96A8]">
              Your Proxy Shield:
            </span>
            <span className="text-[11px] font-semibold text-indigo-400">
              {proxyCeiling ? formatCents(proxyCeiling) : 'None Set'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-[10px] text-[#646870] dark:text-[#8E96A8] uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Clock
            </span>
            <span 
              className={`text-xs font-bold ${
                isExpired 
                  ? 'text-neutral-400' 
                  : isOvertime 
                  ? 'text-amber-500 animate-pulse' 
                  : 'text-[#111315] dark:text-[#F8FAFC]'
              }`}
            >
              {formatted}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action: Inline 1-Click Counter Bid Button */}
      <div className="space-y-1.5">
        {lot.status === 'live' && !isExpired ? (
          <button
            onClick={handleQuickCounterBid}
            className={`w-full py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
              isUserLeading
                ? 'bg-neutral-200 dark:bg-neutral-800 text-[#111315] dark:text-[#F8FAFC] hover:bg-neutral-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {isUserLeading ? `Defend Bid (${formatCents(lot.nextMinBidCents)})` : `1-Click Bid ${formatCents(lot.nextMinBidCents)}`}
            </span>
          </button>
        ) : (
          <div className="py-2 text-center font-mono text-xs text-neutral-400 font-bold bg-neutral-200 dark:bg-neutral-800 rounded-xl">
            AUCTION CLOSED
          </div>
        )}

        {/* Small Rival Challenge Simulator Button */}
        <button
          onClick={handleSimulateChallenge}
          className="w-full py-1 text-[10px] font-mono text-[#646870] dark:text-[#8E96A8] hover:text-amber-500 transition-colors text-center"
          title="Simulate rival bid to test outbid border trigger or autonomous proxy auto-stepping"
        >
          ⚡ Simulate Rival Challenge
        </button>
      </div>
    </div>
  );
};

export const MultiLotWatchlistTerminal: React.FC<{
  onOpenStage: (lotId: string) => void;
}> = ({ onOpenStage }) => {
  const { lots, isSoundMuted, toggleSound } = useAuction();
  const [gridDensity, setGridDensity] = useState<'2x2' | '3x2'>('3x2');

  return (
    <div className="space-y-6 pb-16">
      {/* Top Terminal Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium text-[#111315] dark:text-[#F8FAFC] flex items-center gap-2">
              Auction Day Watchlist Terminal
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-xs font-bold">
                LIVE MULTI-FEED
              </span>
            </h2>
            <p className="text-xs text-[#646870] dark:text-[#8E96A8]">
              High-density split-screen trading terminal for simultaneous multi-lot bidding without switching tabs.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F2EE] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white transition-colors cursor-pointer"
          >
            {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Sound Alerts: {isSoundMuted ? 'OFF' : 'ON'}</span>
          </button>

          {/* Grid Layout Switcher */}
          <div className="p-1 rounded-lg bg-[#F3F2EE] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] flex items-center gap-1">
            <button
              onClick={() => setGridDensity('2x2')}
              className={`p-1.5 rounded transition-colors ${
                gridDensity === '2x2'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-[#646870] dark:text-[#8E96A8]'
              }`}
              title="2x2 Large Grid"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridDensity('3x2')}
              className={`p-1.5 rounded transition-colors ${
                gridDensity === '3x2'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-[#646870] dark:text-[#8E96A8]'
              }`}
              title="3x2 High Density Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Cards Grid */}
      <div 
        className={`grid gap-4 ${
          gridDensity === '2x2' 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {lots.map(lot => (
          <TerminalCard
            key={lot.id}
            lot={lot}
            onOpenStage={onOpenStage}
          />
        ))}
      </div>
    </div>
  );
};

