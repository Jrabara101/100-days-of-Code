import React, { useState } from 'react';
import {
  Gamepad2,
  Search,
  Heart,
  Sliders,
  Layers,
  Users,
  ChevronDown,
  Sparkles,
  Command,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { HardwareProfile } from '../types/game';
import { cn } from '../lib/utils';

export interface StorefrontShellProps {
  hardwareProfiles: HardwareProfile[];
  children: React.ReactNode;
  onOpenDiscoveryQueue: () => void;
  onOpenSquadCart: () => void;
  onOpenCommandPalette: () => void;
}

export function StorefrontShell({
  hardwareProfiles,
  children,
  onOpenDiscoveryQueue,
  onOpenSquadCart,
  onOpenCommandPalette,
}: StorefrontShellProps) {
  const hardwareProfileId = useStore((s) => s.hardwareProfileId);
  const setHardwareProfileId = useStore((s) => s.setHardwareProfileId);
  const wishlist = useStore((s) => s.wishlist);
  const setIsWishlistOpen = useStore((s) => s.setIsWishlistOpen);
  const squadRoom = useStore((s) => s.squadRoom);

  const [isHwMenuOpen, setIsHwMenuOpen] = useState(false);

  const activeProfile =
    hardwareProfiles.find((p) => p.id === hardwareProfileId) || hardwareProfiles[0];

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F8FAFC] flex flex-col">
      {/* 64px Sticky Top Command Header */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#080B11]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Brand Crest & Primary Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-base tracking-wider text-white">
                CRYO<span className="text-[#06B6D4]">-DECK</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#94A3B8] -mt-1">
                Storefront OS
              </span>
            </div>
          </div>

          {/* Nav Pills */}
          <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3 py-1.5 rounded-lg text-white hover:bg-white/5 transition-colors font-semibold"
            >
              Discover
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('alchemist-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
            >
              Genre Alchemist
            </button>
            <button
              onClick={onOpenDiscoveryQueue}
              className="px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Discovery Queue</span>
            </button>
            <button
              onClick={onOpenSquadCart}
              className="px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Squad Co-Op</span>
              {squadRoom && (
                <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px]">
                  {squadRoom.code}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Center: Global Command Search Trigger (Cmd + K) */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101622] border border-white/10 hover:border-white/20 text-[#94A3B8] text-xs font-mono transition-all group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#06B6D4]" />
              <span className="group-hover:text-white transition-colors">
                Quick search catalog, tags, devs...
              </span>
            </div>
            <kbd className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#192234] border border-white/10 text-[10px] text-white">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Right: Hardware Profile Selector & Wishlist */}
        <div className="flex items-center gap-3">
          {/* Mobile search icon */}
          <button
            onClick={onOpenCommandPalette}
            className="md:hidden p-2 rounded-xl bg-[#101622] border border-white/10 text-[#94A3B8]"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Hardware Profile Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setIsHwMenuOpen(!isHwMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101622] hover:bg-[#192234] border border-white/10 text-xs font-mono font-medium text-white transition-all shadow-sm"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="hidden sm:inline font-bold">
                {activeProfile ? activeProfile.badgeLabel : 'Steam Deck OLED'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>

            {/* Dropdown Menu */}
            {isHwMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 p-2 bg-[#192234] border border-white/10 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] border-b border-white/5">
                  Select Target Hardware
                </div>
                {hardwareProfiles.map((hw) => (
                  <button
                    key={hw.id}
                    onClick={() => {
                      setHardwareProfileId(hw.id);
                      setIsHwMenuOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex flex-col',
                      hardwareProfileId === hw.id
                        ? 'bg-[#06B6D4]/20 text-[#38BDF8] border border-[#06B6D4]/40 font-bold'
                        : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                    )}
                  >
                    <span>{hw.name}</span>
                    <span className="text-[10px] text-[#94A3B8] font-normal">{hw.resolution}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist Trigger with Badge Counter */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101622] hover:bg-[#192234] border border-white/10 text-xs font-mono font-bold text-white transition-all relative"
          >
            <Heart className="w-3.5 h-3.5 text-[#38BDF8] fill-[#38BDF8]" />
            <span className="hidden sm:inline">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#3B82F6] text-white text-[10px] font-mono font-bold shadow-md">
                {wishlist.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Centered Storefront Workspace (Max-width 1440px) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#080B11] border-t border-white/5 py-8 px-4 sm:px-8 text-center text-xs font-mono text-[#94A3B8] space-y-2">
        <p>CRYO-DECK // High-Velocity Zero-Bloat Game Discovery & Community Curation Storefront</p>
        <p className="text-[10px] text-[#94A3B8]/60">
          Powered by React 19, Vite, TanStack Virtual/Query, Tailwind CSS, and Express Telemetry Engine.
        </p>
      </footer>
    </div>
  );
}
