import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Camera } from 'lucide-react';
import { formatCents } from '../services/priceCalculator';
import confetti from 'canvas-confetti';

export function InstantMakeGoodModal({
  isOpen,
  onClose,
  order,
  onResolveMakeGood
}) {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [issueType, setIssueType] = useState('missing'); // 'missing' | 'damaged' | 'wrong'
  const [photoAttached, setPhotoAttached] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [resolvedCreditCents, setResolvedCreditCents] = useState(0);

  if (!isOpen || !order) return null;

  const orderItems = order.items || [
    { id: '1', title: 'Rigatoni alla Vodka & Crispy Prosciutto', unit_price_cents: 2200, quantity: 1 },
    { id: '2', title: 'Burrata, Hot Honey & Soppressata Pizza', unit_price_cents: 2450, quantity: 1 }
  ];

  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Calculate instant credit amount
  const calculatedCredit = orderItems
    .filter((i) => selectedItems.has(i.id))
    .reduce((sum, i) => sum + (i.unit_price_cents * (i.quantity || 1)), 0);

  const handleSubmitResolution = () => {
    if (selectedItems.size === 0) return;

    setResolvedCreditCents(calculatedCredit);
    setIsResolved(true);
    onResolveMakeGood(calculatedCredit);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                30-Second Instant Make-Good
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Automated immediate credit • Zero customer support hold time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isResolved ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Step 1: Select Affected Items */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                1. Select Affected Line Items
              </span>
              <div className="space-y-2">
                {orderItems.map((item) => {
                  const isChecked = selectedItems.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleItem(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isChecked
                          ? 'border-rose-500 bg-rose-500/5 shadow-xs'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'border-stone-400 dark:border-stone-600'
                          }`}
                        >
                          {isChecked && <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {item.title} (×{item.quantity || 1})
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {formatCents(item.unit_price_cents * (item.quantity || 1))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Issue */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                2. What Happened?
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'missing', label: 'Missing Item' },
                  { id: 'damaged', label: 'Spilled / Cold' },
                  { id: 'wrong', label: 'Wrong Dish' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setIssueType(type.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      issueType === type.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Optional Photo Verification */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                <Camera className="w-4 h-4 text-blue-500" />
                <span>Optional packaging photo:</span>
              </div>
              <button
                type="button"
                onClick={() => setPhotoAttached(!photoAttached)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                  photoAttached
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-hairline)] text-[var(--text-primary)]'
                }`}
              >
                {photoAttached ? '✓ Photo Attached' : 'Attach Photo'}
              </button>
            </div>

            {/* Refund Calculation Box */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Calculated Instant Credit:
                </span>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                  Applied to your GourmetDrop wallet instantly
                </p>
              </div>
              <span className="text-xl font-display font-black text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                {formatCents(calculatedCredit)}
              </span>
            </div>
          </div>
        ) : (
          /* Resolution Confirmation */
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
                {formatCents(resolvedCreditCents)} Credited Instantly!
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
                We've deposited {formatCents(resolvedCreditCents)} directly into your GourmetDrop balance. We apologize for the culinary mishap.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] font-mono">
              Transaction ID: GD-RESOLVE-{Date.now().toString().slice(-6)}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex justify-end gap-3">
          {!isResolved ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitResolution}
                disabled={selectedItems.size === 0}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition-all shadow-md ${
                  selectedItems.size > 0
                    ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-95'
                    : 'bg-stone-400 cursor-not-allowed'
                }`}
              >
                Issue Instant Credit ({formatCents(calculatedCredit)})
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
