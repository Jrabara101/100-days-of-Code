import React, { useState } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  Clock,
  MapPin,
  Check,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Camera,
  Heart
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function ProductDetailModal() {
  const {
    products,
    selectedProductId,
    vendors,
    addToCart,
    setActiveView,
    setActiveVendorId,
    setIsCartOpen,
    cartGroupedByVendor
  } = useMarketplace();

  const product = products.find((p) => p.id === selectedProductId) || products[0];
  const vendor = vendors.find((v) => v.id === product.vendor_id);

  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0].id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const currentVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  // Calculate current cart status for this specific vendor
  const vendorCartGroup = cartGroupedByVendor.find((g) => g.vendor_id === product.vendor_id);
  const currentSubtotal = vendorCartGroup ? vendorCartGroup.items_subtotal_cents : 0;
  const threshold = vendor?.free_shipping_threshold_cents || 7500;
  const remainingForFreeShipping = Math.max(0, threshold - currentSubtotal);

  const handleAddToCart = () => {
    addToCart(product, currentVariant, quantity);
    setIsCartOpen(true);
  };

  const handleOpenBoutique = () => {
    if (vendor) {
      setActiveVendorId(vendor.id);
      setActiveView('vendor_boutique');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Back to Discovery Navigation */}
      <div className="flex items-center justify-between mb-6 text-xs text-[#686763]">
        <button
          onClick={() => setActiveView('storefront')}
          className="flex items-center gap-1.5 hover:text-[#C2410C] transition-colors font-medium"
        >
          ← Back to Marketplace Discovery
        </button>

        <div className="flex items-center gap-2">
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-[#141413] font-medium">{product.title}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E4DF] shadow-sm overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#F3F2EE] relative border border-[#E5E4DF]">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {product.provenance_badge && (
                <span className="absolute top-4 left-4 backdrop-blur-md bg-white/95 text-[#18181B] text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-white/60">
                  {product.provenance_badge}
                </span>
              )}

              {/* Wishlist Button */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-rose-500 shadow-sm transition-colors"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-[#C2410C] shadow-sm scale-95'
                        : 'border-[#E5E4DF] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Variant Matrix, SLA Card & Action Cluster */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Studio Provenance Ribbon */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F3F2EE]">
                <button
                  onClick={handleOpenBoutique}
                  className="flex items-center gap-2.5 text-left group"
                >
                  <img
                    src={vendor?.logo_url}
                    alt={vendor?.shop_name}
                    className="w-9 h-9 rounded-full object-cover border border-[#E5E4DF]"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-[#141413] group-hover:text-[#C2410C] transition-colors flex items-center gap-1">
                      {vendor?.shop_name} <ChevronRight className="w-3 h-3 text-gray-400" />
                    </h4>
                    <span className="text-[11px] text-[#686763] flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {vendor?.origin_city}
                    </span>
                  </div>
                </button>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#141413]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating_avg.toFixed(2)}</span>
                  </div>
                  <span className="text-[10px] text-[#8E96A8]">
                    {product.reviews_count} verified reviews
                  </span>
                </div>
              </div>

              {/* Title & Price Waterfall */}
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#141413] leading-snug">
                  {product.title}
                </h1>

                <div className="mt-3 flex items-baseline gap-3 font-mono">
                  <span className="text-2xl font-bold text-[#141413] tabular-nums">
                    ${(currentVariant.price_cents / 100).toFixed(2)}
                  </span>
                  {currentVariant.compare_at_price_cents && (
                    <span className="text-sm text-[#8E96A8] line-through tabular-nums">
                      ${(currentVariant.compare_at_price_cents / 100).toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs text-[#059669] font-medium bg-[#059669]/10 px-2 py-0.5 rounded-full font-sans">
                    Includes Escrow Protection
                  </span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-[#686763] leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Per-Shop Free Shipping Nudge Progress Bar */}
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E4DF]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#141413] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#059669]" />
                    {vendor?.shop_name} Shipping Threshold
                  </span>
                  <span className="font-mono text-[11px] text-[#059669] font-bold">
                    {remainingForFreeShipping === 0
                      ? 'FREE SHIPPING UNLOCKED ✨'
                      : `$${(remainingForFreeShipping / 100).toFixed(2)} away`}
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-[#E5E4DF] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#059669] h-full rounded-full transition-all duration-500 relative"
                    style={{
                      width: `${Math.min(100, Math.round((currentSubtotal / threshold) * 100))}%`
                    }}
                  ></div>
                </div>

                <p className="text-[11px] text-[#686763] mt-2">
                  Orders from {vendor?.shop_name} over ${(threshold / 100).toFixed(2)} ship free (saves ${(vendor?.flat_shipping_rate_cents / 100 || 8).toFixed(2)}).
                </p>
              </div>

              {/* Interactive Variant Matrix Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-[#141413]">
                    Select Specification & Style:
                  </label>
                  <span className="font-mono text-[11px] text-[#8E96A8]">
                    SKU: {currentVariant.sku}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedVariantId === v.id
                          ? 'border-[#C2410C] bg-[#C2410C]/5 ring-1 ring-[#C2410C]'
                          : 'border-[#E5E4DF] hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            selectedVariantId === v.id ? 'border-[#C2410C]' : 'border-gray-400'
                          }`}
                        >
                          {selectedVariantId === v.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-[#141413]">{v.title}</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        {v.velocity_days_left <= 3 && (
                          <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-sans font-medium">
                            Only {v.stock_quantity} left
                          </span>
                        )}
                        <span className="font-bold text-[#141413]">
                          ${(v.price_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Vendor Reliability & SLA Badges Card */}
              {vendor && (
                <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-[#E5E4DF] space-y-2 text-xs">
                  <div className="font-semibold text-[#141413] flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    Studio Operational Telemetry & SLA
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-[#E5E4DF]">
                      <div className="font-mono font-bold text-[#141413]">{vendor.avg_ship_hours}h</div>
                      <div className="text-[10px] text-[#686763] mt-0.5">Avg Dispatch</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#E5E4DF]">
                      <div className="font-mono font-bold text-[#059669]">{vendor.on_time_ship_pct}%</div>
                      <div className="text-[10px] text-[#686763] mt-0.5">On-Time SLA</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#E5E4DF]">
                      <div className="font-mono font-bold text-[#141413]">{vendor.response_time_text}</div>
                      <div className="text-[10px] text-[#686763] mt-0.5">Maker Reply</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Cluster */}
            <div className="mt-8 pt-6 border-t border-[#F3F2EE] space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-[#E5E4DF] rounded-xl bg-white p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono font-semibold text-xs text-[#141413]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={vendor?.is_vacation_mode}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all transform active:scale-98 ${
                    vendor?.is_vacation_mode
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#18181B] hover:bg-[#27272A] text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Unified Bag</span>
                  <span className="font-mono font-bold ml-1 bg-white/20 px-2 py-0.5 rounded">
                    ${((currentVariant.price_cents * quantity) / 100).toFixed(2)}
                  </span>
                </button>
              </div>

              <p className="text-center text-[11px] text-[#686763] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                Protected by Delivery-Verified Escrow • Instant Partial Resolution Desk
              </p>
            </div>
          </div>
        </div>

        {/* Dimensional Review Matrix & Verified Customer Photos */}
        {product.dimensional_reviews && (
          <div className="mt-14 pt-10 border-t border-[#E5E4DF]">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C2410C] font-semibold mb-1">
                <Star className="w-3.5 h-3.5 fill-[#C2410C]" /> Dimensional Review Matrix
              </div>
              <h3 className="font-serif text-2xl text-[#141413]">
                Evaluated by Verified Buyers
              </h3>
              <p className="text-xs text-[#686763] mt-1">
                Beyond aggregate stars, verified patrons grade specific artisanal criteria.
              </p>

              {/* 3 Metrics Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E4DF]">
                  <span className="text-xs font-semibold text-[#141413] block mb-1">Sizing & Scale</span>
                  <div className="text-lg font-serif font-bold text-[#C2410C]">
                    {product.dimensional_reviews.sizing}
                  </div>
                  <div className="text-[11px] text-[#686763] mt-0.5">
                    96% report dimensions match exact specifications.
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E4DF]">
                  <span className="text-xs font-semibold text-[#141413] block mb-1">Artisan Craftsmanship</span>
                  <div className="text-lg font-serif font-bold text-[#059669]">
                    {product.dimensional_reviews.craftsmanship.toFixed(1)} / 5.0
                  </div>
                  <div className="text-[11px] text-[#686763] mt-0.5">
                    Glaze uniformity and balanced ergonomics.
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E4DF]">
                  <span className="text-xs font-semibold text-[#141413] block mb-1">Packaging & Protection</span>
                  <div className="text-lg font-serif font-bold text-[#2563EB]">
                    {product.dimensional_reviews.packaging_care.toFixed(1)} / 5.0
                  </div>
                  <div className="text-[11px] text-[#686763] mt-0.5">
                    Double-walled honeycomb & plastic-free paper.
                  </div>
                </div>
              </div>

              {/* Sample Verified Customer Photo Review */}
              {product.sample_reviews && product.sample_reviews.length > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-white border border-[#E5E4DF] flex items-start gap-4">
                  <img
                    src={product.sample_reviews[0].photo}
                    alt="Customer photo"
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#E5E4DF]"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#141413]">
                        {product.sample_reviews[0].author}
                      </span>
                      <span className="text-[10px] text-[#059669] font-medium bg-[#059669]/10 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Verified Purchase
                      </span>
                      <span className="text-[10px] text-[#8E96A8]">
                        {product.sample_reviews[0].date}
                      </span>
                    </div>
                    <p className="text-xs text-[#686763] leading-relaxed">
                      "{product.sample_reviews[0].comment}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
