import React from 'react';
import { formatCents } from '../../utils/currency';
import { ShieldCheck, Lock } from 'lucide-react';

interface PayPalCheckoutDockProps {
  amountCents: number;
  currency: string;
  onPay: () => Promise<void>;
  isProcessing: boolean;
}

export const PayPalCheckoutDock: React.FC<PayPalCheckoutDockProps> = ({
  amountCents,
  currency,
  onPay,
  isProcessing,
}) => {
  const installmentCents = Math.round(amountCents / 4);

  return (
    <div className="space-y-4 text-xs">
      {/* Pay in 4 Interest-Free Callout */}
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 space-y-1">
        <div className="flex items-center justify-between font-semibold">
          <span>PayPal Pay in 4 Available</span>
          <span className="text-[10px] font-mono bg-blue-500/20 px-1.5 py-0.5 rounded">0% APR</span>
        </div>
        <p className="text-[11px] text-blue-300/80 leading-relaxed">
          Pay 4 bi-weekly payments of <strong className="text-white font-mono">{formatCents(installmentCents, currency)}</strong> with no interest or impact on credit score.
        </p>
      </div>

      {/* Official PayPal Buttons Container */}
      <div className="space-y-2.5">
        {/* Primary Gold PayPal Button */}
        <button
          type="button"
          onClick={onPay}
          disabled={isProcessing}
          className="w-full py-3 px-4 rounded-xl font-bold bg-paypal-gold hover:bg-paypal-goldHover text-paypal-navy transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 select-none"
        >
          {isProcessing ? (
            <span>Connecting to PayPal...</span>
          ) : (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-extrabold italic tracking-tight text-[#003087]">Pay</span>
              <span className="font-extrabold italic tracking-tight text-[#0079C1]">Pal</span>
              <span className="font-sans font-medium text-xs ml-1 text-slate-800">
                Checkout ({formatCents(amountCents, currency)})
              </span>
            </div>
          )}
        </button>

        {/* PayPal Pay Later Button */}
        <button
          type="button"
          onClick={onPay}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 rounded-xl font-semibold bg-[#2C2E2F] hover:bg-[#3D4042] text-white transition flex items-center justify-center gap-2 text-xs disabled:opacity-50 active:scale-98"
        >
          <span>Pay Later</span>
          <span className="text-[10px] text-slate-300 font-mono">
            4 payments of {formatCents(installmentCents, currency)}
          </span>
        </button>

        {/* Venmo Button */}
        <button
          type="button"
          onClick={onPay}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 rounded-xl font-bold bg-[#008CFF] hover:bg-[#0078DB] text-white transition flex items-center justify-center gap-2 text-xs disabled:opacity-50 active:scale-98"
        >
          <span className="font-mono italic font-bold">Venmo</span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center font-mono pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
        <span>Official PayPal Commerce Platform Integration • Buyer Protected</span>
      </div>
    </div>
  );
};
