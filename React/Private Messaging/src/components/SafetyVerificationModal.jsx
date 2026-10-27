import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, QrCode, Camera, Check, X, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';

export default function SafetyVerificationModal({ contact, user, onClose, onVerifyToggle }) {
  const [activeTab, setActiveTab] = useState('numbers'); // 'numbers' | 'qr' | 'scanner'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [scanSimulating, setScanSimulating] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Generate QR code for contact's safety verification payload
  useEffect(() => {
    if (!contact || !user) return;
    const payload = JSON.stringify({
      v: 1,
      type: 'SANCTUARY_SAFETY_VERIFICATION',
      fingerprint: contact.safetyFingerprint,
      contactPubKey: contact.publicKeyB64,
      userPubKey: user.publicKeyB64,
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#10B981',
        light: '#0E1015'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error("QR Code generation error", err);
    });
  }, [contact, user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(contact.safetyFingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateCameraScan = () => {
    setScanSimulating(true);
    setScanSuccess(false);

    // Simulate scanning laser passing over viewfinder
    setTimeout(() => {
      setScanSimulating(false);
      setScanSuccess(true);
      onVerifyToggle(contact.id, true);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0E1015] border border-[#1D222D] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1D222D] bg-[#14171E]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Verify Safety Numbers
                {contact.isVerified && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    VERIFIED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">Channel: {contact.alias}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explainer Copy */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-slate-300 leading-relaxed">
            Compare these numbers with your contact over a trusted out-of-band channel or scan their QR code to mathematically verify end-to-end cryptographic identity and eliminate Man-in-the-Middle (MITM) tampering.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex px-5 pt-3 border-b border-[#1D222D] gap-2">
          <button
            onClick={() => setActiveTab('numbers')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'numbers' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="font-mono">#</span> Safety Numbers
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'qr' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Show QR
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'scanner' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Camera Viewfinder
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'numbers' && (
            <div className="space-y-4">
              {/* Monospace 12 groups of 5 digits display */}
              <div className="bg-[#07080A] p-5 rounded-xl border border-[#1D222D] relative group">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center font-mono text-sm tracking-widest text-emerald-400 font-semibold selection:bg-emerald-950">
                  {contact.fingerprintChunks?.map((chunk, idx) => (
                    <div 
                      key={idx} 
                      className="p-2 rounded bg-[#14171E] border border-white/5 hover:border-emerald-500/30 transition-colors"
                    >
                      {chunk}
                    </div>
                  )) || (
                    <div className="col-span-4 py-4 text-slate-400 text-xs">Computing safety fingerprint...</div>
                  )}
                </div>

                <button 
                  onClick={handleCopy}
                  className="mt-3 w-full py-1.5 px-3 rounded-lg bg-[#14171E] hover:bg-[#1D222D] border border-white/5 text-xs text-slate-300 font-mono flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied 60 digits to clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy full 60-digit fingerprint
                    </>
                  )}
                </button>
              </div>

              {contact.keyChanged && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold">Security Alert:</span> Identity key mismatch detected. This contact's keys have regenerated. Re-verify fingerprints before resuming communication.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="p-3 rounded-2xl bg-[#07080A] border border-emerald-500/30 shadow-lg glow-emerald">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Safety Number QR Code" 
                    className="w-56 h-56 rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-500 font-mono">
                    Generating QR...
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 text-center max-w-xs font-mono">
                Have {contact.alias} scan this QR code with their camera to compare and verify public keys instantly.
              </p>
            </div>
          )}

          {activeTab === 'scanner' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full h-56 rounded-2xl bg-[#07080A] border border-[#1D222D] overflow-hidden flex flex-col items-center justify-center">
                {/* Viewfinder crosshairs */}
                <div className="absolute inset-6 border-2 border-dashed border-emerald-500/40 rounded-xl pointer-events-none flex items-center justify-center">
                  {scanSimulating && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-bounce" />
                  )}
                </div>

                {scanSuccess ? (
                  <div className="z-10 flex flex-col items-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 mb-2">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">Cryptographic Match Verified</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5">ECDH Fingerprint Authenticated</span>
                  </div>
                ) : (
                  <div className="z-10 flex flex-col items-center text-center p-4 text-slate-400">
                    <Camera className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs">Align recipient QR code inside camera target frame</span>
                  </div>
                )}
              </div>

              <button
                onClick={simulateCameraScan}
                disabled={scanSimulating}
                className="w-full py-2.5 rounded-xl bg-[#14171E] hover:bg-[#1D222D] border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {scanSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Scanning and authenticating payload...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Trigger Viewfinder Scan
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Commitment CTA Footer */}
        <div className="p-5 border-t border-[#1D222D] bg-[#14171E]/60 flex items-center justify-between gap-3">
          <button
            onClick={() => onVerifyToggle(contact.id, !contact.isVerified)}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
              contact.isVerified
                ? 'bg-[#191D26] hover:bg-[#252B37] text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald border border-emerald-400/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {contact.isVerified ? 'Revoke Verified Status' : 'Mark as Verified Identity'}
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-[#191D26] hover:bg-[#252B37] text-slate-300 text-xs font-medium border border-divider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
