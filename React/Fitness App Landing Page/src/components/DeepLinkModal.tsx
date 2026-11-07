import React, { useState } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSmartDeviceDetection } from '../hooks/useSmartDeviceDetection';

interface DeepLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  goalTitle: string;
}

export const DeepLinkModal: React.FC<DeepLinkModalProps> = ({
  isOpen,
  onClose,
  token,
  goalTitle,
}) => {
  if (!isOpen) return null;

  const { isMobile, storeName, storeUrl } = useSmartDeviceDetection();
  const [phone, setPhone] = useState<string>('');
  const [smsSent, setSmsSent] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);

  const deepLinkUrl = `https://get.pulsefit.app/b/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(deepLinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSmsSent(true);
  };

  const handleSimulateClaim = () => {
    setClaimed(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4FF00', '#10B981', '#38BDF8', '#FFFFFF'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111318] border border-[#D4FF00]/40 overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-[#D4FF00] font-mono text-xs font-bold uppercase mb-2">
            <Zap className="w-3.5 h-3.5" />
            Deferred Deep-Link Engine
          </div>
          <h3 className="font-display text-2xl font-extrabold text-white">
            Beam Your Split to Your Phone
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Your customized <span className="text-white font-bold">{goalTitle}</span> plan is
            encoded in token <span className="font-mono text-[#D4FF00] font-bold">[{token}]</span>.
          </p>
        </div>

        {/* Dynamic QR Code Box */}
        <div className="p-6 rounded-2xl bg-black/80 border border-white/10 flex flex-col items-center justify-center gap-4 text-center">
          <div className="relative w-44 h-44 rounded-2xl bg-white p-3 shadow-xl flex items-center justify-center">
            {/* SVG High-Contrast QR Code */}
            <div className="grid grid-cols-7 gap-1 w-full h-full p-1 bg-white">
              {/* Outer corner markers and data matrix */}
              <div className="bg-[#08090C] rounded-sm col-span-2 row-span-2" />
              <div className="bg-white col-span-3 row-span-2" />
              <div className="bg-[#08090C] rounded-sm col-span-2 row-span-2" />

              <div className="bg-[#08090C] col-span-1" />
              <div className="bg-[#08090C] col-span-2" />
              <div className="bg-[#08090C] col-span-1" />
              <div className="bg-[#08090C] col-span-1" />
              <div className="bg-white col-span-1" />
              <div className="bg-[#08090C] col-span-1" />

              <div className="bg-[#08090C] col-span-2" />
              <div className="bg-[#D4FF00] col-span-3 rounded-xs" />
              <div className="bg-[#08090C] col-span-2" />

              <div className="bg-[#08090C] rounded-sm col-span-2 row-span-2" />
              <div className="bg-white col-span-3 row-span-2" />
              <div className="bg-[#08090C] rounded-sm col-span-2 row-span-2" />
            </div>

            {/* Center Logo Pip */}
            <div className="absolute inset-0 m-auto w-10 h-10 rounded-lg bg-[#08090C] border-2 border-[#D4FF00] flex items-center justify-center font-mono font-black text-xs text-[#D4FF00]">
              PF
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-300 font-bold">
              Point your iPhone or Android camera at the screen
            </span>
            <span className="text-[11px] font-mono text-emerald-400 mt-0.5">
              ✓ Preserves custom plan, coach vibe & 14-day trial pass
            </span>
          </div>
        </div>

        {/* Or Text Me A Magic Link */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono uppercase text-zinc-400 font-bold text-center">
            Or Send via SMS / WhatsApp
          </span>
          {smsSent ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Link dispatched to <strong className="text-white">{phone}</strong>! Open on
                your phone to launch directly into Day 1.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendSms} className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="flex-1 h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                required
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-xl bg-[#D4FF00] text-[#08090C] text-xs font-bold font-mono hover:bg-[#c3ec00] transition-all flex items-center gap-1.5"
              >
                Send SMS <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Deep Link URL Copy Strip */}
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 truncate max-w-[260px]">{deepLinkUrl}</span>
          <button
            onClick={handleCopy}
            className="text-[#D4FF00] hover:underline flex items-center gap-1 text-[11px] font-bold"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Simulation Button */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500">
            Testing Deferred Deep-Link?
          </span>
          <button
            onClick={handleSimulateClaim}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-white font-bold transition-all flex items-center gap-1"
          >
            {claimed ? '✓ Hydrated in App' : 'Simulate First App Launch'}
          </button>
        </div>
      </div>
    </div>
  );
};
