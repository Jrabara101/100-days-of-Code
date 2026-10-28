import React, { useState } from 'react';
import {
  MapPin,
  Star,
  ShieldCheck,
  Zap,
  Sparkles,
  Heart,
  MessageCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import ProductCard from './ProductCard';

export default function VendorBoutiquePage() {
  const {
    vendors,
    activeVendorId,
    products,
    setActiveView,
    activeReferralCode,
    addToast
  } = useMarketplace();

  const vendor = vendors.find((v) => v.id === activeVendorId) || vendors[0];
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedShopCategory, setSelectedShopCategory] = useState('All');

  const vendorProducts = products.filter((p) => p.vendor_id === vendor.id);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    addToast(
      isFollowing ? 'Unfollowed Studio' : 'Following Studio!',
      isFollowing
        ? `You will no longer receive new release alerts from ${vendor.shop_name}.`
        : `You will be notified whenever ${vendor.shop_name} fires new kiln batches!`
    );
  };

  const handleMessageMaker = () => {
    addToast(
      'Maker Message Desk',
      `Direct studio chat channel opened with ${vendor.shop_name} (${vendor.response_time_text} avg reply).`,
      'info'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200 text-left">
      {/* Back to Discovery */}
      <button
        onClick={() => setActiveView('storefront')}
        className="text-xs text-[#686763] hover:text-[#C2410C] font-medium mb-6 inline-flex items-center gap-1.5"
      >
        ← Back to All Independent Studios
      </button>

      {/* Maker Panoramic Cover Banner (Stitch.md) */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E5E4DF] shadow-sm mb-12">
        <div className="h-64 sm:h-72 w-full relative">
          <img
            src={vendor.banner_url}
            alt={vendor.shop_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Elevated Maker Identity Card */}
        <div className="p-6 sm:p-8 bg-white relative -mt-16 sm:-mt-20 mx-4 sm:mx-8 rounded-2xl border border-[#E5E4DF] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={vendor.logo_url}
              alt={vendor.shop_name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white shadow-md shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#141413]">
                  {vendor.shop_name}
                </h1>
                <span className="text-[10px] font-mono font-semibold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full">
                  Verified Maker Studio
                </span>
                {vendor.is_vacation_mode && (
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    🌙 Vacation Mode
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#686763] mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C2410C]" /> {vendor.origin_city}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#141413] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {vendor.rating_avg.toFixed(2)} ({vendor.reviews_count} reviews)
                </span>
                <span>•</span>
                <span className="text-[#059669] font-medium">
                  {vendor.badges[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleFollowToggle}
              className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                isFollowing
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white hover:bg-gray-50 text-[#141413] border-[#E5E4DF]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-rose-600' : ''}`} />
              <span>{isFollowing ? 'Following (2.4k)' : '+ Follow Studio'}</span>
            </button>

            <button
              onClick={handleMessageMaker}
              className="text-xs font-semibold bg-[#18181B] hover:bg-[#27272A] text-white px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Message Maker</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Asymmetric Boutique Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Studio Story & Policies Rail */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#141413]">Studio Provenance</h3>
            <p className="text-xs text-[#686763] leading-relaxed">
              {vendor.story_bio}
            </p>

            <div className="pt-4 border-t border-[#F3F2EE] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8E96A8]">Shipping Policy:</span>
                <span className="font-mono font-medium text-[#141413]">
                  Free over ${(vendor.free_shipping_threshold_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E96A8]">Flat Rate Delivery:</span>
                <span className="font-mono font-medium text-[#141413]">
                  ${(vendor.flat_shipping_rate_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E96A8]">Average Dispatch:</span>
                <span className="font-mono font-medium text-[#059669]">
                  {vendor.avg_ship_hours} Hours
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E5E4DF]">
            <h3 className="font-serif text-xl font-bold text-[#141413]">
              Available Works ({vendorProducts.length})
            </h3>
            <span className="text-xs text-[#686763]">
              Ready for dispatch from {vendor.origin_city}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {vendorProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
