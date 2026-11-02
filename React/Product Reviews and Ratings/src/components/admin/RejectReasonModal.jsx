import React, { useState } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function RejectReasonModal({ isOpen, onClose, review }) {
  const { rejectReview } = useTrustStore();

  const [selectedReason, setSelectedReason] = useState(
    'Spam / Bot Brigading / Duplicate Photo Hash'
  );
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !review) return null;

  const reasons = [
    'Spam / Bot Brigading / Duplicate Photo Hash',
    'Unsanitizable Contact Info / Harassment / Doxxing',
    'Unauthorized Commercial Promotion / Competitor URLs',
    'Counterfeit Token / Fake Proof of Purchase',
    'Fraudulent Healthcare / Curing Claims (FDA Violation)'
  ];

  const handleConfirmReject = (e) => {
    e.preventDefault();
    const finalReason = customNote.trim()
      ? `${selectedReason}: ${customNote.trim()}`
      : selectedReason;

    rejectReview(review.id, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">block</span>
            </div>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
              Reject Review &amp; File Policy Reason
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleConfirmReject} className="flex flex-col gap-4">
          <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 text-xs font-mono text-outline">
            Target: <strong className="text-on-surface font-semibold">{review.id}</strong> ({review.reviewerName})
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Select Violation Category
            </label>
            <div className="flex flex-col gap-1.5">
              {reasons.map((r) => (
                <label
                  key={r}
                  onClick={() => setSelectedReason(r)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-sans cursor-pointer transition-colors ${
                    selectedReason === r
                      ? 'bg-error-container/40 border-error text-error font-semibold'
                      : 'border-outline-variant/30 hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={selectedReason === r}
                    onChange={() => {}}
                    className="accent-error"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-outline font-semibold">
              Additional Audit Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Matched repeated bot subnet signature 198.51.100.0/24"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-body-sm focus:outline-none focus:border-error"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-error hover:bg-error/90 text-white font-mono text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              <span>Confirm Rejection [R]</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

