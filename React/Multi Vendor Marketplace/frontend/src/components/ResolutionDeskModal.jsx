import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  Package,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function ResolutionDeskModal() {
  const {
    isResolutionOpen,
    setIsResolutionOpen,
    selectedSubOrderForResolution,
    resolveTicket
  } = useMarketplace();

  const [issueType, setIssueType] = useState('minor_imperfection');
  const [resolutionChoice, setResolutionChoice] = useState('partial_refund');
  const [customReason, setCustomReason] = useState('');

  if (!isResolutionOpen || !selectedSubOrderForResolution) return null;

  const sub = selectedSubOrderForResolution;
  const suggestedPartialRefundCents = Math.min(2500, Math.round(sub.gross_items_cents * 0.3));

  const handleConfirmResolution = () => {
    resolveTicket(
      sub.id,
      resolutionChoice,
      suggestedPartialRefundCents,
      customReason || issueType
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E5E4DF] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E4DF] bg-[#FAF9F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#141413]">
                Zero-Hostility Resolution Desk
              </h2>
              <p className="text-xs text-[#686763]">
                Sub-Order: {sub.sub_order_number} • Studio: {sub.shop_name}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsResolutionOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Issue Category */}
          <div>
            <label className="block text-xs font-semibold text-[#141413] uppercase tracking-wider mb-2">
              What was the issue with this parcel?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'minor_imperfection', label: 'Minor Glaze / Texture Imperfection' },
                { id: 'delayed_transit', label: 'Delayed Dispatch' },
                { id: 'wrong_variant', label: 'Color / Size Variance' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIssueType(opt.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    issueType === opt.id
                      ? 'border-[#C2410C] bg-[#C2410C]/5 font-semibold text-[#141413]'
                      : 'border-[#E5E4DF] text-[#686763] hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Structured Resolution Options */}
          <div>
            <label className="block text-xs font-semibold text-[#141413] uppercase tracking-wider mb-2">
              Choose Preferred Studio Resolution:
            </label>

            <div className="space-y-3">
              {/* Option 1: Instant Keep-the-Item Partial Refund */}
              <div
                onClick={() => setResolutionChoice('partial_refund')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  resolutionChoice === 'partial_refund'
                    ? 'border-[#059669] bg-[#059669]/5 ring-1 ring-[#059669]'
                    : 'border-[#E5E4DF] hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#059669] text-white flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141413]">
                        Instant Keep-the-Item Partial Refund (Recommended)
                      </h4>
                      <p className="text-[11px] text-[#686763] mt-0.5">
                        Refund ${(suggestedPartialRefundCents / 100).toFixed(2)} directly back to your card right now. Keep the piece without returning.
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded">
                    +${(suggestedPartialRefundCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Option 2: 1-Click Prepaid Return Label */}
              <div
                onClick={() => setResolutionChoice('prepaid_return')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  resolutionChoice === 'prepaid_return'
                    ? 'border-[#C2410C] bg-[#C2410C]/5 ring-1 ring-[#C2410C]'
                    : 'border-[#E5E4DF] hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#18181B] text-white flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141413]">
                        Generate 1-Click Prepaid Return Label
                      </h4>
                      <p className="text-[11px] text-[#686763] mt-0.5">
                        Receive a prepaid QR shipping code. Full refund of ${(sub.gross_items_cents / 100).toFixed(2)} unlocks upon postal drop-off scan.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">100% Free Return</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#686763] mb-1">
              Note to Studio (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., The piece has a tiny glaze flaw on the underside..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full text-xs bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C2410C]"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#E5E4DF] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsResolutionOpen(false)}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 px-4 py-2.5"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmResolution}
              className="text-xs font-semibold bg-[#18181B] hover:bg-[#27272A] text-white px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <span>Confirm & Process Resolution</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
