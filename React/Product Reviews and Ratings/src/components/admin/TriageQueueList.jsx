import React from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function TriageQueueList() {
  const {
    reviews,
    selectedReviewId,
    setSelectedReviewId,
    activeQueueTab,
    adminSearchQuery,
    setAdminSearchQuery
  } = useTrustStore();

  // Filter queue items by active tab and search query
  const queueReviews = reviews.filter(r => {
    // Tab filtering
    if (activeQueueTab === 'triage-inbox') {
      if (r.moderationStatus !== 'pending') return false;
    } else if (activeQueueTab === 'needs-redaction') {
      if (r.priorityQueue !== 'needs-redaction' || r.moderationStatus !== 'pending') return false;
    } else if (activeQueueTab === 'media-blur') {
      if (r.priorityQueue !== 'media-blur' || r.moderationStatus !== 'pending') return false;
    } else if (activeQueueTab === 'low-star-escalations') {
      if (r.priorityQueue !== 'low-star-escalations' || r.moderationStatus !== 'pending') return false;
    } else if (activeQueueTab === 'fraud-hold') {
      if (r.priorityQueue !== 'fraud-hold' && r.moderationStatus !== 'rejected') return false;
    } else if (activeQueueTab === 'published') {
      if (r.moderationStatus !== 'approved') return false;
    }

    // Search query filtering
    if (adminSearchQuery.trim()) {
      const q = adminSearchQuery.toLowerCase();
      const combined = `${r.id} ${r.productTitle} ${r.reviewerName} ${r.riskFlags.join(' ')}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }

    return true;
  });

  return (
    <section className="w-[420px] flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between h-[calc(100vh-100px)] sticky top-[100px]">
      <div className="flex flex-col min-h-0 flex-1">
        {/* List Header */}
        <div className="p-3.5 border-b border-outline-variant/20 flex flex-col gap-2.5 bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold capitalize">
                {activeQueueTab.replace('-', ' ')}
              </h2>
              <span className="font-mono text-label-code-sm bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full font-bold">
                {queueReviews.length}
              </span>
            </div>
            <div className="flex items-center gap-1 text-label-code-sm font-mono text-outline hover:text-on-surface cursor-pointer">
              <span>Oldest first</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </div>
          </div>

          <div className="relative w-full">
            <span className="material-symbols-outlined text-[16px] absolute left-2.5 top-2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Quick filter (author, SKU, flag)..."
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-body-sm font-sans bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Rows List */}
        <div className="flex flex-col divide-y divide-outline-variant/20 overflow-y-auto flex-1">
          {queueReviews.length === 0 ? (
            <div className="p-8 text-center text-outline font-mono text-xs flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
              <span>All items cleared in this queue</span>
            </div>
          ) : (
            queueReviews.map((r) => {
              const isSelected = r.id === selectedReviewId;
              const isApproved = r.moderationStatus === 'approved';
              const isRejected = r.moderationStatus === 'rejected';

              return (
                <article
                  key={r.id}
                  onClick={() => setSelectedReviewId(r.id)}
                  className={`min-h-[72px] px-3.5 py-2.5 flex flex-col justify-center cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-surface-container-low border-l-3 border-primary shadow-xs'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`font-mono text-label-code-sm font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                          r.rating <= 2
                            ? 'text-error bg-error-container/70'
                            : 'text-amber-800 bg-amber-100/70'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px] fill-1">
                          star
                        </span>
                        <span>{Number(r.rating).toFixed(1)}</span>
                      </span>
                      <span className="font-headline-sm text-sm text-on-surface truncate font-semibold">
                        {r.productTitle}
                      </span>
                    </div>

                    <span
                      className={`font-mono text-[11px] font-semibold flex-shrink-0 ${
                        r.slaRemainingMinutes <= 15
                          ? 'text-error font-bold'
                          : 'text-outline'
                      }`}
                    >
                      {isApproved
                        ? 'Published'
                        : isRejected
                        ? 'Rejected'
                        : `${r.slaRemainingMinutes || 15}m SLA`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-body-sm text-xs text-on-surface-variant font-medium">
                        {r.reviewerName}
                      </span>

                      {r.provenanceType === 'verified_purchase' && (
                        <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.2 rounded font-semibold">
                          Verified
                        </span>
                      )}

                      {r.provenanceType === 'incentivized_gifted' && (
                        <span className="font-mono text-[10px] text-secondary bg-secondary/10 px-1.5 py-0.2 rounded font-semibold">
                          Gifted
                        </span>
                      )}

                      {r.provenanceType === 'repeat_buyer' && (
                        <span className="font-mono text-[10px] text-on-surface bg-surface-container-high px-1.5 py-0.2 rounded font-medium">
                          Repeat (4)
                        </span>
                      )}

                      {r.provenanceType === 'unverified' && (
                        <span className="font-mono text-[10px] text-outline bg-surface-variant px-1.5 py-0.2 rounded">
                          Unverified
                        </span>
                      )}

                      {/* Primary Flag Pill */}
                      {r.riskFlags.length > 0 && (
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-medium truncate ${
                            r.riskScore >= 70
                              ? 'text-error bg-error-container'
                              : r.riskFlags.some(f => f.includes('phone') || f.includes('pii'))
                              ? 'text-amber-900 bg-amber-100 border border-amber-300'
                              : 'text-on-surface-variant bg-surface-variant'
                          }`}
                        >
                          {r.riskFlags.length} flags
                        </span>
                      )}

                      {r.media && r.media.length > 0 && (
                        <span className="font-mono text-[10px] text-outline bg-surface-variant px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">photo</span>
                          <span>Photo</span>
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-[11px] text-outline">
                      {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Summary Status */}
      <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low flex items-center justify-between font-mono text-[11px] text-outline">
        <span>Items 1-{queueReviews.length} of {queueReviews.length}</span>
        <span>Escalation quota: 3/10</span>
      </div>
    </section>
  );
}

