import React from 'react';
import { Archetype, VisitStyle } from '../types';
import { VISIT_STYLES } from '../data/archetypes';
import { Calendar, Users, Clock, Filter, Sparkles } from 'lucide-react';

interface DiscoveryRibbonProps {
  archetype: Archetype;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  partySize: number;
  onUpdatePartySize: (size: number) => void;
  visitStyle: VisitStyle;
  onSelectVisitStyle: (style: VisitStyle) => void;
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  totalOpenSpots: number;
}

const DATES = [
  { id: '2026-11-19', label: 'Today', sub: 'Thu, Nov 19' },
  { id: '2026-11-20', label: 'Tomorrow', sub: 'Fri, Nov 20' },
  { id: '2026-11-21', label: 'Weekend', sub: 'Sat, Nov 21' },
  { id: '2026-11-22', label: 'Sunday', sub: 'Sun, Nov 22' },
  { id: '2026-11-23', label: 'Next Week', sub: 'Mon, Nov 23' },
];

export const DiscoveryRibbon: React.FC<DiscoveryRibbonProps> = ({
  archetype,
  selectedDate,
  onSelectDate,
  partySize,
  onUpdatePartySize,
  visitStyle,
  onSelectVisitStyle,
  selectedZoneId,
  onSelectZone,
  totalOpenSpots,
}) => {
  return (
    <div className="w-full bg-white dark:bg-[#1B1F24] rounded-2xl border border-stone-800/8 dark:border-white/8 shadow-sm p-4 sm:p-5 transition-colors duration-300">
      
      {/* Venue Header & Editorial Tagline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 mb-4 border-b border-stone-800/6 dark:border-white/6">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-[#C85A32] font-semibold">
            {archetype.name}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#18201C] dark:text-[#F6F4F0] font-normal leading-tight mt-0.5">
            {archetype.heroSerif}
          </h1>
          <p className="text-xs sm:text-sm text-[#525B56] dark:text-[#A0A8A3] mt-1">
            {archetype.tagline}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#1E6F50]/10 text-[#1E6F50] dark:bg-[#1E6F50]/20 dark:text-[#2CA376] font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1E6F50] animate-pulse" />
            {totalOpenSpots} spots open today
          </span>
        </div>
      </div>

      {/* Discovery Controls Grid: Date, Guests, Duration Pacer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Date Selector (Cols 1-4) */}
        <div className="lg:col-span-4 bg-[#FAF7F2] dark:bg-[#15181C] p-2.5 rounded-xl border border-stone-800/6 dark:border-white/6">
          <div className="flex items-center gap-1.5 text-xs text-[#828B86] font-mono uppercase tracking-wider mb-2 px-1">
            <Calendar className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Select Date</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {DATES.map((d) => {
              const active = selectedDate === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onSelectDate(d.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
                    active
                      ? 'bg-[#18201C] text-[#FAF7F2] dark:bg-white dark:text-[#18201C] shadow-sm font-semibold'
                      : 'bg-white/70 dark:bg-[#1B1F24]/70 text-[#525B56] dark:text-[#A0A8A3] hover:bg-white dark:hover:bg-[#1B1F24]'
                  }`}
                >
                  <span className="text-[11px] font-semibold leading-tight">{d.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">{d.sub.split(',')[1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Party Size Stepper (Cols 5-6) */}
        <div className="lg:col-span-3 bg-[#FAF7F2] dark:bg-[#15181C] p-2.5 rounded-xl border border-stone-800/6 dark:border-white/6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#828B86] font-mono uppercase tracking-wider px-1 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C85A32]" />
              {archetype.id === 'wellness-studio' ? 'MEMBER SPOTS' : 'PARTY SIZE'}
            </span>
            <span className="text-[10px] font-sans lowercase">
              {partySize === 1 ? 'solo' : partySize === 2 ? 'duo' : `${partySize} guests`}
            </span>
          </div>
          <div className="flex items-center justify-between bg-white dark:bg-[#1B1F24] rounded-lg p-1 border border-stone-800/6 dark:border-white/6">
            <button
              onClick={() => onUpdatePartySize(Math.max(1, partySize - 1))}
              disabled={partySize <= 1}
              className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold text-[#525B56] dark:text-[#A0A8A3] hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              −
            </button>
            <div className="flex flex-col items-center">
              <span className="font-mono text-base font-bold text-[#18201C] dark:text-[#F6F4F0]">
                {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
              </span>
              <span className="text-[10px] text-[#828B86]">
                {partySize <= 2 ? 'Ideal: Banquette or Counter' : partySize <= 4 ? 'Ideal: Solarium Booth' : 'Large Table / Alcove'}
              </span>
            </div>
            <button
              onClick={() => onUpdatePartySize(Math.min(10, partySize + 1))}
              disabled={partySize >= 10}
              className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold text-[#525B56] dark:text-[#A0A8A3] hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* Intent & Duration Pacer (Cols 7-12) */}
        <div className="lg:col-span-5 bg-[#FAF7F2] dark:bg-[#15181C] p-2.5 rounded-xl border border-stone-800/6 dark:border-white/6">
          <div className="flex items-center justify-between text-xs text-[#828B86] font-mono uppercase tracking-wider mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
              INTENT &amp; DURATION PACER
            </span>
            <span className="text-[10px] font-sans text-[#1E6F50] dark:text-[#2CA376] flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3" />
              Tetris Gap-Fit Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {VISIT_STYLES.map((v) => {
              const active = visitStyle === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelectVisitStyle(v.id)}
                  title={v.description}
                  className={`flex flex-col text-left p-2 rounded-lg transition-all ${
                    active
                      ? 'bg-[#C85A32] text-white shadow-sm ring-1 ring-[#C85A32]'
                      : 'bg-white dark:bg-[#1B1F24] text-[#525B56] dark:text-[#A0A8A3] hover:border-[#C85A32]/30 border border-stone-800/6 dark:border-white/6'
                  }`}
                >
                  <span className={`text-[11px] font-semibold leading-tight line-clamp-1 ${active ? 'text-white' : 'text-[#18201C] dark:text-[#F6F4F0]'}`}>
                    {v.label.split(' ')[0]} {v.label.split(' ')[1]}
                  </span>
                  <span className={`text-[10px] font-mono mt-0.5 ${active ? 'text-white/80' : 'text-[#828B86]'}`}>
                    {v.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Zone Quick-Filter Pills */}
      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-stone-800/6 dark:border-white/6 overflow-x-auto no-scrollbar">
        <span className="text-xs text-[#828B86] flex items-center gap-1 shrink-0 font-mono uppercase text-[11px]">
          <Filter className="w-3 h-3" />
          Filter Zone:
        </span>

        <button
          onClick={() => onSelectZone('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            selectedZoneId === 'all'
              ? 'bg-[#18201C] text-[#FAF7F2] dark:bg-white dark:text-[#18201C]'
              : 'bg-[#FAF7F2] dark:bg-[#15181C] text-[#525B56] dark:text-[#A0A8A3] hover:text-[#18201C] dark:hover:text-[#F6F4F0]'
          }`}
        >
          All Atmospheric Zones
        </button>

        {archetype.zones.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#C85A32] text-white shadow-sm'
                  : 'bg-[#FAF7F2] dark:bg-[#15181C] text-[#525B56] dark:text-[#A0A8A3] hover:text-[#18201C] dark:hover:text-[#F6F4F0]'
              }`}
            >
              <span>{zone.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-black/20 text-white' : 'bg-stone-200 dark:bg-stone-800 text-[#828B86]'
              }`}>
                {zone.spots.length}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
};
