import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Star, 
  Eye, 
  ShieldCheck, 
  FileCheck, 
  Award, 
  MapPin, 
  Check, 
  Building2,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { LotItem } from '../types/auction';
import { useAuction } from '../context/AuctionContext';
import { ConditionPinboardGallery } from './ConditionPinboardGallery';
import { InterleavedTimeline } from './InterleavedTimeline';
import { LiveBiddingDock } from './LiveBiddingDock';
import { formatCents } from '../utils/formatters';

interface LiveLotBiddingStageProps {
  lot: LotItem;
  onBack: () => void;
}

export const LiveLotBiddingStage: React.FC<LiveLotBiddingStageProps> = ({ lot, onBack }) => {
  const { bidsMap, timelineMap } = useAuction();
  const [isCopied, setIsCopied] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  const bids = bidsMap[lot.id] || [];
  const timelineEntries = timelineMap[lot.id] || [];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Live Sub-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E3DC] dark:border-[#252934]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white transition-colors cursor-pointer"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {lot.lotNumber}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-xs text-[#646870] dark:text-[#8E96A8]">
                {lot.category}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#111315] dark:text-[#F8FAFC]">
              {lot.title}
            </h1>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWatched(!isWatched)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              isWatched
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                : 'bg-[#F3F2EE] dark:bg-[#12141A] border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-amber-500' : ''}`} />
            <span>{isWatched ? 'Watching' : 'Watch'} ({lot.watchersCount + (isWatched ? 1 : 0)})</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-xs font-mono text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isCopied ? 'Link Copied!' : 'Share Lot'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Asymmetric Master Layout (7 cols Left, 5 cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Media Gallery, Condition Hotspots, Dossier & Interleaved Q&A (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. Categorized Media Gallery with Condition Pinboard */}
          <ConditionPinboardGallery
            mediaGallery={lot.mediaGallery}
            conditionPins={lot.conditionPins}
            lotTitle={lot.title}
          />

          {/* 2. Structured Provenance Dossier & Condition Matrix */}
          <div className="rounded-2xl border border-[#E5E3DC] dark:border-[#252934] bg-[#FFFFFF] dark:bg-[#12141A] p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-xl font-medium text-[#111315] dark:text-[#F8FAFC]">
                  Archival Provenance & Condition Dossier
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                  Grade: {lot.conditionGrade}
                </span>
              </div>
              <p className="text-sm text-[#646870] dark:text-[#8E96A8] leading-relaxed">
                {lot.provenanceSummary}
              </p>
            </div>

            {/* Consignor Trust Block */}
            <div className="p-3.5 rounded-xl bg-[#F3F2EE] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold font-mono">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#111315] dark:text-[#F8FAFC] block">
                    Consigned by {lot.sellerName}
                  </span>
                  <span className="text-[#646870] dark:text-[#8E96A8] flex items-center gap-1 font-mono text-[11px]">
                    <MapPin className="w-3 h-3" />
                    {lot.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Specialist Escrow Eligible</span>
              </div>
            </div>

            {/* Specification Key-Value Grid */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-[#646870] dark:text-[#8E96A8] mb-3">
                Technical Specifications & Documented Matching Codes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(lot.specifications).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-[#FAF9F5] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] flex flex-col justify-between"
                  >
                    <span className="text-[#646870] dark:text-[#8E96A8] text-[10px] uppercase">
                      {key}
                    </span>
                    <span className="font-semibold text-[#111315] dark:text-[#F8FAFC] truncate mt-0.5" title={val}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Interleaved Live Bid & Specialist Q&A Pit */}
          <div className="rounded-2xl border border-[#E5E3DC] dark:border-[#252934] bg-[#FFFFFF] dark:bg-[#12141A] p-6 shadow-sm">
            <h2 className="font-serif text-xl font-medium text-[#111315] dark:text-[#F8FAFC] mb-4">
              Interleaved Bidding & Community Q&A Pit
            </h2>
            <InterleavedTimeline
              lotId={lot.id}
              bids={bids}
              timelineEntries={timelineEntries}
              sellerName={lot.sellerName}
            />
          </div>

        </div>

        {/* Right Column: Sticky Live Bidding & Proxy Command Dock (5 Cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <LiveBiddingDock lot={lot} />

          {/* Institutional Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#111315] dark:text-[#F8FAFC]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Auctio Institutional Buyer Safeguards</span>
            </div>
            <ul className="space-y-1.5 text-[#646870] dark:text-[#8E96A8] text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Popcorn Soft-Close Protection:</strong> Automatic 2-minute clock extensions eliminate unfair bot sniping.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Delivery-Gated Escrow:</strong> Seller payout is safeguarded until buyer completes 48-hour physical authenticity inspection.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>No Joybidders:</strong> Every paddle holds a verified Stripe pre-authorization deposit.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

