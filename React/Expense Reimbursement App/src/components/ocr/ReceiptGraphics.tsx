import React from 'react';

interface ReceiptGraphicProps {
  receiptKey?: string;
  zoom?: number;
  rotation?: number;
}

export const ReceiptGraphic: React.FC<ReceiptGraphicProps> = ({
  receiptKey = 'lufthansa',
  zoom = 1,
  rotation = 0,
}) => {
  return (
    <div
      className="relative w-full max-w-[460px] mx-auto select-none transition-transform duration-200"
      style={{
        transform: `scale(${zoom}) rotate(${rotation}deg)`,
        transformOrigin: 'top center',
      }}
    >
      {receiptKey === 'lufthansa' && <LufthansaReceipt />}
      {receiptKey === 'standardHotel' && <StandardHotelReceipt />}
      {receiptKey === 'blueBottle' && <BlueBottleReceipt />}
      {receiptKey === 'uber' && <UberReceipt />}
      {!['lufthansa', 'standardHotel', 'blueBottle', 'uber'].includes(receiptKey) && (
        <GenericUploadedReceipt />
      )}
    </div>
  );
};

const LufthansaReceipt: React.FC = () => (
  <div className="bg-[#FAF9F6] text-[#1E293B] rounded-lg shadow-2xl p-6 border border-[#E2E8F0] font-mono text-xs relative overflow-hidden">
    {/* Airline Header */}
    <div className="flex justify-between items-start border-b-2 border-[#1E293B] pb-4 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#05164D] flex items-center justify-center text-white font-bold text-sm">
            LH
          </div>
          <span className="font-sans font-bold text-base text-[#05164D] tracking-tight">
            Lufthansa Airlines
          </span>
        </div>
        <p className="text-[10px] text-[#64748B] mt-1 font-sans">
          Passenger Receipt & Tax Invoice
        </p>
      </div>
      <div className="text-right">
        <span className="text-[11px] font-bold text-[#05164D] bg-[#E0E7FF] px-2 py-0.5 rounded">
          ETKT 220 9482716301
        </span>
        <p className="text-[10px] text-[#64748B] mt-1">Date: 2026-10-18</p>
      </div>
    </div>

    {/* Passenger Info */}
    <div className="grid grid-cols-2 gap-3 mb-4 bg-white p-3 rounded border border-[#CBD5E1]">
      <div>
        <p className="text-[9px] uppercase text-[#64748B] font-sans">Passenger Name</p>
        <p className="font-bold text-[#0F172A]">ROSTOVA / ELENA MS</p>
      </div>
      <div>
        <p className="text-[9px] uppercase text-[#64748B] font-sans">Booking Ref (PNR)</p>
        <p className="font-bold text-[#0F172A]">LH8X49</p>
      </div>
    </div>

    {/* Flight Route Details */}
    <div className="mb-4 bg-white p-3 rounded border border-[#CBD5E1]">
      <div className="flex justify-between items-center text-xs font-bold mb-2">
        <span className="text-blue-900">BER (Berlin Brandenburg)</span>
        <span className="text-gray-400">✈──────</span>
        <span className="text-blue-900">JFK (New York)</span>
      </div>
      <div className="text-[10px] text-gray-600 space-y-1">
        <p>Flight: LH 400 • Class: Economy (K) • Non-Stop</p>
        <p>Departure: Oct 18, 2026 10:45 AM • Seat: 14A</p>
      </div>
    </div>

    {/* Fare Breakdown */}
    <div className="border-t border-[#CBD5E1] pt-3 space-y-1.5 text-[11px]">
      <div className="flex justify-between">
        <span className="text-gray-600">Airfare Base:</span>
        <span>€320.00</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Seat Reservation (Legroom):</span>
        <span>€50.60</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">VAT / International Airport Tax:</span>
        <span>€42.20</span>
      </div>
      <div className="flex justify-between border-t border-dashed border-gray-300 pt-2 font-bold text-sm text-[#05164D]">
        <span>Total Paid (EUR):</span>
        <span className="text-base">€412.80</span>
      </div>
    </div>

    {/* Monospace Barcode Simulator */}
    <div className="mt-5 pt-3 border-t border-gray-300 text-center">
      <div className="h-9 w-full flex items-center justify-center space-x-1 opacity-70">
        {[4, 2, 6, 1, 5, 2, 4, 3, 7, 2, 1, 4, 6, 2, 8, 3, 2, 5, 1, 4, 7, 2, 3, 5].map((w, i) => (
          <div key={i} className="bg-black h-8" style={{ width: `${w}px` }} />
        ))}
      </div>
      <p className="text-[9px] text-gray-500 mt-1">M1ROSTOVA/ELENA LH400 18OCT BERJFK 14A</p>
    </div>
  </div>
);

