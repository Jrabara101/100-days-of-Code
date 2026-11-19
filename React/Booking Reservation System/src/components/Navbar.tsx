import React from 'react';
import { ArchetypeId } from '../types';
import { ARCHETYPES } from '../data/archetypes';
import { Sun, Moon, Sparkles, ChefHat, Activity, Compass, Ticket } from 'lucide-react';

interface NavbarProps {
  currentArchetypeId: ArchetypeId;
  onSelectArchetype: (id: ArchetypeId) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHostStand: () => void;
  hasActiveReservation: boolean;
  onViewActivePass: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentArchetypeId,
  onSelectArchetype,
  isDarkMode,
  onToggleDarkMode,
  onOpenHostStand,
  hasActiveReservation,
  onViewActivePass,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-300 border-b border-stone-800/10 dark:border-white/10 bg-[#FAF7F2]/90 dark:bg-[#0E1012]/90">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-4">
        
        {/* Brand & Concept Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C85A32] flex items-center justify-center text-white shadow-md shadow-[#C85A32]/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#18201C] dark:text-[#F6F4F0]">
                AURA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-[#1E6F50]/10 text-[#1E6F50] dark:bg-[#1E6F50]/20 dark:text-[#2CA376] font-semibold">
                Spatial Concierge
              </span>
            </div>
            <p className="text-xs text-[#828B86] hidden sm:block font-sans">
              Tactile Floorplan &amp; Anti-Dead-End Hospitality
            </p>
          </div>
        </div>

        {/* 1-Click Vertical Archetype Switcher (Top Demo Ribbon) */}
        <div className="flex items-center bg-[#F1ECE3] dark:bg-[#15181C] p-1 rounded-xl border border-stone-800/8 dark:border-white/8 shadow-inner overflow-x-auto no-scrollbar max-w-full">
          {ARCHETYPES.map((arch) => {
            const isSelected = currentArchetypeId === arch.id;
            const Icon = arch.id === 'fine-dining' ? ChefHat : arch.id === 'wellness-studio' ? Activity : Compass;

            return (
              <button
                key={arch.id}
                onClick={() => onSelectArchetype(arch.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? 'bg-white dark:bg-[#1B1F24] text-[#C85A32] shadow-sm font-semibold'
                    : 'text-[#525B56] dark:text-[#A0A8A3] hover:text-[#18201C] dark:hover:text-[#F6F4F0]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C85A32]' : ''}`} />
                <span>{arch.categoryBadge}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools: Ambiance Mode, Host Stand Lens, Active Pass */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Reservation Shortcut */}
          {hasActiveReservation && (
            <button
              onClick={onViewActivePass}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18201C] text-[#FAF7F2] dark:bg-white dark:text-[#18201C] text-xs font-mono font-medium shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Ticket className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Pass #8492</span>
            </button>
          )}

          {/* Host Stand & Kitchen Waterfall Lens Button */}
          <button
            onClick={onOpenHostStand}
            title="Inspect 15-min kitchen pacing and turn progress"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-800/10 dark:border-white/10 bg-white dark:bg-[#1B1F24] text-xs text-[#525B56] dark:text-[#A0A8A3] hover:text-[#18201C] dark:hover:text-[#F6F4F0] hover:border-[#C85A32]/40 transition-all shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#1E6F50] animate-ping" />
            <span className="hidden sm:inline font-medium">Host Stand Lens</span>
            <span className="sm:hidden font-medium">Host</span>
          </button>

          {/* Daylight / Evening Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle Ambiance Lighting"
            title={isDarkMode ? 'Switch to Sunlit Travertine' : 'Switch to Candlelit Velvet'}
            className="w-9 h-9 rounded-xl border border-stone-800/10 dark:border-white/10 bg-white dark:bg-[#1B1F24] flex items-center justify-center text-[#525B56] dark:text-[#A0A8A3] hover:text-[#C85A32] transition-colors shadow-sm"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>

      </div>
    </header>
  );
};
