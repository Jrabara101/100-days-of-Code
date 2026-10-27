import React, { useState } from 'react';
import { Shield, Key, Copy, Check, Lock, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { generateIdenticon } from '../crypto/cryptoEngine';

export default function OnboardingModal({ user, onComplete, onRegenerateMnemonic }) {
  const [alias, setAlias] = useState(user?.alias || 'Cipher-Ghost');
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [confirmedSafeguard, setConfirmedSafeguard] = useState(false);

  const mnemonicWords = user?.mnemonic ? user.mnemonic.split(' ') : [];
  const identiconUrl = user?.publicKeyB64 ? generateIdenticon(user.publicKeyB64, 72) : '';

  const handleCopySeed = () => {
    if (user?.mnemonic) {
      navigator.clipboard.writeText(user.mnemonic);
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!confirmedSafeguard) return;
    onComplete(alias);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0E1015] border border-[#1D222D] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#1D222D] bg-[#14171E]/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-emerald">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cryptographic Identity Armed
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ZERO-KNOWLEDGE
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Client-Generated ECDH P-256 Keypair</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Pseudonym & Identicon */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#07080A] border border-[#1D222D]">
            <img src={identiconUrl} alt="Your Identicon" className="w-14 h-14 rounded-xl border border-[#1D222D]" />
            <div className="flex-1">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Local Pseudonym (Device Alias)</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-[#14171E] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="Enter pseudonym..."
              />
            </div>
          </div>

          {/* BIP-39 Seed Words */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> 12-Word Mnemonic Recovery Seed
              </span>
              <button
                type="button"
                onClick={handleCopySeed}
                className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copiedSeed ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedSeed ? 'Copied' : 'Copy Words'}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-[#07080A] p-4 rounded-xl border border-[#1D222D]">
              {mnemonicWords.map((word, idx) => (
                <div 
                  key={idx} 
                  className="p-2 rounded-lg bg-[#14171E] border border-white/5 flex items-center gap-1.5 text-xs font-mono"
                >
                  <span className="text-[10px] text-slate-500">{idx + 1}.</span>
                  <span className="text-slate-200 font-medium">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zero Knowledge Safeguard Checkbox */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1">
              <span className="font-semibold">Blind Relay Architecture:</span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Sanctuary does not store your phone number, email, or passwords on any server. If you lose your recovery phrase, recovery is mathematically impossible.
              </p>
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none text-slate-200 font-medium">
                <input
                  type="checkbox"
                  checked={confirmedSafeguard}
                  onChange={(e) => setConfirmedSafeguard(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-[#07080A]"
                />
                <span>I have secured my 12-word phrase safely</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1D222D] bg-[#14171E]/60 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            Vault PIN: 1337 | Duress: 9999
          </div>
          <button
            onClick={handleSubmit}
            disabled={!confirmedSafeguard}
            className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 glow-emerald"
          >
            <span>Enter The Sanctuary</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
