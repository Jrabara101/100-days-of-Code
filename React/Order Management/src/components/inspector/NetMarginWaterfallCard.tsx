import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { Order } from '../../types';
import { formatCents } from '../../utils/formatters';

interface NetMarginWaterfallCardProps {
  order: Order;
}

export const NetMarginWaterfallCard: React.FC<NetMarginWaterfallCardProps> = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const marginPct = ((order.net_margin_cents / order.total_paid_cents) * 100).toFixed(1);
  const totalUnits = order.line_items.reduce((acc, i) => acc + i.quantity_ordered, 0);

  return (
    <div className="rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/80 dark:bg-surface-secondary-dark/80 p-4 transition-colors">
      {/* Header with quick toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Unit Economics & Net Margin Waterfall</span>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold">
                +{marginPct}% NET
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Institutional order profitability after all direct operational costs
            </div>
          </div>
        </div>

        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Waterfall Breakdown in JetBrains Mono */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-divider-light dark:border-divider-dark font-mono text-xs space-y-1.5">
          {/* Customer Gross Paid */}
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>Customer Gross Paid</span>
              <span className="text-[10px] text-slate-400 font-sans">(Subtotal + Ship)</span>
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCents(order.total_paid_cents)}
            </span>
          </div>

          {/* Promo Code Discount */}
          {order.discount_cents > 0 && (
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span>Promo Discount</span>
                <span className="text-[10px] text-slate-400 font-sans">(AUTUMN15)</span>
              </span>
              <span>-{formatCents(order.discount_cents)}</span>
            </div>
          )}

          {/* Landed COGS */}
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span>Landed COGS</span>
              <span className="text-[10px] text-slate-400 font-sans">({totalUnits} Units Product Cost)</span>
            </span>
            <span>-{formatCents(order.cogs_total_cents)}</span>
          </div>

          {/* Payment Gateway Fee */}
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span>Payment Gateway Fee</span>
              <span className="text-[10px] text-slate-400 font-sans">(Stripe 2.9% + 30¢)</span>
            </span>
            <span>-{formatCents(order.gateway_fee_cents)}</span>
          </div>

          {/* Carrier Label Cost */}
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span>Actual Carrier Label</span>
              <span className="text-[10px] text-slate-400 font-sans">
                ({order.fulfillments[0]?.carrier.toUpperCase()} {order.fulfillments[0]?.service_level})
              </span>
            </span>
            <span>-{formatCents(order.shipping_cost_actual_cents || order.fulfillments[0]?.label_cost_cents || 845)}</span>
          </div>

          {/* 3PL Pick & Pack Fee */}
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span>3PL Pick & Pack Fee</span>
              <span className="text-[10px] text-slate-400 font-sans">(Warehouse Labor & Carton)</span>
            </span>
            <span>-{formatCents(order.pick_pack_fee_cents)}</span>
          </div>

          {/* Divider */}
          <div className="pt-1.5 border-t border-dashed border-divider-light dark:border-divider-dark"></div>

          {/* Net Margin Result */}
          <div className="flex items-center justify-between pt-1 text-sm font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
            <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>True Order Net Profit:</span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">
              {formatCents(order.net_margin_cents, true)} ({marginPct}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

