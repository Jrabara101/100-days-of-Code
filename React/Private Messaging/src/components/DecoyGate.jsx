import React, { useState, useEffect } from 'react';
import { Shield, Lock, Fingerprint, AlertCircle, KeyRound, Eye, EyeOff, Info } from 'lucide-react';
import { sounds } from '../sound/soundEffects';

export default function DecoyGate({ onUnlock, user }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [biometricSimulating, setBiometricSimulating] = useState(false);

  const handleKeyPress = (digit) => {
    sounds.playTapSound();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    sounds.playTapSound();
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (pinToTest) => {
    const res = onUnlock(pinToTest);
    if (!res.success) {
      sounds.playKeyAlertSound();
      setErrorMsg(res.error || 'Authentication rejected');
      setTimeout(() => setPin(''), 600);
    }
  };

  const handleBiometricUnlock = () => {
    setBiometricSimulating(true);
    sounds.playTapSound();
    setTimeout(() => {
      setBiometricSimulating(false);
      onUnlock('1337'); // unlocks primary vault
    }, 1200);
  };

  // Keyboard number listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07080A] text-[#F3F4F6] select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 glow-emerald shadow-lg">
          <Shield className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mb-1">Sanctuary Locked</h1>
        <p className="text-xs text-slate-400 font-mono mb-6 text-center">
          Zero-Knowledge Vault Encrypted with Client Seed
        </p>

        {/* PIN Cipher Dots */}
        <div className="flex items-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div 
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                pin.length > idx 
                  ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_10px_#10B981]' 
                  : 'bg-transparent border-[#252B37]'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono mb-4 animate-shake">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 w-64 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-[#0E1015] hover:bg-[#14171E] active:scale-95 border border-[#1D222D] text-lg font-mono font-medium text-slate-200 transition-all flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBiometricUnlock}
            disabled={biometricSimulating}
            className="h-14 rounded-2xl bg-[#0E1015] hover:bg-[#14171E] active:scale-95 border border-[#1D222D] text-emerald-400 transition-all flex items-center justify-center"
            title="Biometric Passkey Unlock"
          >
            <Fingerprint className={`w-6 h-6 ${biometricSimulating ? 'animate-pulse text-emerald-300' : ''}`} />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-[#0E1015] hover:bg-[#14171E] active:scale-95 border border-[#1D222D] text-lg font-mono font-medium text-slate-200 transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-[#0E1015] hover:bg-[#14171E] active:scale-95 border border-[#1D222D] text-xs font-mono text-slate-400 transition-all flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Duress & Vault PIN Hint Drawer */}
        <div className="w-full max-w-xs flex flex-col items-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>PIN Architecture Guide</span>
          </button>

          {showHint && (
            <div className="mt-3 p-3.5 rounded-xl bg-[#0E1015] border border-[#1D222D] text-[11px] text-slate-300 space-y-2 w-full animate-fadeIn font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-emerald-400 font-semibold">Primary Vault:</span>
                <span className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">1337</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-semibold">Duress Decoy:</span>
                <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">9999</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans pt-1">
                Entering <strong>9999</strong> unlocks an innocuous benign chat state to protect you under physical coercion.
              </p>
            </div>
          )}
        </div>

        {/* Global Panic Trigger Reminder */}
        <div className="mt-8 text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
          <span>Global Panic Wipe:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#0E1015] border border-[#1D222D] text-slate-400">Ctrl+Shift+X</kbd>
        </div>
      </div>
    </div>
  );
}
