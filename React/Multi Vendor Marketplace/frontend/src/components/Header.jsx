import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Sparkles,
  Store,
  Layers,
  ShieldCheck,
  ChevronDown,
  Package,
  Moon,
  ExternalLink,
  MapPin,
  X
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function Header() {
  const {
    cart,
    cartGroupedByVendor,
    cartSummary,
    setIsCartOpen,
    activeView,
    setActiveView,
    vendors,
    activeVendorId,
    setActiveVendorId,
    activeReferralCode,
    searchQuery,
    setSearchQuery,
    products,
    setSelectedProductId
  } = useMarketplace();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const searchRef = useRef(null);
  const roleDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeVendor = vendors.find((v) => v.id === activeVendorId) || vendors[0];

  // Search Results
  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const filteredVendors = searchQuery.trim()
    ? vendors.filter(
        (v) =>
          v.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.origin_city.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 2)
    : [];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF9F5]/92 border-b border-[#E5E4DF] transition-colors">
      {/* Top Announcement Bar */}
      <div className="bg-[#18181B] text-[#FAF9F5] text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-medium tracking-wide">
              Protected by Delivery-Verified Escrow: Funds hold securely until carrier delivery is verified.
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] text-[#A1A1AA]">
            {activeReferralCode && (
              <span className="text-[#C4B5FD] font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#A78BFA]" />
                Direct Link Active: 0% Platform Fee for {activeReferralCode}
              </span>
            )}
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveView('order_tracker')}>
              Live Parcel Horizon
            </span>
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveView('vendor_cockpit')}>
              Vendor Portal
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('storefront')}
            className="text-left group flex items-center gap-2.5 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#18181B] text-[#FAF9F5] flex items-center justify-center font-serif text-lg font-bold shadow-sm group-hover:bg-[#C2410C] transition-colors">
              A
            </div>
            <div>
              <span className="font-serif text-2xl font-semibold tracking-tight text-[#141413] block leading-none">
                Atelier & Co.
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#686763] font-medium block mt-0.5">
                Multi-Studio Collective
              </span>
            </div>
          </button>
        </div>

        {/* Federated Instant Search Bar */}
        <div ref={searchRef} className="hidden md:block flex-1 max-w-lg relative">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E96A8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search 1,400+ independent studios, ceramics, wool..."
              className="w-full bg-[#F3F2EE] hover:bg-[#EAE8E2] focus:bg-white text-sm rounded-full pl-10 pr-12 py-2 border border-transparent focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all outline-none font-sans placeholder-[#8E96A8]"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-white/70 px-1.5 py-0.5 rounded border border-gray-200 pointer-events-none">
                ⌘K
              </span>
            )}
          </div>

          {/* Search Dropdown Matrix */}
          {isSearchFocused && (searchQuery.trim().length > 0) && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-[#E5E4DF] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {filteredProducts.length > 0 && (
                <div className="p-3 border-b border-[#F3F2EE]">
                  <div className="text-[11px] font-semibold text-[#8E96A8] uppercase tracking-wider mb-2 px-2">
                    Matching Products
                  </div>
                  <div className="space-y-1">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setActiveView('product_detail');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                      >
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#141413] truncate">{p.title}</p>
                          <p className="text-[11px] text-[#686763]">{p.category}</p>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#18181B]">
                          ${(p.variants[0].price_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredVendors.length > 0 && (
                <div className="p-3 bg-[#FAF9F5]">
                  <div className="text-[11px] font-semibold text-[#8E96A8] uppercase tracking-wider mb-2 px-2">
                    Verified Boutiques
                  </div>
                  <div className="space-y-1">
                    {filteredVendors.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setActiveVendorId(v.id);
                          setActiveView('vendor_boutique');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-[#E5E4DF]"
                      >
                        <img src={v.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#141413]">{v.shop_name}</p>
                          <p className="text-[11px] text-[#686763] flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {v.origin_city}
                          </p>
                        </div>
                        <span className="text-[11px] font-medium text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full">
                          {v.badges[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 && filteredVendors.length === 0 && (
                <div className="p-6 text-center text-xs text-[#686763]">
                  No matching studios or works found for "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Navigation & Interactive Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher Dropdown */}
          <div ref={roleDropdownRef} className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E4DF] bg-white hover:bg-[#F3F2EE] text-xs font-medium text-[#141413] transition-colors"
            >
              {activeView === 'storefront' && (
                <>
                  <Store className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Storefront</span>
                </>
              )}
              {activeView === 'product_detail' && (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Product Stage</span>
                </>
              )}
              {activeView === 'vendor_boutique' && (
                <>
                  <Store className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Boutique: {activeVendor.shop_name}</span>
                </>
              )}
              {activeView === 'vendor_cockpit' && (
                <>
                  <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Studio Cockpit</span>
                </>
              )}
              {activeView === 'operator_hq' && (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Operator HQ</span>
                </>
              )}
              {activeView === 'order_tracker' && (
                <>
                  <Package className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Parcel Horizon</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#8E96A8]" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E5E4DF] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8E96A8] uppercase tracking-wider">
                  Switch Experience Persona
                </div>

                <button
                  onClick={() => {
                    setActiveView('storefront');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF9F5] ${
                    activeView === 'storefront' ? 'text-[#C2410C] font-semibold bg-[#FAF9F5]' : 'text-[#141413]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-[#C2410C]" />
                    <div>
                      <div>Shopper Storefront</div>
                      <div className="text-[10px] text-[#686763]">Unified multi-vendor cart & discovery</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveView('order_tracker');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF9F5] ${
                    activeView === 'order_tracker' ? 'text-[#2563EB] font-semibold bg-[#FAF9F5]' : 'text-[#141413]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-[#2563EB]" />
                    <div>
                      <div>Multi-Parcel Tracking</div>
                      <div className="text-[10px] text-[#686763]">Post-purchase split fulfillment matrix</div>
                    </div>
                  </div>
                </button>

                <div className="my-1 border-t border-[#F3F2EE]"></div>

                <div className="px-3 py-1 text-[10px] font-semibold text-[#8E96A8] uppercase tracking-wider">
                  Maker Portals
                </div>

                {vendors.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setActiveVendorId(v.id);
                      setActiveView('vendor_cockpit');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F8FAFC] ${
                      activeView === 'vendor_cockpit' && activeVendorId === v.id
                        ? 'text-[#4F46E5] font-semibold bg-[#F8FAFC]'
                        : 'text-[#141413]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={v.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <span>{v.shop_name} Cockpit</span>
                    </div>
                    {v.is_vacation_mode && (
                      <span className="text-[9px] font-mono text-amber-600 bg-amber-50 px-1 rounded">
                        Vacation
                      </span>
                    )}
                  </button>
                ))}

                <div className="my-1 border-t border-[#F3F2EE]"></div>

                <button
                  onClick={() => {
                    setActiveView('operator_hq');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-[#FAF9F5] ${
                    activeView === 'operator_hq' ? 'text-[#059669] font-semibold bg-[#FAF9F5]' : 'text-[#141413]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <div>
                    <div>Operator HQ & Governance</div>
                    <div className="text-[10px] text-[#686763]">Dynamic commission & co-op flash deals</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Unified Multi-Vendor Cart Trigger Button */}
          <button
            id="open-unified-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white shadow-sm transition-all transform active:scale-95 group"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#C2410C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#18181B]">
                  {cartSummary.items_count}
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium">
              <span>Bag</span>
              {cartGroupedByVendor.length > 0 && (
                <span className="text-[#A1A1AA] text-[11px]">
                  ({cartGroupedByVendor.length} {cartGroupedByVendor.length === 1 ? 'Studio' : 'Studios'})
                </span>
              )}
              <span className="text-[#A1A1AA]">•</span>
              <span className="font-mono font-semibold tabular-nums text-emerald-400">
                ${(cartSummary.grand_total_cents / 100).toFixed(2)}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
