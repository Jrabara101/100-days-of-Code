import React from 'react';
import { ToastItem } from '../hooks/useAchievementTracker';
import { Trophy, Gift, ShieldAlert, Info, X } from 'lucide-react';
import { getTierBadgeClass } from '../lib/utils';

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const getIcon = () => {
          switch (toast.type) {
            case 'UNLOCK':
              return <Trophy className="text-amber-400 animate-bounce" size={20} />;
            case 'CLAIM':
              return <Gift className="text-emerald-400" size={20} />;
            case 'TAMPER':
              return <ShieldAlert className="text-rose-400 animate-pulse" size={20} />;
            default:
              return <Info className="text-blue-400" size={20} />;
          }
        };

        const getBorderColor = () => {
          switch (toast.type) {
            case 'UNLOCK':
              return 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-gradient-to-r from-[#141C30] via-[#0E1424] to-[#141C30]';
            case 'CLAIM':
              return 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-r from-[#0E1424] via-[#0E241E] to-[#0E1424]';
            case 'TAMPER':
              return 'border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)] bg-gradient-to-r from-[#240E14] to-[#0E1424]';
            default:
              return 'border-slate-800 bg-[#0E1424]';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border ${getBorderColor()} text-slate-100 flex items-start gap-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300`}
          >
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex-shrink-0">
              {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h4 className="font-display font-extrabold text-xs text-slate-100 truncate">
                  {toast.title}
                </h4>
                <span className="text-[9px] font-mono text-slate-500">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {toast.message}
              </p>
              {toast.tier && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[8px] uppercase font-mono px-1.5 py-0.2 rounded font-bold ${getTierBadgeClass(toast.tier)}`}>
                    {toast.tier}
                  </span>
                  <span className="text-[9px] font-mono text-purple-300">
                    Recorded to Ledger
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
