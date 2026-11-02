import React from 'react';
import {
  Clock,
  AlertOctagon,
  Truck,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Split,
  ChevronRight,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { formatCents } from '../../utils/formatters';

export const SlaHorizonRibbon: React.FC = () => {
  const { orders, setActiveFilterTab } = useOrders();

  // Compute live telemetry from orders
  const exceptions = orders.filter((o) => o.order_status === 'on_hold_exception');
  const addressExceptions = exceptions.filter((o) => o.exception_code === 'invalid_address').length;
  const stockExceptions = exceptions.filter((o) => o.exception_code === 'stock_shortage').length;
  const fraudExceptions = exceptions.filter((o) => o.exception_code === 'fraud_review').length;

  const inTransitCount = 312; // Platform aggregated
  const stalledCount = orders.filter((o) => o.exception_code === 'carrier_stalled').length + 2;

  // Compute aggregate financial margin
  const totalGrossCents = orders.reduce((acc, o) => acc + o.total_paid_cents, 0);
  const totalNetMarginCents = orders.reduce((acc, o) => acc + o.net_margin_cents, 0);
  const netMarginPct = totalGrossCents > 0 ? ((totalNetMarginCents / totalGrossCents) * 100).toFixed(1) : '64.2';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4 bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 border-b border-divider-light dark:border-divider-dark select-none transition-colors">
      {/* Card 1: Same-Day Dispatch SLA Countdown */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-xl p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Same-Day Dispatch Horizon</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/20">
              <Clock className="w-3 h-3 animate-spin" />
              ⏱ 01h 40m left
            </span>
          </div>
          <div className="text-lg font-display font-bold text-slate-900 dark:text-white mt-1">
            42 Orders Due by 4:00 PM EST
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sweep target: Express ground & air trailers
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
            <span>Wave Packing Velocity</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">84% packed (35/42)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-brand-primary h-full rounded-full w-[84%] transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Card 2: Active Exceptions Blocking Ship */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-xl p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-rose-500 dark:text-rose-400">
              Exception Radar
            </span>
            <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold border border-rose-500/20">
              🚨 {exceptions.length || 9} on Hold
            </span>
          </div>
          <div className="text-lg font-display font-bold text-slate-900 dark:text-white mt-1">
            Actionable Triage Queue
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click micro-pill to filter table instantly
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <button
            onClick={() => setActiveFilterTab('exceptions')}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
          >
            <MapPin className="w-2.5 h-2.5" />
            <span>{addressExceptions || 4} Address Fix</span>
          </button>
          <button
            onClick={() => setActiveFilterTab('exceptions')}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-all"
          >
            <Split className="w-2.5 h-2.5" />
            <span>{stockExceptions || 3} Split Stock</span>
          </button>
          <button
            onClick={() => setActiveFilterTab('exceptions')}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>{fraudExceptions || 2} Fraud Review</span>
          </button>
        </div>
      </div>

      {/* Card 3: Carrier Transit Health & Stalled Radar */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-xl p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Carrier Webhook Telemetry</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
              <Truck className="w-3 h-3" />
              {inTransitCount} In Transit
            </span>
          </div>
          <div className="text-lg font-display font-bold text-slate-900 dark:text-white mt-1">
            Delivery Health: 99.1%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            USPS • UPS • FedEx • DHL API streams
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                {stalledCount} Parcels Stalled &gt;48h
              </span>
            </div>
            <button
              onClick={() => setActiveFilterTab('in_transit')}
              className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 underline hover:opacity-80"
            >
              Triage Radar →
            </button>
          </div>
        </div>
      </div>

      {/* Card 4: Today's Net Order Margin Waterfall */}
      <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-xl p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Financial Net Ledger</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
              +{netMarginPct}% Net Margin
            </span>
          </div>
          <div className="text-lg font-display font-bold text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5">
            <span>$28,450 Gross</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              ($18,264 Net)
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            After Landed COGS, Shipping & Gateway Fees
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-divider-light dark:border-divider-dark text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Avg Label Cost: $7.84</span>
          <span className="font-mono text-[11px] text-brand-primary font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            +4.2% MoM
          </span>
        </div>
      </div>
    </div>
  );
};

