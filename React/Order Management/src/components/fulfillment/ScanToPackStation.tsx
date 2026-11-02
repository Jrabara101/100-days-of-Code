import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Scan,
  CheckCircle2,
  AlertOctagon,
  Printer,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { CarrierRateOption, PackagingBoxSpec } from '../../types';
import { MOCK_BOX_SPECS } from '../../utils/mockData';
import { formatCents, formatGrams } from '../../utils/formatters';

const CARRIER_RATES: CarrierRateOption[] = [
  {
    carrier: 'usps',
    service_level: 'Ground Advantage',
    transit_days: 2,
    estimated_delivery_date: 'Thu, Nov 5 (1 day early)',
    rate_cents: 645,
    is_optimal_margin: true,
    savings_vs_default_cents: 295,
  },
  {
    carrier: 'ups',
    service_level: 'Ground Commercial',
    transit_days: 2,
    estimated_delivery_date: 'Thu, Nov 5',
    rate_cents: 940,
    is_optimal_margin: false,
  },
  {
    carrier: 'fedex',
    service_level: '2Day Air Express',
    transit_days: 1,
    estimated_delivery_date: 'Wed, Nov 4',
    rate_cents: 1680,
    is_optimal_margin: false,
    warning_text: 'Reduces order margin by 8%',
  },
  {
    carrier: 'dhl',
    service_level: 'Express Worldwide',
    transit_days: 1,
    estimated_delivery_date: 'Wed, Nov 4',
    rate_cents: 2450,
    is_optimal_margin: false,
  },
];

