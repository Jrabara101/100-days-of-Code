import React, { useState } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { StarRating } from '../common/StarRating';
import { HotkeyKeycap } from '../common/HotkeyKeycap';

export function BrandResponseStation({ isOpen, onClose, review }) {
  const { postBrandResponse, approveReview } = useTrustStore();

  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'make-good' | 'qa'
  const [responderName, setResponderName] = useState('Ana Ruiz');
  const [responderTitle, setResponderTitle] = useState('Head of Product Quality');
  const [replyBody, setReplyBody] = useState(
    review?.brandResponse?.body ||
      "We're sorry, Marcus — that seam should never give. We've sent an expedited replacement and quarantined this batch for warehouse QA inspection."
  );

  const [makeGoodType, setMakeGoodType] = useState('replacement_sent');
  const [trackingNumber, setTrackingNumber] = useState('#TRK-882193-FEDEX');

  if (!isOpen || !review) return null;

  const handleApproveAndPost = () => {
    let makeGoodPayload = null;
    if (makeGoodType === 'replacement_sent') {
      makeGoodPayload = {
        type: 'replacement_sent',
        label: `Replacement sent · ${review.variantTitle || 'Item'}`,
        trackingNumber,
        reorderCost: '$0.00'
      };
    } else if (makeGoodType === 'refund_issued') {
      makeGoodPayload = {
        type: 'refund_issued',
        label: 'Full Refund Processed',
        trackingNumber: 'REFUND-STRIPE-8912',
        reorderCost: '$285.00'
      };
    } else if (makeGoodType === 'store_credit') {
      makeGoodPayload = {
        type: 'store_credit',
        label: 'Store Credit Voucher $300.00',
        trackingNumber: 'CODE-HOL-VIP300',
        reorderCost: '$300.00'
      };
    }

    postBrandResponse(review.id, {
      responderName,
      responderTitle,
      body: replyBody,
      makeGood: makeGoodPayload
    });

    approveReview(review.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 lg:p-6 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-surface-container-lowest rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-outline-variant/40 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Low-Star Escalation &amp; Brand Response Station
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
              Queue: Escalations
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Review Details Context */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size={18} />
                <span className="font-headline-sm text-base font-bold text-on-surface">
                  "{review.title}"
                </span>
              </div>
              <span className="font-mono text-xs text-outline">
                Order #{review.orderId} · {review.variantTitle}
              </span>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant italic">
              "{review.bodyOriginal}"
            </p>
          </div>

          {/* Amber Defect Radar Link Card */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-[#B45309] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">warning</span>
              </div>
              <div className="flex flex-col">
                <div className="font-headline-sm text-sm text-[#B45309] font-bold">
                  Defect Radar Link: 4 similar reports · Charcoal L · 72h
                </div>
                <div className="font-body-sm text-xs text-on-surface-variant">
                  Cluster detected across SKU-89211 manufacturing batch{' '}
                  <span className="font-mono font-semibold text-on-surface">#LOT-441B</span>
                </div>
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex items-center gap-3">
              <svg className="w-16 h-6 text-[#B45309]" fill="none" viewBox="0 0 60 20">
                <path d="M2 18 L18 16 L34 10 L58 3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                <circle cx="58" cy="3" fill="currentColor" r="2.5" />
              </svg>
              <span className="font-mono text-xs bg-amber-500/20 text-[#B45309] font-bold px-2 py-1 rounded">
                Trend Spiking
              </span>
            </div>
          </div>

          {/* Integrated Brand Response Form */}
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 flex flex-col gap-4">
            {/* Mode Tabs */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('public')}
                  className={`px-3 py-1.5 rounded-lg font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'public'
                      ? 'bg-surface-container-lowest text-primary shadow-xs border border-outline-variant/30'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">forum</span>
                  <span>Public Response</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('make-good')}
                  className={`px-3 py-1.5 rounded-lg font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'make-good'
                      ? 'bg-surface-container-lowest text-primary shadow-xs border border-outline-variant/30'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  <span>Private Make-Good</span>
                </button>
              </div>

              <span className="font-mono text-xs bg-tertiary/10 text-tertiary px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                <span>Official response from Hollis Goods</span>
              </span>
            </div>

            {/* Response Textarea */}
            <div className="flex flex-col gap-2">
              <textarea
                rows={3}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Draft official merchant reply..."
                className="w-full bg-surface-container-lowest text-on-surface p-3 rounded-lg text-body-sm font-sans focus:outline-none focus:border-primary shadow-inner border border-outline-variant/30 resize-none"
              />
              <div className="flex items-center justify-between text-xs font-mono text-outline">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>
                    Posting as <strong className="text-on-surface">{responderName}</strong> · {responderTitle}
                  </span>
                </div>
                <span>Auto-publishes beneath review on storefront</span>
              </div>
            </div>

            {/* Attached Automated Make-Good Record Selection */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-outline font-bold">
                  Make-Good Action Bridge
                </span>
                <span className="font-mono text-xs text-primary font-bold">
                  Auto-dispatched via ERP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  onClick={() => setMakeGoodType('replacement_sent')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-mono text-xs transition-colors ${
                    makeGoodType === 'replacement_sent'
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'border-outline-variant/40 hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="makeGood"
                    checked={makeGoodType === 'replacement_sent'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                  <span>Send Replacement ($0.00)</span>
                </label>

                <label
                  onClick={() => setMakeGoodType('refund_issued')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-mono text-xs transition-colors ${
                    makeGoodType === 'refund_issued'
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'border-outline-variant/40 hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="makeGood"
                    checked={makeGoodType === 'refund_issued'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                  <span>Issue 100% Refund</span>
                </label>

                <label
                  onClick={() => setMakeGoodType('store_credit')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-mono text-xs transition-colors ${
                    makeGoodType === 'store_credit'
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'border-outline-variant/40 hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="makeGood"
                    checked={makeGoodType === 'store_credit'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                  <span>$300 VIP Store Credit</span>
                </label>
              </div>

              {makeGoodType === 'replacement_sent' && (
                <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                  <span className="text-outline">Assigned Tracking:</span>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="px-2 py-0.5 rounded border border-outline-variant/40 bg-surface-container-low text-on-surface font-bold text-xs"
                  />
                  <span className="text-primary font-semibold">Priority FedEx Express</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Decision Dock Footer */}
        <div className="bg-surface-container-low p-4 border-t border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`Review ${review.id} escalated to QA engineering team.`)}
              className="bg-surface-container-lowest hover:bg-surface-container-high px-3 py-2 rounded text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">bug_report</span>
              <span>Escalate to QA</span>
              <HotkeyKeycap char="E" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant hover:bg-surface-container font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApproveAndPost}
              className="bg-primary hover:bg-primary-container text-white px-5 py-2 rounded font-headline-sm text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Approve &amp; Post Public Response</span>
              <HotkeyKeycap char="A" variant="active" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

