import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Radio, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Server, 
  Smartphone,
  Info
} from 'lucide-react';

export function SignalingModal({
  isOpen,
  onClose,
  role,
  connectionStatus,
  generatedToken,
  tokenType,
  onHostMatch,
  onJoinOffer,
  onAcceptAnswer,
  onResetPeer
}) {
  const [inputToken, setInputToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClientSubmit = () => {
    if (!inputToken.trim()) {
      setErrorMsg('Please paste the Host Offer SDP token first.');
      return;
    }
    setErrorMsg('');
    onJoinOffer(inputToken.trim());
    setInputToken('');
  };

  const handleHostSubmit = () => {
    if (!inputToken.trim()) {
      setErrorMsg('Please paste Player 2 Answer SDP token first.');
      return;
    }
    setErrorMsg('');
    onAcceptAnswer(inputToken.trim());
    setInputToken('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel rounded-2xl border border-cyber-cyan/30 p-6 flex flex-col gap-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyber-rose/20 border border-cyber-rose/50 flex items-center justify-center">
              <Radio className="w-4 h-4 text-cyber-rose" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                WEBRTC_LAN_HANDSHAKE
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Direct Browser-to-Browser UDP DataChannel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs font-mono text-slate-300">
          <Info className="w-4 h-4 text-cyber-cyan flex-shrink-0 mt-0.5" />
          <p>
            Zero external server required! Exchange the compact SDP tokens across two tabs, windows, or devices on the same local network.
          </p>
        </div>

        {/* Role Selection (If no role chosen yet) */}
        {!role && (
          <div className="flex flex-col sm:flex-row gap-4 my-2">
            <button
              onClick={onHostMatch}
              className="flex-1 bg-gradient-to-br from-cyber-cyan/20 to-sky-900/40 hover:from-cyber-cyan/30 hover:to-sky-800/50 border border-cyber-cyan/50 text-cyber-cyan p-5 rounded-2xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-glow-cyan"
            >
              <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/30">
                <Server className="w-6 h-6 text-cyber-cyan" />
              </div>
              <div className="text-center">
                <span className="block font-bold text-sm uppercase tracking-wide">
                  🎮 Host Match (P1)
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Authoritative physics host. Creates offer token.
                </span>
              </div>
            </button>

            <button
              onClick={() => onJoinOffer('')}
              className="flex-1 bg-gradient-to-br from-cyber-rose/20 to-rose-900/40 hover:from-cyber-rose/30 hover:to-rose-800/50 border border-cyber-rose/50 text-cyber-rose p-5 rounded-2xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-glow-rose"
            >
              <div className="w-12 h-12 rounded-xl bg-cyber-rose/10 flex items-center justify-center border border-cyber-rose/30">
                <Smartphone className="w-6 h-6 text-cyber-rose" />
              </div>
              <div className="text-center">
                <span className="block font-bold text-sm uppercase tracking-wide">
                  🕹️ Join Match (P2)
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Client prediction & interpolation. Connects to host.
                </span>
              </div>
            </button>
          </div>
        )}

        {/* HOST WORKFLOW */}
        {role === 'HOST' && (
          <div className="flex flex-col gap-4 font-mono text-xs">
            {/* Step 1: Copy Host Offer */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span>1. COPY HOST OFFER (SEND TO PLAYER 2):</span>
                {copied && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> COPIED TO CLIPBOARD
                  </span>
                )}
              </label>

              <div className="relative">
                <textarea
                  readOnly
                  value={generatedToken || 'Generating local LAN offer...'}
                  onClick={handleCopy}
                  className="w-full h-20 bg-slate-950 text-cyber-cyan p-3 rounded-xl border border-slate-700 text-[10px] font-mono cursor-pointer resize-none focus:outline-none focus:border-cyber-cyan pr-10"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-2.5 top-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  title="Copy Offer Token"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Step 2: Paste Player 2 Answer */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold">
                2. PASTE PLAYER 2 ANSWER STRING:
              </label>
              <textarea
                placeholder="Paste Player 2 Answer token here..."
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full h-20 bg-slate-950 text-white p-3 rounded-xl border border-slate-700 text-[10px] font-mono resize-none focus:outline-none focus:border-cyber-cyan"
              />
            </div>

            {errorMsg && <p className="text-rose-400 text-[11px]">{errorMsg}</p>}

            <button
              onClick={handleHostSubmit}
              disabled={!inputToken.trim()}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow-emerald"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ESTABLISH P2P LINK</span>
            </button>
          </div>
        )}

        {/* CLIENT WORKFLOW */}
        {role === 'CLIENT' && (
          <div className="flex flex-col gap-4 font-mono text-xs">
            {/* Step 1: Paste Host Offer */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold">
                1. PASTE HOST OFFER TOKEN:
              </label>
              <textarea
                placeholder="Paste Host Offer string here..."
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full h-20 bg-slate-950 text-white p-3 rounded-xl border border-slate-700 text-[10px] font-mono resize-none focus:outline-none focus:border-cyber-rose"
              />
            </div>

            <button
              onClick={handleClientSubmit}
              disabled={!inputToken.trim()}
              className="w-full py-2.5 bg-cyber-rose hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow-rose"
            >
              <ArrowRight className="w-4 h-4" />
              <span>GENERATE CLIENT ANSWER</span>
            </button>

            {/* Step 2: Copy Generated Answer */}
            {generatedToken && (
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>2. SEND THIS ANSWER BACK TO HOST:</span>
                  {copied && (
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> COPIED TO CLIPBOARD
                    </span>
                  )}
                </label>

                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedToken}
                    onClick={handleCopy}
                    className="w-full h-20 bg-slate-950 text-cyber-rose p-3 rounded-xl border border-slate-700 text-[10px] font-mono cursor-pointer resize-none focus:outline-none focus:border-cyber-rose pr-10"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute right-2.5 top-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                    title="Copy Answer Token"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {errorMsg && <p className="text-rose-400 text-[11px]">{errorMsg}</p>}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-mono">
          <button
            onClick={onResetPeer}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET PEER</span>
          </button>

          <span className="text-slate-500 text-[10px]">
            STATUS: <strong className="text-cyber-cyan">{connectionStatus}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
