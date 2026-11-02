import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { RESTAURANT_METADATA } from '../data/mockData';
import { Calendar, Download, Share2, Check, Flame, MapPin, Clock, Users, Wine, ShieldCheck } from 'lucide-react';

export default function DigitalTableTicket({ reservation, onClose }) {
  const { downloadIcsCalendar, showToast } = useRestaurant();
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!reservation) return null;

  const handleShareInvite = () => {
    const inviteText = `You're invited to dinner at ${RESTAURANT_METADATA.name}!\n\n` +
      `📅 Date: ${reservation.date}\n` +
      `🕖 Time: ${reservation.time_slot}\n` +
      `📍 Table: ${reservation.table_number} (${reservation.zone_name})\n` +
      `📌 Address: ${RESTAURANT_METADATA.address}\n` +
      `🎟️ Confirmation Code: ${reservation.confirmation_code}\n\n` +
      `Pacing: ${reservation.pacing_preference} | Dietary profiles pre-noted with the kitchen brigade.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteText);
      setCopiedInvite(true);
      showToast('📋 Invitation copied to clipboard. Ready to paste into SMS or WhatsApp!');
      setTimeout(() => setCopiedInvite(false), 3000);
    }
  };

  return (
    <div className="relative max-w-lg mx-auto bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
      
      {/* Top Ticket Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
            <Flame className="w-4 h-4 fill-[var(--brand-primary)]" />
          </div>
          <div>
            <h4 className="font-editorial text-xl font-light text-[var(--text-primary)] uppercase tracking-wider">
              L'Atelier du Feu
            </h4>
            <span className="text-[10px] font-mono-numbers text-[var(--text-muted)] uppercase tracking-widest block">
              Official Guest Table Ticket
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono-numbers font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            ✓ Confirmed
          </span>
        </div>
      </div>

      {/* Main Reservation Focal Strip */}
      <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-hairline)] space-y-4">
        
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider">
              Confirmation Code
            </span>
            <div className="font-mono-numbers text-2xl font-bold text-[var(--brand-primary)] tracking-wider">
              {reservation.confirmation_code}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider">
              Table Assignment
            </span>
            <div className="font-editorial text-2xl font-medium text-[var(--text-primary)]">
              {reservation.table_number}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[var(--border-hairline)]/60 text-xs font-mono-numbers">
          <div>
            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Date</span>
            <span className="font-medium text-[var(--text-primary)]">{reservation.date}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Seating Wave</span>
            <span className="font-medium text-[var(--text-primary)]">{reservation.time_slot}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Party Size</span>
            <span className="font-medium text-[var(--text-primary)]">{reservation.party_size} Diners</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-hairline)]/60 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--accent-gold)]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-medium">{reservation.zone_name}</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-mono-numbers">
            742 S. Santa Fe Avenue, Arts District, Los Angeles
          </p>
        </div>

      </div>

      {/* Perforated Divider Line with Cutouts */}
      <div className="relative py-2">
        <div className="ticket-perforation-left" />
        <div className="ticket-perforation-right" />
        <div className="w-full border-t-2 border-dashed border-[var(--border-hairline)]" />
      </div>

      {/* Hospitality Pre-Brief Summary (Host & Kitchen Record) */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono-numbers uppercase tracking-wider text-[var(--text-muted)] font-semibold block">
          Hospitality Pre-Brief Attached
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono-numbers">
          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Occasion</span>
            <span className="text-[var(--text-primary)] font-medium">
              {reservation.occasion ? `🥂 ${reservation.occasion}` : 'Dining Experience'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Pacing</span>
            <span className="text-[var(--text-primary)] font-medium capitalize">
              {reservation.pacing_preference === 'leisurely' ? '🕯️ Unhurried (2.5h)' : reservation.pacing_preference === 'express' ? '⚡ Pre-Theater (60m)' : '🍷 Standard (1h 45m)'}
            </span>
          </div>
        </div>

        {reservation.dietary_restrictions && reservation.dietary_restrictions.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[var(--safe-fill)] border border-[var(--safe-border)] text-xs font-mono-numbers text-[var(--safe-text)]">
            <span className="font-semibold block mb-0.5">Attached Dietary Guardrails:</span>
            <span>{reservation.dietary_restrictions.join(', ')}</span>
          </div>
        )}

        {reservation.special_requests && (
          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] font-body">
            <span className="font-mono-numbers text-[10px] uppercase block mb-0.5 text-[var(--text-primary)]">Special Requests:</span>
            <span>"{reservation.special_requests}"</span>
          </div>
        )}
      </div>

      {/* Visual QR Code for Host Stand Check-In */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
        <div className="space-y-1">
          <span className="text-xs font-mono-numbers font-medium text-[var(--text-primary)] block">
            Host Stand Contactless Ingress
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-body block">
            Present this code upon arrival for synchronized seating.
          </span>
        </div>

        {/* QR Code SVG representation */}
        <div className="w-16 h-16 p-1.5 rounded-lg bg-white shadow-sm shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-full h-full fill-black">
            <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-2v2h2v4h-2v-2h-2v2h-2v-4h2v-2h2v-2zm-4 4h2v2h-2v-2zm4 2h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
          </svg>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => downloadIcsCalendar(reservation)}
          className="w-full py-3 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-mono-numbers uppercase tracking-wider text-[var(--text-primary)] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-[var(--brand-primary)]" />
          <span>Add to Calendar (.ics)</span>
        </button>

        <button
          onClick={handleShareInvite}
          className="w-full py-3 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--brand-primary)]/20 transition-all cursor-pointer"
        >
          {copiedInvite ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied Invite!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share Guest Invite</span>
            </>
          )}
        </button>
      </div>

      {onClose && (
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="text-xs font-mono-numbers text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-4 cursor-pointer"
          >
            ← Return to Table Overview
          </button>
        </div>
      )}

    </div>
  );
}
