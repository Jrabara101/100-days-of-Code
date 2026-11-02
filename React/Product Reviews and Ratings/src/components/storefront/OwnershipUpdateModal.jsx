import React, { useState } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function OwnershipUpdateModal({ isOpen, onClose, review }) {
  const { addOwnershipUpdate } = useTrustStore();
  const [updateText, setUpdateText] = useState(
    'Update after 6 months of daily use: finish remains pristine, thermal responsiveness has held steady with zero degradation. Would buy again.'
  );

  if (!isOpen || !review) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;

    addOwnershipUpdate(review.id, updateText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">history</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Append Long-Term Ownership Update
              </h3>
              <p className="font-mono text-xs text-outline">
                Verified buyer longitudinal follow-up (Order #{review.orderId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 text-xs font-mono text-on-surface-variant">
            Original Review: <strong className="text-on-surface">"{review.title}"</strong> ({review.rating}★)
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-headline-sm text-xs font-semibold text-on-surface">
              6-Month / Long-Term Durability Notes
            </label>
            <textarea
              rows={4}
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              className="w-full p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-sm focus:outline-none focus:border-primary resize-none"
              placeholder="How has the product held up over months of regular use?"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary text-white font-headline-sm text-xs font-semibold rounded-lg hover:bg-primary-container shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">update</span>
              <span>Append [⏱ 6-Month Update]</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

