import React from 'react';
import { useVault } from '../../context/VaultContext';
import { Shield, Smartphone, Monitor } from 'lucide-react';

export default function Header() {
  const { currentScreen, isAndroidFrameMode, setIsAndroidFrameMode } = useVault();

  // Screen Title mapping
  const screenTitles = {
    files: 'Files',
    uploads: 'Uploads',
    inspector: 'Inspector',
    security: 'Security',
    scanner: 'Document Scanner',
    crop_review: 'Crop & OCR'
  };

  const currentTitle = screenTitles[currentScreen] || 'Vault';

  return (
    <header className="sticky top-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between gap-3">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-container text-tertiary-fixed flex items-center justify-center flex-shrink-0 shadow-sm border border-secondary/30">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="2.5" />
              <path d="M12 13.5V17" />
            </svg>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base sm:text-lg text-primary tracking-tight font-bold truncate">
                Vault
              </span>
              <span className="font-body text-xs text-on-surface-variant font-medium hidden sm:inline">
                &amp; Stream
              </span>
            </div>
            <span className="font-body text-[11px] text-on-surface-variant -mt-0.5 font-medium truncate">
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Right: AES Badge, Android Toggle & Profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 256-bit AES pulse badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed/20 text-on-tertiary-container shadow-[inset_0_0_0_1px_rgba(28,158,113,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase">
              256-bit AES
            </span>
          </div>

          {/* Toggle Android Device Frame vs Full Screen View */}
          <button
            onClick={() => setIsAndroidFrameMode(!isAndroidFrameMode)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-secondary-container hover:bg-surface-container-high transition-colors text-xs font-medium"
            title={isAndroidFrameMode ? "Switch to Full Responsive Web View" : "Switch to Android Mobile Device View"}
          >
            {isAndroidFrameMode ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Mode</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android Frame</span>
              </>
            )}
          </button>

          {/* User Profile Avatar */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:ring-2 hover:ring-secondary/40 transition-all focus:outline-none">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

