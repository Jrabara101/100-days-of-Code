import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { RESTAURANT_METADATA } from '../data/mockData';
import { Sun, Moon, Calendar, Menu as MenuIcon, X, SlidersHorizontal, Flame, Sparkles, Database } from 'lucide-react';

export default function Navbar() {
  const {
    theme,
    toggleTheme,
    openReservationModal,
    setHostCockpitOpen,
    setSchemaModalOpen,
    tables
  } = useRestaurant();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Count available tables
  const availableTablesCount = tables.filter(t => t.status === 'available').length;

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--bg-canvas)]/85 border-b border-[var(--border-hairline)] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Brand Crest & Service Status */}
          <div className="flex items-center gap-4 lg:gap-6">
            <a href="#" className="group flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 flex items-center justify-center text-[var(--brand-primary)] group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 fill-[var(--brand-primary)] text-[var(--brand-primary)]" />
              </div>
              <div className="flex flex-col">
                <span className="font-editorial text-2xl lg:text-3xl font-light tracking-wider text-[var(--text-primary)] leading-tight uppercase">
                  L'Atelier du Feu
                </span>
                <span className="font-mono-numbers text-[10px] tracking-widest uppercase text-[var(--text-muted)] -mt-0.5">
                  Arts District • Los Angeles
                </span>
              </div>
            </a>

            {/* Live Service Pill */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-muted)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[var(--text-primary)] font-medium">Evening Service Tonight</span>
              <span className="opacity-40">•</span>
              <span>5:30 PM – 11:00 PM</span>
              <span className="opacity-40">•</span>
              <span className="text-emerald-500 font-medium">({availableTablesCount} Tables Open)</span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            <button
              onClick={() => scrollToSection('menu')}
              className="text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              The Menu
            </button>
            <button
              onClick={() => scrollToSection('floorplan')}
              className="text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Floorplan & Spaces</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-mono-numbers font-semibold">
                Spatial
              </span>
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Visual Archive
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Diner Notes</span>
              <span className="text-[var(--accent-gold)] font-mono-numbers font-medium">4.92 ★</span>
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Staff / Host Cockpit Toggle */}
            <button
              onClick={() => setHostCockpitOpen(true)}
              title="Host Stand Staff Cockpit (Live 86'd & Seating Manager)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono-numbers text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-hairline)] transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Host Stand</span>
            </button>

            {/* Database Schema Explorer */}
            <button
              onClick={() => setSchemaModalOpen(true)}
              title="View Production PostgreSQL / Supabase Schema"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-mono-numbers text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-hairline)] transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span className="text-[11px]">SQL Schema</span>
            </button>

            {/* Ambience Toggle Pill: Daylight vs Candlelight */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] font-mono-numbers hover:border-[var(--accent-gold)] transition-all cursor-pointer shadow-sm"
              title="Switch between Evening Candlelight and Midday Daylight"
            >
              {theme === 'candlelight' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[var(--accent-gold)] fill-[var(--accent-gold)]/20" />
                  <span className="hidden sm:inline">Candlelight</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Daylight</span>
                </>
              )}
            </button>

            {/* Primary CTA: Reserve a Table */}
            <button
              onClick={() => openReservationModal()}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs uppercase tracking-wider font-medium shadow-lg shadow-[var(--brand-primary)]/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reserve a Table</span>
              <span className="hidden sm:inline opacity-75">↵</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-full transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-6 py-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
            <span className="text-xs font-mono-numbers text-[var(--text-muted)]">
              Evening Service • 5:30 PM – 11:00 PM
            </span>
            <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-500 font-mono-numbers">
              {availableTablesCount} Tables Open
            </span>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <button
              onClick={() => scrollToSection('menu')}
              className="text-left py-2 font-editorial text-2xl text-[var(--text-primary)] border-b border-[var(--border-hairline)]/50"
            >
              The Living Culinary Menu
            </button>
            <button
              onClick={() => scrollToSection('floorplan')}
              className="text-left py-2 font-editorial text-2xl text-[var(--text-primary)] border-b border-[var(--border-hairline)]/50 flex items-center justify-between"
            >
              <span>Floorplan & Zones</span>
              <span className="text-xs font-mono-numbers px-2 py-0.5 rounded bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                Interactive SVG
              </span>
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="text-left py-2 font-editorial text-2xl text-[var(--text-primary)] border-b border-[var(--border-hairline)]/50"
            >
              Visual Archive & Hotspots
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="text-left py-2 font-editorial text-2xl text-[var(--text-primary)] border-b border-[var(--border-hairline)]/50 flex items-center justify-between"
            >
              <span>Verified Diner Notes</span>
              <span className="text-sm font-mono-numbers text-[var(--accent-gold)]">4.92 ★</span>
            </button>
          </div>

          <div className="pt-4 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setHostCockpitOpen(true);
              }}
              className="w-full py-2.5 rounded-lg border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] flex items-center justify-center gap-2 bg-[var(--bg-surface)]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Host Stand Live Cockpit (Staff)</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSchemaModalOpen(true);
              }}
              className="w-full py-2.5 rounded-lg border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-muted)] flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Inspect PostgreSQL / Supabase Schema</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
