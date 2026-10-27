import React from 'react';
import { useProject } from '../context/ProjectContext';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useProject();

  if (!toast) return null;

  const icons = {
    info: <Info className="w-4 h-4 text-brand-light shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  };

  const borders = {
    info: 'border-brand/40 bg-[#121417]/95 text-slate-200',
    success: 'border-emerald-500/40 bg-[#121417]/95 text-emerald-100',
    warning: 'border-amber-500/50 bg-[#121417]/95 text-amber-100',
    error: 'border-rose-500/60 bg-[#121417]/95 text-rose-100',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md text-xs font-medium max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className={`p-1 rounded-md ${borders[toast.type] || borders.info} flex items-center gap-2.5 shadow-2xs`}>
        {icons[toast.type] || icons.info}
        <span className="leading-snug">{toast.message}</span>
      </div>
    </div>
  );
}
