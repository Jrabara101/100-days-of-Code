import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Plus, Check } from 'lucide-react';
import { NEARBY_BUNDLE_ITEMS } from '../data/telemetry';
import { formatCents } from '../services/priceCalculator';
import confetti from 'canvas-confetti';

export function NearbyBundleStrip({ onAddBundleItem, bundledItems = [] }) {
  // 10-minute live countdown timer with session persistence (survives tab reload)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    try {
      const stored = sessionStorage.getItem('gd_bundle_window_expires_at');
      if (stored) {
        const remaining = Math.max(0, Math.floor((parseInt(stored, 10) - Date.now()) / 1000));
        return remaining;
      }
      const newExpiresAt = Date.now() + 600 * 1000;
      sessionStorage.setItem('gd_bundle_window_expires_at', newExpiresAt.toString());
      return 600;
    } catch {
      return 600;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAdd = (item) => {
    onAddBundleItem(item);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.9 }
    });
  };

  if (secondsLeft === 0) {
    return null; // Window expired
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/30 space-y-3 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs sm:text-sm text-[var(--text-primary)]">
              10-Minute Zero-Fee Bundle Add-On Window
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Shops along Marcus's route • Added directly to courier bag at $0 extra delivery fee
            </p>
          </div>
        </div>

        {/* Live Countdown Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs shrink-0 self-start sm:self-center">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(secondsLeft)} left to bundle</span>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
        {NEARBY_BUNDLE_ITEMS.map((item) => {
          const isAdded = bundledItems.some((b) => b.id === item.id);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shrink-0 w-64 shadow-xs"
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-stone-400 truncate">{item.shop_name}</div>
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">{item.title}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                    {formatCents(item.price_cents)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    disabled={isAdded}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3" /> Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" /> Add ($0 Fee)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
