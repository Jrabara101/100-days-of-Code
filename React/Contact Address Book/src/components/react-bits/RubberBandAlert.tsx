import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useContactStore } from '../../store/useContactStore';

export const RubberBandAlert: React.FC = () => {
  const isVisible = useContactStore((state) => state.isRollbackBannerVisible);
  const reason = useContactStore((state) => state.rollbackReason);
  const dismiss = useContactStore((state) => state.dismissRollbackBanner);
  const isRollingBack = useContactStore((state) => state.isRollingBack);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0, y: -20 }}
          animate={{ height: 'auto', opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`w-full overflow-hidden bg-error-container text-on-error-container px-4 py-2.5 shadow-lg border-b border-error/30 ${
            isRollingBack ? 'animate-rubber-band' : ''
          }`}
        >
          <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-error/20 text-error">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono">
                <span className="font-bold uppercase tracking-wider text-error">
                  OPTIMISTIC RECONCILIATION FAULT:
                </span>
                <span className="text-on-error-container font-sans text-xs">
                  {reason || 'Packet dropped on shard #04. Rollback executed in 0.08ms. Local state restored.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/20 text-[10px] font-mono text-error">
                <RefreshCw className="h-3 w-3 animate-spin" />
                RESTORED (0.08ms)
              </span>
              <button
                onClick={dismiss}
                className="p-1 rounded hover:bg-black/20 text-on-error-container transition-colors"
                title="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
