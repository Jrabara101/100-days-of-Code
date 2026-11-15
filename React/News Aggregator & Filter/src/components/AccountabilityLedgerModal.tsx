import React from 'react';
import { CalendarClock, CheckCircle2, Pin, X, XCircle } from 'lucide-react';
import { TrackedPrediction } from '../types/news';

interface AccountabilityLedgerModalProps {
  open: boolean;
  predictions: TrackedPrediction[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: TrackedPrediction['status']) => void;
  onRemove: (id: string) => void;
}

const STATUS_BADGE: Record<TrackedPrediction['status'], string> = {
  'Due Today': 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35',
  Pending: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
  Confirmed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35',
  Missed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35',
};

export const AccountabilityLedgerModal: React.FC<AccountabilityLedgerModalProps> = ({
  open,
  predictions,
  onClose,
  onUpdateStatus,
  onRemove,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Prediction and Follow-Up Accountability Ledger"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[var(--border-column-rule)] bg-[var(--surface-cluster-card)] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-editorial-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-amber-600" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink-primary">
                Prediction & Follow-Up Ledger
              </h2>
              <p className="text-xs text-ink-muted">
                Hold bold media forecasts accountable when their check-in dates arrive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close accountability ledger"
            className="rounded-full p-1 text-ink-muted hover:bg-[var(--surface-brief-inset)] hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {predictions.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No forecasts tracked yet. Click <strong>Track Outcome</strong> on any story with a dated projection.
            </p>
          ) : (
            predictions.map((pred) => (
              <div
                key={pred.id}
                className="rounded-xl border border-[var(--border-editorial-hairline)] bg-[var(--surface-brief-inset)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${STATUS_BADGE[pred.status]}`}
                  >
                    <CalendarClock className="h-3 w-3" />
                    {pred.status} • Check: {pred.targetDateLabel}
                  </span>

                  <span className="text-xs font-medium text-ink-muted">
                    Source: {pred.sourceName}
                  </span>
                </div>

                <h3 className="mt-2 font-serif text-base font-semibold text-ink-primary">
                  “{pred.claim}”
                </h3>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  Story context: {pred.storyTitle}
                </p>
                {pred.note && (
                  <p className="mt-1.5 rounded-md bg-[var(--surface-cluster-card)] px-2.5 py-1.5 text-xs text-ink-secondary">
                    {pred.note}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-editorial-hairline)] pt-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(pred.id, 'Confirmed')}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Confirmed
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(pred.id, 'Missed')}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
                    >
                      <XCircle className="h-3 w-3" />
                      Missed
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(pred.id)}
                    className="text-[11px] font-medium text-ink-muted hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