export const ScanToPackStation: React.FC = () => {
  const {
    orders,
    packStationOrderId,
    closePackStation,
    handlePackBarcodeScan,
    updateSelectedCarrierRate,
    activeCarrierRate,
    purchaseLabelAndPrint,
    isPrintingLabel,
    soundEnabled,
    toggleSound,
    showThermalLabel,
  } = useOrders();

  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanFeedbackMessage, setScanFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [selectedBoxCode, setSelectedBoxCode] = useState<string>('Box #B2');

  const inputRef = useRef<HTMLInputElement>(null);

  // Get active order
  const order = orders.find((o) => o.id === packStationOrderId) || orders[0];

  useEffect(() => {
    // Keep focus in the barcode scanner input for continuous warehouse gun scanning
    inputRef.current?.focus();
  }, [packStationOrderId]);

  // Handle barcode submission
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const res = handlePackBarcodeScan(barcodeInput);
    setScanFeedbackMessage({
      text: res.message,
      isError: !res.success,
    });
    setBarcodeInput('');
    setTimeout(() => {
      setScanFeedbackMessage(null);
    }, 3500);
  };

  const handleSimulateScanItem = (sku: string) => {
    const res = handlePackBarcodeScan(sku);
    setScanFeedbackMessage({
      text: res.message,
      isError: !res.success,
    });
    setTimeout(() => {
      setScanFeedbackMessage(null);
    }, 3500);
  };

  const allItemsPacked = order.line_items.every(
    (i) => (i.scanned_qty || 0) >= i.quantity_ordered
  );

  const totalGrams = order.line_items.reduce(
    (acc, i) => acc + i.weight_grams * i.quantity_ordered,
    0
  );

  const selectedBox = MOCK_BOX_SPECS.find((b) => b.code === selectedBoxCode) || MOCK_BOX_SPECS[1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none overflow-hidden font-sans">
      {/* Top Scanner HUD Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        {/* Left: Wave status & Active Order */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-tight flex items-center gap-2">
                <span>PACKING STATION #04</span>
                <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Wave #W-104 • Order 14 of 40
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Active Order: <span className="text-white font-bold">{order.order_number}</span> ({order.customer_name})
              </div>
            </div>
          </div>
        </div>

        {/* Center: Barcode Gun Input Listener */}
        <div className="flex-1 max-w-md mx-6">
          <form onSubmit={handleScanSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Scan className="w-4 h-4 animate-pulse text-emerald-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="🔫 Scanner Active: Scan UPC, SKU or Packing Slip..."
              className="w-full pl-9 pr-24 py-2 bg-slate-800 border-2 border-emerald-500/60 rounded-xl text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold"
            >
              SCAN ↵
            </button>
          </form>
        </div>

        {/* Right: Sound toggle & Station Close */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute packing beeps' : 'Enable audio feedback'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={closePackStation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            <X className="w-4 h-4" />
            <span>Exit Station</span>
          </button>
        </div>
      </header>

      {/* Real-time Scan Feedback Banner */}
      {scanFeedbackMessage && (
        <div
          className={`py-2 px-6 text-center text-xs font-mono font-bold tracking-wide transition-all ${
            scanFeedbackMessage.isError
              ? 'bg-rose-600 text-white animate-bounce-short'
              : 'bg-emerald-600 text-white animate-flash-emerald'
          }`}
        >
          {scanFeedbackMessage.text}
        </div>
      )}

      {/* 2-Column Packing & Rate Stage */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left Column: Visual Scan Verification Checklist (7 of 12 cols = ~58%) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto pr-2">
          {/* Section Title */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Barcode Verification Checklist
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Click any item to simulate barcode scan
              </span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Total Weight: <span className="text-white font-bold">{formatGrams(totalGrams)}</span>
            </span>
          </div>

          {/* Large Item Cards designed for distance reading */}
          <div className="space-y-3">
            {order.line_items.map((item) => {
              const scanned = item.scanned_qty || 0;
              const isItemComplete = scanned >= item.quantity_ordered;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSimulateScanItem(item.sku)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                    isItemComplete
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 animate-bounce-short'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Thumbnail + Details */}
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-display font-bold text-base text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {item.variant_title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 font-mono text-xs">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                            UPC: {item.sku}
                          </span>
                          <span className="bg-brand-primary/20 text-blue-400 font-bold px-2 py-0.5 rounded">
                            📍 Bin {item.bin_location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Oversized Scan Counter Pill */}
                    <div className="text-right shrink-0">
                      {isItemComplete ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono font-bold text-sm shadow-md">
                          <CheckCircle2 className="w-5 h-5 fill-current" />
                          <span>{scanned} / {item.quantity_ordered} VERIFIED ✓</span>
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-xl border border-amber-500/60 bg-amber-500/10 text-amber-300 font-mono text-xs text-center font-bold">
                          <div>{scanned} / {item.quantity_ordered} Scanned</div>
                          <div className="text-[10px] text-amber-400 font-normal mt-0.5">
                            Scan UPC to confirm
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Smart Corrugated Box Recommender Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-primary" />
                <span>2. Recommended Carton Specification</span>
              </span>
              <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                88% Volume Utilization
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {MOCK_BOX_SPECS.map((box) => (
                <button
                  key={box.code}
                  onClick={() => setSelectedBoxCode(box.code)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedBoxCode === box.code
                      ? 'border-brand-primary bg-blue-500/10 text-white ring-1 ring-brand-primary'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-200">{box.code}</div>
                  <div className="text-[10px] text-slate-400">{box.dimensions_in}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Cap: {box.max_weight_lbs} lbs</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Multi-Carrier Rate Shopper & Thermal Label Dispatch (5 of 12 cols = ~42%) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 overflow-y-auto">
          <div className="space-y-4">
            {/* Delivery Target Banner */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
              <div className="font-semibold text-blue-300 flex items-center justify-between mb-1">
                <span>Customer Promised SLA Target</span>
                <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded text-blue-200">
                  STANDARD SHIPPING ($8.00)
                </span>
              </div>
              <div className="text-slate-300 text-[11px]">
                Destination: <span className="font-semibold text-white">{order.shipping_address.city}, {order.shipping_address.state}</span> • Promised Delivery: <span className="font-semibold text-emerald-400">Fri, Nov 6</span>
              </div>
            </div>

            {/* Carrier Rate Comparison Selector */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>3. Live Commercial Carrier Rates</span>
                <span className="text-[11px] font-mono text-slate-500">Real-Time Webhooks</span>
              </div>

              <div className="space-y-2">
                {CARRIER_RATES.map((rate, idx) => {
                  const isSelected = activeCarrierRate.carrier === rate.carrier;
                  return (
                    <div
                      key={idx}
                      onClick={() => updateSelectedCarrierRate(rate)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-primary bg-blue-500/10'
                          : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => updateSelectedCarrierRate(rate)}
                            className="text-brand-primary focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-xs uppercase text-white flex items-center gap-1.5">
                              <span>{rate.carrier}</span>
                              <span className="font-normal text-slate-400">({rate.service_level})</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Est. Delivery: {rate.estimated_delivery_date}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-bold text-sm text-white">
                            {formatCents(rate.rate_cents)}
                          </div>
                          {rate.is_optimal_margin && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                              ✨ Best Margin (Saves $2.95)
                            </span>
                          )}
                          {rate.warning_text && (
                            <span className="text-[10px] text-amber-400">
                              {rate.warning_text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary Dispatch CTA */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Packing Status:</span>
              <span className={allItemsPacked ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {allItemsPacked ? '✓ 100% Items Scanned' : 'Scanning In Progress...'}
              </span>
            </div>

            <button
              onClick={purchaseLabelAndPrint}
              disabled={isPrintingLabel}
              className={`w-full py-4 rounded-xl text-sm font-bold tracking-tight shadow-xl flex items-center justify-center gap-2 transition-all ${
                isPrintingLabel
                  ? 'bg-slate-700 text-slate-300 cursor-wait'
                  : allItemsPacked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01] active:scale-[0.99] shadow-emerald-500/20'
                  : 'bg-brand-primary hover:bg-blue-500 text-white hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              <Printer className="w-5 h-5" />
              <span>
                {isPrintingLabel
                  ? 'Buying Commercial Label & Printing ZPL...'
                  : `Buy Label (${formatCents(activeCarrierRate.rate_cents)}) & Print Thermal ZPL (Enter ↵)`}
              </span>
            </button>

            {/* View Thermal Label Modal Trigger */}
            <button
              onClick={() => showThermalLabel(order, order.fulfillments[0])}
              className="w-full text-center text-xs font-mono text-slate-400 hover:text-white underline"
            >
              Preview 4×6 Thermal Label & Packing Slip Mockup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

