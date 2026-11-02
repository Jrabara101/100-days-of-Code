import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Building,
  Store,
  Globe,
  Sliders,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { InventoryLevel } from '../../types';

export const InventorySafetyStockView: React.FC = () => {
  const { inventory } = useOrders();
  const [channelFilter, setChannelFilter] = useState<string>('all');

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas-light dark:bg-canvas-dark select-none overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-6 py-4 border-b border-divider-light dark:border-divider-dark bg-surface-secondary-light dark:bg-surface-secondary-dark flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold font-display text-slate-900 dark:text-white">
              Inventory Guardrails & Channel Reservation Locks
            </div>
            <div className="text-xs text-slate-500 font-mono">
              On-Hand • Committed/Reserved • Quality Quarantine • Available to Sell (ATS)
            </div>
          </div>
        </div>

        {/* Channel Reservation Legend */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
            <span>DTC Web</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
            <span>B2B Wholesale</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span>Marketplace</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>POS Retail</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-elevated-light dark:bg-surface-elevated-dark">
            <div className="text-slate-400 uppercase text-[10px] font-bold">Total On-Hand Stock</div>
            <div className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">
              {inventory.reduce((acc, i) => acc + i.on_hand_qty, 0)} Units
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Physically in racks</div>
          </div>

          <div className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-elevated-light dark:bg-surface-elevated-dark">
            <div className="text-slate-400 uppercase text-[10px] font-bold text-amber-500">
              Committed in Orders
            </div>
            <div className="text-xl font-bold font-display text-amber-600 dark:text-amber-400 mt-1">
              {inventory.reduce((acc, i) => acc + i.reserved_qty, 0)} Units
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Reserved by wave pick</div>
          </div>

          <div className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-elevated-light dark:bg-surface-elevated-dark">
            <div className="text-slate-400 uppercase text-[10px] font-bold text-rose-500">
              Quality Quarantine
            </div>
            <div className="text-xl font-bold font-display text-rose-600 dark:text-rose-400 mt-1">
              {inventory.reduce((acc, i) => acc + i.quarantined_qty, 0)} Units
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Damaged / dock review</div>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10">
            <div className="text-emerald-700 dark:text-emerald-400 uppercase text-[10px] font-bold">
              Available to Sell (ATS)
            </div>
            <div className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
              {inventory.reduce((acc, i) => acc + i.available_qty, 0)} Units
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">Safe for checkout</div>
          </div>
        </div>

        {/* Inventory High-Density Ledger Table */}
        <div className="rounded-xl border border-divider-light dark:border-divider-dark bg-surface-elevated-light dark:bg-surface-elevated-dark overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-secondary-light dark:bg-surface-secondary-dark border-b border-divider-light dark:border-divider-dark text-[11px] font-semibold text-slate-400 uppercase">
              <tr className="h-9 font-mono">
                <th className="px-4">SKU & Product</th>
                <th className="px-3">Hub & Bin</th>
                <th className="px-3 text-center">On-Hand</th>
                <th className="px-3 text-center">Committed</th>
                <th className="px-3 text-center">Quarantine</th>
                <th className="px-3 text-center">ATS Stock</th>
                <th className="px-4">Channel Reservation Breakdown</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-divider-light dark:divide-divider-dark font-mono text-xs">
              {inventory.map((item) => {
                const isBackordered = item.available_qty < 0;
                const isLowStock = item.available_qty <= item.safety_stock_threshold && !isBackordered;

                return (
                  <tr
                    key={`${item.variant_id}-${item.warehouse_id}`}
                    className="h-14 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* SKU & Product */}
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-9 h-9 rounded-md object-cover ring-1 ring-divider-light dark:ring-divider-dark"
                        />
                        <div>
                          <div className="font-sans font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans">
                            {item.variant_title}
                          </div>
                          <div className="text-[10px] text-brand-primary">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Hub & Bin */}
                    <td className="px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.warehouse_name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        📍 {item.bin_location}
                      </div>
                    </td>

                    {/* On-Hand */}
                    <td className="px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.on_hand_qty}
                    </td>

                    {/* Committed */}
                    <td className="px-3 text-center text-amber-600 dark:text-amber-400 font-semibold">
                      {item.reserved_qty}
                    </td>

                    {/* Quarantined */}
                    <td className="px-3 text-center text-rose-500 font-semibold">
                      {item.quarantined_qty}
                    </td>

                    {/* ATS Stock */}
                    <td className="px-3 text-center">
                      {isBackordered ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          {item.available_qty} (BACKORDER)
                        </span>
                      ) : isLowStock ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {item.available_qty} (LOW)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {item.available_qty} ATS ✓
                        </span>
                      )}
                    </td>

                    {/* Channel Breakdown */}
                    <td className="px-4">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                          DTC: {item.channel_reservations.dtc_web}
                        </span>
                        <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          B2B: {item.channel_reservations.b2b_wholesale}
                        </span>
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Mkt: {item.channel_reservations.marketplace}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          POS: {item.channel_reservations.pos}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

