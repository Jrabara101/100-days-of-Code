import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import {
  X,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Bell,
  RefreshCw,
  Send,
  Coffee,
  Check
} from 'lucide-react';

export default function HostStandLiveCockpit() {
  const {
    hostCockpitOpen,
    setHostCockpitOpen,
    tables,
    menuItems,
    reservations,
    waitlistEntries,
    staffToggle86d,
    staffUpdatePortions,
    staffUpdateTableStatus,
    staffNotifyWaitlistGuest
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'kitchen86' | 'waitlist' | 'reservations'

  if (!hostCockpitOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cockpit Top Bar */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-2xl font-light text-[var(--text-primary)]">
                  Host Stand &amp; Kitchen Live Cockpit
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-numbers font-semibold bg-emerald-500/15 text-emerald-500">
                  LIVE SYNCED
                </span>
              </div>
              <span className="text-xs font-mono-numbers text-[var(--text-muted)]">
                Real-Time Table Seating • 86'd Kitchen Scarcity • VIP Standby Paging
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Tabs */}
            <div className="hidden md:flex items-center p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-mono-numbers">
              {[
                { id: 'tables', label: 'Floorplan Tables' },
                { id: 'kitchen86', label: "Kitchen 86'd Matrix" },
                { id: 'waitlist', label: `VIP Waitlist (${waitlistEntries.length})` },
                { id: 'reservations', label: `Reservations (${reservations.length})` }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-[var(--brand-primary)] text-[#FAF7F2] font-semibold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setHostCockpitOpen(false)}
              className="p-2 rounded-full hover:bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile View Sub-Tabs */}
        <div className="md:hidden flex items-center overflow-x-auto p-2 bg-[var(--bg-canvas)] border-b border-[var(--border-hairline)] text-xs font-mono-numbers gap-1 shrink-0">
          {[
            { id: 'tables', label: 'Tables' },
            { id: 'kitchen86', label: "86'd Kitchen" },
            { id: 'waitlist', label: 'Standby' },
            { id: 'reservations', label: 'Reservations' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
                activeTab === t.id ? 'bg-[var(--brand-primary)] text-white font-medium' : 'text-[var(--text-muted)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Cockpit Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Live Table Status Management */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider">
                  Live Floor State ({tables.length} Tables Assigned)
                </span>
                <span className="text-xs font-mono-numbers text-emerald-500">
                  Broadcasts directly to guest reservation views
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                          {table.table_number}
                        </span>
                        <span className="text-xs font-mono-numbers text-[var(--text-muted)]">
                          {table.label} ({table.min_covers}-{table.max_covers}p)
                        </span>
                      </div>

                      <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        table.status === 'available'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : table.status === 'seated'
                          ? 'bg-blue-500/15 text-blue-400'
                          : table.status === 'entrees_fired'
                          ? 'bg-amber-500/15 text-amber-500'
                          : table.status === 'check_dropped'
                          ? 'bg-purple-500/15 text-purple-400'
                          : 'bg-zinc-500/15 text-zinc-400'
                      }`}>
                        {table.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono-numbers text-[var(--text-muted)] truncate">
                      {table.vibe}
                    </p>

                    {/* Quick State Transitions */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border-hairline)]/60 text-[10px] font-mono-numbers">
                      {['available', 'seated', 'entrees_fired', 'check_dropped', 'occupied'].map(statusOption => (
                        <button
                          key={statusOption}
                          onClick={() => staffUpdateTableStatus(table.id, statusOption)}
                          className={`px-2 py-1 rounded transition-all cursor-pointer ${
                            table.status === statusOption
                              ? 'bg-[var(--brand-primary)] text-white font-bold'
                              : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
                          }`}
                        >
                          {statusOption === 'entrees_fired' ? '🔥 Entrées Fired' : statusOption === 'check_dropped' ? '💳 Check Out' : statusOption}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Kitchen 86'd & Remaining Portions Scarcity Matrix */}
          {activeTab === 'kitchen86' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider">
                  Menu Availability &amp; Small-Batch Portions
                </span>
                <span className="text-xs font-mono-numbers text-[var(--brand-primary)]">
                  ⚡ Updates active guest menus without page refresh
                </span>
              </div>

              <div className="border border-[var(--border-hairline)] rounded-2xl overflow-hidden bg-[var(--bg-surface)]">
                <table className="w-full text-left text-xs font-mono-numbers">
                  <thead className="bg-[var(--bg-canvas)] text-[var(--text-muted)] uppercase border-b border-[var(--border-hairline)]">
                    <tr>
                      <th className="p-3.5">Course &amp; Dish</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Remaining Portions</th>
                      <th className="p-3.5">Kitchen 86'd Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {menuItems.map(item => (
                      <tr key={item.id} className={item.is_86d ? 'bg-rose-500/5' : ''}>
                        <td className="p-3.5">
                          <span className="font-editorial text-base text-[var(--text-primary)] font-medium block">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {item.course_number}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-[var(--text-primary)]">
                          ${(item.price_cents / 100).toFixed(0)}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => staffUpdatePortions(item.id, Math.max(0, (item.remaining_portions || 5) - 1))}
                              className="w-6 h-6 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-center text-sm font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-[var(--text-primary)] min-w-[20px] text-center">
                              {item.remaining_portions !== null ? item.remaining_portions : '∞'}
                            </span>
                            <button
                              onClick={() => staffUpdatePortions(item.id, (item.remaining_portions || 0) + 1)}
                              className="w-6 h-6 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-center text-sm font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {item.is_86d ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              🚫 86'd (Unavailable)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                              ✓ Available
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => staffToggle86d(item.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono-numbers uppercase tracking-wider transition-all cursor-pointer ${
                              item.is_86d
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
                                : 'bg-rose-600 hover:bg-rose-500 text-white font-bold'
                            }`}
                          >
                            {item.is_86d ? 'Reinstate Plate' : "86'd Plate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VIP Standby Waitlist Manager */}
          {activeTab === 'waitlist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider">
                  Tonight's Priority Standby Queue
                </span>
                <span className="text-xs font-mono-numbers text-amber-500">
                  Dispatches 15-minute priority claim SMS
                </span>
              </div>

              <div className="space-y-3">
                {waitlistEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-editorial text-xl font-medium text-[var(--text-primary)]">
                          {entry.guest_name}
                        </span>
                        <span className="text-xs font-mono-numbers text-[var(--text-muted)]">
                          • Party of {entry.party_size}
                        </span>
                        <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded font-bold uppercase ${
                          entry.status === 'notified'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {entry.status}
                        </span>
                      </div>

                      <div className="text-xs font-mono-numbers text-[var(--text-muted)]">
                        <span>Window: {entry.preferred_window}</span> • <span>Zone: {entry.zone_preference}</span>
                      </div>
                      <div className="text-[11px] font-mono-numbers text-[var(--accent-gold)]">
                        Phone: {entry.guest_phone}
                      </div>
                    </div>

                    <div>
                      {entry.status === 'notified' ? (
                        <div className="flex items-center gap-2 text-xs font-mono-numbers text-amber-500">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>SMS Paged (15m window active)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => staffNotifyWaitlistGuest(entry.id)}
                          className="py-2.5 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch 15m SMS Claim</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Active Reservations Stream */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              <span className="text-xs font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider block">
                Confirmed Reservations Manifest
              </span>

              <div className="border border-[var(--border-hairline)] rounded-2xl overflow-hidden bg-[var(--bg-surface)]">
                <table className="w-full text-left text-xs font-mono-numbers">
                  <thead className="bg-[var(--bg-canvas)] text-[var(--text-muted)] uppercase border-b border-[var(--border-hairline)]">
                    <tr>
                      <th className="p-3.5">Code</th>
                      <th className="p-3.5">Guest &amp; Party</th>
                      <th className="p-3.5">Table &amp; Zone</th>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5">Pacing &amp; Dietary</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {reservations.map(res => (
                      <tr key={res.id}>
                        <td className="p-3.5 font-bold text-[var(--brand-primary)]">
                          {res.confirmation_code}
                        </td>
                        <td className="p-3.5">
                          <span className="font-editorial text-base text-[var(--text-primary)] block">
                            {res.guest_name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {res.party_size} Diners • {res.guest_phone}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[var(--text-primary)] font-medium">Table {res.table_number}</span>
                          <span className="text-[10px] text-[var(--text-muted)] block">{res.zone_name}</span>
                        </td>
                        <td className="p-3.5 text-[var(--text-primary)] font-medium">
                          {res.time_slot} ({res.date})
                        </td>
                        <td className="p-3.5">
                          <span className="block text-[var(--accent-gold)] capitalize">Pacing: {res.pacing_preference}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {res.dietary_restrictions?.join(', ') || 'Standard Menu'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
