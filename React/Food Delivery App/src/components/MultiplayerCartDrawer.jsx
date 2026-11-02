import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Plus,
  Minus,
  Trash2,
  Leaf,
  Zap,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { formatCents, calculateSplitBill } from '../services/priceCalculator';
import confetti from 'canvas-confetti';

export function MultiplayerCartDrawer({
  isOpen,
  onClose,
  restaurant,
  cartItems,
  cartTotals,
  onUpdateQuantity,
  onRemoveItem,
  routingTier,
  onChangeRoutingTier,
  tipPercentage,
  onChangeTipPercentage,
  groupRoom,
  onOpenGroupModal,
  onCheckoutOrder
}) {
  const [utensilsOptIn, setUtensilsOptIn] = useState(false);
  const [paymentMode, setPaymentMode] = useState('host_pays'); // 'host_pays' | 'split_proportional'
  const [showSplitBreakdown, setShowSplitBreakdown] = useState(false);

  // Structured Utensil & Condiment Ledger
  const [condiments, setCondiments] = useState({
    chopsticks: 0,
    forkKnifeSets: 1,
    saucePackets: 2,
    extraNapkins: false
  });

  // Live Cart Lock Countdown Timer
  const [secondsUntilLock, setSecondsUntilLock] = useState(
    (groupRoom?.lockMinutes || 15) * 60
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilLock((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLockTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Trigger celebratory confetti when free delivery is unlocked
  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  const splitBills = calculateSplitBill(cartItems, cartTotals);
  const hostSplit = splitBills.find((s) => s.name.includes('Host') || s.name === 'You (Host)') || splitBills[0];

  // Group items by participant
  const itemsByParticipant = cartItems.reduce((acc, item) => {
    const pName = item.participant_name || 'You (Host)';
    if (!acc[pName]) acc[pName] = [];
    acc[pName].push(item);
    return acc;
  }, {});

  const participantNames = Object.keys(itemsByParticipant);

  // Free delivery threshold progress calculation
  const freeMin = restaurant?.free_delivery_min_cents ?? 3500;
  const progressPercent = freeMin === 0
    ? 100
    : Math.min(100, Math.round((cartTotals.itemsSubtotalCents / freeMin) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--bg-elevated)] border-l border-[var(--border-hairline)] shadow-2xl flex flex-col justify-between">
          {/* Top Header & Free Delivery Meter */}
          <div className="p-4 sm:p-5 border-b border-[var(--border-hairline)] space-y-3 bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  {restaurant?.name || 'Your Cart'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-purple-700 dark:text-purple-300 font-semibold mt-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Room: {groupRoom.code}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ⏳ Host locks in {formatLockTimer(secondsUntilLock)}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenGroupModal}
                    className="text-[11px] underline text-purple-600 dark:text-purple-400 font-bold ml-1 cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Delivery Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span
                  onClick={cartTotals.isFreeDeliveryUnlocked ? handleTriggerConfetti : undefined}
                  className={`cursor-pointer ${cartTotals.isFreeDeliveryUnlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}`}
                >
                  {cartTotals.isFreeDeliveryUnlocked
                    ? '✨ Unlocked $0.00 Free Delivery!'
                    : `Add ${formatCents(cartTotals.distanceToFreeDeliveryCents)} more for $0 Delivery`}
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Scrollable Cart Items grouped by Participant */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Your group cart is currently empty.
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Explore dishes and tap "Add to Order" to begin your meal.
                </p>
              </div>
            ) : (
              participantNames.map((pName) => {
                const pItems = itemsByParticipant[pName];
                const pSubtotal = pItems.reduce(
                  (sum, i) => sum + (i.unit_computed_cents * (i.quantity || 1)),
                  0
                );
                const hasCap = groupRoom?.spendingCapCents && groupRoom.spendingCapCents > 0;
                const isOverCap = hasCap && pSubtotal > groupRoom.spendingCapCents;

                return (
                  <div
                    key={pName}
                    className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3"
                  >
                    {/* Participant Header */}
                    <div className="pb-2 border-b border-[var(--border-hairline)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[10px]">
                            {pName.charAt(0)}
                          </div>
                          <span className="text-[var(--text-primary)]">{pName}</span>
                          {isOverCap && (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Over Cap
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[var(--text-primary)] font-bold">
                          {formatCents(pSubtotal)}
                        </span>
                      </div>

                      {/* Participant Spending Cap Bar */}
                      {hasCap && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                            <span>Spending Cap: {formatCents(groupRoom.spendingCapCents)}</span>
                            <span>{Math.round((pSubtotal / groupRoom.spendingCapCents) * 100)}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverCap
                                  ? 'bg-rose-500'
                                  : pSubtotal >= groupRoom.spendingCapCents * 0.8
                                  ? 'bg-amber-500'
                                  : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((pSubtotal / groupRoom.spendingCapCents) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Participant Items */}
                    <div className="space-y-3">
                      {pItems.map((item, idx) => {
                        const itemGlobalIndex = cartItems.findIndex(
                          (ci) => (ci.cart_item_id && item.cart_item_id && ci.cart_item_id === item.cart_item_id) || ci === item
                        );
                        const targetIndex = itemGlobalIndex >= 0 ? itemGlobalIndex : idx;

                        return (
                          <div
                            key={item.cart_item_id || `${item.menu_item_id}-${idx}`}
                            className="flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <span>{item.title}</span>
                                <span className="text-stone-400 font-normal">×{item.quantity}</span>
                              </div>

                              {/* Modifiers List */}
                              {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                                <div className="text-[11px] text-[var(--text-muted)] leading-tight space-y-0.5">
                                  {item.selected_modifiers.map((m) => (
                                    <div key={m.option_id}>
                                      + {m.name} {m.price_delta_cents > 0 ? `(${formatCents(m.price_delta_cents)})` : ''}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Pre-authorized Substitution Rule Badge */}
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-[10px] text-[var(--text-muted)]">
                                <span>🛡️ If 86'd:</span>
                                <span className="font-medium text-[var(--text-primary)]">
                                  {item.substitution_policy === 'chef_choice' && "Chef's Match"}
                                  {item.substitution_policy === 'refund_item' && "Refund Item"}
                                  {item.substitution_policy === 'cancel_order' && "Cancel Order"}
                                  {item.substitution_policy === 'specific_item' && "Specific Dish"}
                                </span>
                              </div>
                            </div>

                            {/* Price & Steppers */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="font-mono font-bold text-[var(--text-primary)]">
                                {formatCents(item.unit_computed_cents * item.quantity)}
                              </span>

                              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.cart_item_id || targetIndex, Math.max(1, item.quantity - 1))}
                                  className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-mono text-[11px] px-1 font-semibold text-[var(--text-primary)]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.cart_item_id || targetIndex, item.quantity + 1)}
                                  className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemoveItem(item.cart_item_id || targetIndex)}
                                  className="p-0.5 ml-1 text-red-500 hover:text-red-700 cursor-pointer"
                                  title="Remove line item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* Delivery Speed / Eco-Saver Routing Selector */}
            {cartItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Logistics & Dispatch Priority
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeRoutingTier('priority_direct')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                      routingTier === 'priority_direct'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">Direct Priority (+$2.99)</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Courier comes straight to you</div>
                      </div>
                    </div>
                    <span className="font-mono">18–23m</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeRoutingTier('standard')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                      routingTier === 'standard'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">Standard Routing ($0.00)</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Normal dispatch window</div>
                      </div>
                    </div>
                    <span className="font-mono">25–35m</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeRoutingTier('eco_saver')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                      routingTier === 'eco_saver'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">Eco-Batch Saver (-$2.00 Discount)</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Batched with 1 neighbor on your block</div>
                      </div>
                    </div>
                    <span className="font-mono">32–42m</span>
                  </button>
                </div>
              </div>
            )}

            {/* Eco Utensils Toggle & Structured Condiments Ledger */}
            {cartItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Leaf className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-800 dark:text-emerald-300">
                        {utensilsOptIn ? 'Include Single-Use Utensils & Condiments' : '🌱 Zero Plastic Utensils (Default)'}
                      </div>
                      <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                        {utensilsOptIn
                          ? 'Specify exact counts so the kitchen doesn\'t guess'
                          : 'You\'ve saved 24 single-use packets to date!'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUtensilsOptIn(!utensilsOptIn)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      utensilsOptIn ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        utensilsOptIn ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Structured Condiments Ledger (when opt-in active) */}
                {utensilsOptIn && (
                  <div className="pt-2 border-t border-emerald-500/20 space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-900 dark:text-emerald-200 text-[11px] font-medium">Chopsticks Pairs</span>
                      <div className="flex items-center gap-2 bg-[var(--bg-elevated)] px-2 py-0.5 rounded-lg border border-[var(--border-hairline)]">
                        <button
                          type="button"
                          onClick={() => setCondiments(prev => ({ ...prev, chopsticks: Math.max(0, prev.chopsticks - 1) }))}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[11px] font-bold w-3 text-center">{condiments.chopsticks}</span>
                        <button
                          type="button"
                          onClick={() => setCondiments(prev => ({ ...prev, chopsticks: prev.chopsticks + 1 }))}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-900 dark:text-emerald-200 text-[11px] font-medium">Fork, Spoon & Knife Sets</span>
                      <div className="flex items-center gap-2 bg-[var(--bg-elevated)] px-2 py-0.5 rounded-lg border border-[var(--border-hairline)]">
                        <button
                          type="button"
                          onClick={() => setCondiments(prev => ({ ...prev, forkKnifeSets: Math.max(0, prev.forkKnifeSets - 1) }))}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[11px] font-bold w-3 text-center">{condiments.forkKnifeSets}</span>
                        <button
                          type="button"
                          onClick={() => setCondiments(prev => ({ ...prev, forkKnifeSets: prev.forkKnifeSets + 1 }))}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-900 dark:text-emerald-200 text-[11px] font-medium">Sauce & Chili Packets</span>
                      <div className="flex items-center gap-2 bg-[var(--bg-elevated)] px-2 py-0.5 rounded-lg border border-[var(--border-hairline)]">
                        <button
                          type="button"
                          onClick={() => setCondiments(prev => ({ ...prev, saucePackets: Math.max(0, prev.saucePackets - 1) }))}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[11px] font-bold w-3 text-center">{condiments.saucePackets}</span>
                        <button
                          type="button"
                          onClick={() => setCondiments(prev => ({ ...prev, saucePackets: prev.saucePackets + 1 }))}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-emerald-900 dark:text-emerald-200 text-[11px] font-medium">Extra Napkins</span>
                      <button
                        type="button"
                        onClick={() => setCondiments(prev => ({ ...prev, extraNapkins: !prev.extraNapkins }))}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          condiments.extraNapkins ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {condiments.extraNapkins ? '✓ Included' : 'No'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Courier Tip Selector */}
            {cartItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Courier Tip
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    100% goes directly to driver
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 18, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onChangeTipPercentage(pct)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        tipPercentage === pct
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer & Checkout Settlement */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3 shrink-0">
              {/* Payment Mode Selector */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('host_pays');
                    setShowSplitBreakdown(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                    paymentMode === 'host_pays'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'border-[var(--border-hairline)] text-[var(--text-muted)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  💳 Host Pays All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('split_proportional');
                    setShowSplitBreakdown(true);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                    paymentMode === 'split_proportional'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'border-[var(--border-hairline)] text-[var(--text-muted)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  🔀 Split by Person
                </button>
              </div>

              {/* Split Breakdown Details (if split active) */}
              {showSplitBreakdown && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5 font-mono">
                  <div className="font-bold text-purple-700 dark:text-purple-300 font-sans">
                    Proportional Split Breakdown:
                  </div>
                  {splitBills.map((sb) => (
                    <div key={sb.name} className="flex justify-between text-[11px] text-[var(--text-primary)]">
                      <span>{sb.name} ({sb.itemCount} items):</span>
                      <span className="font-bold">{formatCents(sb.totalOwedCents)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fee Waterfall */}
              <div className="space-y-1 text-xs text-[var(--text-muted)] font-mono-numbers">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {formatCents(cartTotals.itemsSubtotalCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {cartTotals.deliveryFeeCents === 0 ? 'FREE' : formatCents(cartTotals.deliveryFeeCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee (10%)</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {formatCents(cartTotals.serviceFeeCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {formatCents(cartTotals.taxCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Courier Tip ({tipPercentage}%)</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {formatCents(cartTotals.courierTipCents)}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={onCheckoutOrder}
                className="w-full py-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base flex items-center justify-between shadow-xl shadow-rose-600/30 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>
                  {paymentMode === 'split_proportional'
                    ? `Pay Your Share • ${formatCents(hostSplit?.totalOwedCents || cartTotals.totalChargedCents)}`
                    : 'Place Order'}
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span>
                    {paymentMode === 'split_proportional'
                      ? formatCents(hostSplit?.totalOwedCents || cartTotals.totalChargedCents)
                      : formatCents(cartTotals.totalChargedCents)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
