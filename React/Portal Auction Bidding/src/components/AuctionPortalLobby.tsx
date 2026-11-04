import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Flame, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Star, 
  Camera, 
  ArrowUpRight, 
  SlidersHorizontal,
  Gavel,
  CheckCircle2
} from 'lucide-react';
import { LotItem } from '../types/auction';
import { useAuction } from '../context/AuctionContext';
import { useLotCountdown } from '../hooks/useServerClockSync';
import { formatCents } from '../utils/formatters';

const LotCard: React.FC<{
  lot: LotItem;
  onSelect: (lotId: string) => void;
}> = ({ lot, onSelect }) => {
  const { currentUser } = useAuction();
  const { formatted, isOvertime, isExpired } = useLotCountdown(lot.endsAt);
  const isUserLeading = lot.leadingBidderId === currentUser.id;

  return (
    <div 
      onClick={() => onSelect(lot.id)}
      className="group rounded-2xl border border-[#E5E3DC] dark:border-[#252934] bg-[#FFFFFF] dark:bg-[#12141A] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600"
    >
      <div>
        {/* Media Frame with Overlay Live Bid Bar */}
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-900">
          <img
            src={lot.mediaGallery[0]?.url}
            alt={lot.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/10">
              {lot.lotNumber}
            </span>

            {lot.reserveStatus === 'no_reserve' && (
              <span className="px-2 py-0.5 rounded bg-sky-500 text-white font-mono text-[10px] font-bold shadow-md flex items-center gap-1">
                <Zap className="w-3 h-3" />
                NO RESERVE
              </span>
            )}

            {lot.reserveStatus === 'reserve_near' && (
              <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-[10px] font-bold shadow-md flex items-center gap-1">
                <Flame className="w-3 h-3 fill-black" />
                RESERVE NEAR
              </span>
            )}

            {lot.reserveStatus === 'reserve_met' && (
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-mono text-[10px] font-bold shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                RESERVE MET
              </span>
            )}
          </div>

          {/* Top Right: Watchers & Photo Count */}
          <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
            <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white/90 font-mono text-[10px] flex items-center gap-1 border border-white/10">
              <Camera className="w-3 h-3" />
              {lot.mediaGallery.length}
            </span>
            <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white/90 font-mono text-[10px] flex items-center gap-1 border border-white/10">
              <Star className="w-3 h-3 text-amber-400" />
              {lot.watchersCount}
            </span>
          </div>

          {/* Bottom Overlay Live Bid Bar */}
          <div className="absolute bottom-0 inset-x-0 backdrop-blur-md bg-black/80 text-white px-3.5 py-2.5 flex items-center justify-between font-mono text-xs border-t border-white/10">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Current High Bid
              </span>
              <span className="font-bold text-sm text-emerald-400">
                {formatCents(lot.currentBidCents)}
              </span>
              <span className="text-[10px] text-neutral-400 ml-1.5 font-normal">
                ({lot.bidsCount} bids)
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Time Remaining
              </span>
              <span 
                className={`font-bold flex items-center gap-1 ${
                  isOvertime ? 'text-amber-400 animate-pulse' : 'text-white'
                }`}
              >
                {isOvertime ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <Clock className="w-3.5 h-3.5" />}
                {formatted}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#646870] dark:text-[#8E96A8]">
              {lot.category}
            </span>
            {isUserLeading && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                YOU'RE LEADING
              </span>
            )}
          </div>

          <h3 className="font-serif text-lg font-medium text-[#111315] dark:text-[#F8FAFC] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {lot.title}
          </h3>

          <p className="text-xs text-[#646870] dark:text-[#8E96A8] line-clamp-2 leading-relaxed">
            {lot.subtitle}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-[#E5E3DC]/60 dark:border-[#252934]/60 flex items-center justify-between font-mono text-xs">
        <span className="text-[11px] text-[#646870] dark:text-[#8E96A8]">
          Leader: <strong className="text-[#111315] dark:text-[#F8FAFC]">{lot.leadingPaddleNumber || 'None'}</strong>
        </span>

        <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
          <span>Inspect</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export const AuctionPortalLobby: React.FC<{
  onSelectLot: (lotId: string) => void;
}> = ({ onSelectLot }) => {
  const { lots } = useAuction();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [reserveFilter, setReserveFilter] = useState<'all' | 'no_reserve' | 'reserve_met'>('all');
  const [sortBy, setSortBy] = useState<'ending_soon' | 'high_bid' | 'most_bids'>('ending_soon');

  // Spotlight lot: Lot #041
  const spotlightLot = lots.find(l => l.id === 'lot-041') || lots[0];

  // Filtered & sorted lots
  const filteredLots = lots
    .filter(lot => {
      // Category filter
      if (selectedCategory !== 'All' && lot.category !== selectedCategory) {
        return false;
      }
      // Reserve filter
      if (reserveFilter === 'no_reserve' && lot.reserveStatus !== 'no_reserve') {
        return false;
      }
      if (reserveFilter === 'reserve_met' && lot.reserveStatus !== 'reserve_met') {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          lot.title.toLowerCase().includes(query) ||
          lot.subtitle.toLowerCase().includes(query) ||
          lot.lotNumber.toLowerCase().includes(query) ||
          lot.provenanceSummary.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ending_soon') {
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      }
      if (sortBy === 'high_bid') {
        return b.currentBidCents - a.currentBidCents;
      }
      if (sortBy === 'most_bids') {
        return b.bidsCount - a.bidsCount;
      }
      return 0;
    });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Spotlight Lot Banner */}
      {spotlightLot && (
        <div 
          onClick={() => onSelectLot(spotlightLot.id)}
          className="relative rounded-3xl overflow-hidden border border-[#E5E3DC] dark:border-[#252934] bg-neutral-900 text-white shadow-2xl group cursor-pointer"
        >
          {/* Background image with dramatic vignette */}
          <div className="absolute inset-0 z-0">
            <img
              src={spotlightLot.mediaGallery[0]?.url}
              alt={spotlightLot.title}
              className="w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-amber-500 text-black font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-black" />
                Curated Spotlight Lot
              </span>
              <span className="text-white/70">{spotlightLot.lotNumber}</span>
              <span className="text-white/40">•</span>
              <span className="text-emerald-400 font-semibold">{spotlightLot.category}</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight">
              {spotlightLot.title}
            </h2>

            <p className="text-sm text-neutral-300 leading-relaxed max-w-xl">
              {spotlightLot.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-6 font-mono">
              <div>
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                  Current Bid
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatCents(spotlightLot.currentBidCents)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                  Reserve Proximity
                </span>
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  Within 8% of Reserve
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                  Active Bidders
                </span>
                <span className="text-sm font-bold text-white">
                  {spotlightLot.watchersCount} Watching • {spotlightLot.bidsCount} Bids
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button className="px-5 py-2.5 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-lg">
                <Gavel className="w-4 h-4" />
                <span>Enter Live Bidding Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#646870] dark:text-[#8E96A8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search lots, chassis serials, reference numbers... ⌘K"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-xs text-[#111315] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Reserve filter pills */}
            <div className="p-1 rounded-xl bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setReserveFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  reserveFilter === 'all'
                    ? 'bg-white dark:bg-[#181B23] text-[#111315] dark:text-white font-bold shadow-sm'
                    : 'text-[#646870] dark:text-[#8E96A8]'
                }`}
              >
                All Reserves
              </button>
              <button
                onClick={() => setReserveFilter('no_reserve')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  reserveFilter === 'no_reserve'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-[#646870] dark:text-[#8E96A8]'
                }`}
              >
                <Zap className="w-3 h-3 text-sky-400" />
                No Reserve
              </button>
              <button
                onClick={() => setReserveFilter('reserve_met')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  reserveFilter === 'reserve_met'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-[#646870] dark:text-[#8E96A8]'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Reserve Met
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-xs font-mono text-[#111315] dark:text-[#F8FAFC] focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="ending_soon">⏱ Ending Soonest</option>
              <option value="high_bid">💎 Highest Current Bid</option>
              <option value="most_bids">🔥 Most Active Bids</option>
            </select>
          </div>
        </div>

        {/* Category Pill Rail */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Automotive', 'Haute Horlogerie', 'Fine Instruments', 'Rare Collectibles'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm'
                  : 'bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              {cat === 'All' ? `All Lots (${lots.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive 3-Column Lot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLots.map(lot => (
          <LotCard
            key={lot.id}
            lot={lot}
            onSelect={onSelectLot}
          />
        ))}
      </div>

      {filteredLots.length === 0 && (
        <div className="py-16 text-center space-y-3 bg-[#F3F2EE] dark:bg-[#12141A] rounded-2xl border border-dashed border-[#E5E3DC] dark:border-[#252934]">
          <Gavel className="w-10 h-10 mx-auto text-[#646870] dark:text-[#8E96A8]" />
          <h3 className="font-serif text-lg font-medium text-[#111315] dark:text-[#F8FAFC]">
            No matching auction lots found
          </h3>
          <p className="text-xs text-[#646870] dark:text-[#8E96A8]">
            Try adjusting your search terms, removing reserve filters, or selecting another category.
          </p>
        </div>
      )}
    </div>
  );
};

