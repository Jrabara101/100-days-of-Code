import React, { useState } from 'react';
import { Star, Plus, Check, Clock } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function ProductCard({ product }) {
  const { vendors, addToCart, setSelectedProductId, setActiveView, setActiveVendorId } = useMarketplace();
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0].id);
  const [justAdded, setJustAdded] = useState(false);

  const vendor = vendors.find((v) => v.id === product.vendor_id);
  const currentVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const handleQuickAdd = (e, variant) => {
    e.stopPropagation();
    addToCart(product, variant, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleCardClick = () => {
    setSelectedProductId(product.id);
    setActiveView('product_detail');
  };

  const handleVendorClick = (e) => {
    e.stopPropagation();
    if (vendor) {
      setActiveVendorId(vendor.id);
      setActiveView('vendor_boutique');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E5E4DF] hover:border-[#D4D3CD] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-left"
    >
      {/* 4:5 Media Container */}
      <div className="aspect-[4/5] relative overflow-hidden bg-[#F3F2EE]">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top Provenance Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.provenance_badge && (
            <span className="backdrop-blur-md bg-white/90 text-[#18181B] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-white/60">
              {product.provenance_badge}
            </span>
          )}
          {vendor?.is_vacation_mode && (
            <span className="backdrop-blur-md bg-amber-500/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Studio on Holiday
            </span>
          )}
        </div>

        {/* Predictive Low-Stock Velocity Alert Pill */}
        {currentVariant.velocity_days_left <= 3 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="backdrop-blur-md bg-rose-500/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
              ⚠️ ~{currentVariant.velocity_days_left}d stock left
            </span>
          </div>
        )}

        {/* Bottom Quick-Add Variant Selector Bar on Hover */}
        <div className="absolute inset-x-2 bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
          <div className="backdrop-blur-md bg-white/95 p-1.5 rounded-xl border border-white/80 shadow-lg flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[70%]">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariantId(v.id);
                  }}
                  className={`text-[10px] px-2 py-1 rounded-md transition-all whitespace-nowrap font-medium ${
                    selectedVariantId === v.id
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {v.attributes.size || v.attributes.style || v.title.split('/')[0].trim()}
                </button>
              ))}
            </div>

            <button
              onClick={(e) => handleQuickAdd(e, currentVariant)}
              disabled={vendor?.is_vacation_mode}
              className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 px-2.5 rounded-lg transition-all ${
                justAdded
                  ? 'bg-[#059669] text-white'
                  : 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3 h-3" /> Added
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> Quick Bag
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor Provenance Row */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <button
              onClick={handleVendorClick}
              className="flex items-center gap-1.5 text-[#686763] hover:text-[#C2410C] transition-colors group/vendor font-medium"
            >
              {vendor?.logo_url && (
                <img
                  src={vendor.logo_url}
                  alt={vendor.shop_name}
                  className="w-4 h-4 rounded-full object-cover"
                />
              )}
              <span className="underline decoration-[#E5E4DF] group-hover/vendor:decoration-[#C2410C]">
                {vendor?.shop_name || 'Independent Maker'}
              </span>
            </button>

            <div className="flex items-center gap-1 text-[11px] font-medium text-[#141413]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating_avg.toFixed(1)}</span>
              <span className="text-[#8E96A8]">({product.reviews_count})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-semibold text-[#141413] line-clamp-1 group-hover:text-[#C2410C] transition-colors">
            {product.title}
          </h3>
          <p className="text-xs text-[#686763] mt-0.5 line-clamp-1">
            {currentVariant.title}
          </p>
        </div>

        {/* Price & Free Shipping Indicator */}
        <div className="mt-3 pt-3 border-t border-[#F3F2EE] flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold text-[#141413] tabular-nums">
              ${(currentVariant.price_cents / 100).toFixed(2)}
            </span>
            {currentVariant.compare_at_price_cents && (
              <span className="text-xs text-[#8E96A8] line-through tabular-nums">
                ${(currentVariant.compare_at_price_cents / 100).toFixed(2)}
              </span>
            )}
          </div>

          {vendor && (
            <span className="text-[10px] text-[#059669] font-medium bg-[#059669]/10 px-2 py-0.5 rounded-full">
              Free over ${(vendor.free_shipping_threshold_cents / 100).toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
