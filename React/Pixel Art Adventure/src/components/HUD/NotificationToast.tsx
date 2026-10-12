import React from 'react';
import { Sparkles, CheckCircle2, Award, Flame } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'item' | 'quest' | 'save' | 'lore';
}

interface NotificationToastProps {
  toasts: ToastMessage[];
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => {
        let Icon = Sparkles;
        let borderColor = 'border-[#F59E0B]';
        let iconColor = 'text-[#F59E0B]';

        if (toast.type === 'quest') {
          Icon = CheckCircle2;
          borderColor = 'border-[#10B981]';
          iconColor = 'text-[#10B981]';
        } else if (toast.type === 'item') {
          Icon = Flame;
          borderColor = 'border-[#38BDF8]';
          iconColor = 'text-[#38BDF8]';
        } else if (toast.type === 'lore') {
          Icon = Award;
          borderColor = 'border-[#D97706]';
          iconColor = 'text-[#FBBF24]';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-3 rounded-lg bg-[#131826]/95 border-2 ${borderColor} backdrop-blur-md shadow-2xl animate-in slide-in-from-top-4 duration-200`}
          >
            <div className="p-2 rounded bg-[#0B0D14]/80 border border-[#2D3954]">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>

            <div className="flex flex-col">
              <span className="font-story font-bold text-xs text-[#F8FAFC]">
                {toast.title}
              </span>
              {toast.description && (
                <span className="font-story text-[11px] text-[#CBD5E1]">
                  {toast.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
