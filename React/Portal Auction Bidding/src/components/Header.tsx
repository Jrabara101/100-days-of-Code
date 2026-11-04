import React, { useState, useEffect } from 'react';
import { 
  Gavel, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  ShieldCheck, 
  LayoutGrid, 
  Terminal, 
  Building2, 
  Receipt, 
  Database,
  Sparkles,
  Search,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export const Header: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    currentUser, 
    setIsPaddleModalOpen, 
    setIsArchitectureModalOpen,
    isSoundMuted, 
    toggleSound, 
    theme, 
    toggleTheme,
    lots 
  } = useAuction();

  // Server UTC Clock
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getUTCHours().toString().padStart(2, '0');
      const m = now.getUTCMinutes().toString().padStart(2, '0');
      const s = now.getUTCSeconds().toString().padStart(2, '0');
      const ms = Math.floor(now.getUTCMilliseconds() / 100);
      setUtcTime(`${h}:${m}:${s}.${ms} UTC`);
    };

    updateTime();
    const timer = setInterval(updateTime, 100);
    return () => clearInterval(timer);
  }, []);

  // Compute how many lots the user is winning
  const winningCount = lots.filter(l => l.leadingBidderId === currentUser.id).length;
  // Compute how many lots the user is outbid on
  const outbidCount = lots.filter(l => l.leadingBidderId && l.leadingBidderId !== currentUser.id && l.bidsCount > 0).length;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF9F5]/90 dark:bg-[#0A0B0E]/90 border-b border-[#E5E3DC] dark:border-[#252934] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand & Primary Navigation */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveView('portal')}
              className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-lg tracking-tight font-medium text-[#111315] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  AUCTIO <span className="text-emerald-500 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-bold">VAULT</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#646870] dark:text-[#8E96A8] block font-mono">
                  Live Institutional Engine
                </span>
              </div>
            </button>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
              <button
                onClick={() => setActiveView('portal')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView === 'portal' 
                    ? 'bg-neutral-200/70 dark:bg-neutral-800 text-[#111315] dark:text-white font-semibold' 
                    : 'text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Live Catalog
              </button>

              <button
                onClick={() => setActiveView('terminal')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 relative ${
                  activeView === 'terminal' 
                    ? 'bg-neutral-200/70 dark:bg-neutral-800 text-[#111315] dark:text-white font-semibold' 
                    : 'text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                Multi-Lot Terminal
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveView('studio')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView === 'studio' 
                    ? 'bg-neutral-200/70 dark:bg-neutral-800 text-[#111315] dark:text-white font-semibold' 
                    : 'text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Consignor Studio
              </button>

              <button
                onClick={() => setActiveView('settlement')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView === 'settlement' 
                    ? 'bg-neutral-200/70 dark:bg-neutral-800 text-[#111315] dark:text-white font-semibold' 
                    : 'text-[#646870] dark:text-[#8E96A8] hover:text-[#111315] dark:hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Escrow Settlement
              </button>
            </nav>
          </div>

          {/* Center-Right: Server UTC Clock & Active Ticker */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Sync UTC Clock */}
            <div className="px-2.5 py-1 rounded bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] flex items-center gap-1.5 font-mono text-[11px] text-[#646870] dark:text-[#8E96A8]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>SERVER CLOCK:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{utcTime}</span>
            </div>

            {/* Active Bids Ticker */}
            <div className="px-2.5 py-1 rounded bg-[#F3F2EE] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] flex items-center gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Leading {winningCount}
              </span>
              <span className="text-neutral-400 dark:text-neutral-600">•</span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Challenged {outbidCount}
              </span>
            </div>
          </div>

          {/* Right: Controls & Verified Paddle Pill */}
          <div className="flex items-center gap-2.5">
            {/* Sound Mute Toggle */}
            <button
              onClick={toggleSound}
              title={isSoundMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}
              className="p-2 rounded-lg text-[#646870] dark:text-[#8E96A8] hover:bg-[#F3F2EE] dark:hover:bg-[#161922] transition-colors"
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Color Theme"
              className="p-2 rounded-lg text-[#646870] dark:text-[#8E96A8] hover:bg-[#F3F2EE] dark:hover:bg-[#161922] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Architecture Modal Trigger */}
            <button
              onClick={() => setIsArchitectureModalOpen(true)}
              title="Inspect Database Schema & PL/pgSQL Atomic Bidding Code"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL Architecture</span>
            </button>

            {/* Verified Bidder Paddle Pill */}
            {currentUser.paddle.isVerified ? (
              <button
                onClick={() => setIsPaddleModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all font-mono text-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <div className="text-left leading-tight">
                  <span className="font-bold">{currentUser.paddle.paddleNumber}</span>
                  <span className="hidden sm:inline text-[10px] text-emerald-600/80 dark:text-emerald-400/80 ml-1.5 font-sans">
                    • Verified ($50k)
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsPaddleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Paddle</span>
              </button>
            )}

            {/* Consign Button */}
            <button
              onClick={() => setActiveView('studio')}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <span>+ Consign</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

