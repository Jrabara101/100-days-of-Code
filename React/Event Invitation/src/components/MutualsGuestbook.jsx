import React, { useState } from 'react';
import { Users, Search, Heart, MapPin, Music, Sparkles, MessageCircle } from 'lucide-react';

export function MutualsGuestbook({
  event,
  guests,
  onPlaySong
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  const filteredGuests = guests.filter(g => {
    // Only show guests relevant to this archetype or general
    const matchesArchetype = !g.archetype || g.archetype === event.id;
    if (!matchesArchetype) return false;

    // Search query
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (g.name && g.name.toLowerCase().includes(q)) ||
      (g.city && g.city.toLowerCase().includes(q)) ||
      (g.roleTag && g.roleTag.toLowerCase().includes(q)) ||
      (g.icebreaker && g.icebreaker.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Filter tabs
    if (filterTab === 'out-of-town') return g.outOfTown;
    if (filterTab === 'table-4') return g.tableId === 'T04' || g.tableId === 'T02' || g.tableId === 'V01';
    if (filterTab === 'rideshare') return g.rideshare && g.rideshare.needed;

    return true;
  });

  return (
    <section id="guestbook" className="w-full mt-14 pt-8 border-t border-theme-border">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-theme-gold font-semibold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Social Warmth & Mutuals Wall</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-theme-primary font-normal">
            Who’s Coming & Icebreaker Bios
          </h2>
          <p className="text-xs sm:text-sm text-theme-secondary max-w-xl mt-1">
            Skip the awkward "how do you know the host?" openers. Here is who you will be clinking glasses with.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, city, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full border border-theme-border bg-theme-card text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-foil placeholder:text-theme-muted"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Confirmed (${filteredGuests.length})` },
          { id: 'out-of-town', label: '✈️ Flying In from Out of Town' },
          { id: 'table-4', label: '🍷 Featured Tables' },
          { id: 'rideshare', label: '🚗 Looking to Coordinate Rides' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              filterTab === tab.id
                ? 'bg-theme-accent text-white shadow-sm font-semibold'
                : 'bg-theme-inset text-theme-secondary hover:text-theme-primary border border-theme-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guest Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((guest) => (
          <div
            key={guest.id}
            className="p-5 rounded-2xl bg-theme-card border border-theme-border shadow-sm hover:shadow-paper transition-all duration-300 hover:border-theme-foil/60 flex flex-col justify-between"
          >
            <div>
              {/* Top Row: Avatar & Identity */}
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={guest.avatar}
                  alt={guest.name}
                  className="w-12 h-12 rounded-full object-cover border border-theme-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-semibold text-theme-primary text-base truncate">
                    {guest.name}
                  </h4>
                  <div className="text-[11px] font-medium text-theme-gold truncate">
                    {guest.roleTag}
                  </div>
                  <div className="text-[10px] text-theme-muted flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-theme-accent" />
                    <span>{guest.city}</span>
                  </div>
                </div>
              </div>

              {/* Icebreaker Prompt Box */}
              <div className="p-3 rounded-xl bg-theme-inset/70 border border-theme-border/60 text-xs text-theme-secondary mb-3 leading-relaxed">
                <span className="font-medium text-theme-primary">Conversation starter: </span>
                <span>{guest.icebreaker}</span>
              </div>
            </div>

            {/* Bottom: Song Pill & Dietary */}
            <div className="pt-3 border-t border-theme-border flex items-center justify-between gap-2 text-[11px]">
              {guest.danceSong && (
                <div 
                  className="flex items-center gap-1.5 text-theme-accent font-medium truncate max-w-[190px]"
                  title={`Requested: ${guest.danceSong}`}
                >
                  <Music className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{guest.danceSong}</span>
                </div>
              )}
              {guest.dietary && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-inset border border-theme-border text-theme-muted flex-shrink-0">
                  {guest.dietary}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}

