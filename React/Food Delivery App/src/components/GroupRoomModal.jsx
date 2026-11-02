import React, { useState } from 'react';
import { X, Users, Copy, Check, Clock, DollarSign, Sparkles } from 'lucide-react';

export function GroupRoomModal({
  isOpen,
  onClose,
  groupRoom,
  onUpdateGroupRoom,
  onSimulatePeerAction
}) {
  const [copiedToast, setCopiedToast] = useState(false);
  const [spendingCap, setSpendingCap] = useState(groupRoom.spendingCapCents ? groupRoom.spendingCapCents / 100 : 25);
  const [lockMinutes, setLockMinutes] = useState(15);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?join_room=${groupRoom.code}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleSaveSettings = () => {
    onUpdateGroupRoom({
      spendingCapCents: spendingCap > 0 ? spendingCap * 100 : null,
      lockMinutes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Multiplayer Group Order Room
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Collaborate in real time • Split items or pay unified bill
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Share Code & Link Box */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Room Access Code
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-mono font-bold text-xs">
                {groupRoom.code}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Authentic SVG QR Code Preview */}
              <div className="p-2.5 rounded-xl bg-white border border-purple-300/40 shadow-sm flex flex-col items-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" fill="#ffffff" rx="4" />
                  {/* Top-Left Finder */}
                  <rect x="10" y="10" width="26" height="26" rx="3" fill="#141413" />
                  <rect x="14" y="14" width="18" height="18" rx="2" fill="#ffffff" />
                  <rect x="18" y="18" width="10" height="10" rx="1.5" fill="#7C3AED" />
                  {/* Top-Right Finder */}
                  <rect x="64" y="10" width="26" height="26" rx="3" fill="#141413" />
                  <rect x="68" y="14" width="18" height="18" rx="2" fill="#ffffff" />
                  <rect x="72" y="18" width="10" height="10" rx="1.5" fill="#7C3AED" />
                  {/* Bottom-Left Finder */}
                  <rect x="10" y="64" width="26" height="26" rx="3" fill="#141413" />
                  <rect x="14" y="68" width="18" height="18" rx="2" fill="#ffffff" />
                  <rect x="18" y="72" width="10" height="10" rx="1.5" fill="#7C3AED" />
                  {/* Data Blocks Pattern */}
                  <rect x="42" y="12" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="52" y="12" width="6" height="6" rx="1" fill="#7C3AED" />
                  <rect x="42" y="24" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="48" y="32" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="14" y="44" width="6" height="6" rx="1" fill="#7C3AED" />
                  <rect x="24" y="44" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="34" y="44" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="44" y="44" width="12" height="12" rx="2" fill="#7C3AED" />
                  <rect x="62" y="44" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="74" y="44" width="6" height="6" rx="1" fill="#7C3AED" />
                  <rect x="84" y="44" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="44" y="62" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="56" y="62" width="6" height="6" rx="1" fill="#7C3AED" />
                  <rect x="44" y="74" width="6" height="6" rx="1" fill="#7C3AED" />
                  <rect x="54" y="74" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="66" y="66" width="6" height="6" rx="1" fill="#141413" />
                  <rect x="76" y="66" width="14" height="6" rx="1" fill="#141413" />
                  <rect x="66" y="78" width="6" height="12" rx="1" fill="#7C3AED" />
                  <rect x="78" y="78" width="12" height="12" rx="2" fill="#141413" />
                </svg>
                <span className="text-[9px] text-stone-600 font-mono font-semibold mt-1">
                  Scan to Join
                </span>
              </div>

              {/* URL & Copy control */}
              <div className="flex-1 space-y-2 w-full">
                <p className="text-xs text-[var(--text-muted)]">
                  Share this invitation link or QR code with roommates or colleagues to add items synchronously:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-purple-500/30 text-xs text-[var(--text-primary)] font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToast ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Host Spending Cap Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Host-Set Spending Cap Per Person
              </label>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {spendingCap > 0 ? `$${spendingCap}/person` : 'No Limit'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 20, 25, 35].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSpendingCap(val)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    spendingCap === val
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-stone-400'
                  }`}
                >
                  {val === 0 ? 'No Limit' : `$${val}`}
                </button>
              ))}
            </div>
          </div>

          {/* Cart Lock Countdown Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Cart Auto-Lock Timer
              </label>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                {lockMinutes} Minutes
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLockMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    lockMinutes === mins
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-stone-400'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          </div>

          {/* Active Participants */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Active Dining Room ({groupRoom.participants?.length || 1})
              </span>
              <button
                type="button"
                onClick={onSimulatePeerAction}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <Sparkles className="w-3 h-3" /> Simulate Friend Adding Item
              </button>
            </div>

            <div className="space-y-2">
              {(groupRoom.participants || []).map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: p.color || '#8B5CF6' }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{p.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{p.status || 'Active'}</div>
                    </div>
                  </div>
                  <span className="font-mono font-medium text-[var(--text-primary)]">
                    {p.itemCount ? `${p.itemCount} items` : 'Browsing'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-md"
          >
            Apply Room Controls
          </button>
        </div>
      </div>
    </div>
  );
}
