import React, { useState, useRef, useEffect } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { useNetwork } from '../../context/NetworkContext';
import { formatTime } from '../../utils/puzzleEngine';
import { soundSynth } from '../../utils/audioSynth';
import { Key, Send, Lock, Unlock, AlertOctagon } from 'lucide-react';

export default function CentralNexus() {
  const {
    gameState,
    setKeyInterlockHeld,
    submitCipherCode,
    pullHazardLatch,
    addLog
  } = useGameState();
  const { playerRole, sendEvent } = useNetwork();
  const [chatInput, setChatInput] = useState('');
  const [cipherInput, setCipherInput] = useState('');
  const logScrollRef = useRef(null);

  const { syncLock, countdownSeconds, phase, alpha, beta, cipher, hazardSafetyOn, logs } = gameState;

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const sender = playerRole === 'p2' ? 'P2' : 'P1';
    const color = playerRole === 'p2' ? 'text-secondary' : 'text-primary';
    addLog(sender, chatInput.trim(), color);
    sendEvent('CHAT_MSG', { sender, text: chatInput.trim(), color });
    setChatInput('');
  };

  const handleCipherSubmit = (e) => {
    e.preventDefault();
    submitCipherCode(cipherInput.trim());
    setCipherInput('');
  };

  // SVG Dial radius: 42, circumference: 2 * PI * 42 = 263.89
  const circumference = 264;
  const strokeOffset = circumference - (syncLock / 100) * circumference;

  return (
    <div className="flex flex-col bg-surface-container-low rounded-xl p-space-md shadow-2xl space-y-space-md relative border-none">
      {/* Central Sync Hub Indicator */}
      <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col items-center text-center space-y-space-xs shadow-md">
        <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
          COLLABORATIVE NEXUS CONDUIT
        </span>
        <div className="flex items-center gap-space-sm font-telemetry-lg text-telemetry-lg">
          <span className="text-primary font-bold">ALPHA</span>
          <span className="text-tertiary font-bold animate-pulse">⇄</span>
          <span className="text-secondary font-bold">BETA</span>
        </div>

        {/* Big Sync Dial Visualizer */}
        <div className="relative w-36 h-36 flex items-center justify-center my-space-xs">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="text-surface-container-highest"
              cx="50"
              cy="50"
              fill="transparent"
              r="42"
              stroke="currentColor"
              strokeWidth="8"
            ></circle>
            {/* Progress circle */}
            <circle
              className="text-tertiary transition-all duration-700"
              cx="50"
              cy="50"
              fill="transparent"
              r="42"
              stroke="currentColor"
              strokeDasharray="264"
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              strokeWidth="8"
            ></circle>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-label-caps text-label-caps text-outline">SYNC LOCK</span>
            <span className="font-headline-lg text-headline-lg text-on-surface font-bold leading-none tracking-tight">
              {syncLock.toFixed(1)}%
            </span>
            <span className="font-telemetry-sm text-telemetry-sm text-tertiary mt-1 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              {syncLock >= 100 ? 'UNLOCKED' : phase >= 3 ? 'CRITICAL' : 'MUTUAL'}
            </span>
          </div>
        </div>

        {/* Master Sync Countdown Pill */}
        <div className="w-full bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between shadow-inner">
          <div className="flex flex-col text-left">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              COUNTDOWN TO BURST
            </span>
            <span
              className={`font-telemetry-lg text-telemetry-lg font-bold tracking-widest ${
                countdownSeconds < 120 ? 'text-error animate-pulse' : 'text-primary'
              }`}
            >
              {formatTime(countdownSeconds)}
            </span>
          </div>
          <div
            className={`px-space-sm py-1 rounded font-label-caps text-label-caps uppercase flex items-center gap-1 shadow ${
              countdownSeconds < 120
                ? 'bg-error-container text-on-error animate-pulse'
                : 'bg-primary/20 text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-body-sm">alarm</span>
            {countdownSeconds < 120 ? 'WINDOW CRITICAL' : 'STAGE OPTIMAL'}
          </div>
        </div>
      </div>

      {/* Dual-Key Interlock Mechanism */}
      <div className="bg-surface-container p-space-md rounded-lg space-y-space-sm shadow-inner">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-on-surface uppercase">
            Dual-Key Interlock Mechanism
          </span>
          <span
            className={`font-telemetry-sm text-telemetry-sm font-bold ${
              alpha.keyHeld && beta.keyHeld ? 'text-tertiary animate-pulse' : 'text-outline'
            }`}
          >
            {alpha.keyHeld && beta.keyHeld ? 'SYNCHRONIZED' : phase >= 3 ? 'READY TO HOLD' : 'LOCKED'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          {/* Key Alpha (Cyan) */}
          <div
            onMouseDown={() => setKeyInterlockHeld('p1', true)}
            onMouseUp={() => setKeyInterlockHeld('p1', false)}
            onTouchStart={() => setKeyInterlockHeld('p1', true)}
            onTouchEnd={() => setKeyInterlockHeld('p1', false)}
            className={`p-space-sm rounded flex items-center gap-space-sm shadow cursor-pointer transition-all active:scale-95 select-none ${
              alpha.keyHeld
                ? 'bg-primary/30 border border-primary shadow-[0_0_12px_rgba(162,201,255,0.5)]'
                : 'bg-surface-container-low hover:bg-surface-container-high border border-transparent'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                alpha.keyHeld ? 'bg-primary text-on-primary' : 'bg-primary/20 text-primary'
              }`}
            >
              <Key size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps text-outline truncate">KEY 01 (CYAN)</span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
                {alpha.keyHeld ? 'HOLDING...' : 'PRESS & HOLD'}
              </span>
            </div>
          </div>

          {/* Key Beta (Amber) */}
          <div
            onMouseDown={() => setKeyInterlockHeld('p2', true)}
            onMouseUp={() => setKeyInterlockHeld('p2', false)}
            onTouchStart={() => setKeyInterlockHeld('p2', true)}
            onTouchEnd={() => setKeyInterlockHeld('p2', false)}
            className={`p-space-sm rounded flex items-center gap-space-sm shadow cursor-pointer transition-all active:scale-95 select-none ${
              beta.keyHeld
                ? 'bg-secondary/30 border border-secondary shadow-[0_0_12px_rgba(250,188,69,0.5)]'
                : 'bg-surface-container-low hover:bg-surface-container-high border border-transparent'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                beta.keyHeld ? 'bg-secondary text-on-secondary' : 'bg-secondary/20 text-secondary'
              }`}
            >
              <Key size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps text-outline truncate">KEY 02 (AMBER)</span>
              <span className="font-telemetry-sm text-telemetry-sm text-secondary font-bold">
                {beta.keyHeld ? 'HOLDING...' : 'PRESS & HOLD'}
              </span>
            </div>
          </div>
        </div>

        {/* Mutual Confirmation Conduit Glow Indicator */}
        <div
          className={`p-space-sm rounded flex items-center justify-between shadow transition-all ${
            alpha.keyHeld && beta.keyHeld
              ? 'bg-tertiary text-on-tertiary-fixed'
              : 'bg-tertiary-container/30 text-on-tertiary-container'
          }`}
        >
          <div className="flex items-center gap-space-xs">
            <Lock size={15} className="text-tertiary" />
            <span className="font-label-caps text-label-caps text-tertiary uppercase font-bold">
              {alpha.keyHeld && beta.keyHeld
                ? 'SIMULTANEOUS HOLD ENGAGED // 100% PAIRING'
                : 'INTERLOCK VERIFIED // STANDBY FOR CO-OP HOLD'}
            </span>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full bg-tertiary ${
              alpha.keyHeld && beta.keyHeld ? 'animate-ping' : 'shadow-[0_0_8px_rgba(123,219,128,0.8)]'
            }`}
          ></span>
        </div>
      </div>

      {/* Stage 3 Cipher Verification Box (Visible when stage >= 3) */}
      {phase >= 3 && !cipher.codeUnlocked && (
        <div className="bg-surface-container-high p-space-sm rounded-lg space-y-space-xs border border-primary/40 shadow-lg animate-pulse">
          <div className="flex justify-between items-center text-primary font-label-caps text-[11px]">
            <span>CIPHER OVERRIDE RECEPTACLE</span>
            <span>TOKEN: {cipher.tokenPrompt}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Enter the 4-digit code (Hint: Look at room telemetry sector codes or room code suffix).
          </p>
          <form onSubmit={handleCipherSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Code (e.g. 7749)"
              value={cipherInput}
              onChange={(e) => setCipherInput(e.target.value)}
              className="flex-1 bg-surface-container-lowest px-2 py-1 rounded text-primary font-telemetry-sm border border-outline-variant/50 focus:outline-none focus:border-primary uppercase"
              maxLength={6}
            />
            <button
              type="submit"
              className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-caps text-label-caps font-bold hover:bg-primary-container"
            >
              DECRYPT
            </button>
          </form>
        </div>
      )}

      {/* Real-Time Cross-Feed Ping & Chat Stream */}
      <div className="bg-surface-container-lowest/90 p-space-md rounded-lg flex flex-col space-y-space-xs shadow-inner min-h-[160px]">
        <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
          <span className="font-label-caps text-label-caps text-outline uppercase">Dynamic Ping Stream</span>
          <span className="font-telemetry-sm text-telemetry-sm text-outline">AUTO-POLL: 50ms</span>
        </div>

        <div
          ref={logScrollRef}
          className="flex-1 max-h-40 overflow-y-auto space-y-space-xs font-telemetry-sm text-telemetry-sm pr-1"
        >
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-space-xs bg-surface-container-low/60 p-space-xs rounded text-[11px]"
            >
              <span className="font-label-caps text-label-caps text-outline shrink-0">{log.time}</span>
              <span className={`font-bold shrink-0 ${log.color}`}>[{log.sender}]:</span>
              <span className="truncate text-on-surface">{log.text}</span>
            </div>
          ))}
        </div>

        {/* In-Console Chat Bar */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
          <input
            type="text"
            placeholder="Type tactical message or co-op coordinate..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-surface-container-low/80 text-on-surface px-space-xs py-1 rounded text-[11px] font-telemetry-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="p-1 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors"
            title="Transmit message"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Industrial Manual Override Safety Lever (Hazard Striped) */}
      <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col space-y-space-xs shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-error uppercase font-bold tracking-wider flex items-center gap-1">
            <AlertOctagon size={14} />
            Hazard Latch // Manual Break
          </span>
          <span className="font-telemetry-sm text-telemetry-sm text-outline">
            SAFETY GUARD: {hazardSafetyOn ? 'ON' : 'PULLED'}
          </span>
        </div>
        <div
          onClick={pullHazardLatch}
          className="h-10 w-full rounded flex items-center justify-between px-space-md relative overflow-hidden bg-surface-container-lowest shadow-inner cursor-pointer hover:bg-surface-container-lowest/80 transition-colors group/latch"
          title="Click to pull Emergency Hazard Latch"
        >
          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#ffb4ab,#ffb4ab_10px,#0a0e14_10px,#0a0e14_20px)]"></div>
          <span className="font-label-caps text-label-caps text-on-surface-variant z-10 uppercase tracking-widest text-[11px]">
            {hazardSafetyOn ? 'DISENGAGE RELAYS' : 'PRESSURE VENTED // +60s'}
          </span>
          <div className="w-8 h-7 bg-surface-variant rounded flex items-center justify-center z-10 shadow group-hover/latch:scale-105 transition-transform">
            {hazardSafetyOn ? (
              <Lock size={15} className="text-error" />
            ) : (
              <Unlock size={15} className="text-tertiary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
