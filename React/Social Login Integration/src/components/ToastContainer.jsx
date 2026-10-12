import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-blue-500/30 bg-[#121316] text-white';
        let Icon = Info;
        let iconColor = 'text-blue-400';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 bg-[#10141a] text-white shadow-emerald-500/10';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/40 bg-[#181510] text-white shadow-amber-500/10';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/40 bg-[#1a1012] text-white shadow-rose-500/10';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 glass-panel animate-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold tracking-tight text-white">{toast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-white transition flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
