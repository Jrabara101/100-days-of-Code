import React, { useState } from 'react';
import {
  X,
  Zap,
  MapPin,
  CheckCircle2,
  Navigation,
  Printer,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { formatCents } from '../../utils/formatters';

export const WavePickModal: React.FC = () => {
  const { isWaveModalOpen, closeWaveModal, executeBatchWave, selectedRowIds, orders } = useOrders();

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (!isWaveModalOpen) return null;

  // Selected orders or ready orders
  const waveOrders =
    selectedRowIds.size > 0
      ? orders.filter((o) => selectedRowIds.has(o.id))
      : orders.filter((o) => o.order_status === 'ready_to_fulfill');

  // Walking path steps sorted by aisle and bin
  const pickSteps = [
    {
      id: 1,
      bin: 'A2-B04',
      sku: 'SKU-LINEN-M',
      title: 'Structured Belgian Linen Blazer (M)',
      qtyToPick: 6,
      ordersCount: 6,
      walkingNote: 'Aisle 2, Lower Shelf Bay 04',
    },
    {
      id: 2,
      bin: 'B1-C12',
      sku: 'SKU-MERINO-BLK-S',
      title: 'Extra-Fine Merino Knit Crew (S)',
      qtyToPick: 8,
      ordersCount: 5,
      walkingNote: 'Aisle 1, Mid Shelf Bay 12',
    },
    {
      id: 3,
      bin: 'C3-A01',
      sku: 'SKU-OXF-WHT-M',
      title: 'Organic Heavy Oxford Shirt (M)',
      qtyToPick: 12,
      ordersCount: 12,
      walkingNote: 'Aisle 3, Bulk Cart Bay 01',
    },
  ];

  const toggleStep = (stepId: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const allStepsPicked = pickSteps.every((s) => completedSteps.has(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={closeWaveModal}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 select-none transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-divider-light dark:border-divider-dark flex items-center justify-between bg-surface-secondary-light dark:bg-surface-secondary-dark">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <span>Batch Wave Picking Manifest #W-104</span>
                <span className="font-mono text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                  {waveOrders.length} Orders Consolidated
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Sorted bin-location walking path with optimal pick sequence
              </div>
            </div>
          </div>

          <button
            onClick={closeWaveModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Walking Path Telemetry Banner */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-brand-primary font-bold">
              <Navigation className="w-4 h-4" />
              <span>Optimized Path: 114 meters total walking distance</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Est. Pick Time: <span className="font-bold text-slate-900 dark:text-white">3.4 minutes</span>
            </div>
          </div>

          {/* Sorted Walking Route Steps */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pick Stops Along Walking Route
            </div>

            {pickSteps.map((step, idx) => {
              const isDone = completedSteps.has(step.id);
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                      : 'border-divider-light dark:border-divider-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="font-mono text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
                            📍 {step.bin}
                          </span>
                          <span>{step.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {step.walkingNote} • SKU: {step.sku}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        Pick {step.qtyToPick} Units
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({step.ordersCount} single-item orders)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-divider-light dark:border-divider-dark bg-surface-secondary-light dark:bg-surface-secondary-dark flex items-center justify-between">
          <button
            onClick={closeWaveModal}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={executeBatchWave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-blue-500 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Complete Wave & Batch Purchase Labels</span>
          </button>
        </div>
      </div>
    </div>
  );
};

