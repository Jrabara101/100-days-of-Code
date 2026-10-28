import React from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Layers
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function MultiParcelDeliveryTracker() {
  const {
    orders,
    activeOrderForTracking,
    setActiveOrderForTracking,
    setActiveView,
    simulateCarrierDelivery,
    setSelectedSubOrderForResolution,
    setIsResolutionOpen
  } = useMarketplace();

  const currentOrder = activeOrderForTracking || orders[0];

  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="font-serif text-xl text-[#141413]">No active parcels found</h2>
        <button
          onClick={() => setActiveView('storefront')}
          className="mt-4 text-xs font-semibold bg-[#18181B] text-white px-4 py-2 rounded-xl"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const getStageIndex = (status) => {
    switch (status) {
      case 'confirmed':
        return 0; // Preparing at Studio
      case 'shipped':
        return 1; // Handed to Carrier
      case 'delivered':
        return 3; // Delivered
      default:
        return 0;
    }
  };

  const handleOpenResolution = (subOrder) => {
    setSelectedSubOrderForResolution(subOrder);
    setIsResolutionOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200 text-left">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => setActiveView('storefront')}
            className="text-xs text-[#686763] hover:text-[#C2410C] font-medium"
          >
            ← Back to Storefront
          </button>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#141413] mt-2">
            Multi-Parcel Delivery Horizon
          </h1>
          <p className="text-xs text-[#686763] mt-0.5">
            Single unified receipt split into {currentOrder.sub_orders.length} independent maker dispatches.
          </p>
        </div>

        {orders.length > 1 && (
          <select
            value={currentOrder.id}
            onChange={(e) => {
              const selected = orders.find((o) => o.id === e.target.value);
              if (selected) setActiveOrderForTracking(selected);
            }}
            className="text-xs bg-white border border-[#E5E4DF] rounded-xl px-3 py-2 outline-none font-mono"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number} (${(o.grand_total_cents / 100).toFixed(2)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Unified Parent Receipt Summary Ribbon */}
      <div className="bg-white rounded-3xl border border-[#E5E4DF] p-6 shadow-xs mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-[#F3F2EE] text-xs">
          <div>
            <span className="text-[#8E96A8] block">Parent Order Number</span>
            <span className="font-mono font-bold text-[#141413] text-sm">
              {currentOrder.order_number}
            </span>
          </div>

          <div>
            <span className="text-[#8E96A8] block">Destination</span>
            <span className="font-medium text-[#141413] truncate block">
              {currentOrder.buyer.address}
            </span>
          </div>

          <div>
            <span className="text-[#8E96A8] block">Unified Payment Status</span>
            <span className="inline-flex items-center gap-1 text-[#059669] font-semibold bg-[#059669]/10 px-2 py-0.5 rounded-full mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Paid via Stripe Escrow
            </span>
          </div>

          <div className="sm:text-right">
            <span className="text-[#8E96A8] block">Total Settled</span>
            <span className="font-mono font-bold text-base text-[#18181B]">
              ${(currentOrder.grand_total_cents / 100).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Escrow Guarantee Statement */}
        <div className="pt-3 flex items-center justify-between text-[11px] text-[#686763]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>
              <strong>Delivery-Verified Escrow Guardrail:</strong> Individual studio payout transfers remain in escrow lock until carrier webhooks verify package delivery.
            </span>
          </div>
          <span className="font-mono text-emerald-600 font-semibold hidden md:inline">
            100% Protected
          </span>
        </div>
      </div>

      {/* Distinct Sub-Order Parcel Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#141413] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#4F46E5]" />
            Independent Studio Parcels ({currentOrder.sub_orders.length})
          </h2>
          <span className="text-xs text-[#686763]">
            Track dispatches independently without delay
          </span>
        </div>

        {currentOrder.sub_orders.map((sub, index) => {
          const stage = getStageIndex(sub.fulfillment_status);

          return (
            <div
              key={sub.id}
              className="bg-white rounded-3xl border border-[#E5E4DF] shadow-xs overflow-hidden transition-all"
            >
              {/* Parcel Header */}
              <div className="p-5 bg-[#FAF9F5] border-b border-[#E5E4DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#C2410C] bg-[#C2410C]/10 px-2 py-0.5 rounded">
                      Parcel {index + 1} of {currentOrder.sub_orders.length}
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#141413]">
                      {sub.shop_name}
                    </h3>
                  </div>
                  <div className="text-[11px] text-[#686763] flex items-center gap-3 mt-1">
                    <span>Sub-Order: {sub.sub_order_number}</span>
                    <span>•</span>
                    <span>Origin: {sub.shop_origin}</span>
                  </div>
                </div>

                {/* Live Escrow Lifecycle Badge */}
                <div>
                  {sub.fulfillment_status === 'delivered' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] bg-[#059669]/10 px-3 py-1 rounded-full border border-[#059669]/20">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-escrow-pulse" />
                      Delivered • Escrow Released to Maker
                    </span>
                  ) : sub.fulfillment_status === 'shipped' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#2563EB]/20">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                      In Transit • Funds Locked in Escrow
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Studio Preparing Dispatch • SLA Active
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-Parcel Progress Horizon Stepper */}
              <div className="p-6 border-b border-[#F3F2EE]">
                <div className="grid grid-cols-4 gap-2 relative">
                  {/* Connecting Line */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E5E4DF] -z-0">
                    <div
                      className="h-full bg-[#059669] transition-all duration-500"
                      style={{
                        width: stage === 0 ? '10%' : stage === 1 ? '50%' : '100%'
                      }}
                    />
                  </div>

                  {/* Step 1 */}
                  <div className="text-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                        stage >= 0 ? 'bg-[#059669] text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      ✓
                    </div>
                    <span className="text-xs font-medium text-[#141413] block mt-2">
                      Studio Confirmed
                    </span>
                    <span className="text-[10px] text-[#8E96A8] block">Crafting & Packing</span>
                  </div>

                  {/* Step 2 */}
                  <div className="text-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                        stage >= 1 ? 'bg-[#059669] text-white' : 'bg-[#FAF9F5] border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      {stage >= 1 ? '✓' : '2'}
                    </div>
                    <span className="text-xs font-medium text-[#141413] block mt-2">
                      Carrier Dispatched
                    </span>
                    <span className="text-[10px] text-[#8E96A8] block">
                      {sub.carrier_name || 'Awaiting Hand-off'}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="text-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                        stage >= 2 ? 'bg-[#059669] text-white' : 'bg-[#FAF9F5] border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      {stage >= 2 ? '✓' : '3'}
                    </div>
                    <span className="text-xs font-medium text-[#141413] block mt-2">
                      Out for Delivery
                    </span>
                    <span className="text-[10px] text-[#8E96A8] block">Final Mile Scan</span>
                  </div>

                  {/* Step 4 */}
                  <div className="text-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                        stage >= 3 ? 'bg-[#059669] text-white shadow-md' : 'bg-[#FAF9F5] border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      {stage >= 3 ? '✓' : '4'}
                    </div>
                    <span className="text-xs font-medium text-[#141413] block mt-2">
                      Verified Delivered
                    </span>
                    <span className="text-[10px] text-[#8E96A8] block">Escrow Settled</span>
                  </div>
                </div>

                {/* Carrier Tracking Code Bar */}
                {sub.tracking_number && (
                  <div className="mt-5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E4DF] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#2563EB]" />
                      <span className="font-medium text-[#141413]">
                        {sub.carrier_name} Tracking:
                      </span>
                      <span className="font-mono font-semibold text-[#18181B]">
                        {sub.tracking_number}
                      </span>
                    </div>

                    <a
                      href="#tracking"
                      onClick={(e) => e.preventDefault()}
                      className="text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
                    >
                      Live Carrier Hub <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Items in this Sub-Order */}
              <div className="p-6">
                <div className="space-y-3">
                  {sub.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-[#E5E4DF]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-[#141413] truncate">
                          {item.title}
                        </h4>
                        <span className="text-[11px] text-[#686763]">{item.variant}</span>
                      </div>
                      <div className="font-mono text-xs text-right">
                        <span className="text-[#8E96A8]">{item.quantity}x </span>
                        <span className="font-bold text-[#141413]">
                          ${(item.unit_price_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Simulator Bar: Simulate Webhook & Open Dispute */}
                <div className="mt-6 pt-4 border-t border-[#F3F2EE] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Carrier Delivery Webhook Simulation Trigger */}
                    {sub.fulfillment_status !== 'delivered' && (
                      <button
                        onClick={() => simulateCarrierDelivery(sub.id)}
                        className="text-xs font-medium bg-[#059669] hover:bg-[#047857] text-white px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simulate Delivery Scan (Unlocks Escrow)</span>
                      </button>
                    )}

                    {sub.fulfillment_status === 'delivered' && (
                      <span className="text-xs font-mono text-[#059669] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Carrier Delivery Confirmed
                      </span>
                    )}
                  </div>

                  {/* Zero-Hostility Dispute Resolution Trigger */}
                  <button
                    onClick={() => handleOpenResolution(sub)}
                    className="text-xs font-medium text-[#686763] hover:text-[#DC2626] border border-[#E5E4DF] hover:border-[#FCA5A5] px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50/50 transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Resolution Desk (Partial Refund / Return)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
