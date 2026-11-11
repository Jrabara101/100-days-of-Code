import React, { useState } from 'react';
import { Sparkles, Calendar, Users, MapPin, Music, Compass, ShieldCheck, Heart, Cpu, BarChart3, ChevronDown, Check } from 'lucide-react';
import { SAMPLE_INVITE_TOKENS } from '../data/guestsData';

export function TopDemoBar({
  currentArchetype,
  onSelectArchetype,
  currentGuest,
  onSelectGuest,
  eventMode,
  onChangeEventMode,
  onOpenHostInsights,
  onScrollToRsvp
}) {
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);

  const archetypes = [
    { id: 'wedding', label: '💍 Garden Wedding', tag: 'Romantic Letterpress' },
    { id: 'birthday', label: '🥂 30th Rooftop Soirée', tag: 'Plum Velvet & Vinyl' },
    { id: 'conference', label: '🎙️ Design & AI Summit', tag: 'Architectural Swiss' },
  ];

  const modes = [
    { id: 'pre-event', label: '💌 Pre-Event RSVP', desc: 'Invitation & Travel Hub' },
    { id: 'day-of', label: '📍 Day-Of Live Mode', desc: 'Seat Finder & Live Guide' },
    { id: 'post-event', label: '📸 Memory Vault', desc: 'Polaroids & Toasts' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-3 py-2.5 backdrop-blur-xl bg-opacity-90 border-b border-theme-border transition-all duration-300 shadow-sm"
      style={{
        backgroundColor: currentArchetype.id === 'birthday' ? 'rgba(18, 14, 22, 0.92)' : 'rgba(250, 247, 242, 0.92)'
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
        
        {/* Left: 1-Click 3-Archetype Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full border border-theme-border bg-theme-inset shadow-inner">
          <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 text-theme-muted hidden sm:inline-block">
            Archetype:
          </span>
          {archetypes.map(arc => {
            const isActive = currentArchetype.id === arc.id;
            return (
              <button
                key={arc.id}
                onClick={() => onSelectArchetype(arc.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-theme-card text-theme-primary shadow-sm font-semibold scale-100 ring-1 ring-theme-foil'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-black/5'
                }`}
                title={arc.tag}
              >
                <span>{arc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Event Lifecycle State Machine */}
        <div className="flex items-center gap-1 p-1 rounded-full border border-theme-border bg-theme-card">
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 text-theme-muted hidden md:inline">
            Lifecycle:
          </span>
          {modes.map(m => {
            const isActive = eventMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeEventMode(m.id)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all font-medium ${
                  isActive
                    ? 'bg-theme-accent text-white shadow-sm font-semibold'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Right: Guest Token Selector, Host Insights & RSVP Action */}
        <div className="flex items-center gap-2">
          
          {/* Guest Identity Dropdown */}
          <div className="relative">
            <button
              onClick={() => setGuestDropdownOpen(!guestDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-theme-border bg-theme-card text-theme-primary text-xs hover:border-theme-foil transition shadow-sm"
              title="Switch demo guest token"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline text-theme-muted">Viewing as:</span>
              <span className="font-semibold">{currentGuest.primaryName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-theme-muted" />
            </button>

            {guestDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-theme-border bg-theme-card shadow-2xl p-2 z-50 text-xs">
                <div className="px-2 py-1 font-semibold text-theme-muted uppercase tracking-wider text-[10px]">
                  Sample Guest Tokens:
                </div>
                {Object.values(SAMPLE_INVITE_TOKENS).map(g => (
                  <button
                    key={g.token}
                    onClick={() => {
                      onSelectGuest(g.token);
                      setGuestDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                      currentGuest.token === g.token
                        ? 'bg-theme-inset text-theme-primary font-medium'
                        : 'text-theme-secondary hover:bg-black/5'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-theme-primary">{g.primaryName}</div>
                      <div className="text-[10px] text-theme-muted">
                        {g.archetypeTarget} • {g.hasPlusOneAllowed ? '+1 Allowed' : 'Single Pass'}
                      </div>
                    </div>
                    {currentGuest.token === g.token && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Host Intelligence / Catering Matrix Drawer Button */}
          <button
            onClick={onOpenHostInsights}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-theme-border bg-theme-inset hover:bg-theme-card text-theme-secondary text-xs transition"
            title="Open Live Catering & Dietary Matrix"
          >
            <BarChart3 className="w-3.5 h-3.5 text-theme-accent" />
            <span className="hidden lg:inline">Host Insights</span>
          </button>

          {/* Jump to RSVP */}
          <button
            onClick={onScrollToRsvp}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-theme-accent text-white font-medium text-xs hover:brightness-110 active:scale-95 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>RSVP</span>
          </button>
        </div>

      </div>
    </header>
  );
}

