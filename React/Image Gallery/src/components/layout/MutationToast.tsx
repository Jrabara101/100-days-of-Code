import React, { useEffect } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';

export const MutationToast: React.FC = () => {
  const notice = useGalleryStore((s) => s.lastMutationNotice);
  const dismiss = useGalleryStore((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notice, dismiss]);

  if (!notice) return null;

  const isRollback = notice.type === 'rollback';

  return (
    <div className="fixed top-20 right-5 z-50 animate-in slide-in-from-top-3 duration-300">
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur-xl shadow-2xl text-xs font-mono-data ${
          isRollback
            ? 'bg-error-container/30 border-error text-error shadow-[0_0_20px_rgba(255,180,171,0.3)]'
            : 'bg-surface-container-high/90 border-primary/40 text-on-surface shadow-[0_0_20px_rgba(56,189,248,0.2)]'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] ${
            isRollback ? 'text-error' : 'text-primary'
          }`}
        >
          {isRollback ? 'history' : 'check_circle'}
        </span>
        <span>{notice.message}</span>
        <button
          type="button"
          onClick={dismiss}
          className="ml-2 text-outline hover:text-white"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>
  );
};
