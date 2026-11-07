import React, { useState, useEffect } from 'react';
import { Smartphone, Zap, Sparkles, Menu, X, ShieldCheck } from 'lucide-react';
import { useSmartDeviceDetection } from '../hooks/useSmartDeviceDetection';

interface NavbarProps {
  onOpenQRModal: () => void;
  onOpenHsaModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQRModal, onOpenHsaModal }) => {
  const [sweatCount, setSweatCount] = useState<number>(3842);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const { storeName, isMobile } = useSmartDeviceDetection();

  // Simulate real-time community pulse counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSweatCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 2;
        return Math.max(3800, prev + delta);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Detect scroll for enhanced glassmorphic shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? 'bg-[#08090C]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/80'
          : 'bg-[#08090C]/70 backdrop-blur-md border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Live Global Sweat Pill */}
        <div className="flex items-center gap-3 sm:gap-6">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#D4FF00] flex items-center justify-center font-black text-[#08090C] text-sm tracking-tighter shadow-[0_0_15px_rgba(212,255,0,0.5)] group-hover:scale-105 transition-transform">
              PF
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                PULSE<span className="text-[#D4FF00]">//</span>FIT
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase -mt-0.5">
                KINETIC OS
              </span>
            </div>
          </a>

          {/* Live Sweat Ribbon Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318] border border-emerald-500/30 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums">
              {sweatCount.toLocaleString()}
            </span>
            <span className="text-zinc-400 text-[11px]">Training Live Now</span>
          </div>
        </div>

        {/* Desktop Nav Anchors */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-medium tracking-wide">
          <a
            href="#workouts"
            className="text-zinc-300 hover:text-[#D4FF00] transition-colors py-1 hover:border-b hover:border-[#D4FF00]"
          >
            Workouts
          </a>
          <a
            href="#plan-builder"
            className="text-zinc-300 hover:text-[#D4FF00] transition-colors py-1 hover:border-b hover:border-[#D4FF00]"
          >
            4-Week Blueprint
          </a>
          <a
            href="#coaches"
            className="text-zinc-300 hover:text-[#D4FF00] transition-colors py-1 hover:border-b hover:border-[#D4FF00]"
          >
            Coaches
          </a>
          <a
            href="#wearables"
            className="text-zinc-300 hover:text-[#D4FF00] transition-colors py-1 hover:border-b hover:border-[#D4FF00]"
          >
            Wearables
          </a>
          <a
            href="#pricing"
            className="text-zinc-300 hover:text-[#D4FF00] transition-colors py-1 hover:border-b hover:border-[#D4FF00]"
          >
            Pricing & ROI
          </a>
          <button
            onClick={onOpenHsaModal}
            className="text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1 font-mono text-[11px]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            HSA/FSA Eligible
          </button>
        </nav>

        {/* Desktop Acquisition Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onOpenQRModal}
            className="h-10 px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-all active:scale-95"
            title="Scan Dynamic QR or Text Link to Phone"
          >
            <Smartphone className="w-4 h-4 text-[#D4FF00]" />
            <span>{isMobile ? `Open in ${storeName}` : 'Get the App'}</span>
          </button>

          <a
            href="#pricing"
            className="h-10 px-4 rounded-xl bg-[#D4FF00] text-[#08090C] text-xs font-extrabold tracking-tight flex items-center gap-1.5 hover:bg-[#c3ec00] transition-all glow-volt active:scale-95 shadow-md shadow-[#D4FF00]/20"
          >
            <Zap className="w-3.5 h-3.5 fill-[#08090C]" />
            <span>Start 14-Day Free Trial</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#08090C] border-b border-white/10 px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-[#111318] border border-emerald-500/30 text-xs self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums">
              {sweatCount.toLocaleString()}
            </span>
            <span className="text-zinc-400 text-[11px]">Training Live Now</span>
          </div>

          <a
            href="#workouts"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-zinc-200 hover:text-[#D4FF00]"
          >
            Workouts Catalog & Anatomy Map
          </a>
          <a
            href="#plan-builder"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-zinc-200 hover:text-[#D4FF00]"
          >
            Build 4-Week Custom Blueprint
          </a>
          <a
            href="#coaches"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-zinc-200 hover:text-[#D4FF00]"
          >
            Coach Audition Deck
          </a>
          <a
            href="#wearables"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-zinc-200 hover:text-[#D4FF00]"
          >
            Apple Watch & Wearable Sync
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-zinc-200 hover:text-[#D4FF00]"
          >
            Pricing & ROI Calculator
          </a>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQRModal();
              }}
              className="w-full py-3 rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-center text-zinc-200 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-[#D4FF00]" />
              Scan or Text App Link
            </button>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-[#D4FF00] text-[#08090C] text-sm font-black text-center glow-volt"
            >
              Start 14-Day Free Trial ($0 Today)
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
