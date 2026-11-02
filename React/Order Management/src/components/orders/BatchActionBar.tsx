import React from 'react';
import {
  Zap,
  Tag,
  FileText,
  PauseCircle,
  X,
  Package,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { formatGrams, formatCents } from '../../utils/formatters';

export const BatchActionBar: React.FC = () => {
  const {
    orders,
    selectedRowIds,
    clearRowSelection,
    openWaveModal,
    executeBatchWave,
    placeOrderOnHold,
  } = useOrders();

  if (selectedRowIds.size === 0) return null;

  const selectedOrders = orders.filter((o) => selectedRowIds.has(o.id));
  const totalGrams = selectedOrders.reduce(
    (acc, o) => acc + o.line_items.reduce((sum, item) => sum + item.weight_grams * item.quantity_ordered, 0),
    0
  );
  const totalEstLabelCents = selectedOrders.reduce((acc, o) => acc + (o.fulfillments[0]?.label_cost_cents || 750), 0);

  const handleBatchHold = () => {
    selectedOrders.forEach((o) => placeOrderOnHold(o.id, 'Bulk operator hold placed from ledger'));
    clearRowSelection();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-bounce-short">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-full px-5 py-2.5 shadow-2xl border border-slate-700/80 flex items-center gap-3 text-xs select-none ring-1 ring-white/10">
        {/* Count & Weight pill */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
          <span className="font-semibold whitespace-nowrap">
            {selectedRowIds.size} {selectedRowIds.size === 1 ? 'Order' : 'Orders'} Selected
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            ({formatGrams(totalGrams)})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Generate Wave */}
          <button
            onClick={() => openWaveModal(Array.from(selectedRowIds))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold tracking-tight shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Generate Pick Wave</span>
          </button>

          {/* Batch Buy Optimal Labels */}
          <button
            onClick={executeBatchWave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary hover:bg-blue-500 text-white font-medium shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Batch Buy Labels ({formatCents(totalEstLabelCents)})</span>
          </button>

          {/* Print Packing Slips */}
          <button
            onClick={executeBatchWave}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:scale-105 active:scale-95 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Slips</span>
          </button>

          {/* Place On Hold */}
          <button
            onClick={handleBatchHold}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 hover:scale-105 active:scale-95 transition-all"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Hold</span>
          </button>
        </div>

        {/* Clear Selection */}
        <button
          onClick={clearRowSelection}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
          title="Clear Selection (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

