import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Percent,
  Sparkles,
  Layers,
  DollarSign,
  Plus,
  CheckCircle2,
  Lock,
  Users
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export default function MarketplaceOperatorCockpit() {
  const {
    commissionTiers,
    setCommissionTiers,
    coopCampaigns,
    setCoopCampaigns,
    vendors,
    orders,
    addToast
  } = useMarketplace();

  const [campaignTitle, setCampaignTitle] = useState('');
  const [discountPct, setDiscountPct] = useState(20);
  const [platformSubsidyPct, setPlatformSubsidyPct] = useState(10);
  const [vendorContribPct, setVendorContribPct] = useState(10);

  // Compute aggregate marketplace metrics
  const totalGmvCents = orders.reduce((sum, o) => sum + o.grand_total_cents, 0);
  const totalEscrowHeldCents = vendors.reduce((sum, v) => sum + v.escrow_balance_cents, 0);

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!campaignTitle.trim()) return;

    const newCampaign = {
      id: `camp-${Date.now()}`,
      title: campaignTitle,
      slug: campaignTitle.toLowerCase().replace(/\s+/g, '-'),
      discount_pct: Number(discountPct),
      marketplace_subsidy_pct: Number(platformSubsidyPct),
      vendor_contribution_pct: Number(vendorContribPct),
      participating_vendors_count: vendors.length,
      status: 'active',
      end_date: 'Nov 15, 2026'
    };

    setCoopCampaigns([newCampaign, ...coopCampaigns]);
    setCampaignTitle('');
    addToast('Co-Funded Campaign Launched!', `"${campaignTitle}" is now live on the storefront!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200 text-left">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E5E4DF] p-6 shadow-xs mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#141413]">
              Marketplace Operator Governance & Governance HQ
            </h1>
            <p className="text-xs text-[#686763] mt-0.5">
              Configure dynamic basis-point commission tiers, co-funded marketing subsidies, and inspect escrow solvency.
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate Network Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs">
          <span className="text-xs text-[#686763] block">Platform GMV (All Studios)</span>
          <div className="mt-2 font-mono text-2xl font-bold text-[#141413] tabular-nums">
            ${(totalGmvCents / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-[#059669] font-medium mt-1 block">
            ↑ 14.8% Month-over-Month
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs">
          <span className="text-xs text-[#686763] block">Active Escrow Locked (Stripe Reserve)</span>
          <div className="mt-2 font-mono text-2xl font-bold text-[#2563EB] tabular-nums">
            ${(totalEscrowHeldCents / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-[#686763] mt-1 block">
            100% Solvency backed by delivery webhooks
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs">
          <span className="text-xs text-[#686763] block">Active Independent Studios</span>
          <div className="mt-2 font-mono text-2xl font-bold text-[#141413] tabular-nums">
            {vendors.length} Studios
          </div>
          <span className="text-[10px] text-purple-700 font-medium mt-1 block">
            Average Take Rate: 8.8%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Dynamic Commission Tier Engine */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E5E4DF] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-4 h-4 text-[#C2410C]" />
            <h3 className="font-serif text-lg font-bold text-[#141413]">
              Dynamic Commission Engine (Basis Points)
            </h3>
          </div>
          <p className="text-xs text-[#686763] mb-6">
            Commission is calculated in integer basis points (bps) during atomic checkout transactions.
          </p>

          <div className="space-y-3">
            {commissionTiers.map((tier) => (
              <div
                key={tier.id}
                className="p-4 rounded-2xl border border-[#E5E4DF] bg-[#FAF9F5] flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#141413]">{tier.name}</h4>
                  <p className="text-[11px] text-[#686763] mt-0.5">{tier.description}</p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-base font-bold text-[#18181B]">{tier.rate_pct}</span>
                  <span className="text-[10px] text-[#8E96A8] block">{tier.rate_bps} bps</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Co-Funded Flash Campaign Creator */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E5E4DF] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="font-serif text-lg font-bold text-[#141413]">
              Launch Co-Funded Flash Campaign
            </h3>
          </div>
          <p className="text-xs text-[#686763] mb-6">
            Co-funded campaigns split discount costs between the platform and participating makers.
          </p>

          <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#686763] mb-1">
                Campaign Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 🌿 Spring Tabletop & Pottery Fest"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#4F46E5]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-[#686763] mb-1">
                  Total Discount (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#686763] mb-1">
                  Operator Subsidy (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={platformSubsidyPct}
                  onChange={(e) => setPlatformSubsidyPct(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#686763] mb-1">
                  Maker Share (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={vendorContribPct}
                  onChange={(e) => setVendorContribPct(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E5E4DF] rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-medium shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Site-Wide Co-Op Campaign</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
