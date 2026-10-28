import React from 'react';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import Header from './components/Header';
import EditorialMarketplaceHome from './components/EditorialMarketplaceHome';
import ProductDetailModal from './components/ProductDetailModal';
import GroupedMultiVendorCartDrawer from './components/GroupedMultiVendorCartDrawer';
import MultiVendorCheckoutModal from './components/MultiVendorCheckoutModal';
import MultiParcelDeliveryTracker from './components/MultiParcelDeliveryTracker';
import ResolutionDeskModal from './components/ResolutionDeskModal';
import VendorCommandCockpit from './components/VendorCommandCockpit';
import MarketplaceOperatorCockpit from './components/MarketplaceOperatorCockpit';
import VendorBoutiquePage from './components/VendorBoutiquePage';
import { ShieldCheck, Heart, Sparkles, Lock, ArrowUpRight } from 'lucide-react';

function AppContent() {
  const { activeView, setActiveView, toasts } = useMarketplace();

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#141413] flex flex-col justify-between selection:bg-[#C2410C]/20 selection:text-[#C2410C]">
      {/* Sticky Header */}
      <Header />

      {/* Main Dynamic View Routing */}
      <main className="flex-1">
        {activeView === 'storefront' && <EditorialMarketplaceHome />}
        {activeView === 'product_detail' && <ProductDetailModal />}
        {activeView === 'vendor_boutique' && <VendorBoutiquePage />}
        {activeView === 'vendor_cockpit' && <VendorCommandCockpit />}
        {activeView === 'operator_hq' && <MarketplaceOperatorCockpit />}
        {activeView === 'order_tracker' && <MultiParcelDeliveryTracker />}
      </main>

      {/* Slide-Over Drawers & Interactive Modals */}
      <GroupedMultiVendorCartDrawer />
      <MultiVendorCheckoutModal />
      <ResolutionDeskModal />

      {/* Toast Notifications System */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border text-xs flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'alert'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toast.type === 'info'
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-white border-[#E5E4DF] text-[#141413]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                toast.type === 'alert'
                  ? 'bg-rose-500'
                  : toast.type === 'info'
                  ? 'bg-purple-600'
                  : 'bg-[#059669]'
              }`}
            />
            <div>
              <div className="font-bold text-xs">{toast.title}</div>
              <div className="text-[11px] text-[#686763] mt-0.5 leading-relaxed">
                {toast.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E5E4DF] bg-white py-12 px-4 sm:px-6 lg:px-8 mt-20 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white flex items-center justify-center font-serif font-bold text-sm">
                A
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-[#141413]">
                Atelier & Co.
              </span>
            </div>
            <p className="text-xs text-[#686763] leading-relaxed">
              Curated multi-vendor marketplace connecting independent craft studios with conscious collectors. Single checkout, transparent split fulfillment, and delivery-verified escrow.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#141413] uppercase tracking-wider mb-3">
              Marketplace Architecture
            </h4>
            <ul className="space-y-2 text-xs text-[#686763]">
              <li>
                <button onClick={() => setActiveView('storefront')} className="hover:text-[#C2410C]">
                  Unified Multi-Vendor Cart
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('order_tracker')} className="hover:text-[#C2410C]">
                  Multi-Parcel Delivery Matrix
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('operator_hq')} className="hover:text-[#C2410C]">
                  Dynamic Commission Rules (Basis Points)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('vendor_cockpit')} className="hover:text-[#C2410C]">
                  Net-Margin Studio Calculator
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#141413] uppercase tracking-wider mb-3">
              Makers & Studios
            </h4>
            <ul className="space-y-2 text-xs text-[#686763]">
              <li>
                <button onClick={() => setActiveView('vendor_cockpit')} className="hover:text-[#4F46E5]">
                  Vendor Command Cockpit
                </button>
              </li>
              <li>
                <span className="text-purple-700 font-mono text-[11px] font-semibold">
                  0% Commission Direct Links
                </span>
              </li>
              <li>
                <span className="text-[#059669] font-mono text-[11px]">
                  Stripe Connect Escrow Payouts
                </span>
              </li>
              <li>
                <span>Studio Vacation Mode & Waitlists</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#141413] uppercase tracking-wider mb-3">
              Trust & Guardrails
            </h4>
            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E5E4DF] space-y-2 text-[11px] text-[#686763]">
              <div className="flex items-center gap-1.5 font-semibold text-[#141413]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" /> Delivery-Verified Escrow
              </div>
              <p>
                Funds are released from escrow to individual makers only after carrier webhooks confirm package delivery.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#F3F2EE] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8E96A8]">
          <div>
            © 2026 Atelier & Co. Engineered with React 19, Vite, Tailwind CSS & Laravel API.
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>STRICT INTEGER CENTS</span>
            <span>•</span>
            <span>STRIPE CONNECT LEDGER</span>
            <span>•</span>
            <span>DOUBLE ENTRY ESCROW</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MarketplaceProvider>
      <AppContent />
    </MarketplaceProvider>
  );
}
