import React, { useState } from 'react';
import {
  X,
  Lock,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  Truck
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function MultiVendorCheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartGroupedByVendor,
    cartSummary,
    executeSplitCheckout,
    activeReferralCode
  } = useMarketplace();

  const [name, setName] = useState('Sofia Alcantara');
  const [email, setEmail] = useState('sofia.alcantara@designstudio.io');
  const [address, setAddress] = useState('742 Evergreen Terrace, Portland, OR 97201');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isCheckoutOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      executeSplitCheckout({
        name,
        email,
        address
      });
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E5E4DF] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E4DF] bg-[#FAF9F5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
              <h2 className="font-serif text-xl font-medium text-[#141413]">
                Unified Multi-Vendor Checkout
              </h2>
            </div>
            <p className="text-xs text-[#686763] mt-0.5">
              Pay once — atomically splits into {cartGroupedByVendor.length} isolated maker fulfillment queues.
            </p>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Split Order Visual Horizon */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E4DF] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#141413] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#4F46E5]" />
                Independent Studio Parcels in this Transaction:
              </span>
              <span className="font-mono text-[#059669] text-[11px] font-semibold">
                {cartGroupedByVendor.length} Sub-Orders
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {cartGroupedByVendor.map((group, idx) => (
                <div
                  key={group.vendor_id}
                  className="bg-white p-3 rounded-xl border border-[#E5E4DF] flex items-center gap-3 text-xs"
                >
                  <img
                    src={group.vendor.logo_url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-[#E5E4DF]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#141413] truncate">
                      Parcel {idx + 1}: {group.vendor.shop_name}
                    </div>
                    <div className="text-[11px] text-[#686763] flex items-center justify-between mt-0.5">
                      <span>{group.items.length} items</span>
                      <span className="font-mono font-semibold text-[#059669]">
                        {group.shipping_cents === 0 ? 'Free Shipping' : `$${(group.shipping_cents / 100).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activeReferralCode && (
              <div className="bg-purple-50 border border-purple-200 text-purple-800 text-[11px] p-2 rounded-lg flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  <strong>0% Platform Fee Active:</strong> You accessed via {activeReferralCode}'s direct link. 100% of marketplace commission is waived for this maker.
                </span>
              </div>
            )}
          </div>

          {/* Delivery Coordinates */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[#141413] uppercase tracking-wider">
              1. Delivery Coordinates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#686763] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#686763] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C2410C]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#686763] mb-1">
                  Shipping Destination
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C2410C]"
                />
              </div>
            </div>
          </div>

          {/* Stripe Connect Escrow Settlement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#141413] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#059669]" />
                2. Stripe Connect Escrow Payment
              </h3>
              <span className="text-[11px] font-mono text-[#059669]">256-bit TLS Encrypted</span>
            </div>

            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E4DF] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-700" />
                  <span className="text-xs font-medium text-[#141413]">Direct Payment Element</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                    VISA
                  </span>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                    Apple Pay
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={cardNumber}
                    readOnly
                    className="w-full text-xs bg-white border border-[#E5E4DF] rounded-xl px-3.5 py-2 font-mono text-gray-700"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value="12/28"
                    readOnly
                    className="w-full text-xs bg-white border border-[#E5E4DF] rounded-xl px-3.5 py-2 font-mono text-center text-gray-700"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#686763] leading-relaxed">
                Your payment is authorized globally and held in an automated escrow lock. Funds are released to individual makers only upon verified carrier delivery scan.
              </p>
            </div>
          </div>

          {/* Final Grand Total and Action */}
          <div className="pt-4 border-t border-[#E5E4DF] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-[#686763] block">Total Settled Today:</span>
              <span className="font-mono text-2xl font-bold text-[#141413] tabular-nums">
                ${(cartSummary.grand_total_cents / 100).toFixed(2)} USD
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Authorizing & Splitting Order...</span>
              ) : (
                <>
                  <span>Authorize & Split Transaction</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
