import React from 'react';
import type { MMOGameState, ItemInstance } from '../../types/mmo.js';
import { Package, User, HelpCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../../engine/sound.js';

interface ActionHotbarProps {
  state: MMOGameState;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenGuide: () => void;
  onUseItem: (uid: string) => void;
}

export const ActionHotbar: React.FC<ActionHotbarProps> = ({
  state,
  onOpenInventory,
  onOpenCharacter,
  onOpenGuide,
  onUseItem,
}) => {
  // Find consumables in inventory for quick slots
  const consumables = state.inventory.slots
    .filter(s => s.item.category === 'consumable')
    .map(s => s.item);

  // Keyboard number keys 1-8 listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].includes(e.code)) {
        const index = parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (consumables[index]) {
          onUseItem(consumables[index].uid);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [consumables, onUseItem]);

  return (
    <div className="pointer-events-auto flex items-end gap-2 select-none">
      {/* 8-Slot Quick Action Belt */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0B0F19]/85 backdrop-blur-md border border-slate-700/60 shadow-2xl">
        {Array.from({ length: 8 }).map((_, idx) => {
          const item: ItemInstance | undefined = consumables[idx];

          return (
            <div
              key={idx}
              onClick={() => item && onUseItem(item.uid)}
              className={`group relative w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                item
                  ? 'bg-slate-900/90 border-amber-500/50 hover:border-amber-400 hover:scale-105 active:scale-95 cursor-pointer shadow-lg'
                  : 'bg-[#151C2C]/80 border-slate-800 text-slate-700'
              }`}
            >
              {/* Hotkey Number Pill */}
              <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
                {idx + 1}
              </span>

              {/* Item Graphic or Placeholder */}
              {item ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm">
                    {item.iconKey.includes('red') ? '🧪' : item.iconKey.includes('cyan') ? '✨' : '📜'}
                  </span>
                  {/* Quantity Badge */}
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-amber-300 drop-shadow">
                      x{item.quantity}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              )}
            </div>
          );
        })}
      </div>

      {/* Flanking Utility Drawer Toggles */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0B0F19]/85 backdrop-blur-md border border-slate-700/60 shadow-2xl">
        {/* Inventory Toggle [I] */}
        <button
          onClick={onOpenInventory}
          className="relative group p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition active:scale-95 shadow"
          title="Spatial Inventory Bag [I]"
        >
          <Package className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-slate-950 border border-slate-700 text-[8px] font-mono font-bold text-slate-400 group-hover:text-amber-400">
            I
          </span>
        </button>

        {/* Character Sheet Toggle [C] */}
        <button
          onClick={onOpenCharacter}
          className="relative group p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition active:scale-95 shadow"
          title="Paper-Doll Equipment & Stats [C]"
        >
          <User className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-slate-950 border border-slate-700 text-[8px] font-mono font-bold text-slate-400 group-hover:text-cyan-400">
            C
          </span>
        </button>

        {/* Controls / Guide Toggle [H] */}
        <button
          onClick={onOpenGuide}
          className="relative group p-2 rounded-xl bg-slate-900/80 hover:bg-fuchsia-500/20 border border-slate-700 hover:border-fuchsia-400 text-slate-300 hover:text-fuchsia-300 transition active:scale-95 shadow"
          title="Keybindings & Controls [H]"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-slate-950 border border-slate-700 text-[8px] font-mono font-bold text-slate-400 group-hover:text-fuchsia-400">
            H
          </span>
        </button>
      </div>
    </div>
  );
};
