import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  Check, 
  Sparkles, 
  HelpCircle, 
  AlertCircle 
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { formatCents } from '../utils/formatters';

export const BidderPaddleVerificationModal: React.FC = () => {
  const { 
    currentUser, 
    updatePaddle, 
    isPaddleModalOpen, 
    setIsPaddleModalOpen 
  } = useAuction();

  const [depositTier, setDepositTier] = useState<number>(100000); // $1,000 hold -> $50,000 limit
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4092');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isPaddleModalOpen) return null;

  const getBiddingLimit = (depositCents: number) => {
    switch (depositCents) {
      case 25000: return 1000000;   // $250 hold -> $10,000 limit
      case 100000: return 5000000;  // $1,000 hold -> $50,000 limit
      case 250000: return 25000000; // $2,500 hold -> $250,000 limit
      default: return 5000000;
    }
  };

  const handleAuthorizeHold = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorizing(true);

    setTimeout(() => {
      setIsAuthorizing(false);
      setIsSuccess(true);

      updatePaddle({
        paddleNumber: currentUser.paddle.paddleNumber || '#4092',
        heldDepositCents: depositTier,
        biddingLimitCents: getBiddingLimit(depositTier),
        holdStatus: 'active_authorized',
        isVerified: true,
        verifiedAt: new Date().toISOString(),
      });

      setTimeout(() => {
        setIsSuccess(false);
        setIsPaddleModalOpen(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#181B23] border border-[#E5E3DC] dark:border-[#252934] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-[#111315] dark:text-[#F8FAFC]">
                Verified Bidder Paddle
              </h3>
              <p className="text-xs text-[#646870] dark:text-[#8E96A8]">
                Instant KYC & Stripe Pre-Authorization Hold
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPaddleModalOpen(false)}
            className="text-neutral-400 hover:text-neutral-200 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h4 className="font-serif text-2xl font-bold text-[#111315] dark:text-[#F8FAFC]">
              Paddle {currentUser.paddle.paddleNumber} Activated!
            </h4>
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Pre-Auth Hold of {formatCents(depositTier)} Authorized • Bidding Limit {formatCents(getBiddingLimit(depositTier))}
            </p>
          </div>
        ) : (
          <form onSubmit={handleAuthorizeHold} className="space-y-5 text-xs font-mono">
            {/* Value Proposition Note */}
            <div className="p-3.5 rounded-xl bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] text-[11px] text-[#646870] dark:text-[#8E96A8] leading-relaxed">
              <span className="font-semibold text-[#111315] dark:text-[#F8FAFC] block mb-0.5">
                Zero-Charge Pre-Authorization Policy:
              </span>
              Your card is NOT charged today. A temporary pre-authorization hold is placed via Stripe to ensure high-trust bidding without defaults. The hold releases automatically if you don't win.
            </div>

            {/* Select Deposit Tier */}
            <div className="space-y-2">
              <label className="text-[11px] text-[#646870] dark:text-[#8E96A8] uppercase tracking-wider block">
                Select Hold Deposit Tier & Bidding Power:
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDepositTier(25000)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    depositTier === 25000
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-[#FAF9F5] dark:bg-[#12141A] border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8]'
                  }`}
                >
                  <span className="block text-sm font-bold text-[#111315] dark:text-[#F8FAFC]">$250</span>
                  <span className="text-[10px] block">$10k Limit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositTier(100000)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    depositTier === 100000
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-[#FAF9F5] dark:bg-[#12141A] border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8]'
                  }`}
                >
                  <span className="block text-sm font-bold text-[#111315] dark:text-[#F8FAFC]">$1,000</span>
                  <span className="text-[10px] block text-emerald-600 dark:text-emerald-400 font-semibold">$50k Limit ★</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositTier(250000)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    depositTier === 250000
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-[#FAF9F5] dark:bg-[#12141A] border-[#E5E3DC] dark:border-[#252934] text-[#646870] dark:text-[#8E96A8]'
                  }`}
                >
                  <span className="block text-sm font-bold text-[#111315] dark:text-[#F8FAFC]">$2,500</span>
                  <span className="text-[10px] block">$250k Limit</span>
                </button>
              </div>
            </div>

            {/* Simulated Stripe Card Element */}
            <div className="space-y-3">
              <label className="text-[11px] text-[#646870] dark:text-[#8E96A8] uppercase tracking-wider block">
                Stripe Payment Hold Guardrails:
              </label>

              <div className="p-3.5 rounded-xl bg-[#FAF9F5] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] space-y-2">
                <div className="flex items-center gap-2 text-[#646870] dark:text-[#8E96A8] pb-1 border-b border-neutral-200 dark:border-neutral-800">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>Card Pre-Authorization (Stripe Manual Capture)</span>
                </div>

                <div>
                  <label className="text-[10px] text-[#646870] dark:text-[#8E96A8] block">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full bg-transparent text-[#111315] dark:text-[#F8FAFC] font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <div>
                    <label className="text-[10px] text-[#646870] dark:text-[#8E96A8] block">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full bg-transparent text-[#111315] dark:text-[#F8FAFC] font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#646870] dark:text-[#8E96A8] block">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      className="w-full bg-transparent text-[#111315] dark:text-[#F8FAFC] font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Authorize Button */}
            <button
              type="submit"
              disabled={isAuthorizing}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isAuthorizing 
                  ? 'Authorizing with Stripe...' 
                  : `Authorize ${formatCents(depositTier)} Hold & Unlock Paddle ${currentUser.paddle.paddleNumber}`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