const StandardHotelReceipt: React.FC = () => (
  <div className="bg-white text-[#1E293B] rounded-lg shadow-2xl p-6 border border-[#E2E8F0] font-sans text-xs relative">
    <div className="text-center border-b border-gray-200 pb-4 mb-4">
      <h3 className="text-base font-bold tracking-widest uppercase text-gray-900">
        THE STANDARD, HIGH LINE
      </h3>
      <p className="text-[11px] text-gray-500">848 Washington St, New York, NY 10014</p>
      <p className="text-[10px] text-gray-400">Guest Folio & Final Settlement</p>
    </div>

    <div className="grid grid-cols-2 gap-2 text-[10px] mb-4 bg-gray-50 p-2.5 rounded border border-gray-100">
      <div>
        <p className="text-gray-400">Guest:</p>
        <p className="font-semibold text-gray-800">Elena Rostova</p>
        <p className="text-gray-400 mt-1">Room #:</p>
        <p className="font-semibold text-gray-800">1104 (Deluxe Queen)</p>
      </div>
      <div className="text-right">
        <p className="text-gray-400">Folio #:</p>
        <p className="font-semibold text-gray-800">FOL-99841</p>
        <p className="text-gray-400 mt-1">Dates:</p>
        <p className="font-semibold text-gray-800">Oct 19 – Oct 21 (2 Nts)</p>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-3 space-y-2 font-mono text-[11px]">
      <div className="flex justify-between">
        <span>Oct 19 Room Charge</span>
        <span>$395.00</span>
      </div>
      <div className="flex justify-between">
        <span>Oct 20 Room Charge</span>
        <span>$395.00</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>NYC Hotel Occupancy Tax (8.875%)</span>
        <span>$70.10</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>NYC Javits Center Fee</span>
        <span>$29.90</span>
      </div>
      <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-sm text-gray-900">
        <span>TOTAL BALANCE:</span>
        <span className="text-emerald-700 font-bold">$890.00</span>
      </div>
    </div>

    <div className="mt-5 text-[10px] text-gray-400 text-center border-t border-gray-100 pt-3">
      Paid via Visa ending in 4829 • Auth 048192 • Thank you for staying
    </div>
  </div>
);

const BlueBottleReceipt: React.FC = () => (
  <div className="bg-[#FFFDF9] text-[#292524] rounded shadow-xl p-5 border border-[#E7E5E4] font-mono text-xs max-w-[340px] mx-auto">
    <div className="text-center pb-3 border-b border-dashed border-gray-300 mb-3">
      <div className="w-4 h-6 bg-[#00A0E2] mx-auto mb-1 rounded-sm opacity-90" />
      <h4 className="font-sans font-bold text-sm tracking-wide text-gray-900">
        BLUE BOTTLE COFFEE
      </h4>
      <p className="text-[10px] text-gray-500">76 N 4th St, Brooklyn, NY</p>
      <p className="text-[10px] text-gray-400 mt-0.5">2026-10-20 09:14 AM • Order #42</p>
    </div>

    <div className="space-y-1.5 text-[11px] mb-3">
      <div className="flex justify-between">
        <span>1x Oat Gibraltar</span>
        <span>$6.75</span>
      </div>
      <div className="flex justify-between">
        <span>1x Hayes Valley Double</span>
        <span>$5.50</span>
      </div>
      <div className="flex justify-between">
        <span>1x Almond Croissant</span>
        <span>$4.75</span>
      </div>
      <div className="flex justify-between text-gray-500 text-[10px]">
        <span>NY Sales Tax (8.875%)</span>
        <span>$1.55</span>
      </div>
      <div className="flex justify-between text-gray-500 text-[10px]">
        <span>Tip (20%)</span>
        <span>$2.45</span>
      </div>
    </div>

    <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between font-bold text-sm">
      <span>TOTAL USD:</span>
      <span className="text-base">$18.50</span>
    </div>

    <div className="mt-4 pt-3 border-t border-gray-200 text-center">
      <p className="text-[9px] text-gray-400">Card ending 4829 • Contactless</p>
      <p className="text-[9px] text-amber-600 font-sans font-medium mt-1">
        ⚠️ Cryptographic Fingerprint: SHA-256 e3b0c442...
      </p>
    </div>
  </div>
);

const UberReceipt: React.FC = () => (
  <div className="bg-white text-black rounded-lg shadow-xl p-5 border border-gray-200 font-sans text-xs">
    <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
      <span className="text-xl font-bold tracking-tighter">Uber</span>
      <span className="text-xs text-gray-500">Tue, Oct 20, 2026</span>
    </div>

    <div className="mb-3">
      <p className="text-xs text-gray-500">Trip to Midtown Manhattan</p>
      <h4 className="text-lg font-bold text-gray-900">$42.10</h4>
    </div>

    <div className="space-y-2 text-[11px] border-t border-gray-100 pt-2">
      <div className="flex justify-between text-gray-600">
        <span>Trip fare (UberX)</span>
        <span>$32.50</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>NYC Congestion Surcharge</span>
        <span>$2.75</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Airport Pickup Fee</span>
        <span>$1.85</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Tip</span>
        <span>$5.00</span>
      </div>
      <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-200">
        <span>Total Paid</span>
        <span>$42.10</span>
      </div>
    </div>

    <div className="mt-4 p-2 bg-gray-50 rounded text-[10px] text-gray-500">
      Pickup: JFK Terminal 4 • Dropoff: 450 Lexington Ave, New York
    </div>
  </div>
);

const GenericUploadedReceipt: React.FC = () => (
  <div className="bg-white text-gray-900 rounded-lg shadow-2xl p-6 border border-gray-200 font-mono text-xs">
    <div className="text-center border-b border-gray-300 pb-3 mb-3">
      <h3 className="font-bold text-sm">COMMERCIAL TAX INVOICE</h3>
      <p className="text-[10px] text-gray-500">Auto-detected OCR Document</p>
    </div>
    <div className="space-y-2 text-xs">
      <div className="flex justify-between">
        <span className="text-gray-500">Merchant:</span>
        <span className="font-bold">Enterprise Cloud Services</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Date:</span>
        <span>2026-10-22</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Category:</span>
        <span>SaaS Tooling</span>
      </div>
      <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-sm">
        <span>Total:</span>
        <span>$149.00 USD</span>
      </div>
    </div>
  </div>
);
