import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, Monitor, QrCode, Copy, Check, Cast } from 'lucide-react';
import QRCode from 'qrcode';
import { Dialog } from '@/components/ui/dialog';

interface DualScreenPairingModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  viewMode: 'standard' | 'mobile_stylus' | 'tv_spectator';
  onSelectViewMode: (mode: 'standard' | 'mobile_stylus' | 'tv_spectator') => void;
}

export const DualScreenPairingModal: React.FC<DualScreenPairingModalProps> = ({
  open,
  onClose,
  roomId,
  viewMode,
  onSelectViewMode,
}) => {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !qrCanvasRef.current) return;

    const currentUrl = window.location.origin + window.location.pathname + `?room=${roomId}&view=mobile`;

    QRCode.toCanvas(
      qrCanvasRef.current,
      currentUrl,
      {
        width: 160,
        margin: 1,
        color: {
          dark: '#1E2638',
          light: '#F8F4EC',
        },
      },
      (error) => {
        if (error) console.error('QR code generation error:', error);
      }
    );
  }, [open, roomId]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose} className="max-w-md text-left">
      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#D5C7B0]">
        <div className="w-8 h-8 rounded-xl bg-studio-sienna/15 border border-studio-sienna/30 text-studio-sienna flex items-center justify-center">
          <Cast className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-serif font-bold text-studio-ink">
            Dual-Screen Pairing & Mobile Stylus
          </h2>
          <p className="text-[11px] text-studio-charcoal/80 font-sans">
            Cast the easel to your TV while using your phone as a stylus pad!
          </p>
        </div>
      </div>

      {/* QR Code & Room Code Card */}
      <div className="p-3.5 bg-white/80 rounded-2xl border border-[#D5C7B0] flex flex-col sm:flex-row items-center gap-3.5 mb-3 shadow-sm">
        {/* QR Canvas */}
        <div className="p-2 bg-studio-paper rounded-xl border border-[#D5C7B0] shrink-0 shadow-inner flex flex-col items-center">
          <canvas ref={qrCanvasRef} className="rounded-lg" />
          <span className="text-[9px] font-serif text-studio-charcoal mt-1 flex items-center gap-1">
            <QrCode className="w-3 h-3" /> Camera Scan to Join
          </span>
        </div>

        {/* 4-Character Room Code & Explanation */}
        <div className="flex-1 text-center sm:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-studio-charcoal/80">
            Room Code Entry
          </span>
          <div className="flex items-center justify-center sm:justify-start gap-2 my-1">
            <div className="px-3.5 py-1.5 bg-studio-paper border-2 border-studio-sienna/50 rounded-xl font-mono font-extrabold text-xl text-studio-ink tracking-widest shadow-inner">
              {roomId}
            </div>
            <button
              onClick={copyCode}
              className="p-2 bg-studio-paper hover:bg-white border border-[#D5C7B0] rounded-xl text-studio-charcoal transition active:scale-95 shadow-xs"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-studio-charcoal font-sans mt-1">
            Instant entry without app store installs or account creation.
          </p>
        </div>
      </div>

      {/* Layout View Mode Switcher */}
      <div>
        <label className="block text-[11px] font-bold text-studio-charcoal uppercase tracking-wider mb-1.5">
          Choose Your Screen Role
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* Standard / TV Display */}
          <button
            onClick={() => {
              onSelectViewMode('standard');
              onClose();
            }}
            className={`p-3 rounded-2xl border text-left transition active:scale-95 flex flex-col justify-between ${
              viewMode === 'standard'
                ? 'bg-amber-100/80 border-studio-sienna ring-1 ring-studio-sienna'
                : 'bg-white border-[#D5C7B0] hover:bg-studio-paper'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Monitor className="w-4 h-4 text-studio-sienna" />
              {viewMode === 'standard' && <Check className="w-3.5 h-3.5 text-studio-sienna" />}
            </div>
            <div>
              <div className="font-serif font-bold text-xs text-studio-ink">Studio Easel / TV</div>
              <div className="text-[10px] text-studio-charcoal/75">
                Desktop layout with chat, pad, and scoreboard.
              </div>
            </div>
          </button>

          {/* Mobile Stylus View */}
          <button
            onClick={() => {
              onSelectViewMode('mobile_stylus');
              onClose();
            }}
            className={`p-3 rounded-2xl border text-left transition active:scale-95 flex flex-col justify-between ${
              viewMode === 'mobile_stylus'
                ? 'bg-amber-100/80 border-studio-sienna ring-1 ring-studio-sienna'
                : 'bg-white border-[#D5C7B0] hover:bg-studio-paper'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Smartphone className="w-4 h-4 text-studio-sienna" />
              {viewMode === 'mobile_stylus' && <Check className="w-3.5 h-3.5 text-studio-sienna" />}
            </div>
            <div>
              <div className="font-serif font-bold text-xs text-studio-ink">Mobile Stylus Pad</div>
              <div className="text-[10px] text-studio-charcoal/75">
                Full-touch responsive drawing pad with haptic feel.
              </div>
            </div>
          </button>
        </div>
      </div>
    </Dialog>
  );
};
