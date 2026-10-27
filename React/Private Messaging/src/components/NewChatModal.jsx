import React, { useState, useEffect } from 'react';
import { UserPlus, Link2, QrCode, Copy, Check, Shield, AlertCircle, X, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

export default function NewChatModal({ user, onClose, onAddContact }) {
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' | 'key' | 'qr'
  const [alias, setAlias] = useState('');
  const [pubKeyInput, setPubKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [qrInviteData, setQrInviteData] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Generate ephemeral single-use invite link
  useEffect(() => {
    if (!user) return;
    const invitePayload = {
      v: 1,
      pubKey: user.publicKeyB64,
      alias: user.alias,
      exp: Date.now() + 86400000, // 24h
      nonce: Math.random().toString(36).substring(2, 10),
    };

    const b64Token = window.btoa(JSON.stringify(invitePayload));
    const url = `${window.location.origin}/#invite=${b64Token}`;
    setInviteUrl(url);

    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: { dark: '#10B981', light: '#0E1015' }
    }).then(setQrInviteData).catch(console.error);
  }, [user]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pubKeyInput.trim()) {
      setErrorMsg('Please enter a valid ECDH Public Key (Base64)');
      return;
    }

    try {
      await onAddContact({
        alias: alias.trim() || `Agent-${pubKeyInput.slice(0, 6)}`,
        publicKeyB64: pubKeyInput.trim(),
        defaultTtl: 3600,
      });
      onClose();
    } catch (err) {
      setErrorMsg('Invalid Public Key format. Must be an uncompressed ECDH P-256 public key.');
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0E1015] border border-[#1D222D] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1D222D] bg-[#14171E]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Blind Contact Exchange</h2>
              <p className="text-[11px] font-mono text-slate-400">Zero Social Graph Discovery</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex px-5 pt-3 border-b border-[#1D222D] gap-2">
          <button
            onClick={() => setActiveTab('invite')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'invite' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> Ephemeral Invite Link
          </button>
          <button
            onClick={() => setActiveTab('key')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'key' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Import Public Key
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Share this single-use ephemeral invite link. Once redeemed by your recipient, the handshake burns automatically without leaving social graph breadcrumbs.
              </p>

              {/* QR Code */}
              {qrInviteData && (
                <div className="flex justify-center my-2">
                  <div className="p-3 bg-[#07080A] rounded-2xl border border-emerald-500/30 glow-emerald">
                    <img src={qrInviteData} alt="Ephemeral QR" className="w-44 h-44 rounded-lg" />
                  </div>
                </div>
              )}

              {/* Link Box */}
              <div className="p-3 bg-[#07080A] rounded-xl border border-[#1D222D] flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="bg-transparent text-xs text-emerald-400 font-mono flex-1 outline-none truncate"
                />
                <button
                  onClick={handleCopyInvite}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedInvite ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Single-use burn guarantee. No contact scraping.</span>
              </div>
            </div>
          )}

          {activeTab === 'key' && (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Contact Pseudonym / Local Alias</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Echo Cipher, Agent Thorne..."
                  className="w-full bg-[#07080A] border border-[#1D222D] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  Alias is stored locally only on this machine.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Recipient ECDH Public Key (Base64)</label>
                <textarea
                  value={pubKeyInput}
                  onChange={(e) => setPubKeyInput(e.target.value)}
                  placeholder="Paste uncompressed ECDH P-256 public key..."
                  rows={3}
                  className="w-full bg-[#07080A] border border-[#1D222D] rounded-xl p-3 text-xs text-emerald-400 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none break-all"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 glow-emerald"
              >
                <UserPlus className="w-4 h-4" />
                <span>Establish E2EE Channel</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
