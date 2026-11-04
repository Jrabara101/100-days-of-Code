import React, { useState } from 'react';
import { 
  Receipt, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  Printer, 
  ExternalLink,
  Building2,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Package
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { formatCents, formatDateTime } from '../utils/formatters';
import { EscrowStage } from '../types/auction';

export const EscrowSettlementPortal: React.FC = () => {
  const { settlements, updateSettlementStage, updateCarrierTracking, currentUser } = useAuction();
  
  const [selectedSettlementId, setSelectedSettlementId] = useState<string>(settlements[0]?.id || '');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [carrierInput, setCarrierInput] = useState('Ferrari Classiche Armored Logistics');
  const [trackingInput, setTrackingInput] = useState('TRK-981024-EU');

  const settlement = settlements.find(s => s.id === selectedSettlementId) || settlements[0];

  if (!settlement) {
    return (
      <div className="py-20 text-center space-y-4">
        <Receipt className="w-12 h-12 mx-auto text-neutral-400" />
        <h2 className="font-serif text-2xl font-medium text-[#111315] dark:text-[#F8FAFC]">
          No Hammer Settlements Active Yet
        </h2>
        <p className="text-xs text-[#646870] dark:text-[#8E96A8] max-w-md mx-auto">
          When an auction lot reaches 00:00.0 or the gavel strikes, the winning bidder and consignor escrow ledger is initialized here automatically.
        </p>
      </div>
    );
  }

  const stages: { stage: EscrowStage; label: string; desc: string }[] = [
    { stage: 'awaiting_payment', label: '1. Hammer Fallen', desc: 'Pre-auth deposit captured' },
    { stage: 'funds_in_escrow', label: '2. Escrow Funded', desc: 'Remaining balance secured' },
    { stage: 'in_transit_authenticated', label: '3. Carrier Dispatched', desc: 'Armored courier en route' },
    { stage: 'buyer_inspected', label: '4. 48h Inspection', desc: 'Condition verified by buyer' },
    { stage: 'payout_released', label: '5. Consignor Paid', desc: 'Escrow released to seller' },
  ];

  const getStageIndex = (stage: EscrowStage) => {
    switch (stage) {
      case 'awaiting_payment': return 0;
      case 'funds_in_escrow': return 1;
      case 'in_transit_authenticated': return 2;
      case 'buyer_inspected': return 3;
      case 'payout_released': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(settlement.escrowStage);

  const handleAdvanceEscrow = () => {
    if (currentIndex === 0) {
      updateSettlementStage(settlement.id, 'funds_in_escrow');
    } else if (currentIndex === 1) {
      updateSettlementStage(settlement.id, 'in_transit_authenticated');
    } else if (currentIndex === 2) {
      updateSettlementStage(settlement.id, 'buyer_inspected');
    } else if (currentIndex === 3) {
      updateSettlementStage(settlement.id, 'payout_released');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-medium text-[#111315] dark:text-[#F8FAFC] flex items-center gap-2">
              Post-Hammer Escrow & Multi-Rail Settlement
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-xs font-bold">
                ESCROW SAFEGUARDED
              </span>
            </h1>
            <p className="text-xs text-[#646870] dark:text-[#8E96A8]">
              Automated winner invoice generation, pre-auth deposit deduction, and 5-stage delivery-gated escrow release.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCertificateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-mono text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
        >
          <FileText className="w-4 h-4" />
          <span>View Official Bill of Sale PDF</span>
        </button>
      </div>

      {/* Settlement Selector (if multiple) */}
      {settlements.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
          {settlements.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSettlementId(s.id)}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                s.id === settlement.id
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-[#FFFFFF] dark:bg-[#12141A] border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8]'
              }`}
            >
              <span>{s.settlementNumber}</span> • <span>{s.lotTitle}</span>
            </button>
          ))}
        </div>
      )}

      {/* 5-Stage Visual Escrow Stepper */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-[#646870] dark:text-[#8E96A8]">
            Escrow Settlement Progress: <strong className="text-[#111315] dark:text-[#F8FAFC]">{settlement.settlementNumber}</strong>
          </span>
          <span className="font-mono text-xs text-emerald-500 font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Stage {currentIndex + 1} of 5 Active
          </span>
        </div>

        {/* Stepper Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((stg, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={stg.stage}
                className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700 text-[#111315] dark:text-[#F8FAFC]'
                    : 'bg-transparent border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{stg.label}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  ) : null}
                </div>
                <p className="text-[11px] text-[#646870] dark:text-[#8E96A8] font-sans">
                  {stg.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Advance Escrow Milestone Action Button (for interactive demo testing) */}
        {currentIndex < 4 && (
          <div className="pt-2 flex items-center justify-between border-t border-[#E5E3DC] dark:border-[#252934]">
            <span className="text-xs text-[#646870] dark:text-[#8E96A8] font-mono">
              Simulate Escrow Milestone Progression:
            </span>
            <button
              onClick={handleAdvanceEscrow}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>Advance to Next Escrow Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Invoice Ledger & Waterfall Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Financial Statement */}
        <div className="lg:col-span-7 rounded-2xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] p-6 shadow-sm space-y-4 font-mono text-xs">
          <h3 className="font-serif text-lg font-medium text-[#111315] dark:text-[#F8FAFC] pb-3 border-b border-[#E5E3DC] dark:border-[#252934]">
            Itemized Winner Settlement Statement
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
              <span>Lot Title:</span>
              <span className="text-[#111315] dark:text-[#F8FAFC] font-semibold">{settlement.lotTitle}</span>
            </div>

            <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
              <span>Winning Bidder:</span>
              <span className="text-emerald-500 font-bold">{settlement.winnerPaddleNumber} ({currentUser.name})</span>
            </div>

            <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
              <span>Consignor:</span>
              <span className="text-[#111315] dark:text-[#F8FAFC]">{settlement.sellerName}</span>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between">
              <span>Hammer Price:</span>
              <span className="font-bold text-[#111315] dark:text-[#F8FAFC]">{formatCents(settlement.hammerPriceCents, true)}</span>
            </div>

            <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
              <span>Platform Buyer's Premium (5.00%):</span>
              <span>+{formatCents(settlement.buyerPremiumCents, true)}</span>
            </div>

            <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
              <span>Insured Transit & Escrow Protection:</span>
              <span>+{formatCents(settlement.shippingInsuredCents, true)}</span>
            </div>

            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Paddle Pre-Authorization Deposit Applied:</span>
              <span>-{formatCents(settlement.depositAppliedCents, true)}</span>
            </div>

            <div className="pt-3 border-t-2 border-[#E5E3DC] dark:border-[#252934] flex justify-between text-base font-bold text-[#111315] dark:text-[#F8FAFC]">
              <span>Remaining Balance Due / Funded:</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatCents(settlement.totalBuyerDueCents, true)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F3F2EE] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] space-y-1 text-[11px]">
            <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
              <span>Escrow Vault ID:</span>
              <span>{settlement.payoutTraceId || 'STRIPE_ESCROW_TR_88192041'}</span>
            </div>
            <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
              <span>Settlement Created:</span>
              <span>{formatDateTime(settlement.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: Courier Tracking & 48h Inspection Window */}
        <div className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-medium text-[#111315] dark:text-[#F8FAFC] pb-3 border-b border-[#E5E3DC] dark:border-[#252934]">
            Carrier Logistics & Inspection Window
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Insured Freight Logistics:</span>
              </div>
              <p className="font-sans text-[11px] leading-relaxed">
                Carrier: {settlement.carrier || 'DHL Global Forwarding Enclosed Auto Logistics'}
              </p>
              <p className="font-bold">
                Tracking #: {settlement.trackingNumber || 'CARRIER-DHL-EXP-992140'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F3F2EE] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#111315] dark:text-[#F8FAFC]">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>48-Hour Inspection Safeguard</span>
              </div>
              <p className="text-[11px] text-[#646870] dark:text-[#8E96A8] leading-relaxed font-sans">
                Upon delivery scan, the buyer has 48 hours to cross-verify physical condition against the disclosed condition pins and certificate hashes. Escrow will not disburse to the consignor until this window completes or buyer signs off.
              </p>
            </div>

            {/* Consignor Net Payout Preview */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs space-y-1">
              <div className="flex justify-between text-[#646870] dark:text-[#8E96A8]">
                <span>Consignor Net Payout:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCents(settlement.sellerNetPayoutCents, true)}
                </span>
              </div>
              <span className="text-[10px] text-[#646870] dark:text-[#8E96A8] block">
                Disbursement via Stripe Automated Clearing House (ACH) / Bank Wire upon buyer acceptance.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bill of Sale & Hammer Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#FAF9F5] text-neutral-900 border-2 border-neutral-300 rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Certificate Header */}
            <div className="text-center pb-4 border-b-2 border-neutral-300 space-y-1">
              <div className="font-serif text-xs tracking-widest uppercase text-neutral-500">
                Official Document of Record
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-neutral-900">
                CERTIFICATE OF SALE & HAMMER BILL
              </h2>
              <p className="font-mono text-xs text-emerald-700 font-bold">
                AUCTIO VAULT INSTITUTIONAL PROTOCOL • SETTLEMENT {settlement.settlementNumber}
              </p>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-white border border-neutral-300 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">LOT NUMBER:</span>
                  <span className="font-bold">LOT #041</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">ITEM DESCRIPTION:</span>
                  <span className="font-bold">{settlement.lotTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">FINAL HAMMER PRICE:</span>
                  <span className="font-bold text-sm text-emerald-700">{formatCents(settlement.hammerPriceCents, true)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">WINNING BIDDER:</span>
                  <span className="font-bold">{settlement.winnerPaddleNumber} ({currentUser.name})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">CONSIGNOR:</span>
                  <span className="font-bold">{settlement.sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">CARRIER LOGISTICS:</span>
                  <span className="font-bold">{settlement.carrier || 'Insured Transport'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">ESCROW TRACE HASH:</span>
                  <span className="font-bold font-mono text-[10px]">{settlement.payoutTraceId}</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-300 text-[11px] font-sans text-neutral-600 leading-relaxed">
                This document certifies that title to the above lot transferred at hammer fall pursuant to Auctio Vault Institutional Marketplace Terms. Funds are safeguarded in Stripe Escrow pending final buyer inspection release.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-300 font-mono text-xs">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-400 bg-white hover:bg-neutral-100 font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>

              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800 cursor-pointer"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

