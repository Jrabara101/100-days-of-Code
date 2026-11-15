import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { cn } from '../../lib/utils';

export function ToastBanner() {
  const toasts = useChatWorkspaceStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg backdrop-blur-md text-xs font-medium animate-bubble-in',
            'bg-surface-elevated/95 border-divider text-txt-primary'
          )}
        >
          {t.tone === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : t.tone === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

