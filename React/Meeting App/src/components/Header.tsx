import React from 'react';
import { HostProfile } from '../types';

interface HeaderProps {
  host: HostProfile;
  activeMode: 'guest' | 'host';
  onToggleMode: (mode: 'guest' | 'host') => void;
  onOpenApkModal: () => void;
  onOpenSyncModal: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  pageTitle?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  host,
  activeMode,
  onToggleMode,
  onOpenApkModal,
  onOpenSyncModal,
  canGoBack,
  onGoBack,
  pageTitle = 'Book Slot',
  subtitle = 'CalSync Host'
}) => {
  return (
    <header className="sticky top-0 w-full z-40 pt-safe bg-surface/85 backdrop-blur-xl border-b border-border-divider/50 shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-all">
      <div className="h-14 px-3 sm:px-4 max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Back / Brand */}
        <div className="flex items-center gap-2 min-w-0">
          {canGoBack && onGoBack ? (
            <button
              aria-label="Go back"
              onClick={onGoBack}
              className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-neutral active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-filled text-[20px]">calendar_month</span>
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-semibold text-text-primary truncate leading-tight">
              {activeMode === 'guest' ? pageTitle : 'Host Studio'}
            </span>
            <span className="text-[11px] font-medium text-text-secondary truncate">
              {activeMode === 'guest' ? subtitle : 'Alex Rivera • Calendar Synced'}
            </span>
          </div>
        </div>

        {/* Right actions: Mode switch, APK Download, Sync indicator, Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Switcher Pill */}
          <div className="bg-surface-neutral p-1 rounded-xl flex items-center border border-border-divider shadow-xs">
            <button
              onClick={() => onToggleMode('guest')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeMode === 'guest'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Guest View
            </button>
            <button
              onClick={() => onToggleMode('host')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeMode === 'host'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Host Studio
            </button>
          </div>

          {/* Android APK Download Action */}
          <button
            onClick={onOpenApkModal}
            title="Download Android APK"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-secondary-container/60 hover:bg-secondary-container text-on-secondary-container text-xs font-semibold active:scale-95 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">android</span>
            <span className="hidden sm:inline">APK</span>
          </button>

          {/* Calendar Sync Status Trigger */}
          <button
            onClick={onOpenSyncModal}
            title="Two-Way Calendar Sync & Webhooks"
            className="w-9 h-9 rounded-xl bg-surface-neutral hover:bg-surface-variant/50 text-primary flex items-center justify-center border border-border-divider/80 active:scale-95 transition-all relative"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-available animate-pulse"></span>
          </button>

          {/* Host Avatar */}
          <div className="relative shrink-0">
            <img
              src={host.avatarUrl}
              alt={host.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-surface shadow-xs"
            />
            {host.verified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-container text-on-primary rounded-full flex items-center justify-center text-[9px] font-bold">
                ✓
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
