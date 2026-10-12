import React, { useState } from 'react';
import { X, CheckCircle2, Circle, Scroll, BookOpen, Map, Sparkles, Navigation } from 'lucide-react';
import { Quest, MemoryEcho } from '../../types/game';
import { MapDefinition } from '../../../server/maps';

interface QuestJournalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  memoryEchoes: MemoryEcho[];
  currentMap: MapDefinition | null;
  playerCoords: { x: number; y: number };
}

export const QuestJournalDrawer: React.FC<QuestJournalDrawerProps> = ({
  isOpen,
  onClose,
  quests,
  memoryEchoes,
  currentMap,
  playerCoords,
}) => {
  const [activeTab, setActiveTab] = useState<'quests' | 'lore' | 'map'>('quests');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-2xl h-[520px] rounded-lg bg-[#131826] border-2 border-[#2D3954] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2D3954] bg-[#0B0D14]/80">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="font-pixel text-xs text-[#F8FAFC] tracking-wider uppercase">
              Chronicle & Wayfarer Journal
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
            title="Close [ESC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2D3954] bg-[#0F1420]">
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-story font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'quests'
                ? 'border-[#F59E0B] text-[#F8FAFC] bg-[#1E293B]/40'
                : 'border-transparent text-[#94A3B8] hover:text-[#CBD5E1]'
            }`}
          >
            <Scroll className="w-4 h-4 text-[#F59E0B]" />
            Active Quests ({quests.length})
          </button>

          <button
            onClick={() => setActiveTab('lore')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-story font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'lore'
                ? 'border-[#38BDF8] text-[#F8FAFC] bg-[#1E293B]/40'
                : 'border-transparent text-[#94A3B8] hover:text-[#CBD5E1]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#38BDF8]" />
            Memory Echoes ({memoryEchoes.length})
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-story font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'map'
                ? 'border-[#10B981] text-[#F8FAFC] bg-[#1E293B]/40'
                : 'border-transparent text-[#94A3B8] hover:text-[#CBD5E1]'
            }`}
          >
            <Map className="w-4 h-4 text-[#10B981]" />
            Illustrated World Map
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-grow p-6 overflow-y-auto bg-[#131826]/70">
          {/* TAB 1: QUESTS */}
          {activeTab === 'quests' && (
            <div className="flex flex-col gap-4">
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className="p-4 rounded-md bg-[#0B0D14]/80 border border-[#2D3954] shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-story font-semibold text-sm text-[#F59E0B]">
                      {quest.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        quest.isCompleted
                          ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                      }`}
                    >
                      {quest.isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>

                  <p className="font-story text-xs text-[#CBD5E1] mb-3 leading-relaxed">
                    {quest.description}
                  </p>

                  <div className="flex flex-col gap-2 pt-2 border-t border-[#1E293B]">
                    <span className="text-[10px] font-pixel text-[#64748B] uppercase">
                      Objectives:
                    </span>
                    {quest.objectives.map((obj, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-story">
                        {obj.done ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                        )}
                        <span className={obj.done ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}>
                          {obj.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: LORE FRAGMENTS */}
          {activeTab === 'lore' && (
            <div className="flex flex-col gap-4">
              {memoryEchoes.length > 0 ? (
                memoryEchoes.map((echo) => (
                  <div
                    key={echo.id}
                    className="p-4 rounded-md bg-[#1C1712]/90 border border-[#B4732D]/40 shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-story font-semibold text-sm text-[#FBBF24]">
                        {echo.title}
                      </h3>
                      <span className="text-[10px] font-mono text-[#A8A29E]">
                        {echo.discoveredAt || 'Discovered'}
                      </span>
                    </div>

                    <div className="font-story text-xs text-[#E7E5E4] italic leading-relaxed">
                      "{echo.prose}"
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-[#64748B]">
                  <Sparkles className="w-8 h-8 text-[#38BDF8]/40 mb-2" />
                  <p className="font-story text-sm text-[#94A3B8]">
                    No memory echoes discovered yet.
                  </p>
                  <p className="font-story text-xs text-[#64748B] mt-1">
                    Touch ancient monoliths and relics in the world to recover fragments of the Sundering.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ILLUSTRATED WORLD MAP */}
          {activeTab === 'map' && (
            <div className="flex flex-col gap-3">
              <div className="relative w-full h-72 rounded-md bg-[#0B0D14] border-2 border-[#2D3954] overflow-hidden flex items-center justify-center shadow-inner">
                {/* Parchment Grid Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                {/* Stylized Illustrated Map Graphic */}
                <div className="relative w-full h-full flex flex-col justify-between p-4">
                  {/* Whispering Glade Area */}
                  <div className="absolute top-8 left-12 p-2.5 rounded bg-[#143823]/80 border border-[#10B981] shadow-lg">
                    <span className="font-pixel text-[9px] text-[#10B981] block">
                      WHISPERING GLADE
                    </span>
                    <span className="text-[9px] font-story text-[#A7F3D0]">
                      Ancient stone circle & Elder Mael
                    </span>
                  </div>

                  {/* River dividing line */}
                  <div className="absolute top-0 bottom-0 left-[55%] w-3 bg-[#0284C7]/60 border-x border-[#38BDF8]/40" />

                  {/* Bridge marker */}
                  <div className="absolute top-[48%] left-[53%] w-7 h-4 bg-[#78350F] border border-[#D97706] rounded-xs flex items-center justify-center">
                    <span className="text-[7px] text-[#FEF08A] font-pixel">BRG</span>
                  </div>

                  {/* Sunken Shrine Area */}
                  <div className="absolute top-12 right-10 p-2.5 rounded bg-[#0F172A]/90 border border-[#38BDF8] shadow-lg">
                    <span className="font-pixel text-[9px] text-[#38BDF8] block">
                      SUNKEN SHRINE
                    </span>
                    <span className="text-[9px] font-story text-[#BAE6FD]">
                      Crystalline Chamber & Guardian
                    </span>
                  </div>

                  {/* Player Location Pin */}
                  <div
                    className="absolute z-20 flex flex-col items-center pointer-events-none transition-all duration-300"
                    style={{
                      left: `${Math.min(90, Math.max(10, (playerCoords.x / (currentMap?.width || 32)) * 100))}%`,
                      top: `${Math.min(85, Math.max(15, (playerCoords.y / (currentMap?.height || 22)) * 100))}%`,
                    }}
                  >
                    <Navigation className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B] animate-bounce" />
                    <span className="font-pixel text-[8px] px-1 py-0.5 rounded bg-[#0B0D14] text-[#F59E0B] border border-[#F59E0B]">
                      YOU
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] px-1">
                <span>Active Region: {currentMap?.title || 'Whispering Glade'}</span>
                <span>Coordinates: X: {Math.round(playerCoords.x)}, Y: {Math.round(playerCoords.y)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#2D3954] bg-[#0B0D14]/80 flex justify-between items-center">
          <span className="font-mono text-[10px] text-[#64748B]">
            Press [ESC] or [J] to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1E293B] hover:bg-[#2D3954] text-xs font-story text-[#F8FAFC] border border-[#2D3954] transition cursor-pointer"
          >
            Return to World
          </button>
        </div>
      </div>
    </div>
  );
};
