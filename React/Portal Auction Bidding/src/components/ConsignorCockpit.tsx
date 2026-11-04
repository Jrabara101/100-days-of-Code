import React, { useState } from 'react';
import { 
  Building2, 
  Flame, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  DollarSign, 
  Unlock, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Sparkles,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { formatCents } from '../utils/formatters';

export const ConsignorCockpit: React.FC = () => {
  const { lots, dropReserve, setSelectedLotId, setActiveView } = useAuction();
  
  // Find Lot #108 (1961 Gibson Les Paul Standard "Burst") which is currently at $18,500 with reserve at $19,500
  const gibsonLot = lots.find(l => l.id === 'lot-108') || lots[0];
  const porscheLot = lots.find(l => l.id === 'lot-041');

  const [selectedLotForCockpit, setSelectedLotForCockpit] = useState<string>(gibsonLot.id);
  const [isConsignModalOpen, setIsConsignModalOpen] = useState(false);
  const [reserveDroppedSuccess, setReserveDroppedSuccess] = useState(false);

  // New consignment form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Automotive');
  const [newStartingBid, setNewStartingBid] = useState(10000);
  const [newReserve, setNewReserve] = useState(15000);
  const [newProvenance, setNewProvenance] = useState('');

  const activeLot = lots.find(l => l.id === selectedLotForCockpit) || gibsonLot;
  const reserveCents = activeLot.reservePriceCents || 0;
  const reserveCoverage = reserveCents > 0 
    ? Math.min(100, (activeLot.currentBidCents / reserveCents) * 100).toFixed(1)
    : '100.0';

  // Net Proceeds calculation (5% seller commission)
  const commissionCents = Math.round(activeLot.currentBidCents * 0.05);
  const estimatedNetPayoutCents = activeLot.currentBidCents - commissionCents;

  const handleDropReserveAction = () => {
    dropReserve(activeLot.id);
    setReserveDroppedSuccess(true);
    setTimeout(() => setReserveDroppedSuccess(false), 5000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-medium text-[#111315] dark:text-[#F8FAFC] flex items-center gap-2">
              Consignor Cockpit & Live Telemetry Studio
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-xs font-bold">
                SELLER DESK
              </span>
            </h1>
            <p className="text-xs text-[#646870] dark:text-[#8E96A8]">
              Real-time reserve transparency, buyer demand telemetry, and 1-click reserve adjustments.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsConsignModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Consign New High-Value Lot</span>
        </button>
      </div>

      {/* Lot Selector Tabs for Consignor */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
        {lots.slice(0, 4).map(lot => (
          <button
            key={lot.id}
            onClick={() => setSelectedLotForCockpit(lot.id)}
            className={`px-4 py-2 rounded-xl border transition-all text-left flex items-center gap-2.5 cursor-pointer ${
              selectedLotForCockpit === lot.id
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                : 'bg-[#FFFFFF] dark:bg-[#12141A] border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8] hover:border-neutral-400'
            }`}
          >
            <span className="font-bold">{lot.lotNumber}</span>
            <span className="truncate max-w-[140px] font-sans">{lot.title}</span>
          </button>
        ))}
      </div>

      {/* Live Seller Telemetry Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm">
          <div className="flex items-center justify-between text-[#646870] dark:text-[#8E96A8] text-xs">
            <span>Active Watchers</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-[#111315] dark:text-[#F8FAFC] mt-1">
            {activeLot.watchersCount}
          </div>
          <span className="text-[11px] text-emerald-500 font-semibold">
            ↑ 24 joined in last 2h
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm">
          <div className="flex items-center justify-between text-[#646870] dark:text-[#8E96A8] text-xs">
            <span>Verified Paddles Following</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">
            {Math.round(activeLot.watchersCount * 0.16)}
          </div>
          <span className="text-[11px] text-[#646870] dark:text-[#8E96A8]">
            Pre-authorized deposits held
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm">
          <div className="flex items-center justify-between text-[#646870] dark:text-[#8E96A8] text-xs">
            <span>Current High Bid</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#111315] dark:text-[#F8FAFC] mt-1">
            {formatCents(activeLot.currentBidCents)}
          </div>
          <span className="text-[11px] text-[#646870] dark:text-[#8E96A8]">
            Leader: {activeLot.leadingPaddleNumber || 'None'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm">
          <div className="flex items-center justify-between text-[#646870] dark:text-[#8E96A8] text-xs">
            <span>Reserve Coverage</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-[#111315] dark:text-[#F8FAFC] mt-1">
            {reserveCoverage}%
          </div>
          <span className="text-[11px] text-amber-500 font-semibold">
            {activeLot.reserveStatus === 'reserve_met' ? 'Reserve Met!' : 'Within 10% Floor'}
          </span>
        </div>
      </div>

      {/* Live "Drop the Reserve" Action Card (Key High-Impact Feature) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/40 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black font-mono font-bold text-xs flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-black" />
                CONSIGNOR ACTION: RESERVE OPTIMIZATION
              </span>
              <span className="font-mono text-xs text-[#646870] dark:text-[#8E96A8]">
                {activeLot.lotNumber}
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-[#111315] dark:text-[#F8FAFC]">
              Trigger Reserve-Met Momentum Frenzy
            </h3>
          </div>

          <div className="text-right font-mono text-xs hidden sm:block">
            <span className="text-[#646870] dark:text-[#8E96A8] block">Your Confidential Reserve:</span>
            <span className="text-base font-bold text-[#111315] dark:text-[#F8FAFC]">
              {reserveCents > 0 ? formatCents(reserveCents) : 'NO RESERVE'}
            </span>
          </div>
        </div>

        <p className="text-sm text-[#646870] dark:text-[#8E96A8] leading-relaxed max-w-2xl">
          💡 Bidding is currently at <strong>{formatCents(activeLot.currentBidCents)}</strong> (
          {reserveCoverage}% of your {formatCents(reserveCents)} reserve). Lowering your reserve to the current bid immediately sends a <strong>"RESERVE MET — WILL SELL AT HAMMER"</strong> push broadcast to all {activeLot.watchersCount} watchers, igniting competitive bidding.
        </p>

        {reserveDroppedSuccess ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500 text-emerald-700 dark:text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-bold">
              Reserve successfully dropped to {formatCents(activeLot.currentBidCents)}! Reserve-Met alert broadcasted to all watchers.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleDropReserveAction}
              disabled={activeLot.reserveStatus === 'reserve_met' || activeLot.reserveStatus === 'no_reserve'}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>Drop Reserve to {formatCents(activeLot.currentBidCents)} & Broadcast Alert</span>
            </button>

            <button
              onClick={() => {
                setSelectedLotId(activeLot.id);
                setActiveView('portal');
              }}
              className="px-4 py-3 rounded-xl bg-[#FFFFFF] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] text-xs font-mono font-medium text-[#111315] dark:text-[#F8FAFC] hover:border-neutral-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Live Lot Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Net Proceeds Settlement Waterfall Calculator */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-500" />
          <h3 className="font-serif text-lg font-medium text-[#111315] dark:text-[#F8FAFC]">
            Live Consignor Net Proceeds Waterfall
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934]">
            <span className="text-[#646870] dark:text-[#8E96A8] uppercase block">Gross Hammer Price</span>
            <span className="text-xl font-bold text-[#111315] dark:text-[#F8FAFC] mt-1 block">
              {formatCents(activeLot.currentBidCents)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934]">
            <span className="text-[#646870] dark:text-[#8E96A8] uppercase block">Platform Consignor Fee (5.0%)</span>
            <span className="text-xl font-bold text-rose-500 mt-1 block">
              -{formatCents(commissionCents)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-emerald-700 dark:text-emerald-400 uppercase font-bold block">
              Estimated Net Consignor Payout
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1 block">
              {formatCents(estimatedNetPayoutCents)}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-1">
              Guaranteed escrow disbursement within 48h of buyer inspection.
            </span>
          </div>
        </div>
      </div>

      {/* Consignment Intake Modal */}
      {isConsignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#FFFFFF] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC] dark:border-[#252934]">
              <h3 className="font-serif text-lg font-medium text-[#111315] dark:text-[#F8FAFC] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                Consign a Lot to Auctio Vault
              </h3>
              <button
                onClick={() => setIsConsignModalOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[#646870] dark:text-[#8E96A8] mb-1">
                  Lot Title (Make, Model, Reference, Year):
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. 1967 Shelby GT500 Fastback or Rolex Submariner 5513"
                  className="w-full p-2.5 rounded-lg bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#646870] dark:text-[#8E96A8] mb-1">
                    Category:
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-white"
                  >
                    <option value="Automotive">Automotive</option>
                    <option value="Haute Horlogerie">Haute Horlogerie</option>
                    <option value="Fine Instruments">Fine Instruments</option>
                    <option value="Rare Collectibles">Rare Collectibles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#646870] dark:text-[#8E96A8] mb-1">
                    Starting Bid ($):
                  </label>
                  <input
                    type="number"
                    value={newStartingBid}
                    onChange={e => setNewStartingBid(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#646870] dark:text-[#8E96A8] mb-1">
                  Confidential Reserve Floor ($) [0 for No Reserve]:
                </label>
                <input
                  type="number"
                  value={newReserve}
                  onChange={e => setNewReserve(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[#646870] dark:text-[#8E96A8] mb-1">
                  Provenance & Documentation Summary:
                </label>
                <textarea
                  rows={3}
                  value={newProvenance}
                  onChange={e => setNewProvenance(e.target.value)}
                  placeholder="Detail ownership history, matching numbers, certificate hashes, service invoices..."
                  className="w-full p-2.5 rounded-lg bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[#111315] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E3DC] dark:border-[#252934]">
              <button
                onClick={() => setIsConsignModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-xs font-mono font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Consignment application submitted to specialist inspection triage!');
                  setIsConsignModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-mono font-bold hover:bg-emerald-500"
              >
                Submit for Specialist Curation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

