import React, { useState } from 'react';
import { formatCents } from '../../utils/currency';
import { Landmark, Search, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

interface AchBankTransferDockProps {
  amountCents: number;
  currency: string;
  onPay: (bankName: string) => Promise<void>;
  isProcessing: boolean;
  savingsCents?: number;
}

const popularBanks = [
  { id: 'chase', name: 'JPMorgan Chase', logo: '🏦' },
  { id: 'bofa', name: 'Bank of America', logo: '🏛️' },
  { id: 'wells', name: 'Wells Fargo', logo: '🐎' },
  { id: 'mercury', name: 'Mercury Bank', logo: '🪐' },
  { id: 'citi', name: 'Citibank', logo: '🏙️' },
];

export const AchBankTransferDock: React.FC<AchBankTransferDockProps> = ({
  amountCents,
  currency,
  onPay,
  isProcessing,
  savingsCents = 24500,
}) => {
  const [selectedBank, setSelectedBank] = useState<string>('JPMorgan Chase');
  const [accountNumber, setAccountNumber] = useState('•••• 9012');
  const [routingNumber, setRoutingNumber] = useState('021000021');
  const [agreedToDebit, setAgreedToDebit] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToDebit) return;
    onPay(selectedBank);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Zero Fee Callout */}
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Processing Fee ($0.00)</span>
        </div>
        <p className="text-[11px] text-emerald-400/90 leading-relaxed">
          Stripe Financial Connections ACH settles directly from your business checking account, saving {formatCents(savingsCents)} compared to credit cards.
        </p>
      </div>

      {/* Instant Bank Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          INSTANT BANK CONNECTION (STRIPE ACH)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {popularBanks.map((bank) => {
            const isSelected = selectedBank === bank.name;
            return (
              <button
                type="button"
                key={bank.id}
                onClick={() => setSelectedBank(bank.name)}
                className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                    : 'bg-vault-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-base">{bank.logo}</span>
                <span className="font-medium truncate text-xs">{bank.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Verification Details */}
      <div className="p-3 rounded-lg bg-vault-900 border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Connected Account:</span>
          <span className="font-mono text-emerald-400 font-semibold">{selectedBank} (Checking)</span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Account Routing:</span>
          <span className="font-mono text-slate-300">{routingNumber}</span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Account Number:</span>
          <span className="font-mono text-slate-300">{accountNumber}</span>
        </div>
      </div>

      {/* NACHA Electronic Debit Consent */}
      <label className="flex items-start gap-2.5 cursor-pointer text-slate-400 text-[11px] leading-relaxed pt-1 select-none">
        <input
          type="checkbox"
          checked={agreedToDebit}
          onChange={(e) => setAgreedToDebit(e.target.checked)}
          className="rounded border-slate-700 text-emerald-500 focus:ring-0 mt-0.5"
        />
        <span>
          I authorize Studio Hyperion LLC to electronically debit my {selectedBank} account for{' '}
          <strong className="text-white font-mono">{formatCents(amountCents, currency)}</strong> via the Automated Clearing House (ACH) network.
        </span>
      </label>

      {/* Payment Action Button */}
      <button
        type="submit"
        disabled={isProcessing || !agreedToDebit}
        className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:pointer-events-none"
      >
        <Lock className="w-4 h-4" />
        <span>
          {isProcessing
            ? 'Authorizing Bank Debit...'
            : `Authorize ACH Transfer of ${formatCents(amountCents, currency)} ($0 Fee)`}
        </span>
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Secured by Stripe Financial Connections • End-to-End Encrypted</span>
      </div>
    </form>
  );
};
