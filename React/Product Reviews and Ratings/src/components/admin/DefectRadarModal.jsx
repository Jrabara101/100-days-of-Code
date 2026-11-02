import React, { useState } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function DefectRadarModal({ isOpen, onClose }) {
  const { products, setActiveProductId, setViewMode } = useTrustStore();
  const [qaNotified, setQaNotified] = useState(false);

  if (!isOpen) return null;

  const woolCoat = products.find(p => p.sku === 'SKU-89211') || products[1];

  const handleNotifyWarehouse = () => {
    setQaNotified(true);
    setTimeout(() => {
      alert('Warehouse inventory QA hold placed on #LOT-441B (Charcoal L). Merchandising notified.');
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 lg:p-6 animate-fadeIn select-none">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">radar</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                SKU Defect Early-Warning Radar
              </h3>
              <p className="font-mono text-xs text-outline">
                Automated sentiment extraction &amp; warehouse anomaly correlation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Anomaly Card */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#B45309] uppercase tracking-wider">
              Critical Cluster Spike (72h Horizon)
            </span>
            <span className="font-mono text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
              +400% Keyword Velocity
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-headline-sm text-base font-bold text-on-surface">
              {woolCoat.title} · Charcoal / L (SKU-89211)
            </span>
            <p className="font-body-sm text-xs text-on-surface-variant">
              4 verified reviews submitted over the last 72 hours specifically mention <strong className="text-[#B45309]">"seam torn"</strong> or <strong className="text-[#B45309]">"underarm seam"</strong> after brief gentle wear.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs text-on-surface">
            <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30 flex flex-col">
              <span className="text-outline text-[10px]">CORRELATED BATCH</span>
              <span className="font-bold">#LOT-441B</span>
            </div>
            <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30 flex flex-col">
              <span className="text-outline text-[10px]">SUPPLIER UNIT</span>
              <span className="font-bold">Porto Mill 04</span>
            </div>
            <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30 flex flex-col">
              <span className="text-outline text-[10px]">REPORTS / UNITS</span>
              <span className="font-bold text-error">4 / 48 (8.3%)</span>
            </div>
          </div>
        </div>

        {/* Trend Graph Preview */}
        <div className="flex flex-col gap-1.5 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30">
          <span className="font-mono text-xs uppercase tracking-wider text-outline font-bold">
            Defect Reports by Day
          </span>
          <div className="flex items-end gap-3 h-20 pt-4 px-2">
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/40 rounded-t h-3" />
              <span className="font-mono text-[10px] text-outline">Oct 19</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/50 rounded-t h-4" />
              <span className="font-mono text-[10px] text-outline">Oct 20</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-amber-500 rounded-t h-9" />
              <span className="font-mono text-[10px] text-outline">Oct 21</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-error rounded-t h-16 animate-pulse" />
              <span className="font-mono text-[10px] text-error font-bold">Today (4)</span>
            </div>
          </div>
        </div>

        {/* Merchandising & Warehouse Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <button
            onClick={() => {
              setActiveProductId(woolCoat.id);
              setViewMode('storefront');
              onClose();
            }}
            className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
          >
            <span>View SKU on Storefront →</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-on-surface-variant hover:bg-surface-container"
            >
              Close
            </button>
            <button
              onClick={handleNotifyWarehouse}
              disabled={qaNotified}
              className={`px-4 py-1.5 rounded-lg font-headline-sm text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                qaNotified
                  ? 'bg-primary text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {qaNotified ? 'check' : 'local_shipping'}
              </span>
              <span>{qaNotified ? 'Warehouse QA Hold Active' : 'Halt Lot-441B Shipments & Notify Merch'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

