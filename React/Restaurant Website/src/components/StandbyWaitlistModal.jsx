import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { DINING_ZONES } from '../data/mockData';
import { X, Bell, ShieldCheck, Clock, Users } from 'lucide-react';

export default function StandbyWaitlistModal() {
  const {
    waitlistModalOpen,
    setWaitlistModalOpen,
    submitWaitlist
  } = useRestaurant();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    partySize: 2,
    date: 'Tonight, Oct 29',
    window: '7:00 PM – 8:30 PM',
    zoneName: 'Any Available Zone'
  });

  if (!waitlistModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    submitWaitlist(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] text-xs font-mono-numbers">
              <Bell className="w-3.5 h-3.5" />
              <span>Smart Standby Waitlist</span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
              Join Tonight's VIP Standby
            </h3>
          </div>

          <button
            onClick={() => setWaitlistModalOpen(false)}
            className="p-2 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Value Proposition Note */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-2 text-xs font-mono-numbers text-[var(--text-muted)]">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>How Standby Works:</span>
          </div>
          <p className="leading-relaxed font-body">
            If an active reservation cancels or modifies their table, our host engine immediately dispatches a 15-minute exclusive claim link to your mobile number. First to tap confirms the table instantly.
          </p>
        </div>

        {/* Waitlist Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Guest Name *
              </label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Party Size
              </label>
              <select
                value={form.partySize}
                onChange={(e) => setForm(prev => ({ ...prev, partySize: Number(e.target.value) }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 8].map(n => (
                  <option key={n} value={n} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                    {n} {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Mobile Number (SMS Alert) *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 (310) 555-0199"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Target Window
              </label>
              <select
                value={form.window}
                onChange={(e) => setForm(prev => ({ ...prev, window: e.target.value }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              >
                <option value="6:00 PM – 7:30 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Early (6:00 – 7:30 PM)</option>
                <option value="7:00 PM – 8:30 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Prime (7:00 – 8:30 PM)</option>
                <option value="8:30 PM – 10:00 PM" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Late (8:30 – 10:00 PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Preferred Seating Zone
              </label>
              <select
                value={form.zoneName}
                onChange={(e) => setForm(prev => ({ ...prev, zoneName: e.target.value }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              >
                <option value="Any Available Zone" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">Any Available Zone</option>
                {DINING_ZONES.map(z => (
                  <option key={z.id} value={z.name} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-bold shadow-lg shadow-[var(--brand-primary)]/20 transition-all cursor-pointer mt-4"
          >
            Join Standby List &amp; Receive SMS Alerts →
          </button>
        </form>

      </div>
    </div>
  );
}
