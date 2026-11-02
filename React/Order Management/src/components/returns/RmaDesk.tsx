import React from 'react';
import {
  RotateCcw,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  DollarSign,
  TrendingUp,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { ReturnAuthorization, ConditionGrade } from '../../types';
import { formatCents, formatShortDate } from '../../utils/formatters';

export const RmaDesk: React.FC = () => {
  const {
    rmas,
    selectedRmaId,
    setSelectedRmaId,
    gradeRmaCondition,
    resolveRmaWithKeepItem,
  } = useOrders();

  const selectedRma = rmas.find((r) => r.id === selectedRmaId) || rmas[0];

  const isKeepItemCandidate =
    selectedRma &&
    selectedRma.return_label_cost_cents > selectedRma.item_cogs_cents &&
    selectedRma.resolution_type !== 'keep_item_credit';

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'sizing_small':
        return <span className="bg-blue-500/10 text-brand-primary px-1.5 py-0.5 rounded">Sizing: Runs Small</span>;
      case 'defective':
        return <span className="bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded">Defective / Snag</span>;
      case 'damaged_in_transit':
        return <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">Transit Damage</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded">{reason}</span>;
    }
  };

  const getGradeBadge = (grade: ConditionGrade) => {
    switch (grade) {
      case 'grade_a_restock':
        return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">🟢 Grade A: Pristine Restock</span>;
      case 'grade_b_open_box':
        return <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded">🟡 Grade B: Refurbish Queue</span>;
      case 'grade_c_quarantine':
        return <span className="bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded">🔴 Grade C: Vendor Claim</span>;
      case 'uninspected':
      default:
        return <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded">Uninspected at Dock</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas-light dark:bg-canvas-dark select-none overflow-hidden transition-colors">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-divider-light dark:border-divider-dark bg-surface-secondary-light dark:bg-surface-secondary-dark flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold font-display text-slate-900 dark:text-white">
              Returns & Exchanges (RMA) Resolution Desk
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Frictionless Returns • Keep-the-Item Economizer • Dock Condition Grading
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
          <span>Active RMAs:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{rmas.length}</span>
        </div>
      </div>

      {/* Split-Pane RMA Triage View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left RMA Queue (5 of 12 cols) */}
        <div className="md:col-span-5 border-r border-divider-light dark:border-divider-dark overflow-y-auto p-4 space-y-2.5 bg-surface-secondary-light/30 dark:bg-surface-secondary-dark/30">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Incoming & Dock-Scanned RMAs
          </div>

          {rmas.map((rma) => {
            const isSelected = selectedRmaId === rma.id;
            return (
              <div
                key={rma.id}
                onClick={() => setSelectedRmaId(rma.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-brand-primary bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-xs ring-1 ring-brand-primary'
                    : 'border-divider-light dark:border-divider-dark bg-surface-elevated-light dark:bg-surface-elevated-dark hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 font-mono">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {rma.rma_number}
                  </span>
                  <span className="text-slate-400 text-[11px]">{rma.order_number}</span>
                </div>

                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {rma.customer_name} • {rma.line_item.title}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono mt-2">
                  {getReasonBadge(rma.reason_code)}

                  {rma.customer_photo_url && (
                    <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Camera className="w-2.5 h-2.5" />
                      Photo Attached
                    </span>
                  )}

                  {rma.resolution_type === 'keep_item_credit' && (
                    <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      💡 Keep-Item Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Inspector & Grading Desk (7 of 12 cols) */}
        {selectedRma && (
          <div className="md:col-span-7 overflow-y-auto p-6 space-y-5 bg-canvas-light dark:bg-canvas-dark">
            {/* RMA Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-divider-light dark:border-divider-dark">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                    {selectedRma.rma_number}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Order Ref: {selectedRma.order_number}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedRma.customer_name}</span>
                </div>
              </div>

              <div>{getGradeBadge(selectedRma.condition_grade)}</div>
            </div>

            {/* Smart Return Economizer Banner (When return shipping > item value) */}
            {isKeepItemCandidate && (
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Return Economizer Opportunity</span>
                  </div>
                  <span className="font-mono text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                    RECOMMENDED CX RESOLUTION
                  </span>
                </div>

                <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-mono">
                  Generating a return shipping label costs <strong>{formatCents(selectedRma.return_label_cost_cents)}</strong> for an item with only <strong>{formatCents(selectedRma.item_cogs_cents)}</strong> Landed COGS.
                  Offering a <strong>$12.00 Instant Store Credit & Keep-the-Item</strong> saves <strong>$3.50 in net recovery</strong> and eliminates reverse warehouse handling fees.
                </p>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => resolveRmaWithKeepItem(selectedRma.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Offer $12 Instant Credit & Keep Item</span>
                  </button>
                  <button className="px-3 py-2 rounded-lg border border-divider-light dark:border-divider-dark text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs">
                    Issue Standard Return Label ({formatCents(selectedRma.return_label_cost_cents)})
                  </button>
                </div>
              </div>
            )}

            {/* Item Details & Customer Uploaded Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">Returned Line Item</div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {selectedRma.line_item.title}
                </div>
                <div className="font-mono text-slate-500">
                  SKU: {selectedRma.line_item.sku}
                </div>
                <div className="font-mono text-slate-500">
                  Original Price: {formatCents(selectedRma.line_item.unit_price_cents)} • COGS: {formatCents(selectedRma.item_cogs_cents)}
                </div>
                {selectedRma.customer_comment && (
                  <div className="mt-2 pt-2 border-t border-divider-light dark:border-divider-dark text-slate-600 dark:text-slate-300 italic">
                    "{selectedRma.customer_comment}"
                  </div>
                )}
              </div>

              {selectedRma.customer_photo_url && (
                <div className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-purple-500" />
                    <span>Customer Uploaded Defect/Fit Photo</span>
                  </div>
                  <img
                    src={selectedRma.customer_photo_url}
                    alt="Customer inspection"
                    className="w-full h-32 rounded-lg object-cover ring-1 ring-divider-light dark:ring-divider-dark"
                  />
                </div>
              )}
            </div>

            {/* Warehouse Dock Grading Controls */}
            <div className="p-4 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/60 dark:bg-surface-secondary-dark/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-brand-primary" />
                  <span>Warehouse Dock Condition Grading</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Dock Location: Receiving Bay #02
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => gradeRmaCondition(selectedRma.id, 'grade_a_restock', 'wh-austin-3pl')}
                  className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all group"
                >
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    🟢 Grade A: Pristine
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                    Auto-restock to Available to Sell (ATS) inventory
                  </div>
                </button>

                <button
                  onClick={() => gradeRmaCondition(selectedRma.id, 'grade_b_open_box', 'wh-austin-3pl')}
                  className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all group"
                >
                  <div className="font-bold text-amber-700 dark:text-amber-400 text-xs">
                    🟡 Grade B: Open Box
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                    Route to outlet refurbishment queue
                  </div>
                </button>

                <button
                  onClick={() => gradeRmaCondition(selectedRma.id, 'grade_c_quarantine', 'wh-austin-3pl')}
                  className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-all group"
                >
                  <div className="font-bold text-rose-700 dark:text-rose-400 text-xs">
                    🔴 Grade C: Defective
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                    Flag SKU defect & quarantine for vendor credit
                  </div>
                </button>
              </div>

              {selectedRma.dock_operator && (
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Last inspected by: {selectedRma.dock_operator}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

