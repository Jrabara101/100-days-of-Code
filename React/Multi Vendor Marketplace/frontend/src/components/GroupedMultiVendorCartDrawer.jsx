import React from 'react';
import {
  X,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ArrowRight,
  MapPin,
  Lock,
  Package
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function GroupedMultiVendorCartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cartGroupedByVendor,
    cartSummary,
    updateCartQuantity,
    removeFromCart,
    addToCart,
    setIsCheckoutOpen,
    activeReferralCode
  } = useMarketplace();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#FAF9F5] shadow-2xl border-l border-[#E5E4DF] flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-[#E5E4DF] bg-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#C2410C]" />
                <h2 className="font-serif text-lg font-medium text-[#141413]">
                  Your Unified Marketplace Bag
                </h2>
              </div>
              <p className="text-xs text-[#686763] mt-0.5">
                {cartSummary.items_count} items across{' '}
                <span className="font-semibold text-[#141413]">
                  {cartGroupedByVendor.length}{' '}
                  {cartGroupedByVendor.length === 1 ? 'Independent Studio' : 'Independent Studios'}
                </span>
              </p>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content: Vendor-Grouped Cart Containers */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cartGroupedByVendor.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E4DF] p-10 text-center my-8">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg text-[#141413]">Your bag is currently empty</h3>
                <p className="text-xs text-[#686763] mt-1 mb-5">
                  Explore curated stoneware, hand-loomed textiles, and natural apothecary from independent studios.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs font-semibold bg-[#18181B] text-white px-4 py-2 rounded-xl"
                >
                  Discover Artisans
                </button>
              </div>
            ) : (
              cartGroupedByVendor.map((group, groupIndex) => (
                <div
                  key={group.vendor_id}
                  className="bg-white rounded-2xl border border-[#E5E4DF] shadow-xs overflow-hidden transition-all text-left"
                >
                  {/* Shop Header */}
                  <div className="p-4 bg-[#F8FAFC] border-b border-[#E5E4DF] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={group.vendor.logo_url}
                        alt={group.vendor.shop_name}
                        className="w-7 h-7 rounded-full object-cover border border-[#E5E4DF]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#141413]">
                            Parcel {groupIndex + 1} of {cartGroupedByVendor.length}: {group.vendor.shop_name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#686763] flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {group.vendor.origin_city}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#059669] font-semibold bg-[#059669]/10 px-2 py-0.5 rounded-full block">
                        Est. {group.vendor.avg_ship_hours}h SLA
                      </span>
                    </div>
                  </div>

                  {/* Per-Shop Dynamic Free Shipping Unlock Bar */}
                  <div className="p-3.5 bg-gradient-to-r from-[#FAF9F5] to-white border-b border-[#F3F2EE]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[#141413] flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#059669]" />
                        {group.is_free_unlocked ? (
                          <span className="text-[#059669] font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Free Express Shipping Unlocked!
                          </span>
                        ) : (
                          <span>
                            Add{' '}
                            <strong className="text-[#059669] font-mono font-bold">
                              ${(group.cents_to_free_shipping / 100).toFixed(2)}
                            </strong>{' '}
                            more for Free Shipping
                          </span>
                        )}
                      </span>

                      <span className="font-mono text-[11px] text-[#686763]">
                        {group.is_free_unlocked
                          ? 'Saves $' + (group.vendor.flat_shipping_rate_cents / 100).toFixed(2)
                          : `${group.progress_percentage}%`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#E5E4DF] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          group.is_free_unlocked
                            ? 'bg-[#059669] shadow-[0_0_8px_rgba(5,150,105,0.4)]'
                            : 'bg-[#C2410C]'
                        }`}
                        style={{ width: `${group.progress_percentage}%` }}
                      />
                    </div>

                    {/* 1-Click Horizontal Add-on Items Mini-Carousel if threshold not reached */}
                    {!group.is_free_unlocked && group.add_ons && group.add_ons.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#F3F2EE]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#686763] font-semibold block mb-1.5">
                          Quick Add from {group.vendor.shop_name} to unlock free shipping:
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {group.add_ons.map(({ product, variant }) => (
                            <div
                              key={variant.id}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-[#E5E4DF] shrink-0 text-left"
                            >
                              <img
                                src={product.images[0]}
                                alt=""
                                className="w-8 h-8 rounded-md object-cover"
                              />
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium text-[#141413] truncate w-24">
                                  {product.title}
                                </p>
                                <span className="text-[10px] font-mono font-bold text-[#059669]">
                                  ${(variant.price_cents / 100).toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() => addToCart(product, variant, 1)}
                                className="p-1 rounded-md bg-[#18181B] hover:bg-[#C2410C] text-white transition-colors"
                                title="Add to bag"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Line Items for this Vendor */}
                  <div className="divide-y divide-[#F3F2EE] p-4 space-y-3">
                    {group.items.map((item) => (
                      <div key={item.variant_id} className="pt-3 first:pt-0 flex items-start gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E5E4DF]"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-[#141413] leading-snug">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-[#686763] block mt-0.5">
                            {item.variant_title}
                          </span>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-[#E5E4DF] rounded-lg bg-[#FAF9F5] p-0.5">
                              <button
                                onClick={() => updateCartQuantity(item.variant_id, -1)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-mono font-medium text-xs text-[#141413]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.variant_id, 1)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Subtotal & Delete */}
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-[#141413] tabular-nums">
                                ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                              </span>
                              <button
                                onClick={() => removeFromCart(item.variant_id)}
                                className="text-gray-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vendor Subtotal Footer */}
                  <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#F3F2EE] flex items-center justify-between text-xs font-medium">
                    <span className="text-[#686763]">
                      Studio Subtotal ({group.items.reduce((s, i) => s + i.quantity, 0)} items):
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#059669]">
                        Shipping: {group.shipping_cents === 0 ? 'FREE' : `$${(group.shipping_cents / 100).toFixed(2)}`}
                      </span>
                      <span className="font-mono font-bold text-[#141413]">
                        ${(group.items_subtotal_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Unified Settlement Footer (Pinned Bottom) */}
          {cartGroupedByVendor.length > 0 && (
            <div className="p-5 bg-white border-t border-[#E5E4DF] space-y-3.5 shadow-lg text-left">
              {/* Transparent Cost Breakdown */}
              <div className="space-y-1.5 text-xs text-[#686763] font-medium">
                <div className="flex items-center justify-between">
                  <span>Items Subtotal ({cartGroupedByVendor.length} Studios):</span>
                  <span className="font-mono text-[#141413] font-semibold tabular-nums">
                    ${(cartSummary.items_subtotal_cents / 100).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Combined Shipping ({cartGroupedByVendor.length} Parcels):</span>
                  <span className="font-mono text-[#141413] tabular-nums">
                    {cartSummary.shipping_total_cents === 0 ? (
                      <span className="text-[#059669] font-bold">FREE</span>
                    ) : (
                      `$${(cartSummary.shipping_total_cents / 100).toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Estimated Tax (8%):</span>
                  <span className="font-mono text-[#141413] tabular-nums">
                    ${(cartSummary.tax_total_cents / 100).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E5E4DF] flex items-center justify-between text-sm font-bold text-[#141413]">
                  <span>Total Due Today:</span>
                  <span className="font-mono text-base font-bold text-[#18181B] tabular-nums">
                    ${(cartSummary.grand_total_cents / 100).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Escrow Trust Microcopy */}
              <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E5E4DF] flex items-center gap-2 text-[11px] text-[#686763]">
                <Lock className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>
                  <strong>Delivery-Verified Escrow:</strong> Makers receive funds only after your parcels arrive safely.
                </span>
              </div>

              {/* Primary Checkout CTA */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-md transition-all transform active:scale-98"
              >
                <span>Proceed to Unified Checkout</span>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <span>${(cartSummary.grand_total_cents / 100).toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
