import React, { useState } from 'react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloadTriggered(true);
    // Trigger download of the built APK from public folder
    const link = document.createElement('a');
    link.href = '/cal-sync-debug.apk';
    link.download = 'cal-sync-meeting-scheduler.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadTriggered(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-divider/70 p-5 z-50 animate-slide-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-divider/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs">
              <span className="material-symbols-filled text-[24px] text-secondary">android</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Download Android APK</h3>
              <p className="text-xs text-text-secondary">Capacitor Mobile Hybrid Package</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-neutral text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* APK Spec Sheet */}
        <div className="p-3.5 bg-surface-neutral rounded-xl border border-border-divider/60 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Application ID:</span>
            <span className="font-mono text-text-primary font-bold">com.calsync.meetingapp</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Runtime Engine:</span>
            <span className="font-semibold text-primary">Capacitor 7 + Android SDK 35</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Target Platforms:</span>
            <span className="font-medium text-text-primary">Android 8.0 to Android 15 (ARM64/x86_64)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Native Capabilities:</span>
            <span className="text-secondary font-semibold">Offline Sync, Calendar, Haptics</span>
          </div>
        </div>

        {/* Download Button */}
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            className="w-full min-h-[48px] px-4 rounded-xl bg-primary-container hover:bg-primary-hover active:scale-95 text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>{downloadTriggered ? 'Downloading APK Package...' : 'Download Android APK'}</span>
          </button>
          {downloadTriggered && (
            <p className="text-[11px] text-center text-status-available font-semibold animate-fade-in">
              ✓ Download initiated! Check your browser's download manager.
            </p>
          )}
        </div>

        {/* Install Guide */}
        <div className="p-3 bg-surface-container rounded-xl text-xs space-y-1.5 text-text-secondary">
          <span className="font-bold text-text-primary block flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">info</span>
            Installation Steps on Android Phone:
          </span>
          <ol className="list-decimal list-inside space-y-1 text-[11px] pl-1">
            <li>Download the <strong className="text-text-primary">cal-sync-debug.apk</strong> file.</li>
            <li>Tap the completed download from notifications or Files app.</li>
            <li>If prompted, allow <em>"Install unknown apps"</em> for your browser.</li>
            <li>Tap <strong>Install</strong> and launch CalSync from your home screen!</li>
          </ol>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-neutral text-text-secondary hover:text-text-primary font-semibold text-xs rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
