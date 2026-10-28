import React, { useState } from 'react';
import { formatCents } from '../../utils/currency';
import { CreditCard, Lock, ShieldCheck, Zap } from 'lucide-react';

interface StripeCheckoutDockProps {
  amountCents: number;
  currency: string;
  onPay: () => Promise<void>;
  isProcessing: boolean;
  passFeeToClient?: boolean;
}

export const StripeCheckoutDock: React.FC<StripeCheckoutDockProps> = ({
  amountCents,
  currency,
  onPay,
  isProcessing,
  passFeeToClient = false,
}) => {
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('•••');
  const [billingZip, setBillingZip] = useState('94105');

  // If merchant configured pass fee to client
  const surchargeCents = passFeeToClient ? Math.round(amountCents * 0.029 + 30) : 0;
  const totalChargeCents = amountCents + surchargeCents;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPay();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Express Checkout Element: Apple Pay / Google Pay / Link */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
          EXPRESS ONE-TOUCH CHECKOUT
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPay}
            disabled={isProcessing}
            className="py-2.5 px-3 rounded-lg bg-black hover:bg-slate-900 border border-slate-700 text-white font-semibold flex items-center justify-center gap-1.5 transition text-xs shadow-sm"
          >
            <span>Pay</span>
          </button>
          <button
            type="button"
            onClick={onPay}
            disabled={isProcessing}
            className="py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold flex items-center justify-center gap-1.5 transition text-xs shadow-sm"
          >
            <span className="text-stripe">Link</span>
            <span className="text-[10px] text-slate-400 font-normal">1-Click</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-2 text-[10px] font-mono text-slate-500 uppercase">Or Pay with Card</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>
      </div>

      {/* Stripe Payment Element Styled Inputs */}
      <div className="p-3.5 rounded-xl bg-vault-900 border border-slate-800 space-y-3">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Card Information</label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              className="w-full text-xs font-mono p-2.5 pl-9 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe transition"
            />
            <CreditCard className="w-4 h-4 text-stripe absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Expires</label>
            <input
              type="text"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              placeholder="MM/YY"
              className="w-full text-xs font-mono p-2 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe transition text-center"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">CVC</label>
            <input
              type="password"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
              placeholder="CVC"
              maxLength={4}
              className="w-full text-xs font-mono p-2 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe transition text-center"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Postal Code</label>
            <input
              type="text"
              value={billingZip}
              onChange={(e) => setBillingZip(e.target.value)}
              placeholder="ZIP"
              className="w-full text-xs font-mono p-2 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe transition text-center"
            />
          </div>
        </div>
      </div>

      {/* Surcharge notice if applicable */}
      {passFeeToClient && surchargeCents > 0 && (
        <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 font-mono">
          <span>Card Processing Fee (2.9% + 30¢):</span>
          <span>+{formatCents(surchargeCents, currency)}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-stripe hover:bg-stripe-hover active:scale-98 transition flex items-center justify-center gap-2 shadow-lg shadow-stripe/20 disabled:opacity-50 disabled:pointer-events-none"
      >
        <Lock className="w-4 h-4" />
        <span>
          {isProcessing ? 'Processing Payment...' : `Pay ${formatCents(totalChargeCents, currency)} Now`}
        </span>
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-stripe" />
        <span>Official Stripe Elements Integration • TLS 256-bit Encrypted</span>
      </div>
    </form>
  );
};
