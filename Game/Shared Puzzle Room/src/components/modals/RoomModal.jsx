import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { soundSynth } from '../../utils/audioSynth';
import { X, Copy, ExternalLink, RefreshCw, Users, ShieldCheck } from 'lucide-react';

export default function RoomModal({ isOpen, onClose }) {
  const { roomId, setRoomId, playerRole, setPlayerRole } = useNetwork();
  const [inputCode, setInputCode] = useState(roomId);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSaveCode = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setRoomId(inputCode.trim().toUpperCase());
      soundSynth.playClick(900);
      onClose();
    }
  };

  const handleGenerateRandom = () => {
    const randomId = `SIGMA-${Math.floor(1000 + Math.random() * 9000)}`;
    setInputCode(randomId);
    soundSynth.playClick(1100);
  };

  const handleOpenPartnerTab = () => {
    const partnerRole = playerRole === 'p1' ? 'p2' : 'p1';
    const partnerUrl = `${window.location.origin}${window.location.pathname}?room=${inputCode || roomId}&role=${partnerRole}`;
    window.open(partnerUrl, '_blank', 'width=1200,height=800');
    soundSynth.playStageComplete();
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${inputCode || roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    soundSynth.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl shadow-2xl max-w-lg w-full p-space-md space-y-space-md relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-headline-md text-headline-md text-on-surface">
              Co-op Chamber Pairing
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-outline transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Room Code Config */}
        <form onSubmit={handleSaveCode} className="space-y-space-sm">
          <label className="block font-label-caps text-label-caps text-outline uppercase">
            Sector Room Code:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="SIGMA-7749"
              className="flex-1 bg-surface-container-lowest border border-outline-variant/50 rounded px-space-sm py-2 font-telemetry-md text-telemetry-md text-primary tracking-widest uppercase focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleGenerateRandom}
              className="px-space-sm bg-surface-container-high hover:bg-surface-variant text-on-surface rounded flex items-center gap-1 font-label-caps text-[11px] uppercase transition-colors"
              title="Generate Random Room"
            >
              <RefreshCw size={14} />
              NEW
            </button>
            <button
              type="submit"
              className="px-space-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-caps text-label-caps uppercase font-bold transition-all"
            >
              CONNECT
            </button>
          </div>
        </form>

        {/* Player Role Selector */}
        <div className="space-y-space-xs">
          <label className="block font-label-caps text-label-caps text-outline uppercase">
            Select Your Chamber Console:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setPlayerRole('p1');
                soundSynth.playClick(800);
              }}
              className={`p-space-sm rounded border flex flex-col items-center gap-1 transition-all ${
                playerRole === 'p1'
                  ? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(162,201,255,0.4)] font-bold'
                  : 'bg-surface-container border-outline-variant/30 text-outline hover:text-on-surface'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="font-label-caps text-[11px]">CON_ALPHA</span>
              <span className="text-[10px] text-primary/80">P1: Cyan (Vex-01)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlayerRole('p2');
                soundSynth.playClick(600);
              }}
              className={`p-space-sm rounded border flex flex-col items-center gap-1 transition-all ${
                playerRole === 'p2'
                  ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_12px_rgba(250,188,69,0.4)] font-bold'
                  : 'bg-surface-container border-outline-variant/30 text-outline hover:text-on-surface'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span className="font-label-caps text-[11px]">CON_BETA</span>
              <span className="text-[10px] text-secondary/80">P2: Amber (Nyx-09)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlayerRole('dual');
                soundSynth.playClick(700);
              }}
              className={`p-space-sm rounded border flex flex-col items-center gap-1 transition-all ${
                playerRole === 'dual'
                  ? 'bg-surface-variant border-outline text-on-surface shadow-md font-bold'
                  : 'bg-surface-container border-outline-variant/30 text-outline hover:text-on-surface'
              }`}
            >
              <Users size={14} className="text-tertiary" />
              <span className="font-label-caps text-[11px]">DUAL VIEW</span>
              <span className="text-[10px] text-tertiary/80">Split Console</span>
            </button>
          </div>
        </div>

        {/* Quick Launch Partner Tab (Local Frictionless Entry) */}
        <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-outline uppercase flex items-center gap-1">
              <ShieldCheck size={13} className="text-tertiary" />
              Frictionless Local / Multi-Tab Co-op
            </span>
            <span className="font-telemetry-sm text-[10px] text-tertiary">ZERO DOWNLOADS</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Testing on one computer? Click below to instantly launch the opposite player's chamber in a separate synchronized window!
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenPartnerTab}
              className="flex-1 py-2 px-space-sm rounded bg-surface-container-high hover:bg-surface-variant text-primary border border-primary/30 flex items-center justify-center gap-2 font-label-caps text-label-caps uppercase transition-all shadow active:scale-95"
            >
              <ExternalLink size={14} />
              Open Partner Chamber In 2nd Window
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-space-md py-2 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/40 flex items-center gap-1 font-label-caps text-[11px] transition-colors"
              title="Copy Room Link"
            >
              <Copy size={14} />
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
