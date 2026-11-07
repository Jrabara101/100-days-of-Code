import React from 'react';
import { 
  Radio, 
  Search, 
  Moon, 
  Sun, 
  Sliders, 
  BookmarkCheck, 
  MoonStar,
  Sparkles
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';

interface NavbarProps {
  onOpenVault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVault }) => {
  const { 
    isDaylightTheme, 
    toggleDaylightTheme, 
    isCreatorView, 
    toggleCreatorView,
    setIsSearchModalOpen,
    setIsSleepTimerModalOpen,
    sleepTimerRemainingSec,
    listeningVault,
    isPlaying
  } = usePodcast();

  return (
    <header className="sticky top-0 z-40 w-full glass-dock border-b border-[var(--border-hairline)] px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity & On-Air Indicator */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-md shadow-amber-500/20">
            <Radio className="w-5 h-5 text-neutral-950 stroke-[2.2]" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                RESONANCE
              </span>
              <span className="text-[10px] uppercase font-mono-tabular tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 font-semibold">
                STUDIO
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-[var(--text-muted)] tracking-wide">
              The Audio Architecture of Modern Building
            </p>
          </div>

          {/* On-Air Hardware Pill */}
          <div className="hidden lg:flex items-center gap-2 ml-3 px-2.5 py-1 rounded-full bg-neutral-900/60 border border-[var(--border-hairline)]">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-amber-500 animate-on-air' : 'bg-neutral-600'}`} />
            <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
              {isPlaying ? 'ON AIR • LIVE SYNC' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Center: Global Spoken Word Search Trigger */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex-1 max-w-md hidden sm:flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/40 text-left transition-all group shadow-inner"
        >
          <div className="flex items-center gap-2.5 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
            <Search className="w-4 h-4 text-amber-500/80" />
            <span className="text-xs font-medium">
              Search spoken words across 140+ episodes...
            </span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 font-mono-tabular text-[10px] px-1.5 py-0.5 rounded bg-[var(--canvas-console)] text-[var(--text-muted)] border border-[var(--border-hairline)]">
            ⌘K
          </kbd>
        </button>

        {/* Right: Quick Studio Controls */}
        <div className="flex items-center gap-2">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="sm:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-amber-500 hover:bg-white/5 transition-colors"
            title="Search Spoken Words"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Sleep / Wind-Down Timer */}
          <button
            onClick={() => setIsSleepTimerModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              sleepTimerRemainingSec !== null
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-500 font-mono-tabular'
                : 'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
            title="Smart Sleep & Commute Timer"
          >
            <MoonStar className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {sleepTimerRemainingSec !== null 
                ? `${Math.floor(sleepTimerRemainingSec / 60)}m left`
                : 'Wind-Down'
              }
            </span>
          </button>

          {/* Listening Vault Drawer Button */}
          <button
            onClick={onOpenVault}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            title="Personal Listening Vault"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Vault</span>
            {listeningVault.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-mono-tabular text-[10px] font-bold">
                {listeningVault.length}
              </span>
            )}
          </button>

          {/* Daylight Paper Mode Toggle */}
          <button
            onClick={toggleDaylightTheme}
            className="p-2 rounded-xl border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            title={isDaylightTheme ? 'Switch to Studio Slate (Dark)' : 'Switch to Daylight Paper (Light)'}
          >
            {isDaylightTheme ? (
              <Moon className="w-4 h-4 text-amber-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Creator Studio Mode Switch */}
          <button
            onClick={toggleCreatorView}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all ${
              isCreatorView 
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold hover:brightness-110 shadow-sm'
            }`}
          >
            {isCreatorView ? (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Listener View</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>Creator Studio</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
