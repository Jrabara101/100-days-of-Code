import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  Layers,
  MapPin,
  ChevronRight,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import ProductCard from './ProductCard';

export default function EditorialMarketplaceHome() {
  const {
    products,
    vendors,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    curatedBundle,
    addCrossShopBundle,
    setActiveVendorId,
    setActiveView,
    coopCampaigns
  } = useMarketplace();

  const categories = [
    'All',
    'Home & Ceramics',
    'Apparel & Textiles',
    'Pantry & Apothecary',
    'Art & Stationery'
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCampaign = coopCampaigns[0];

  return (
    <div className="min-h-screen pb-24">
      {/* Editorial Hero Stage */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#E5E4DF] bg-gradient-to-b from-[#FAF9F5] via-[#F6F5EF] to-[#FAF9F5]">
        <div className="max-w-7xl mx-auto">
          {/* Subtle Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E4DF] shadow-xs mb-6 animate-in fade-in duration-300">
            <span className="w-2 h-2 rounded-full bg-[#C2410C]"></span>
            <span className="text-xs font-medium text-[#141413] tracking-wide">
              The Curated Multi-Vendor Marketplace
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[11px] font-mono text-[#686763]">Single Checkout Split Order System</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#141413] font-normal tracking-tight leading-[1.1]">
                Where independent craft meets <span className="italic font-normal text-[#C2410C]">unified checkout.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#686763] max-w-xl font-sans leading-relaxed">
                Shop directly from generational ceramicists, master weavers, and botanical perfumers in a single unified bag. We automatically split your order into isolated maker dispatch queues backed by delivery-verified escrow.
              </p>

              {/* Trust Metric Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#141413]">
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-[#E5E4DF]">
                  <Lock className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Delivery-Verified Escrow</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-[#E5E4DF]">
                  <Truck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Per-Maker Free Shipping Bars</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-[#E5E4DF]">
                  <Zap className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>⚡ 98.6% Dispatched in &lt; 24h</span>
                </div>
              </div>
            </div>

            {/* Hero Interactive Mini-Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#E5E4DF] bg-white p-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000&auto=format&fit=crop&q=80"
                    alt="Artisan ceramicist at work"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-semibold block mb-1">
                      Featured Studio Spotlight
                    </span>
                    <h3 className="font-serif text-xl font-medium">Atelier Koto • Kyoto, Japan</h3>
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                      400-year Shigaraki clay stoneware with zero-drip pour-over spouts.
                    </p>
                  </div>
                </div>

                {/* Split-Order Guarantee Pill Banner */}
                <div className="mt-3 bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E5E4DF] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#141413]">
                    <Layers className="w-4 h-4 text-[#4F46E5]" />
                    <span className="font-medium">1 Checkout = N Independent Parcels</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#059669] font-semibold bg-[#059669]/10 px-2 py-0.5 rounded-full">
                    No Surprise Fees
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Co-Funded Marketplace Flash Campaign Banner (Stitch.md) */}
      {activeCampaign && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="bg-gradient-to-r from-[#18181B] via-[#27272A] to-[#18181B] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-[#3F3F46] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#C2410C] flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base text-white">
                    {activeCampaign.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#C2410C] text-white px-2 py-0.5 rounded font-bold">
                    Co-Funded Promotion
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Save {activeCampaign.discount_pct}% across participating studios: {activeCampaign.marketplace_subsidy_pct}% subsidized by Atelier & Co. via reduced commission + {activeCampaign.vendor_contribution_pct}% maker contribution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
              <span className="text-[11px] font-mono text-gray-400">Ends {activeCampaign.end_date}</span>
              <button
                onClick={() => setSelectedCategory('Home & Ceramics')}
                className="text-xs font-semibold bg-white text-[#18181B] hover:bg-gray-100 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                Explore Works <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Curated Cross-Shop Lookbook: "Complete the Look" (Multi-Vendor 1-Click Bundle) */}
      {curatedBundle && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="bg-white rounded-3xl border border-[#E5E4DF] overflow-hidden shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#C2410C] font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Cross-Studio Editorial Lookbook
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#141413]">
                  {curatedBundle.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#686763] mt-1 max-w-2xl">
                  {curatedBundle.tagline}
                </p>
              </div>

              <button
                onClick={() => addCrossShopBundle(curatedBundle)}
                className="flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-medium text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all transform active:scale-95 shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Complete Lookbook (3 Studios)</span>
                <span className="font-mono font-bold ml-1 bg-black/20 px-2 py-0.5 rounded">
                  $113.90
                </span>
              </button>
            </div>

            {/* 3-Part Multi-Vendor Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {curatedBundle.items.map((item, idx) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E4DF] hover:border-[#D4D3CD] transition-colors"
                >
                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-[#C2410C] font-semibold block">
                      Studio {idx + 1}: {item.vendor_name}
                    </span>
                    <h4 className="text-xs font-semibold text-[#141413] truncate">{item.title}</h4>
                    <div className="flex items-center gap-1.5 mt-1 font-mono">
                      <span className="text-xs font-bold text-[#141413]">
                        ${(item.price_cents / 100).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#059669] font-medium bg-[#059669]/10 px-1.5 py-0.2 rounded">
                        -15% in Bundle
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Maker Boutiques Ribbon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl text-[#141413]">Featured Independent Studios</h2>
            <p className="text-xs text-[#686763] mt-0.5">
              Verified makers with guaranteed 24-48h fulfillment SLAs and delivery-backed escrow.
            </p>
          </div>
          <span className="text-xs font-mono text-[#8E96A8] hidden sm:block">
            {vendors.length} Verified Boutiques
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => {
                setActiveVendorId(vendor.id);
                setActiveView('vendor_boutique');
              }}
              className="group bg-white rounded-2xl border border-[#E5E4DF] hover:border-[#C2410C]/40 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={vendor.logo_url}
                    alt={vendor.shop_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="font-serif font-semibold text-base text-[#141413] group-hover:text-[#C2410C] transition-colors">
                      {vendor.shop_name}
                    </h3>
                    <p className="text-xs text-[#686763] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C2410C]" /> {vendor.origin_city}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#686763] line-clamp-2 leading-relaxed">
                  {vendor.story_bio}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F3F2EE] flex items-center justify-between text-[11px]">
                <span className="text-[#059669] font-medium bg-[#059669]/10 px-2 py-0.5 rounded-full">
                  {vendor.badges[0]}
                </span>
                <span className="font-mono text-[#18181B] font-semibold">
                  ★ {vendor.rating_avg.toFixed(2)} ({vendor.reviews_count})
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Faceted Discovery Stage */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        {/* Category Navigation Pills */}
        <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-4 mb-8 overflow-x-auto">
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs sm:text-sm font-medium px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'bg-[#F3F2EE] text-[#686763] hover:bg-[#E5E4DF] hover:text-[#141413]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-[#8E96A8] hidden md:block">
            Showing {filteredProducts.length} curated works
          </div>
        </div>

        {/* 4-Column Responsive Product Card Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E4DF] p-12 text-center max-w-md mx-auto my-12">
            <p className="text-base font-serif text-[#141413] mb-2">No matching studio works found</p>
            <p className="text-xs text-[#686763] mb-4">
              Try adjusting your category filter or search keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
              }}
              className="text-xs font-semibold bg-[#18181B] text-white px-4 py-2 rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
