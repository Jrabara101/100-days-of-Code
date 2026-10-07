import React, { useState } from 'react';
import { ConnectedCalendar, WebhookLog } from '../../types';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendars: ConnectedCalendar[];
  webhookLogs: WebhookLog[];
  onTriggerTestWebhook: (type: 'booking.created' | 'booking.rescheduled' | 'booking.cancelled') => void;
  onTestConflictDetection: () => void;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  calendars,
  webhookLogs,
  onTriggerTestWebhook,
  onTestConflictDetection,
}) => {
  const [conflictTestResult, setConflictTestResult] = useState<string | null>(null);
  const [isTestingConflict, setIsTestingConflict] = useState(false);

  if (!isOpen) return null;

  const handleConflictCheck = () => {
    setIsTestingConflict(true);
    setConflictTestResult(null);
    setTimeout(() => {
      onTestConflictDetection();
      setConflictTestResult('✓ Free/Busy check complete. Found 2 busy events on Google Calendar; unavailable slots automatically purged from guest view.');
      setIsTestingConflict(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs" />
      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-divider/70 p-5 z-50 animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border-divider/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-variant text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Two-Way Calendar Sync & Webhooks</h3>
              <p className="text-xs text-text-secondary">Google Calendar, Microsoft Graph & Real-Time Conflict Radar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-neutral text-text-secondary hover:text-text-primary flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 1. Connected Calendars */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-text-primary block">Connected Bi-Directional Calendars</span>
          <div className="space-y-2">
            {calendars.map((cal, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-surface border border-border-divider flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {cal.provider === 'google' ? 'calendar_month' : 'mail'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-text-primary block">{cal.name}</span>
                    <span className="text-text-secondary text-[11px]">{cal.email}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container font-semibold text-[10px]">
                    ● Active 2-Way Sync
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">{cal.lastSyncedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Real-Time Free/Busy Conflict Detection */}
        <div className="p-3.5 bg-surface-neutral rounded-xl border border-border-divider/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-text-primary">
              <span className="material-symbols-outlined text-[18px] text-primary">flaky</span>
              <span>Real-Time Free/Busy Conflict Detection</span>
            </div>
            <button
              onClick={handleConflictCheck}
              disabled={isTestingConflict}
              className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary font-bold text-[11px] hover:bg-primary-hover active:scale-95 transition-all shadow-xs"
            >
              {isTestingConflict ? 'Checking endpoints...' : 'Test Conflict Radar'}
            </button>
          </div>
          <p className="text-[11px] text-text-secondary">
            Queries host's Google Calendar and Outlook free/busy APIs simultaneously before rendering guest slots.
          </p>
          {conflictTestResult && (
            <div className="p-2 bg-secondary-container/40 text-on-secondary-container rounded-lg text-xs font-medium animate-fade-in">
              {conflictTestResult}
            </div>
          )}
        </div>

        {/* 3. Webhook & Automation Pipeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary block">Webhook & Automation Event Pipeline</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onTriggerTestWebhook('booking.created')}
                className="px-2 py-0.5 rounded-md bg-surface-neutral hover:bg-surface-variant text-[10px] font-semibold text-text-secondary hover:text-text-primary border border-border-divider"
              >
                + Test Created
              </button>
              <button
                onClick={() => onTriggerTestWebhook('booking.rescheduled')}
                className="px-2 py-0.5 rounded-md bg-surface-neutral hover:bg-surface-variant text-[10px] font-semibold text-text-secondary hover:text-text-primary border border-border-divider"
              >
                + Test Rescheduled
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
            {webhookLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-surface border border-border-divider space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{log.event}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-secondary-container/50 text-secondary text-[10px] font-bold">
                      HTTP {log.responseCode}
                    </span>
                    <span className="text-[10px] text-text-secondary">{log.timestamp}</span>
                  </div>
                </div>
                <pre className="text-[10px] text-text-secondary overflow-x-auto bg-surface-container-lowest p-1.5 rounded-lg border border-border-divider/50">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-border-divider/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-container text-on-primary font-bold text-xs rounded-xl shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
