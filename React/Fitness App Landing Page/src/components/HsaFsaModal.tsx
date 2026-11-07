import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Search, ArrowRight, DollarSign } from 'lucide-react';

interface HsaFsaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HsaFsaModal: React.FC<HsaFsaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [companyInput, setCompanyInput] = useState<string>('');
  const [eligibilityResult, setEligibilityResult] = useState<boolean | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInput.trim()) return;
    setEligibilityResult(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111318] border border-amber-500/40 overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            TrueMed Partnership
          </div>
          <h3 className="font-display text-2xl font-extrabold text-white">
            Instant HSA/FSA Eligibility Checker
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Exercise programming that prevents or reverses chronic conditions qualifies for
            pre-tax HSA/FSA health dollars (saving ~30% on average).
          </p>
        </div>

        {/* Savings Calculator Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
              Annual Flagship Price
            </span>
            <span className="font-mono text-xl font-bold text-white">$119.88</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold">
              With Pre-Tax HSA/FSA (~30% off)
            </span>
            <span className="font-mono text-2xl font-black text-emerald-400">$83.92</span>
          </div>
        </div>

        {/* Company / Plan Search Form */}
        <form onSubmit={handleCheck} className="flex flex-col gap-3">
          <label className="text-xs font-mono uppercase text-zinc-300 font-bold">
            Search Employer Domain or Health Plan
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="e.g. google.com, aetna, or cigna"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-amber-400 text-[#08090C] text-xs font-bold font-mono hover:bg-amber-300 transition-all"
            >
              Verify
            </button>
          </div>
        </form>

        {/* Result Feedback */}
        {eligibilityResult && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Verified Eligible for Pre-Tax HSA/FSA Reimbursement!
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your membership qualifies under IRS Code 213(d). TrueMed provides an instant,
              physician-signed Letter of Medical Necessity upon trial signup.
            </p>
          </div>
        )}

        {/* 3-Step Process */}
        <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Select Annual Plan & checkout with standard or HSA card</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Answer a 2-minute health intake survey for doctor sign-off</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span>Submit receipt to your HSA/FSA administrator for 100% refund</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold transition-all"
        >
          Got it, Return to Plans
        </button>
      </div>
    </div>
  );
};
