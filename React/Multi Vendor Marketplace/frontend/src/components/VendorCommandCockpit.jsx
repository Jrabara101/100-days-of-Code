import React, { useState } from 'react';
import {
  Layers,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sliders,
  FileText,
  Printer,
  ChevronRight,
  Send,
  X
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function VendorCommandCockpit() {
  const {
    vendors,
    activeVendorId,
    setActiveVendorId,
    orders,
    ledgerEntries,
    markSubOrderShipped,
    withdrawVendorFunds,
    toggleVacationMode,
    calculatePricingWaterfall,
    addToast,
    products,
    setProducts,
    setActiveView
  } = useMarketplace();

  const currentVendor = vendors.find((v) => v.id === activeVendorId) || vendors[0];
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'pricing' | 'inventory' | 'ledger' | 'referral'
  const [selectedSubOrderForPacking, setSelectedSubOrderForPacking] = useState(null);
  const [carrierInput, setCarrierInput] = useState('USPS Priority Mail');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // Interactive Net-to-Pocket Pricing Calculator State
  const [calculatorRetailPrice, setCalculatorRetailPrice] = useState(85);
  const [isCalculatorDirectReferral, setIsCalculatorDirectReferral] = useState(false);

  // Filter Sub-Orders belonging to this vendor
  const vendorSubOrders = orders.flatMap((ord) =>
    ord.sub_orders
      .filter((sub) => sub.vendor_id === currentVendor.id)
      .map((sub) => ({ ...sub, parentOrderNumber: ord.order_number, buyer: ord.buyer }))
  );

  // Filter Ledger Entries for this vendor
  const vendorLedgers = ledgerEntries.filter((l) => l.vendor_id === currentVendor.id);

  // Filter Products for this vendor
  const vendorProducts = products.filter((p) => p.vendor_id === currentVendor.id);

  const waterfall = calculatePricingWaterfall(
    calculatorRetailPrice * 100,
    currentVendor.commission_rate_bps,
    isCalculatorDirectReferral
  );

  const handleCopyReferral = () => {
    const url = `${window.location.origin}?ref=${currentVendor.slug}`;
    navigator.clipboard.writeText(url);
    addToast(
      '0% Referral Link Copied!',
      `Share ${url} on your Instagram/Newsletter for 0% commission!`,
      'success'
    );
  };

  const handleDispatchOrder = (e) => {
    e.preventDefault();
    if (!selectedSubOrderForPacking) return;

    markSubOrderShipped(
      selectedSubOrderForPacking.id,
      carrierInput,
      trackingNumberInput || null
    );

    setSelectedSubOrderForPacking(null);
    setTrackingNumberInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200 text-left">
      {/* Studio Header & Vacation Switcher Bar */}
      <div className="bg-white rounded-3xl border border-[#E5E4DF] p-6 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentVendor.logo_url}
            alt={currentVendor.shop_name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl font-bold text-[#141413]">
                {currentVendor.shop_name}
              </h1>
              <span className="text-[10px] font-mono text-[#4F46E5] font-semibold bg-[#4F46E5]/10 px-2.5 py-0.5 rounded-full border border-[#4F46E5]/20">
                {currentVendor.tier}
              </span>
            </div>
            <p className="text-xs text-[#686763] mt-0.5">
              Maker Origin: {currentVendor.origin_city} • Connected to Stripe Account ({currentVendor.stripe_connect_account_id})
            </p>
          </div>
        </div>

        {/* Vacation Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleVacationMode(currentVendor.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs border ${
              currentVendor.is_vacation_mode
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-[#FAF9F5] text-[#141413] border-[#E5E4DF] hover:bg-[#F3F2EE]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentVendor.is_vacation_mode ? 'bg-white' : 'bg-[#10B981]'
              }`}
            />
            <span>
              {currentVendor.is_vacation_mode
                ? 'Studio On Holiday (Vacation Active)'
                : 'Fulfillment Active (Live Online)'}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveView('vendor_boutique');
            }}
            className="text-xs font-medium text-[#4F46E5] hover:underline flex items-center gap-1"
          >
            <span>Public Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Top Financial & Escrow Horizon Ribbon (4-Card Metric Bar from Stitch.md) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Available for Instant Payout */}
        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#686763] block">
              Available for Instant Payout
            </span>
            <div className="mt-2 font-mono text-2xl font-bold text-[#059669] tabular-nums">
              ${(currentVendor.available_balance_cents / 100).toFixed(2)}
            </div>
          </div>

          <button
            onClick={() => withdrawVendorFunds(currentVendor.id)}
            disabled={currentVendor.available_balance_cents <= 0}
            className="mt-4 w-full text-xs font-semibold bg-[#059669] hover:bg-[#047857] disabled:bg-gray-200 disabled:text-gray-400 text-white py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw to Bank (•••• 4910)</span>
          </button>
        </div>

        {/* Card 2: In Escrow (Pending Delivery) */}
        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#686763] block">
              In Escrow (Pending Delivery)
            </span>
            <div className="mt-2 font-mono text-2xl font-bold text-[#2563EB] tabular-nums">
              ${(currentVendor.escrow_balance_cents / 100).toFixed(2)}
            </div>
          </div>
          <p className="text-[11px] text-[#686763] mt-2">
            Auto-releases directly to Available Balance upon verified carrier delivery scan.
          </p>
        </div>

        {/* Card 3: 30-Day Net Revenue (After Fees) */}
        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#686763] block">
              30-Day Net Take-Home (After Fees)
            </span>
            <div className="mt-2 font-mono text-2xl font-bold text-[#141413] tabular-nums">
              $18,490.00
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
            <span>Avg Fee: 7.4%</span>
            <span>•</span>
            <span>Saved $640 via Direct Link</span>
          </div>
        </div>

        {/* Card 4: Fulfillment SLA Health */}
        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#686763] block">
              Studio Fulfillment SLA Health
            </span>
            <div className="mt-2 font-mono text-2xl font-bold text-[#141413] tabular-nums">
              {currentVendor.on_time_ship_pct}%
            </div>
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#059669]">
            <Sparkles className="w-3 h-3" /> Top-Rated Maker Badge Active
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#E5E4DF] mb-6 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'orders', label: `Sub-Order Queue (${vendorSubOrders.length})`, icon: Package },
          { id: 'pricing', label: 'Live Net-Margin Calculator', icon: Sliders },
          { id: 'inventory', label: 'Variant & Inventory Matrix', icon: Layers },
          { id: 'ledger', label: 'Double-Entry Escrow Ledger', icon: FileText },
          { id: 'referral', label: '0% Referral Link', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#4F46E5] text-[#4F46E5] bg-white'
                  : 'border-transparent text-[#686763] hover:text-[#141413] hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Sub-Order Queue */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#E5E4DF] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF9F5] border-b border-[#E5E4DF] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#141413] uppercase tracking-wider">
              Isolated Studio Sub-Order Queue (Your Split Fulfillments)
            </h3>
            <span className="text-[11px] font-mono text-[#686763]">
              Only items routed to {currentVendor.shop_name} appear here
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E4DF] text-[#686763] font-mono h-[42px]">
                  <th className="px-4 py-2 font-medium">Sub-Order #</th>
                  <th className="px-4 py-2 font-medium">Buyer & Destination</th>
                  <th className="px-4 py-2 font-medium">Items</th>
                  <th className="px-4 py-2 font-medium">Referral Source</th>
                  <th className="px-4 py-2 font-medium">Fulfillment Status</th>
                  <th className="px-4 py-2 font-medium text-right">Net Payout</th>
                  <th className="px-4 py-2 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2EE]">
                {vendorSubOrders.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#FAF9F5] transition-colors h-[48px]">
                    <td className="px-4 py-2.5 font-mono font-bold text-[#141413]">
                      {sub.sub_order_number}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-[#141413]">{sub.buyer.name}</div>
                      <div className="text-[10px] text-[#8E96A8] truncate max-w-[180px]">
                        {sub.buyer.address}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-[#141413]">
                        {sub.items.reduce((s, i) => s + i.quantity, 0)} units
                      </span>
                      <span className="text-[10px] text-[#686763] block truncate max-w-[160px]">
                        {sub.items[0]?.title}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {sub.referral_source === 'vendor_direct' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          ⚡ Direct Link (0%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          🌐 Marketplace (10%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {sub.fulfillment_status === 'delivered' ? (
                        <span className="text-[11px] font-semibold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full">
                          ✓ Delivered
                        </span>
                      ) : sub.fulfillment_status === 'shipped' ? (
                        <span className="text-[11px] font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                          In Transit ({sub.carrier_name})
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          ⏱ Fulfill within {sub.sla_hours_remaining || 24}h
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-[#059669]">
                      ${(sub.vendor_net_payout_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {sub.fulfillment_status === 'confirmed' ? (
                        <button
                          onClick={() => setSelectedSubOrderForPacking(sub)}
                          className="text-[11px] font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3 h-3" /> Print & Pack
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedSubOrderForPacking(sub)}
                          className="text-[11px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-2.5 py-1 rounded-lg"
                        >
                          View Slip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Live Net-Margin Calculator */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-3xl border border-[#E5E4DF] p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl mb-8">
            <h3 className="font-serif text-2xl text-[#141413]">
              Live Net-to-Pocket Pricing Calculator
            </h3>
            <p className="text-xs text-[#686763] mt-1">
              Visualize your exact take-home pay in real time before publishing retail prices. Never wonder what commission or gateway deductions will cost you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-[#FAF9F5] p-5 rounded-2xl border border-[#E5E4DF] space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#141413] uppercase tracking-wider mb-2">
                  Target Retail Price ($ USD)
                </label>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl font-bold text-[#141413]">$</span>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={calculatorRetailPrice}
                    onChange={(e) => setCalculatorRetailPrice(Number(e.target.value))}
                    className="w-full text-xl font-mono font-bold bg-white border border-[#E5E4DF] rounded-xl px-4 py-2 outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <input
                  type="range"
                  min="15"
                  max="350"
                  value={calculatorRetailPrice}
                  onChange={(e) => setCalculatorRetailPrice(Number(e.target.value))}
                  className="w-full mt-3 accent-[#4F46E5]"
                />
              </div>

              {/* 0% Direct Link Toggle */}
              <div className="pt-3 border-t border-[#E5E4DF]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCalculatorDirectReferral}
                    onChange={(e) => setIsCalculatorDirectReferral(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#141413] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Bring-Your-Own-Customer Link (0% Commission)
                    </span>
                    <span className="text-[11px] text-[#686763] block mt-0.5">
                      Shopper accessed via your custom ?ref={currentVendor.slug} social link.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Real-Time Waterfall Ledger Breakdown */}
            <div className="lg:col-span-7 bg-[#18181B] text-[#FAF9F5] p-6 rounded-2xl font-mono text-xs space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#3F3F46]">
                <span className="uppercase tracking-wider text-gray-400 font-sans font-semibold">
                  Revenue Waterfall Line
                </span>
                <span className="text-gray-400 font-sans">Tabular Precision</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Retail Price Paid by Shopper:</span>
                <span className="font-bold text-white">
                  ${(waterfall.retail_cents / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-amber-400">
                <span>
                  Marketplace Commission (
                  {isCalculatorDirectReferral ? '0% Referral' : `${(waterfall.commission_bps / 100).toFixed(1)}%`}
                  ):
                </span>
                <span>-${(waterfall.commission_cents / 100).toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-blue-400">
                <span>Stripe Gateway Processing Fee (2.9% + $0.30):</span>
                <span>-${(waterfall.gateway_cents / 100).toFixed(2)}</span>
              </div>

              <div className="my-2 border-t border-dashed border-[#52525B]"></div>

              <div className="flex items-center justify-between text-base font-bold text-[#10B981] pt-1">
                <span>Guaranteed Net Take-Home Payout:</span>
                <span className="text-xl">
                  ${(waterfall.guaranteed_net_cents / 100).toFixed(2)}
                </span>
              </div>

              <div className="pt-3 text-[11px] text-gray-400 font-sans">
                Effective Platform Retention: {waterfall.take_rate_pct}% of gross transaction.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Variant & Inventory Matrix */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-[#E5E4DF] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF9F5] border-b border-[#E5E4DF] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#141413] uppercase tracking-wider">
                Interactive Variant & Inventory Matrix
              </h3>
              <p className="text-[11px] text-[#686763] mt-0.5">
                Multi-axis variants (`Size × Color × Material`) with predictive depletion velocity.
              </p>
            </div>

            <button
              onClick={() => addToast('SKU Matrix Updated', 'All variant levels synchronized with live catalog.')}
              className="text-xs font-semibold bg-[#18181B] text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>

          <div className="p-4 space-y-6">
            {vendorProducts.map((p) => (
              <div key={p.id} className="border border-[#E5E4DF] rounded-xl overflow-hidden">
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E4DF] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-[#141413]">{p.title}</h4>
                      <span className="text-[10px] text-[#686763]">{p.category}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#8E96A8]">
                    {p.variants.length} SKU Variants
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white border-b border-[#F3F2EE] text-[#8E96A8] font-mono">
                      <th className="px-4 py-2">Variant Title</th>
                      <th className="px-4 py-2">SKU Identifier</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Stock On Hand</th>
                      <th className="px-4 py-2">Velocity Warning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F2EE]">
                    {p.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-[#FAF9F5]">
                        <td className="px-4 py-2 font-medium text-[#141413]">{v.title}</td>
                        <td className="px-4 py-2 font-mono text-gray-500">{v.sku}</td>
                        <td className="px-4 py-2 font-mono font-bold text-[#141413]">
                          ${(v.price_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 font-mono font-semibold">
                          {v.stock_quantity} units
                        </td>
                        <td className="px-4 py-2">
                          {v.velocity_days_left <= 3 ? (
                            <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                              <AlertCircle className="w-2.5 h-2.5" /> Depletion in ~{v.velocity_days_left}d
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">
                              ~{v.velocity_days_left}d runway
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Double-Entry Escrow Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-[#E5E4DF] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF9F5] border-b border-[#E5E4DF] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#141413] uppercase tracking-wider">
                Double-Entry Escrow & Payout Ledger
              </h3>
              <p className="text-[11px] text-[#686763] mt-0.5">
                Exact transaction audit log separating escrow pending reserves from available balances.
              </p>
            </div>
            <span className="font-mono text-xs text-[#059669] bg-[#059669]/10 px-2 py-1 rounded">
              Stripe Connect Synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E4DF] text-[#686763] font-mono h-[40px]">
                  <th className="px-4 py-2">Entry ID</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Balance Bucket</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2EE]">
                {vendorLedgers.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAF9F5]">
                    <td className="px-4 py-2.5 font-mono text-[#8E96A8]">{l.id}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          l.type === 'sale_escrow_credit'
                            ? 'bg-blue-50 text-blue-700'
                            : l.type === 'escrow_released'
                            ? 'bg-emerald-50 text-emerald-700'
                            : l.type === 'payout_withdrawal'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {l.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#141413] max-w-md">{l.description}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#686763]">
                      {l.balance_bucket}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-bold ${
                        l.amount_cents > 0 ? 'text-[#059669]' : 'text-rose-600'
                      }`}
                    >
                      {l.amount_cents > 0 ? '+' : ''}${(l.amount_cents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: 0% Referral Link */}
      {activeTab === 'referral' && (
        <div className="bg-white rounded-3xl border border-[#E5E4DF] p-6 sm:p-8 shadow-xs max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#141413]">
                Zero-Commission "Bring Your Own Customer" Program
              </h3>
              <p className="text-xs text-[#686763]">
                Promote your storefront to your direct audience and pay 0% marketplace commission.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200 mt-6 space-y-4">
            <div className="text-xs text-purple-900 leading-relaxed">
              Whenever a shopper places an order via your unique studio referral link, the platform waives 100% of the marketplace commission. You take home the full retail price minus only basic Stripe processing fees.
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-purple-200">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${currentVendor.slug}`}
                className="w-full text-xs font-mono text-purple-900 bg-transparent outline-none"
              />
              <button
                onClick={handleCopyReferral}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer: Sub-Order Financial Waterfall & Packing Slip */}
      {selectedSubOrderForPacking && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelectedSubOrderForPacking(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E5E4DF] flex flex-col justify-between p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E4DF]">
                  <div>
                    <span className="text-[10px] font-mono text-[#C2410C] font-semibold uppercase">
                      Sub-Order Slip
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#141413]">
                      {selectedSubOrderForPacking.sub_order_number}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedSubOrderForPacking(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Net Payout Waterfall Card (Stitch.md) */}
                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E4DF] font-mono text-xs space-y-2">
                  <div className="font-bold text-[#141413] font-sans pb-1 border-b border-[#E5E4DF]">
                    Net Financial Settlement Waterfall
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Buyer Paid for Items:</span>
                    <span>${(selectedSubOrderForPacking.gross_items_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Allocation:</span>
                    <span>+${(selectedSubOrderForPacking.shipping_charged_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Marketplace Commission:</span>
                    <span>-${(selectedSubOrderForPacking.platform_commission_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Stripe Gateway Share:</span>
                    <span>-${(selectedSubOrderForPacking.gateway_fee_allocation_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E5E4DF] flex justify-between font-bold text-sm text-[#059669]">
                    <span>Guaranteed Net Payout:</span>
                    <span>${(selectedSubOrderForPacking.vendor_net_payout_cents / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping Dispatch Form */}
                <form onSubmit={handleDispatchOrder} className="space-y-4">
                  <h4 className="text-xs font-semibold text-[#141413] uppercase tracking-wider">
                    Carrier Fulfillment Dispatch
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-[#686763] mb-1">
                      Carrier Service
                    </label>
                    <select
                      value={carrierInput}
                      onChange={(e) => setCarrierInput(e.target.value)}
                      className="w-full text-xs bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3 py-2 outline-none"
                    >
                      <option value="USPS Priority Mail">USPS Priority Mail</option>
                      <option value="DHL Express International">DHL Express International</option>
                      <option value="FedEx Ground">FedEx Ground</option>
                      <option value="CTT Correios Portugal">CTT Correios Portugal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#686763] mb-1">
                      Tracking Number (or Auto-Generate)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank to auto-generate"
                      value={trackingNumberInput}
                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                      className="w-full text-xs bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3 py-2 outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ Mark Shipped & Notify Buyer</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
