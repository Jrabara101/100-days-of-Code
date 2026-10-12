import React from 'react';
import { Compass, BookOpen, Map, Volume2, VolumeX, Sun, Moon, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { AdventureGameState, InventoryItem } from '../../types/game';
import { MapDefinition } from '../../../server/maps';
import { audioEngine } from '../../services/audio';

interface ExplorationHUDProps {
  gameState: AdventureGameState;
  mapData: MapDefinition | null;
  onOpenJournal: () => void;
  onOpenMap: () => void;
  onToggleTool: (toolId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  saveSyncStatus: 'synced' | 'saving' | 'offline';
}

export const ExplorationHUD: React.FC<ExplorationHUDProps> = ({
  gameState,
  mapData,
  onOpenJournal,
  onOpenMap,
  onToggleTool,
  isMuted,
  onToggleMute,
  saveSyncStatus,
}) => {
  const { player, timeOfDay } = gameState;
  const isNight = timeOfDay >= 19 || timeOfDay < 6;

  // Format 24hr decimal into clock string e.g. "16:30"
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay - hours) * 60);
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

  // Predefined inventory slots (Tools)
  const toolSlots: { id: string; name: string; key: string; icon: any }[] = [
    { id: 'lantern', name: 'Lantern', key: '1', icon: Flame },
    { id: 'harmonic_flute', name: 'Flute', key: '2', icon: Sparkles },
    { id: 'relic_compass', name: 'Compass', key: '3', icon: Compass },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
      {/* --- TOP FLOATING BAR --- */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Location & Chapter banner */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded bg-[#131826]/90 border border-[#2D3954] backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
            <span className="font-pixel text-[11px] text-[#F8FAFC] tracking-wider uppercase">
              {mapData?.chapter || 'CHAPTER 01 // WHISPERING GLADE'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#0B0D14]/85 border border-[#1E293B] backdrop-blur-sm">
            {isNight ? (
              <Moon className="w-3.5 h-3.5 text-[#38BDF8]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#FBBF24]" />
            )}
            <span className="font-code text-xs text-[#CBD5E1] tracking-wide">{timeStr}</span>
            <span className="text-[#475569] text-xs">|</span>
            <span className="font-story text-xs text-[#94A3B8] font-medium">{mapData?.title || 'Forest'}</span>
            
            {/* Cloud save sync indicator */}
            <span className="text-[#475569] text-xs">|</span>
            <span className="flex items-center gap-1 text-[11px] text-[#10B981] font-code">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              {saveSyncStatus === 'saving' ? 'Syncing...' : 'Local+Cloud'}
            </span>
          </div>
        </div>

        {/* Right: Radar Minimap Capsule & Quick Hotkeys */}
        <div className="flex items-start gap-3 pointer-events-auto">
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded bg-[#131826]/90 border border-[#2D3954] backdrop-blur-md">
            <button
              onClick={onOpenJournal}
              title="Open Quest Journal [J]"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-[#1E293B] text-[#CBD5E1] hover:text-[#F8FAFC] transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#F59E0B]" />
              <span className="font-pixel text-[10px] hidden sm:inline">[J] Journal</span>
            </button>

            <button
              onClick={onOpenMap}
              title="Open World Map [M]"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-[#1E293B] text-[#CBD5E1] hover:text-[#F8FAFC] transition cursor-pointer"
            >
              <Map className="w-4 h-4 text-[#38BDF8]" />
              <span className="font-pixel text-[10px] hidden sm:inline">[M] Map</span>
            </button>

            <button
              onClick={onToggleMute}
              title="Toggle Audio"
              className="p-1.5 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#EF4444]" /> : <Volume2 className="w-4 h-4 text-[#10B981]" />}
            </button>
          </div>

          {/* Radar Capsule */}
          <div className="relative w-24 h-24 rounded-lg bg-[#0B0D14]/90 border-2 border-[#2D3954] overflow-hidden shadow-xl hidden md:flex flex-col items-center justify-center p-1">
            <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:8px_8px] opacity-40" />
            <div className="font-pixel text-[8px] text-[#64748B] mb-0.5">RADAR</div>
            
            {/* Player blip in center */}
            <div className="relative w-16 h-16 rounded bg-[#131826]/70 border border-[#1E293B] flex items-center justify-center">
              {/* Radar sweep ring */}
              <div className="absolute inset-0 rounded-full border border-[#38BDF8]/20 animate-ping" />
              
              {/* Player Arrow indicator */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />

              {/* NPC indicators nearby */}
              <div className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-[#10B981]" title="NPC" />
              <div className="absolute bottom-3 left-2 w-1.5 h-1.5 rounded-full bg-[#38BDF8]" title="Chest/Monolith" />
            </div>
            
            <div className="font-code text-[9px] text-[#94A3B8] mt-0.5">
              {Math.round(player.position.x)}, {Math.round(player.position.y)}
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM QUICK-INVENTORY BELT --- */}
      <div className="flex justify-center w-full mb-1">
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#131826]/95 border-2 border-[#2D3954] backdrop-blur-md shadow-2xl pointer-events-auto">
          {toolSlots.map((slot) => {
            const hasItem = player.inventory.some((i) => i.id === slot.id);
            const isActive = player.activeToolId === slot.id;
            const Icon = slot.icon;

            return (
              <button
                key={slot.id}
                onClick={() => {
                  if (hasItem) {
                    onToggleTool(slot.id);
                  }
                }}
                disabled={!hasItem}
                title={`${slot.name} [${slot.key}] ${!hasItem ? '(Not in inventory)' : ''}`}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1E293B] border-2 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : hasItem
                    ? 'bg-[#0B0D14]/80 border border-[#2D3954] hover:border-[#475569] hover:bg-[#1E293B]'
                    : 'bg-[#0B0D14]/40 border border-[#1E293B]/50 opacity-35 cursor-not-allowed'
                }`}
              >
                {/* Hotkey Tag */}
                <span className="absolute top-1 left-1.5 font-pixel text-[8px] text-[#64748B]">
                  [{slot.key}]
                </span>

                <Icon
                  className={`w-5 h-5 mt-1 ${
                    isActive
                      ? 'text-[#F59E0B] scale-110 transition-transform'
                      : hasItem
                      ? 'text-[#CBD5E1]'
                      : 'text-[#475569]'
                  }`}
                />

                <span
                  className={`text-[9px] font-story font-medium mt-0.5 truncate max-w-[50px] ${
                    isActive ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'
                  }`}
                >
                  {slot.name}
                </span>

                {/* Active Light Glow Indicator */}
                {isActive && slot.id === 'lantern' && (
                  <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-[#FBBF24] shadow-[0_0_6px_#FBBF24]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
