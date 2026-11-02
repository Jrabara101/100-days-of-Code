import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { audioEngine } from '../../utils/audio';

export const ThermalLabelModal: React.FC = () => {
  const {
    isThermalLabelModalOpen,
    setIsThermalLabelModalOpen,
    thermalLabelData,
  } = useOrders();

  if (!isThermalLabelModalOpen || !thermalLabelData) return null;

  const { order, parcel, carrier } = thermalLabelData;

  const handlePrint = () => {
    audioEngine.playPrintSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsThermalLabelModalOpen(false)}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all select-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-divider-light dark:border-divider-dark flex items-center justify-between bg-surface-secondary-light dark:bg-surface-secondary-dark">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-brand-primary" />
            <div className="text-sm font-bold font-display text-slate-900 dark:text-white">
              4×6 Thermal Shipping Label & Packing Slip
            </div>
          </div>
          <button
            onClick={() => setIsThermalLabelModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4x6 Label Canvas (True to standard courier label) */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex justify-center bg-slate-200 dark:bg-slate-950/80">
          <div className="w-[380px] bg-white text-black p-5 rounded-lg shadow-lg border border-slate-300 font-sans text-xs">
            {/* Courier Header Bar */}
            <div className="border-b-2 border-black pb-2 flex items-center justify-between">
              <div className="font-extrabold text-base tracking-tighter uppercase font-mono">
                {carrier === 'USPS' ? 'PRIORITY MAIL® 2-DAY' : `${carrier} GROUND COMMERCIAL`}
              </div>
              <div className="font-mono text-xs font-bold border-2 border-black px-1.5 py-0.5">
                P
              </div>
            </div>

            {/* Shipper & Delivery Addresses */}
            <div className="py-2.5 border-b border-black text-[11px] leading-tight font-mono">
              <div className="text-[9px] uppercase font-bold text-slate-600">SHIP FROM:</div>
              <div className="font-semibold">DISPATCH CORE FULFILLMENT #{parcel.warehouse_name}</div>
              <div>1200 AIRPORT COMMERCE DR STE 300</div>
              <div>AUSTIN TX 78741</div>
            </div>

            <div className="py-3 border-b-2 border-black text-xs font-mono">
              <div className="text-[9px] uppercase font-bold text-slate-600">SHIP TO:</div>
              <div className="font-extrabold text-sm uppercase">{order.shipping_address.name}</div>
              <div className="font-bold">{order.shipping_address.street1}</div>
              {order.shipping_address.street2 && <div>{order.shipping_address.street2}</div>}
              <div className="font-extrabold text-sm uppercase">
                {order.shipping_address.city} {order.shipping_address.state} {order.shipping_address.postalCode}
              </div>
            </div>

            {/* Carrier Routing & ZIP Block */}
            <div className="py-2 border-b border-black flex items-center justify-between font-mono">
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-600">CARRIER ROUTE:</div>
                <div className="font-extrabold text-sm">402 0-01</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase font-bold text-slate-600">POSTNET CODE:</div>
                <div className="font-extrabold text-sm">C048</div>
              </div>
            </div>

            {/* 1D Tracking Barcode Simulation */}
            <div className="py-4 text-center font-mono">
              <svg className="w-full h-16 mx-auto" viewBox="0 0 300 60">
                {Array.from({ length: 65 }).map((_, i) => (
                  <rect
                    key={i}
                    x={i * 4.6}
                    y={0}
                    width={i % 3 === 0 ? 3.2 : i % 2 === 0 ? 1.8 : 1.2}
                    height={55}
                    fill="black"
                  />
                ))}
              </svg>
              <div className="text-xs font-extrabold tracking-widest mt-1">
                {parcel.tracking_number || '9400 1118 9956 2910 3948 12'}
              </div>
            </div>

            {/* Bottom Order Details / Tear-Off Slip */}
            <div className="border-t-2 border-dashed border-black pt-2 text-[10px] font-mono flex justify-between">
              <div>
                <div>REF: {order.order_number}</div>
                <div>BOX: {parcel.recommended_box_code || 'Box #B2'}</div>
              </div>
              <div className="text-right">
                <div>WEIGHT: 2 LBS 4 OZ</div>
                <div>ZONE: 04</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-divider-light dark:border-divider-dark bg-surface-secondary-light dark:bg-surface-secondary-dark flex items-center justify-between">
          <div className="text-xs font-mono text-slate-500">
            ZPL Thermal Output Ready • 203 DPI / 300 DPI Direct
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsThermalLabelModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-divider-light dark:border-divider-dark text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-primary hover:bg-blue-500 text-white text-xs font-bold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label (⌘P)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

