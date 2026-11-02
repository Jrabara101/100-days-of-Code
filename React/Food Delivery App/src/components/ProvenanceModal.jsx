import React from 'react';
import { X, ShieldCheck, MapPin, ExternalLink, CheckCircle } from 'lucide-react';

export function ProvenanceModal({ isOpen, onClose, restaurant }) {
  if (!isOpen || !restaurant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
              Storefront Provenance & Health Audit
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Origin Badge Banner */}
          <div className={`p-4 rounded-2xl border ${
            restaurant.is_virtual_kitchen
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {restaurant.is_virtual_kitchen ? '🍳' : '🏛️'}
              </span>
              <div>
                <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                  {restaurant.is_virtual_kitchen
                    ? 'Commissary Cloud Kitchen Facility'
                    : 'Verified Brick-and-Mortar Neighborhood Dining Room'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {restaurant.origin_badge}
                </p>
              </div>
            </div>
          </div>

          {/* Physical Address & Street View Link */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Physical Licensed Kitchen Address
            </h4>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {restaurant.physical_street_address}
                </span>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.physical_street_address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold shrink-0"
              >
                Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Health Inspection Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                San Francisco Dept. of Public Health Audit
              </h4>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {restaurant.health_grade}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-between">
              <div>
                <div className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {restaurant.health_score} <span className="text-sm font-medium text-[var(--text-muted)]">/ 100</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Inspection verified on October 14, 2026 • 0 Critical Violations
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium justify-end">
                  <CheckCircle className="w-3.5 h-3.5" /> Food Temp Holding: Pass
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium justify-end">
                  <CheckCircle className="w-3.5 h-3.5" /> Equipment Sanitization: Pass
                </div>
              </div>
            </div>
          </div>

          {/* Kitchen Load & Velocity Telemetry */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Live Kitchen Ticket Velocity
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                <span className="text-xs text-[var(--text-muted)]">Active POS Tickets</span>
                <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                  {restaurant.active_ticket_count} orders firing
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
                <span className="text-xs text-[var(--text-muted)]">Travel Heat Retention</span>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {restaurant.travel_quality_score}% verified hot
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
