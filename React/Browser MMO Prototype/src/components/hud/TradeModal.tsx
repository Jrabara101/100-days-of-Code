import React, { useState, useEffect } from 'react';
import type { ActiveTradeSession, InventoryState, ItemInstance } from '../../types/mmo.js';
import { ArrowRightLeft, Lock, Unlock, CheckCircle, AlertTriangle, X, Coins } from 'lucide-react';
import { RARITY_COLORS } from '../../engine/spriteRenderer.js';
import { sound } from '../../engine/sound.js';

interface TradeModalProps {
  trade: ActiveTradeSession;
  inventory: InventoryState;
  onStageItem: (itemUid: string) => void;
  onUnstageItem: (itemUid: string) => void;
  onSetGold: (amount: number) => void;
  onToggleLock: (locked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  trade,
  inventory,
  onStageItem,
  onUnstageItem,
  onSetGold,
  onToggleLock,
  onConfirm,
  onCancel,
}) => {
  const [goldInput, setGoldInput] = useState(trade.myOffer.gold.toString());
  const [countdown, setCountdown] = useState<number | null>(null);

  // Sync gold input if offer changes externally
  useEffect(() => {
    setGoldInput(trade.myOffer.gold.toString());
  }, [trade.myOffer.gold]);

  // Handle 3-second countdown when both locked
  useEffect(() => {
    if (trade.stage === 'COUNTDOWN') {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(null);
    }
  }, [trade.stage]);

  const handleGoldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0;
    const clamped = Math.max(0, Math.min(val, inventory.gold));
    setGoldInput(clamped.toString());
    onSetGold(clamped);
  };

  const myLocked = trade.myOffer.locked;
  const partnerLocked = trade.partnerOffer.locked;
  const bothLocked = myLocked && partnerLocked;
  const countdownFinished = countdown === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0B0F19]/95 border border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-100">
                Secure Double-Lock Trade Chamber
              </h2>
              <p className="text-xs text-slate-400">
                Trading with <span className="text-amber-400 font-semibold">{trade.partnerName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner on Lock Mutation */}
        <div className="px-4 py-2 bg-amber-950/20 border-b border-amber-900/30 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Anti-Bait Protection: Modifying items or gold resets both locks immediately.</span>
        </div>

        {/* Dual-Column Staging Matrix */}
        <div className="grid grid-cols-2 divide-x divide-slate-800 p-4 gap-4">
          {/* Left Column: My Offer */}
          <div
            className={`flex flex-col p-3 rounded-2xl transition-all duration-300 ${
              myLocked
                ? 'bg-emerald-950/20 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-slate-900/40 border border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-200">Your Staged Offer</span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  myLocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {myLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{myLocked ? 'LOCKED' : 'UNLOCKED'}</span>
              </div>
            </div>

            {/* Staged Items Grid */}
            <div className="h-32 rounded-xl bg-slate-950/80 border border-slate-800/80 p-2 overflow-y-auto grid grid-cols-4 gap-2 content-start">
              {trade.myOffer.items.length === 0 ? (
                <div className="col-span-4 text-center text-slate-600 text-xs py-8">
                  Click items in your bag below to stage
                </div>
              ) : (
                trade.myOffer.items.map(item => {
                  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                  return (
                    <div
                      key={item.uid}
                      onClick={() => !myLocked && onUnstageItem(item.uid)}
                      className={`relative w-12 h-12 rounded-lg bg-slate-900 border flex flex-col items-center justify-center transition-all ${
                        !myLocked ? 'hover:border-red-500 hover:scale-105 cursor-pointer' : 'cursor-default'
                      }`}
                      style={{ borderColor: rarity.main }}
                      title={`${item.name} (Click to remove)`}
                    >
                      <span className="text-xl">⚔️</span>
                      <span className="text-[8px] font-bold text-center truncate w-full px-0.5" style={{ color: rarity.text }}>
                        {item.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Gold Offer Input */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
              <Coins className="w-4 h-4 text-amber-400" />
              <input
                type="number"
                disabled={myLocked}
                value={goldInput}
                onChange={handleGoldChange}
                placeholder="0"
                className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
              <span className="text-[11px] font-mono text-slate-400">
                / {inventory.gold.toLocaleString()} Gold
              </span>
            </div>
          </div>

          {/* Right Column: Partner's Offer */}
          <div
            className={`flex flex-col p-3 rounded-2xl transition-all duration-300 ${
              partnerLocked
                ? 'bg-emerald-950/20 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-slate-900/40 border border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-200">{trade.partnerName}'s Offer</span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  partnerLocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {partnerLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{partnerLocked ? 'LOCKED' : 'UNLOCKED'}</span>
              </div>
            </div>

            {/* Partner's Staged Items Grid */}
            <div className="h-32 rounded-xl bg-slate-950/80 border border-slate-800/80 p-2 overflow-y-auto grid grid-cols-4 gap-2 content-start">
              {trade.partnerOffer.items.length === 0 ? (
                <div className="col-span-4 text-center text-slate-600 text-xs py-8">
                  Partner has not staged items yet
                </div>
              ) : (
                trade.partnerOffer.items.map(item => {
                  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                  return (
                    <div
                      key={item.uid}
                      className="relative w-12 h-12 rounded-lg bg-slate-900 border flex flex-col items-center justify-center cursor-default"
                      style={{ borderColor: rarity.main }}
                      title={item.name}
                    >
                      <span className="text-xl">🛡️</span>
                      <span className="text-[8px] font-bold text-center truncate w-full px-0.5" style={{ color: rarity.text }}>
                        {item.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Partner Gold Staged */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-300">
                🪙 {trade.partnerOffer.gold.toLocaleString()} Gold
              </span>
            </div>
          </div>
        </div>

        {/* Quick Inventory Picker: Click to stage items */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40">
          <span className="text-[11px] font-mono text-slate-400 mb-1.5 block">
            Your Backpack (Click to Stage in Trade):
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-800">
            {inventory.slots.map(slot => {
              const isStaged = trade.myOffer.items.some(i => i.uid === slot.item.uid);
              const rarity = RARITY_COLORS[slot.item.rarity] || RARITY_COLORS.common;
              return (
                <div
                  key={slot.item.uid}
                  onClick={() => !myLocked && !isStaged && onStageItem(slot.item.uid)}
                  className={`flex-shrink-0 w-11 h-11 rounded-lg border flex flex-col items-center justify-center transition-all ${
                    isStaged
                      ? 'opacity-30 border-slate-800 cursor-not-allowed'
                      : 'bg-slate-900 hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                  style={{ borderColor: isStaged ? '#1e293b' : rarity.main }}
                  title={slot.item.name}
                >
                  <span className="text-sm">📦</span>
                  <span className="text-[7px] font-bold truncate w-full text-center px-0.5" style={{ color: rarity.text }}>
                    {slot.item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions: Lock & Confirm */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition active:scale-95 shadow"
          >
            Cancel Trade
          </button>

          <div className="flex items-center gap-3">
            {/* Lock / Unlock Toggle Button */}
            <button
              onClick={() => onToggleLock(!myLocked)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition active:scale-95 shadow-lg ${
                myLocked
                  ? 'bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/50 text-amber-200'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {myLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{myLocked ? 'Unlock Offer' : 'Lock Offer'}</span>
            </button>

            {/* Confirm Trade Button (Unlocks after 3s countdown) */}
            <button
              onClick={onConfirm}
              disabled={!bothLocked || (countdown !== null && countdown > 0)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition active:scale-95 shadow-lg ${
                bothLocked && countdownFinished
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {countdown !== null && countdown > 0
                  ? `Verifying (${countdown}s)...`
                  : 'Confirm Trade'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
