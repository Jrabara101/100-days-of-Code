import React, { useState } from 'react';
import {
  X,
  Split,
  Package,
  Calendar,
  Building2,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { Order, OrderLineItem } from '../../types';
import { MOCK_WAREHOUSES } from '../../utils/mockData';
import { formatCents, formatGrams } from '../../utils/formatters';

export const SplitFulfillmentModal: React.FC = () => {
  const { isSplitModalOpen, orderToSplit, closeSplitModal, executeOrderSplit } = useOrders();

  if (!isSplitModalOpen || !orderToSplit) return null;

  // Local state for partitioning
  // itemSplits holds { [itemId]: { parcelAQty: number, parcelBQty: number } }
  const [splits, setSplits] = useState<{ [itemId: string]: { parcelAQty: number; parcelBQty: number } }>(() => {
    const init: { [itemId: string]: { parcelAQty: number; parcelBQty: number } } = {};
    orderToSplit.line_items.forEach((item, idx) => {
      // By default: if more than 1 item, put the last item or backordered item into parcel B
      if (idx === orderToSplit.line_items.length - 1 && orderToSplit.line_items.length > 1) {
        init[item.id] = { parcelAQty: 0, parcelBQty: item.quantity_ordered };
      } else {
        init[item.id] = { parcelAQty: item.quantity_ordered, parcelBQty: 0 };
      }
    });
    return init;
  });

  const [parcelBWarehouseId, setParcelBWarehouseId] = useState<string>('wh-nj-east');
  const [isBackorderRestock, setIsBackorderRestock] = useState<boolean>(true);
  const [restockDate, setRestockDate] = useState<string>('2026-11-12');

  const moveQtyToB = (itemId: string) => {
    setSplits((prev) => {
      const current = prev[itemId];
      if (!current || current.parcelAQty <= 0) return prev;
      return {
        ...prev,
        [itemId]: {
          parcelAQty: current.parcelAQty - 1,
          parcelBQty: current.parcelBQty + 1,
        },
      };
    });
  };

  const moveQtyToA = (itemId: string) => {
    setSplits((prev) => {
      const current = prev[itemId];
      if (!current || current.parcelBQty <= 0) return prev;
      return {
        ...prev,
        [itemId]: {
          parcelAQty: current.parcelAQty + 1,
          parcelBQty: current.parcelBQty - 1,
        },
      };
    });
  };

  // Calculations
  const parcelAItems = orderToSplit.line_items
    .map((item) => ({
      item,
      qty: splits[item.id]?.parcelAQty || 0,
    }))
    .filter((x) => x.qty > 0);

  const parcelBItems = orderToSplit.line_items
    .map((item) => ({
      item,
      qty: splits[item.id]?.parcelBQty || 0,
    }))
    .filter((x) => x.qty > 0);

  const parcelAGrams = parcelAItems.reduce((sum, x) => sum + x.item.weight_grams * x.qty, 0);
  const parcelBGrams = parcelBItems.reduce((sum, x) => sum + x.item.weight_grams * x.qty, 0);

  // Dynamic estimate: split adds second packaging + shipping
  const parcelAShipEstCents = 645;
  const parcelBShipEstCents = isBackorderRestock ? 675 : 780;
  const additionalShippingCostCents = parcelBShipEstCents;
  const newNetMarginCents = orderToSplit.net_margin_cents - additionalShippingCostCents;

  const handleConfirm = () => {
    executeOrderSplit(
      orderToSplit.id,
      parcelAItems.map((x) => ({ itemId: x.item.id, qty: x.qty })),
      parcelBItems.map((x) => ({ itemId: x.item.id, qty: x.qty })),
      parcelBWarehouseId,
      isBackorderRestock ? restockDate : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={closeSplitModal}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all select-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-divider-light dark:border-divider-dark flex items-center justify-between bg-surface-secondary-light dark:bg-surface-secondary-dark">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <span>Split-Shipment Orchestrator</span>
                <span className="font-mono text-xs text-brand-primary">
                  {orderToSplit.order_number}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Partition line items across fulfillment nodes or restock release dates
              </div>
            </div>
          </div>

          <button
            onClick={closeSplitModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Item Partition Controls */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Line Items Allocation Stepper
            </div>

            {orderToSplit.line_items.map((item) => {
              const split = splits[item.id] || { parcelAQty: item.quantity_ordered, parcelBQty: 0 };
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-10 h-10 rounded-md object-cover ring-1 ring-divider-light dark:ring-divider-dark shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.variant_title} • <span className="font-mono">{item.sku}</span>
                      </div>
                      <div className="text-[10px] font-mono text-brand-primary mt-0.5">
                        📍 {item.bin_location} ({item.weight_grams}g)
                      </div>
                    </div>
                  </div>

                  {/* Partition Stepper */}
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    {/* Parcel A count */}
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">Parcel A</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {split.parcelAQty}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveQtyToA(item.id)}
                        disabled={split.parcelBQty <= 0}
                        title="Move 1 unit to Parcel A"
                        className="w-7 h-7 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark disabled:opacity-40 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => moveQtyToB(item.id)}
                        disabled={split.parcelAQty <= 0}
                        title="Move 1 unit to Parcel B"
                        className="w-7 h-7 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark disabled:opacity-40 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                      >
                        →
                      </button>
                    </div>

                    {/* Parcel B count */}
                    <div className="text-center">
                      <div className="text-[10px] text-purple-500 font-semibold">Parcel B</div>
                      <div className="font-bold text-purple-600 dark:text-purple-400">
                        {split.parcelBQty}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-Side Parcel Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Parcel A Box */}
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-brand-primary flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Parcel A (Ship Now)</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ⚡ Immediate Wave
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-[11px] mb-2 font-mono">
                From: {orderToSplit.allocated_warehouse_id.replace('wh-', '').toUpperCase()} Hub
              </div>
              <div className="space-y-1 mb-2">
                {parcelAItems.map((x) => (
                  <div key={x.item.id} className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    • {x.qty}x {x.item.title.slice(0, 24)}...
                  </div>
                ))}
                {parcelAItems.length === 0 && (
                  <div className="text-[11px] text-rose-500 font-mono">No items allocated to Parcel A</div>
                )}
              </div>
              <div className="pt-2 border-t border-blue-500/20 font-mono text-[11px] text-slate-500 flex justify-between">
                <span>Weight: {formatGrams(parcelAGrams)}</span>
                <span>Est. Label: {formatCents(parcelAShipEstCents)}</span>
              </div>
            </div>

            {/* Parcel B Box */}
            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Parcel B (Split Destination)</span>
                </span>
                <span className="font-mono text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                  {isBackorderRestock ? 'Backorder Hold' : 'Reroute Node'}
                </span>
              </div>

              {/* Reroute Node or Restock Date Controls */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-500 font-medium">Mode:</label>
                  <button
                    onClick={() => setIsBackorderRestock(true)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isBackorderRestock ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Restock Date
                  </button>
                  <button
                    onClick={() => setIsBackorderRestock(false)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      !isBackorderRestock ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Alternate Node
                  </button>
                </div>

                {isBackorderRestock ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                    <input
                      type="date"
                      value={restockDate}
                      onChange={(e) => setRestockDate(e.target.value)}
                      className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded px-2 py-0.5 font-mono text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    <select
                      value={parcelBWarehouseId}
                      onChange={(e) => setParcelBWarehouseId(e.target.value)}
                      className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded px-2 py-0.5 font-mono text-xs text-slate-800 dark:text-slate-200"
                    >
                      {MOCK_WAREHOUSES.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.code} ({wh.location})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1 mb-2">
                {parcelBItems.map((x) => (
                  <div key={x.item.id} className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                    • {x.qty}x {x.item.title.slice(0, 24)}...
                  </div>
                ))}
                {parcelBItems.length === 0 && (
                  <div className="text-[11px] text-slate-400 font-mono">No items in Parcel B</div>
                )}
              </div>

              <div className="pt-2 border-t border-purple-500/20 font-mono text-[11px] text-slate-500 flex justify-between">
                <span>Weight: {formatGrams(parcelBGrams)}</span>
                <span>Est. Label: {formatCents(parcelBShipEstCents)}</span>
              </div>
            </div>
          </div>

          {/* Real-Time Net Margin Impact Banner */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-divider-light dark:border-divider-dark text-xs font-mono flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Margin Impact Calculation</div>
              <div className="text-slate-800 dark:text-slate-200">
                Split adds second carrier label: <span className="text-rose-500">-{formatCents(additionalShippingCostCents)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">New True Net Profit</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {formatCents(newNetMarginCents, true)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-divider-light dark:border-divider-dark bg-surface-secondary-light dark:bg-surface-secondary-dark flex items-center justify-between">
          <button
            onClick={closeSplitModal}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={parcelAItems.length === 0 || parcelBItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Confirm Split & Update Parcels</span>
          </button>
        </div>
      </div>
    </div>
  );
};

