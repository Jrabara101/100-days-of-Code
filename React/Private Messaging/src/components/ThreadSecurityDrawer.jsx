import React, { useState } from 'react';
import { 
  X, Shield, ShieldCheck, AlertTriangle, Key, Flame, Trash2, 
  Copy, Check, Edit2, RefreshCw, EyeOff, Lock
} from 'lucide-react';
import { generateIdenticon } from '../crypto/cryptoEngine';

export default function ThreadSecurityDrawer({ 
  contact, 
  isOpen, 
  onClose, 
  onUpdateAlias, 
  onSetTtl, 
  onVerifyModalOpen, 
  onSimulateKeyChange, 
  onBurnThread 
}) {
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState(contact?.alias || '');
  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmBurn, setConfirmBurn] = useState(false);

  if (!isOpen || !contact) return null;

  const identiconUrl = generateIdenticon(contact.publicKeyB64, 80);

  const handleSaveAlias = (e) => {
    e.preventDefault();
    if (aliasInput.trim()) {
      onUpdateAlias(contact.id, aliasInput);
      setEditingAlias(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(contact.publicKeyB64);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const ttlOptions = [
    { label: '5 Seconds', value: 5 },
    { label: '1 Minute', value: 60 },
    { label: '1 Hour', value: 3600 },
    { label: '24 Hours', value: 86400 },
    { label: 'Off', value: 0 },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#0E1015] border-l border-[#1D222D] shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#1D222D] bg-[#14171E]/60">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-100">Cryptographic Inspector</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* Identicon & Alias */}
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#07080A] border border-[#1D222D]">
          <div className="relative mb-3">
            <img src={identiconUrl} alt="Identicon" className="w-20 h-20 rounded-2xl shadow-md border border-[#1D222D]" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#14171E] border border-[#1D222D] flex items-center justify-center">
              {contact.isVerified ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
          </div>

          {editingAlias ? (
            <form onSubmit={handleSaveAlias} className="w-full flex items-center gap-2 mt-1">
              <input 
                type="text" 
                value={aliasInput} 
                onChange={(e) => setAliasInput(e.target.value)}
                className="flex-1 bg-[#14171E] border border-emerald-500/50 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                autoFocus
              />
              <button 
                type="submit" 
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
              >
                Save
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-base font-semibold text-white">{contact.alias}</h3>
              <button 
                onClick={() => { setAliasInput(contact.alias); setEditingAlias(true); }}
                className="p-1 text-slate-400 hover:text-white"
                title="Edit local alias"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Local alias stored on this device only. Never transmitted.
          </p>
        </div>

        {/* Key Mismatch Sentinel Indicator */}
        {contact.keyChanged && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs space-y-2 animate-key-alert">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Security Sentinel Alert</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This contact's cryptographic keypair changed. Outbound transmissions are locked until you re-verify their identity.
            </p>
            <button
              onClick={() => onVerifyModalOpen(contact)}
              className="w-full py-1.5 px-3 rounded-lg bg-amber-500 text-black font-semibold text-[11px] hover:bg-amber-400 transition-colors"
            >
              Verify New Safety Numbers
            </button>
          </div>
        )}

        {/* Out-of-band Verification Badge */}
        <div className="p-4 rounded-xl bg-[#07080A] border border-[#1D222D] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Out-of-Band Attestation
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              contact.isVerified 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {contact.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-emerald-400/90 bg-[#14171E] p-2.5 rounded-lg border border-white/5 break-all">
            {contact.safetyFingerprint ? `${contact.safetyFingerprint.slice(0, 29)}...` : 'Generating fingerprint...'}
          </div>

          <button
            onClick={() => onVerifyModalOpen(contact)}
            className="w-full py-2 rounded-lg bg-[#14171E] hover:bg-[#1D222D] border border-divider text-xs text-slate-200 font-medium transition-colors"
          >
            Open Safety Numbers & QR Hub
          </button>
        </div>

        {/* Public Key Display */}
        <div className="p-4 rounded-xl bg-[#07080A] border border-[#1D222D] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" /> ECDH Public Key
            </span>
            <button 
              onClick={handleCopyKey}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
            >
              {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedKey ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="text-[11px] font-mono text-slate-400 bg-[#14171E] p-2.5 rounded-lg border border-white/5 break-all">
            {contact.publicKeyB64}
          </div>
        </div>

        {/* Disappearing Message Preset Horizon */}
        <div className="p-4 rounded-xl bg-[#07080A] border border-[#1D222D] space-y-2">
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-400" /> Ephemeral Horizon (TTL)
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {ttlOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSetTtl(contact.id, opt.value)}
                className={`py-1.5 px-3 rounded-lg text-xs font-mono transition-colors text-center border ${
                  contact.defaultTtl === opt.value
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                    : 'bg-[#14171E] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Forensic & Sentinel Simulation */}
        <div className="p-4 rounded-xl bg-[#07080A] border border-amber-500/20 space-y-2">
          <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Test Key Mismatch Sentinel
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Simulate a contact device reinstall to trigger the cryptographic Key Change alert and composer lockdown.
          </p>
          <button
            onClick={() => onSimulateKeyChange(contact.id)}
            className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium transition-colors"
          >
            Regenerate Contact Keys
          </button>
        </div>

        {/* Irreversible Burn Thread */}
        <div className="p-4 rounded-xl bg-[#07080A] border border-red-500/20 space-y-2">
          <span className="text-xs font-medium text-red-400 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-red-400" /> Shredder Auto-Purge
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Definitively purge this entire conversation history from local encrypted memory.
          </p>

          {confirmBurn ? (
            <div className="flex gap-2">
              <button
                onClick={() => { onBurnThread(contact.id); setConfirmBurn(false); onClose(); }}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                Confirm Shred
              </button>
              <button
                onClick={() => setConfirmBurn(false)}
                className="px-3 py-2 rounded-lg bg-[#14171E] text-slate-400 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmBurn(true)}
              className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition-colors"
            >
              Burn Entire Thread
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
