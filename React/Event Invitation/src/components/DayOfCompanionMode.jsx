import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Search, 
  Users, 
  Bell, 
  Wifi, 
  PhoneCall, 
  Clock, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { TABLE_MAP } from '../data/guestsData';

export function DayOfCompanionMode({
  event,
  currentGuest,
  onDeactivate
}) {
  const [searchName, setSearchName] = useState(currentGuest.primaryName || '');
  const [selectedTableId, setSelectedTableId] = useState(currentGuest.assignedTableId || 'T04');
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      time: '4:10 PM',
      text: '🔔 The MacArthur Place & Lodge shuttle has just departed for the North Conservatory Gate.',
      urgent: false
    },
    {
      id: 2,
      time: '4:25 PM',
      text: '🌅 Golden Hour vows begin promptly at 4:30 PM under the Heritage Oak. Ushers are seating guests.',
      urgent: true
    }
  ]);

  const activeTable = TABLE_MAP[selectedTableId] || TABLE_MAP['T04'];

  return (
    <div className="w-full bg-[#161E19] text-[#FAF7F2] rounded-3xl p-6 sm:p-10 border-2 border-theme-foil shadow-2xl relative overflow-hidden animate-fadeIn mb-12">
      
      {/* Decorative Gold Inset Outline */}
      <div className="absolute inset-2 border border-amber-500/20 rounded-2xl pointer-events-none"></div>

      {/* Top Banner: Day-Of Companion Pocket Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono tracking-wider uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live Day-Of Companion Mode Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium">
            Your Event Pocket Guide
          </h2>
        </div>

        <button
          onClick={onDeactivate}
          className="self-start sm:self-auto text-xs font-mono text-amber-200/80 hover:text-white px-3 py-1.5 rounded-full border border-white/20 hover:border-amber-400 transition"
        >
          Exit Day-Of Mode
        </button>
      </div>

      {/* Live Phase Banner */}
      <div className="my-6 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-amber-300 uppercase tracking-widest">
              CURRENT MOMENT • 4:25 PM PST
            </div>
            <div className="text-base sm:text-lg font-serif font-semibold text-white">
              Vows Under the Heritage Oak (Doors Seating Now)
            </div>
            <div className="text-xs text-white/60">
              Next: Sunset Cocktails & Oyster Bar at 5:15 PM in the Rose Garden
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
            Shuttle on Route
          </span>
        </div>
      </div>

      {/* Live Host Announcements Ticker */}
      <div className="mb-8 space-y-2 relative z-10">
        <div className="text-xs font-mono uppercase tracking-wider text-white/60 flex items-center gap-1.5 mb-2">
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time Host Announcements:</span>
        </div>
        {announcements.map((a) => (
          <div
            key={a.id}
            className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
              a.urgent
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                : 'bg-white/5 border-white/10 text-white/80'
            }`}
          >
            <span className="font-mono text-[10px] text-amber-300 flex-shrink-0 mt-0.5">{a.time}</span>
            <span>{a.text}</span>
          </div>
        ))}
      </div>

      {/* FEATURE: "Find My Seat & Tablemates" Live Search */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Seating Graph & Tablemates Explorer</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-white font-normal">
              Find My Seat & Who I'm Sitting Next To
            </h3>
            <p className="text-xs text-white/60 max-w-lg mt-1">
              Type your name to view your assigned table, seat number, and an instant friendly intro to your neighbors!
            </p>
          </div>

          {/* Quick Table Switcher */}
          <div className="flex items-center gap-1.5">
            {Object.keys(TABLE_MAP).map(tKey => (
              <button
                key={tKey}
                onClick={() => setSelectedTableId(tKey)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition ${
                  selectedTableId === tKey
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                {tKey}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Table Overview Card */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-amber-300">
              ASSIGNED SEATING CLUSTER
            </div>
            <div className="text-lg font-serif font-bold text-white">
              {activeTable.name}
            </div>
            <div className="text-xs text-white/60">
              Location: {activeTable.location} • {activeTable.vibe}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 text-white">
              Capacity: {activeTable.members.length} / {activeTable.capacity} Guests
            </span>
          </div>
        </div>

        {/* Illustrated Table Grid & Seatmates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeTable.members.map((member, mIdx) => {
            const isUser = member.name.includes('Sarah') || member.name.includes('(You)');
            return (
              <div
                key={mIdx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isUser
                    ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-amber-300">
                    SEAT #{member.seat}
                  </span>
                  {isUser && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-neutral-950 font-bold font-mono">
                      YOU
                    </span>
                  )}
                </div>
                <div className="font-serif font-semibold text-white text-sm">
                  {member.name}
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  {member.role}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Guest Quick Concierge Tools: Wifi & Captain */}
      <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/70 relative z-10">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <Wifi className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div>
            <div className="font-semibold text-white">Guest WiFi</div>
            <div className="font-mono text-[11px] text-amber-200">EstateGuest_5G • pass: GoldenOak2026</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <PhoneCall className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div>
            <div className="font-semibold text-white">Event Lead Concierge</div>
            <div className="font-mono text-[11px] text-amber-200">Text: (707) 555-0194</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="font-semibold text-white">First Aid & Wrap Warming</div>
            <div className="text-[11px] text-white/60">Glasshouse East Station</div>
          </div>
        </div>
      </div>

    </div>
  );
}

