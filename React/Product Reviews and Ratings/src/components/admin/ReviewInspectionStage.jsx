import React, { useState, useMemo } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { StarRating } from '../common/StarRating';
import { scanTextEntities } from '../../lib/trustEngine';
import { HotkeyKeycap } from '../common/HotkeyKeycap';
import { formatDate } from '../../lib/utils';

export function ReviewInspectionStage({
  onOpenBlurTool,
  onOpenBrandReply,
  onOpenRejectModal
}) {
  const {
    selectedReview,
    approveReview,
    redactAndApproveReview,
    rejectReview
  } = useTrustStore();

  const [stagedRedactions, setStagedRedactions] = useState(new Set());
  const [showBrandReplyDock, setShowBrandReplyDock] = useState(false);
  const [replyText, setReplyText] = useState(
    selectedReview?.brandResponse?.body ||
      "We're sorry to hear this didn't meet expectations — we've flagged this for product inspection and our team is sending a direct resolution."
  );

  // Scan detected entities in raw text
  const detectedEntities = useMemo(() => {
    if (!selectedReview) return [];
    return scanTextEntities(selectedReview.bodyOriginal);
  }, [selectedReview]);

  if (!selectedReview) {
    return (
      <main className="flex-1 bg-surface flex items-center justify-center text-outline font-mono text-sm">
        Select a review from the triage queue to inspect
      </main>
    );
  }

  const pendingEntitiesCount = detectedEntities.filter(
    e => !stagedRedactions.has(e.id)
  ).length;

  const isFullyRedacted = detectedEntities.length > 0 && pendingEntitiesCount === 0;

  const stageRedaction = (entityId) => {
    setStagedRedactions(prev => new Set([...prev, entityId]));
  };

  const stageAllRedactions = () => {
    setStagedRedactions(new Set(detectedEntities.map(e => e.id)));
  };

  const handleApplyAndApprove = () => {
    redactAndApproveReview(selectedReview.id);
  };

  const handleApproveAsIs = () => {
    approveReview(selectedReview.id);
  };

  const firstMedia = selectedReview.media && selectedReview.media.length > 0 ? selectedReview.media[0] : null;

  return (
    <main className="flex-1 bg-surface flex flex-col justify-between overflow-y-auto min-h-[calc(100vh-100px)]">
      <div className="p-6 max-w-4xl w-full flex flex-col">
        {/* Stage Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <StarRating rating={selectedReview.rating} size={20} />
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              {selectedReview.title}
            </h1>
          </div>
          <div className="font-mono text-label-code-sm text-outline flex items-center gap-2">
            <span>
              Audit ID: <strong className="text-on-surface font-semibold">{selectedReview.id}</strong>
            </span>
            <span>·</span>
            <span>{formatDate(selectedReview.createdAt)}</span>
          </div>
        </div>

        {/* Provenance Card (4-grid) */}
        <section className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 mb-5 select-none shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-outline-variant/30 text-center font-mono text-label-code-sm">
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-outline uppercase text-[10px] tracking-wider mb-0.5">
                Verification &amp; Delivery
              </span>
              <span className="text-on-surface font-semibold">
                Order #{selectedReview.orderId || 'HG-8492'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-outline uppercase text-[10px] tracking-wider mb-0.5">
                Reviewer Tenure
              </span>
              <span className="text-on-surface font-semibold">
                {selectedReview.reviewerAttributes?.accountAge || '2 yrs'} · {selectedReview.reviewerAttributes?.orderCount || 4} orders
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-outline uppercase text-[10px] tracking-wider mb-0.5">
                Integrity Heuristics
              </span>
              <span className={`font-semibold flex items-center gap-1 ${
                selectedReview.riskScore >= 70 ? 'text-error' : 'text-primary'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedReview.riskScore >= 70 ? 'bg-error' : 'bg-primary'
                }`} />
                <span>Risk {selectedReview.riskScore} / 100 · {selectedReview.riskLevel}</span>
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-outline uppercase text-[10px] tracking-wider mb-0.5">
                Media Uniqueness
              </span>
              <span className="text-on-surface font-semibold">
                {selectedReview.media?.length > 0 ? 'Photo hash · Unique' : 'No photo uploaded'}
              </span>
            </div>
          </div>
        </section>

        {/* Section: Review Text & Entities Detected */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-headline-sm text-xs uppercase tracking-wider text-outline font-bold">
              Review Text (Entities Detected)
            </span>
            {pendingEntitiesCount > 0 ? (
              <span className="font-mono text-label-code-sm text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-bold border border-amber-300">
                {pendingEntitiesCount} Text PII / Claims Pending
              </span>
            ) : (
              <span className="font-mono text-label-code-sm text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">
                ✓ All Text Tokens Sanitized
              </span>
            )}
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-xs">
            <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
              {(() => {
                const text = selectedReview.bodyOriginal;
                if (!detectedEntities || detectedEntities.length === 0) {
                  return text;
                }

                // Render with interactive entity chips
                let lastIdx = 0;
                const fragments = [];

                detectedEntities.forEach((ent, i) => {
                  if (ent.startIndex > lastIdx) {
                    fragments.push(text.substring(lastIdx, ent.startIndex));
                  }

                  const isStaged = stagedRedactions.has(ent.id) || selectedReview.isRedacted;

                  if (isStaged) {
                    fragments.push(
                      <span
                        key={ent.id}
                        className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant font-mono text-xs border border-outline-variant/50"
                      >
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        <span>{ent.suggestedMask}</span>
                      </span>
                    );
                  } else {
                    fragments.push(
                      <span key={ent.id} className="inline-flex flex-col mx-1 align-baseline group">
                        <span className="text-[10px] font-mono uppercase font-bold text-amber-900 bg-amber-200 px-1 py-0.5 rounded-t border border-b-0 border-amber-300 w-max leading-none">
                          {ent.label}
                        </span>
                        <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-b font-medium text-body-md transition-colors hover:bg-amber-100">
                          {ent.rawText}
                        </span>
                      </span>
                    );
                  }

                  lastIdx = ent.endIndex;
                });

                if (lastIdx < text.length) {
                  fragments.push(text.substring(lastIdx));
                }

                return fragments;
              })()}
            </p>
          </div>
        </section>

        {/* Token Action Bar */}
        {detectedEntities.length > 0 && !selectedReview.isRedacted && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {detectedEntities.map((ent) => {
              const isStaged = stagedRedactions.has(ent.id);
              return (
                <button
                  key={ent.id}
                  disabled={isStaged}
                  onClick={() => stageRedaction(ent.id)}
                  className={`h-8 px-3 rounded font-mono text-label-code-sm font-semibold flex items-center gap-1.5 transition-colors border ${
                    isStaged
                      ? 'bg-surface-variant text-outline border-outline-variant/30 cursor-not-allowed opacity-50'
                      : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isStaged ? 'check' : 'visibility_off'}
                  </span>
                  <span>{isStaged ? `Redacted ${ent.label}` : `Redact ${ent.label}`}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-outline-variant/40 mx-1" />

            <button
              onClick={stageAllRedactions}
              className="h-8 px-3 rounded text-on-surface-variant hover:bg-surface-container-high font-mono text-label-code-sm font-bold underline decoration-dashed transition-colors"
            >
              Redact all ({detectedEntities.length})
            </button>
          </div>
        )}

        {/* Section: Media Attachment & Label Blur */}
        {firstMedia && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-outline font-bold">
                Media · 1 photo
              </span>
              <span className={`font-mono text-label-code-sm px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                firstMedia.isBlurred
                  ? 'bg-primary/10 text-primary'
                  : 'bg-error/10 text-error'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${firstMedia.isBlurred ? 'bg-primary' : 'bg-error'}`} />
                <span>{firstMedia.isBlurred ? 'Privacy Blur Applied' : 'Shipping label exposed'}</span>
              </span>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4">
                {/* Visual Mockup Container (160x120) with Bounding Box Overlay */}
                <div
                  onClick={() => onOpenBlurTool(selectedReview, firstMedia)}
                  className="w-[160px] h-[120px] rounded-lg bg-surface-container-low border border-outline-variant/30 relative overflow-hidden flex flex-col items-center justify-center select-none cursor-pointer group"
                >
                  <img
                    src={firstMedia.sanitizedUrl || firstMedia.previewUrl || firstMedia.originalPath}
                    alt="Review Media"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* Bounding Box Overlay for Address on Label */}
                  {!firstMedia.isBlurred && (
                    <div className="absolute bottom-2 left-4 right-4 h-6 border-2 border-dashed border-error bg-error/20 rounded flex items-center justify-center">
                      <span className="font-mono text-[9px] text-error bg-surface-container-lowest border border-error px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                        Address on label
                      </span>
                    </div>
                  )}

                  {firstMedia.isBlurred && (
                    <div className="absolute bottom-2 left-4 right-4 h-6 bg-surface-variant/90 border border-outline-variant rounded flex items-center justify-center backdrop-blur-md">
                      <span className="font-mono text-[9px] text-primary font-bold uppercase">
                        Blurred
                      </span>
                    </div>
                  )}
                </div>

                {/* Media Metadata */}
                <div className="flex flex-col gap-1">
                  <span className="font-headline-sm text-sm text-on-surface font-semibold">
                    {firstMedia.filename}
                  </span>
                  <span className="font-mono text-label-code-sm text-outline">
                    {firstMedia.dimensions} · EXIF Geotag stripped · {firstMedia.fileSize}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-error font-medium">
                      BBox [y: 78%, x: 22%, w: 56%, h: 14%]
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenBlurTool(selectedReview, firstMedia)}
                className="h-8 px-3 rounded border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-mono text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">blur_circular</span>
                <span>{firstMedia.isBlurred ? 'Edit blur box' : 'Open blur tool'}</span>
                <HotkeyKeycap char="B" />
              </button>
            </div>
          </section>
        )}

        {/* Brand Reply Collapsible Bar */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3.5 mb-6 flex flex-col gap-3">
          <div
            onClick={() => setShowBrandReplyDock(!showBrandReplyDock)}
            className="flex items-center justify-between cursor-pointer text-on-surface-variant hover:text-on-surface"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-outline">
                {showBrandReplyDock ? 'expand_more' : 'chevron_right'}
              </span>
              <span className="font-headline-sm text-sm font-semibold text-on-surface">
                Brand response draft
              </span>
              <span className="text-outline text-xs font-mono">
                {selectedReview.brandResponse ? '(Response posted)' : '(Optional merchant note)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-outline text-xs font-mono">Shortcut</span>
              <HotkeyKeycap char="M" />
            </div>
          </div>

          {showBrandReplyDock && (
            <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2.5 animate-fadeIn">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Draft official merchant reply..."
                className="w-full bg-surface-container-lowest p-3 rounded-lg text-body-sm font-sans border border-outline-variant/40 focus:outline-none focus:border-primary shadow-xs resize-none"
              />
              <div className="flex items-center justify-between text-xs font-mono text-outline">
                <span>Posting as <strong>Ana Ruiz</strong> · Head of Product Quality</span>
                <button
                  onClick={() => onOpenBrandReply(selectedReview)}
                  className="px-3 py-1 bg-surface-container-highest hover:bg-surface-container-high rounded text-on-surface font-semibold"
                >
                  Configure Make-Good &amp; Resolution →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PINNED DECISION BAR (Fixed bottom, hairline separator) */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 px-6 py-3 flex items-center justify-between sticky bottom-0 z-40 select-none shadow-sm">
        {/* Left: Rejection & Quarantine */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenRejectModal(selectedReview)}
            className="h-8 px-3 rounded text-error hover:bg-error/10 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors border border-error/20"
          >
            <span className="material-symbols-outlined text-[16px]">block</span>
            <span>Reject</span>
            <HotkeyKeycap char="R" variant="error" />
          </button>

          <button
            onClick={() => {
              rejectReview(selectedReview.id, 'Quarantined IP Subnet / Bot Ring Detection');
              alert(`Subnet flagged for review ${selectedReview.id}`);
            }}
            className="h-8 px-3 rounded text-on-surface-variant hover:bg-surface-container-high font-mono text-xs font-medium transition-colors border border-outline-variant/30"
          >
            Quarantine IP
          </button>
        </div>

        {/* Right: Primary Decision Buttons */}
        <div className="flex items-center gap-3">
          {/* Split Redact & Approve Button */}
          <button
            onClick={handleApplyAndApprove}
            className={`h-9 px-4 rounded text-white font-headline-sm text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
              isFullyRedacted || selectedReview.isRedacted
                ? 'bg-primary hover:bg-primary-container'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isFullyRedacted || selectedReview.isRedacted ? 'task_alt' : 'security'}
            </span>
            <span>
              {isFullyRedacted
                ? 'Commit redactions & publish'
                : selectedReview.isRedacted
                ? 'Published (Redactions Active)'
                : `Apply ${pendingEntitiesCount || 3} redactions & approve`}
            </span>
            <HotkeyKeycap char="E" variant="amber" />
          </button>

          {/* Approve as is Button with Tooltip Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAsIs}
              disabled={pendingEntitiesCount > 0 && !selectedReview.isRedacted}
              className={`h-9 px-4 rounded font-headline-sm text-sm font-semibold flex items-center gap-2 transition-colors border ${
                pendingEntitiesCount > 0 && !selectedReview.isRedacted
                  ? 'bg-surface-container-high text-outline border-outline-variant/40 cursor-not-allowed opacity-50'
                  : 'bg-surface-container-lowest text-on-surface border-outline-variant/60 hover:bg-surface-container cursor-pointer'
              }`}
            >
              <span>Approve as is</span>
              <HotkeyKeycap char="A" />
            </button>

            {pendingEntitiesCount > 0 && !selectedReview.isRedacted ? (
              <span className="bg-inverse-surface text-inverse-on-surface text-[11px] font-mono px-2 py-0.5 rounded">
                Resolve flags first
              </span>
            ) : (
              <span className="bg-primary/10 text-primary text-[11px] font-mono px-2 py-0.5 rounded font-semibold">
                Override safe
              </span>
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}

