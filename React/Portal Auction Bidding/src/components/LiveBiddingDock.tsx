import React, { useState, useEffect } from 'react';
import { 
  Gavel, 
  Shield, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Flame, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  Sparkles, 
  HelpCircle,
  RotateCcw,
  Bot
} from 'lucide-react';
import { LotItem, calculateDynamicMinIncrement, calculateLandedCost } from '../types/auction';
import { useLotCountdown } from '../hooks/useServerClockSync';
import { formatCents } from '../utils/formatters';
import { useAuction } from '../context/AuctionContext';

interface LiveBiddingDockProps {
  lot: LotItem;
}

export const LiveBiddingDock: React.FC<LiveBiddingDockProps> = ({ lot }) => {
  const { 
    currentUser, 
    userProxyCeilings, 
    placeBid, 
    simulateRivalBid, 
    fastForwardClock, 
    triggerHammerFall, 
    setIsPaddleModalOpen,
    lastOutbidLotId,
    lastPopcornExtendedLotId,
    lastProxyDefendedLotId
  } = useAuction();

  const isUserLeading = lot.leadingBidderId === currentUser.id;
  const isOutbid = !isUserLeading && lot.bidsCount > 0 && lastOutbidLotId === lot.id;
  const isPopcornSurge = lastPopcornExtendedLotId === lot.id;
  const isProxyDefended = lastProxyDefendedLotId === lot.id;

  const currentProxyCeiling = userProxyCeilings[lot.id];

  // Countdown timer
  const { formatted, isOvertime, isExpired } = useLotCountdown(lot.endsAt, () => {
    if (lot.status === 'live') {
      triggerHammerFall(lot.id);
    }
  });

  // Increment step options based on current price
  const baseIncrement = calculateDynamicMinIncrement(lot.currentBidCents);
  const quickStep1 = lot.currentBidCents + baseIncrement;
  const quickStep2 = lot.currentBidCents + (baseIncrement * 2);
  const quickStep3 = lot.currentBidCents + (baseIncrement * 4);

  // Bidding input state
  const [biddingMode, setBiddingMode] = useState<'direct' | 'proxy'>('direct');
  const [customBidAmount, setCustomBidAmount] = useState<number>(quickStep1 / 100);
  const [proxyCeilingAmount, setProxyCeilingAmount] = useState<number>(
    currentProxyCeiling ? currentProxyCeiling / 100 : (quickStep3 + baseIncrement * 4) / 100
  );
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Keep custom bid aligned with next min bid when current bid changes
  useEffect(() => {
    if (customBidAmount < lot.nextMinBidCents / 100) {
      setCustomBidAmount(lot.nextMinBidCents / 100);
    }
  }, [lot.nextMinBidCents, customBidAmount]);

  // Landed Cost calculations based on current selected bid
  const proposedBidCents = customBidAmount * 100;
  const landedCost = calculateLandedCost(
    proposedBidCents, 
    lot.category, 
    currentUser.paddle.heldDepositCents
  );

  const handlePlaceBid = (amountCents: number, isProxy = false) => {
    const proxyCents = isProxy || biddingMode === 'proxy' 
      ? proxyCeilingAmount * 100 
      : undefined;

    const res = placeBid(lot.id, amountCents, proxyCents);

    if (!res.success) {
      setFeedbackMessage({ type: 'error', text: res.message });
    } else if (res.wasOutbid) {
      setFeedbackMessage({ type: 'error', text: res.message });
    } else {
      setFeedbackMessage({ type: 'success', text: res.message });
    }

    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  return (
    <div 
      className={`rounded-2xl border-2 bg-[#FFFFFF] dark:bg-[#181B23] p-5 shadow-xl transition-all duration-300 relative ${
        isOutbid 
          ? 'animate-outbid-shake border-rose-500 shadow-rose-500/20' 
          : isPopcornSurge
          ? 'animate-popcorn-surge border-amber-500 shadow-amber-500/20'
          : isUserLeading
          ? 'border-emerald-500/80 shadow-emerald-500/10'
          : 'border-[#E5E3DC] dark:border-[#252934]'
      }`}
    >
      {/* 1. Dynamic User State Banner */}
      <div className="mb-4">
        {isExpired || lot.status === 'sold_hammer' ? (
          <div className="p-3 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white font-mono text-xs flex items-center justify-between border border-neutral-700">
            <span className="flex items-center gap-1.5 font-bold">
              <Gavel className="w-4 h-4 text-emerald-400" />
              HAMMER FALLEN — LOT CLOSED
            </span>
            <span className="text-emerald-400 font-bold">
              Winner: {lot.leadingPaddleNumber || currentUser.paddle.paddleNumber}
            </span>
          </div>
        ) : isProxyDefended ? (
          <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400 text-indigo-700 dark:text-indigo-300 font-mono text-xs flex items-center gap-2 animate-proxy-pulse">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <span className="font-bold block">Autonomous Proxy Shield Active!</span>
              <span>Defended your high bid against rival challenge.</span>
            </div>
          </div>
        ) : isUserLeading ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">You Hold the Leading Bid ({formatCents(lot.currentBidCents)})</span>
            </div>
            {currentProxyCeiling && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
                Proxy Shield: {formatCents(currentProxyCeiling)}
              </span>
            )}
          </div>
        ) : isOutbid ? (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400 text-rose-700 dark:text-rose-300 font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
              <span className="font-bold">You Were Outbid by {lot.leadingPaddleNumber}!</span>
            </div>
            <span className="text-[11px] underline font-bold cursor-pointer" onClick={() => handlePlaceBid(lot.nextMinBidCents)}>
              Counter-Bid Now
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[11px] font-mono flex items-center justify-between text-[#646870] dark:text-[#8E96A8]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified Paddle Required to Bid
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {currentUser.paddle.paddleNumber}
            </span>
          </div>
        )}
      </div>

      {/* 2. Price & Countdown Hero Row */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E5E3DC] dark:border-[#252934]">
        {/* Left: High Bid */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#646870] dark:text-[#8E96A8] block">
            Current High Bid
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[#111315] dark:text-[#F8FAFC] tabular-nums mt-0.5">
            {formatCents(lot.currentBidCents)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-[#646870] dark:text-[#8E96A8]">
            <span>Paddle {lot.leadingPaddleNumber || 'None'}</span>
            <span>•</span>
            <span>{lot.bidsCount} bids</span>
          </div>
        </div>

        {/* Right: Countdown Clock */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#646870] dark:text-[#8E96A8] block">
              Time Remaining
            </span>
            {isOvertime && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div 
            className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight tabular-nums mt-0.5 flex items-center justify-end gap-1 ${
              isExpired 
                ? 'text-neutral-400' 
                : isOvertime 
                ? 'text-amber-500 animate-pulse' 
                : 'text-[#111315] dark:text-[#F8FAFC]'
            }`}
          >
            {isOvertime && <Zap className="w-5 h-5 text-amber-500 inline shrink-0" />}
            {formatted}
          </div>

          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-mono text-[#646870] dark:text-[#8E96A8]">
            {isOvertime ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                ⚡ Popcorn Overtime Active (&lt;02:00)
              </span>
            ) : isExpired ? (
              <span>Final Result</span>
            ) : (
              <span>Server-Synced Clock</span>
            )}
          </div>
        </div>
      </div>

      {/* Popcorn Surge Float Badge */}
      {isPopcornSurge && (
        <div className="my-2 p-2 rounded-lg bg-amber-500 text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 animate-bounce shadow-lg">
          <Flame className="w-4 h-4 fill-black" />
          <span>+02:00 OVERTIME CLOCK RESET TRIGGERED!</span>
        </div>
      )}

      {/* 3. Live Reserve Proximity Thermometer */}
      <div className="py-4 border-b border-[#E5E3DC] dark:border-[#252934] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#646870] dark:text-[#8E96A8] flex items-center gap-1">
            Reserve Status:
          </span>
          {lot.reserveStatus === 'no_reserve' ? (
            <span className="text-sky-500 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              ⚡ No Reserve Auction (Will Sell!)
            </span>
          ) : lot.reserveStatus === 'reserve_met' ? (
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              🟢 Reserve Met — Lot Will Sell!
            </span>
          ) : lot.reserveStatus === 'reserve_near' ? (
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              🔥 Reserve Near (Within 10% of Reserve)
            </span>
          ) : (
            <span className="text-[#646870] dark:text-[#8E96A8] font-bold">
              🔒 Reserve Not Met
            </span>
          )}
        </div>

        {/* Segmented Thermometer Progress Bar */}
        <div className="grid grid-cols-3 gap-1 h-2 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 p-0.5">
          {/* Segment 1: Under Reserve */}
          <div 
            className={`rounded-l-full h-full transition-all ${
              lot.reserveStatus === 'not_met' || lot.reserveStatus === 'reserve_near' || lot.reserveStatus === 'reserve_met' || lot.reserveStatus === 'no_reserve'
                ? 'bg-neutral-400 dark:bg-neutral-500'
                : 'bg-transparent'
            }`} 
          />
          {/* Segment 2: Reserve Near (90-99%) */}
          <div 
            className={`h-full transition-all ${
              lot.reserveStatus === 'reserve_near' || lot.reserveStatus === 'reserve_met' || lot.reserveStatus === 'no_reserve'
                ? 'bg-amber-500'
                : 'bg-transparent'
            }`} 
          />
          {/* Segment 3: Reserve Met (100%+) */}
          <div 
            className={`rounded-r-full h-full transition-all ${
              lot.reserveStatus === 'reserve_met' || lot.reserveStatus === 'no_reserve'
                ? 'bg-emerald-500'
                : 'bg-transparent'
            }`} 
          />
        </div>
      </div>

      {/* 4. Instant-Action Paddle Presets & Custom Input */}
      {lot.status === 'live' && !isExpired && (
        <div className="py-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#111315] dark:text-[#F8FAFC]">
              Instant Counter-Paddles
            </span>
            <span className="font-mono text-[10px] text-[#646870] dark:text-[#8E96A8]">
              Ladder Step: +{formatCents(baseIncrement)}
            </span>
          </div>

          {/* 3 Instant Quick-Step Paddle Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePlaceBid(quickStep1)}
              className="px-2 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-[#F3F2EE] dark:bg-[#12141A] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#111315] dark:text-[#F8FAFC] font-mono text-xs font-bold transition-all text-center cursor-pointer hover:border-emerald-500"
            >
              <span className="block text-[10px] text-[#646870] dark:text-[#8E96A8] font-normal">
                +{formatCents(baseIncrement)}
              </span>
              <span>{formatCents(quickStep1)}</span>
            </button>

            <button
              onClick={() => handlePlaceBid(quickStep2)}
              className="px-2 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-[#F3F2EE] dark:bg-[#12141A] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#111315] dark:text-[#F8FAFC] font-mono text-xs font-bold transition-all text-center cursor-pointer hover:border-emerald-500"
            >
              <span className="block text-[10px] text-[#646870] dark:text-[#8E96A8] font-normal">
                +{formatCents(baseIncrement * 2)}
              </span>
              <span>{formatCents(quickStep2)}</span>
            </button>

            <button
              onClick={() => handlePlaceBid(quickStep3)}
              className="px-2 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-[#F3F2EE] dark:bg-[#12141A] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#111315] dark:text-[#F8FAFC] font-mono text-xs font-bold transition-all text-center cursor-pointer hover:border-emerald-500"
            >
              <span className="block text-[10px] text-[#646870] dark:text-[#8E96A8] font-normal">
                +{formatCents(baseIncrement * 4)}
              </span>
              <span>{formatCents(quickStep3)}</span>
            </button>
          </div>

          {/* Segmented Mode: Direct Bid vs Confidential Proxy Ceiling */}
          <div className="p-1 rounded-xl bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] grid grid-cols-2 text-xs font-mono">
            <button
              onClick={() => setBiddingMode('direct')}
              className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                biddingMode === 'direct'
                  ? 'bg-white dark:bg-[#181B23] text-[#111315] dark:text-white font-bold shadow-sm'
                  : 'text-[#646870] dark:text-[#8E96A8]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Direct Single Bid
            </button>

            <button
              onClick={() => setBiddingMode('proxy')}
              className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                biddingMode === 'proxy'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-[#646870] dark:text-[#8E96A8]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Confidential Max Proxy
            </button>
          </div>

          {/* Bid Input & Primary CTA Button */}
          <div className="space-y-2">
            {biddingMode === 'proxy' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#646870] dark:text-[#8E96A8]">
                  <span>Your Secret Maximum Ceiling ($):</span>
                  <span className="text-indigo-400 font-bold">Auto-steps only when challenged</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#646870] dark:text-[#8E96A8]">
                    $
                  </span>
                  <input
                    type="number"
                    step={baseIncrement / 100}
                    value={proxyCeilingAmount}
                    onChange={e => setProxyCeilingAmount(Math.max(quickStep1 / 100, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] font-mono text-sm font-bold text-[#111315] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#646870] dark:text-[#8E96A8]">
                  <span>Custom Bid Amount ($):</span>
                  <span>Min: {formatCents(lot.nextMinBidCents)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#646870] dark:text-[#8E96A8]">
                    $
                  </span>
                  <input
                    type="number"
                    step={baseIncrement / 100}
                    min={lot.nextMinBidCents / 100}
                    value={customBidAmount}
                    onChange={e => setCustomBidAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] font-mono text-sm font-bold text-[#111315] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => {
                if (biddingMode === 'proxy') {
                  handlePlaceBid(lot.nextMinBidCents, true);
                } else {
                  handlePlaceBid(customBidAmount * 100, false);
                }
              }}
              className={`w-full py-3.5 rounded-xl font-mono text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                biddingMode === 'proxy'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  : 'bg-[#111315] dark:bg-white text-white dark:text-[#111315] hover:opacity-95 shadow-black/20'
              }`}
            >
              <Gavel className="w-4 h-4" />
              <span>
                {biddingMode === 'proxy'
                  ? `Place ${formatCents(lot.nextMinBidCents)} (Proxy Shield up to $${proxyCeilingAmount.toLocaleString()})`
                  : `Confirm Bid of ${formatCents(customBidAmount * 100)} 🔨`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-mono mb-3 ${
            feedbackMessage.type === 'error'
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* 5. Zero-Surprise All-In Landed Cost Breakdown */}
      <div className="rounded-xl bg-[#F3F2EE] dark:bg-[#12141A] p-3.5 font-mono text-xs border border-[#E5E3DC] dark:border-[#252934] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#646870] dark:text-[#8E96A8] pb-1 border-b border-neutral-300 dark:border-neutral-800">
          <span className="font-semibold text-[#111315] dark:text-[#F8FAFC]">
            All-In Landed Cost Preview
          </span>
          <span>Zero Surprise Fees</span>
        </div>

        <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
          <span>Your Bid Commitment:</span>
          <span className="text-[#111315] dark:text-[#F8FAFC] font-bold">
            {formatCents(landedCost.bidAmountCents, true)}
          </span>
        </div>

        <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
          <span>Buyer's Premium (5.00%):</span>
          <span>+{formatCents(landedCost.buyerPremiumCents, true)}</span>
        </div>

        <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
          <span>Insured Escrow & Transit Est.:</span>
          <span>+{formatCents(landedCost.estimatedShippingCents, true)}</span>
        </div>

        <div className="pt-1.5 border-t border-neutral-300 dark:border-neutral-800 flex justify-between font-bold text-sm text-[#111315] dark:text-[#F8FAFC]">
          <span>Total Landed Out-of-Pocket:</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {formatCents(landedCost.totalLandedCommitmentCents, true)}
          </span>
        </div>

        <p className="text-[10px] text-[#646870] dark:text-[#8E96A8] pt-1">
          🔒 Paddle {currentUser.paddle.paddleNumber} Pre-Authorized • Protected by Delivery-Verified Escrow
        </p>
      </div>

      {/* 6. Interactive Developer Simulator Controls */}
      <div className="mt-4 pt-3 border-t border-[#E5E3DC] dark:border-[#252934] space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#646870] dark:text-[#8E96A8] block">
          Simulation Lab (Test Micro-Interactions)
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <button
            onClick={() => simulateRivalBid(lot.id)}
            className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-[#111315] dark:text-white font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title="Simulate a rival paddle placing a challenge bid via WebSocket"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Rival Bid</span>
          </button>

          <button
            onClick={() => fastForwardClock(lot.id, 90)}
            className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-[#111315] dark:text-white font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title="Fast forward timer to 01:30 so you can test the +02:00 soft-close reset"
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Fast-Fwd to 01:30</span>
          </button>
        </div>
      </div>
    </div>
  );
};

