import React from 'react';
import type { InventoryState, EquipSlot, ItemInstance } from '../../types/mmo.js';
import { Shield, Swords, Zap, Heart, Coins, X } from 'lucide-react';
import { RARITY_COLORS } from '../../engine/spriteRenderer.js';
import { sound } from '../../engine/sound.js';

interface PaperDollEquipmentProps {
  inventory: InventoryState;
  onUnequipItem: (slot: EquipSlot) => void;
  onClose: () => void;
  username: string;
  level: number;
}

const SOCKET_NAMES: Record<EquipSlot, { label: string; icon: string }> = {
  head: { label: 'Head / Helm', icon: '👑' },
  chest: { label: 'Chest / Armor', icon: '🥋' },
  main_hand: { label: 'Main Hand', icon: '⚔️' },
  off_hand: { label: 'Off Hand', icon: '🛡️' },
  feet: { label: 'Feet / Boots', icon: '👢' },
  relic: { label: 'Relic Slot', icon: '🌟' },
};

export const PaperDollEquipment: React.FC<PaperDollEquipmentProps> = ({
  inventory,
  onUnequipItem,
  onClose,
  username,
  level,
}) => {
  // Calculate Aggregated Stats
  let totalAttack = 10;
  let totalDefense = 5;
  let totalSpeed = 0;
  let bonusHp = 0;

  for (const item of Object.values(inventory.equipped)) {
    if (item?.stats) {
      if (item.stats.attack) totalAttack += item.stats.attack;
      if (item.stats.defense) {
        totalDefense += item.stats.defense;
        bonusHp += item.stats.defense * 2;
      }
      if (item.stats.speed) totalSpeed += item.stats.speed;
    }
  }

  const renderSocket = (slot: EquipSlot, extraClasses = '') => {
    const item = inventory.equipped[slot];
    const info = SOCKET_NAMES[slot];
    const rarity = item ? RARITY_COLORS[item.rarity] || RARITY_COLORS.common : null;

    return (
      <div
        onClick={() => {
          if (item) {
            onUnequipItem(slot);
            sound.playEquip();
          }
        }}
        className={`group relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border transition-all ${
          item
            ? 'bg-slate-900/90 hover:scale-105 active:scale-95 cursor-pointer shadow-lg'
            : 'bg-[#151C2C]/80 border-slate-800 hover:border-slate-700'
        } ${extraClasses}`}
        style={item && rarity ? { borderColor: rarity.main } : {}}
        title={item ? `${item.name} (Click to Unequip)` : `Empty ${info.label}`}
      >
        {item ? (
          <>
            <span className="text-2xl drop-shadow">{info.icon}</span>
            <span
              className="text-[9px] font-bold text-center truncate w-full px-1"
              style={{ color: rarity?.text }}
            >
              {item.name}
            </span>
          </>
        ) : (
          <>
            <span className="text-base opacity-25">{info.icon}</span>
            <span className="text-[8px] text-slate-500 font-mono font-medium">
              {slot.replace('_', ' ')}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col p-3 rounded-2xl bg-[#0B0F19]/90 backdrop-blur-md border border-slate-700/60 shadow-2xl select-none min-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div>
          <span className="font-display font-bold text-sm text-slate-100 tracking-wide block">
            {username}
          </span>
          <span className="text-[10px] font-mono text-amber-400">
            Level {level} Adventurer
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Paper-Doll Equipment Silhouette Matrix */}
      <div className="relative py-2 flex flex-col items-center gap-2">
        {/* Head */}
        <div className="flex justify-center">{renderSocket('head')}</div>

        {/* Torso row: Main Hand, Chest, Off Hand */}
        <div className="flex items-center justify-center gap-3">
          {renderSocket('main_hand')}
          {renderSocket('chest')}
          {renderSocket('off_hand')}
        </div>

        {/* Lower row: Boots and Relic */}
        <div className="flex items-center justify-center gap-3">
          {renderSocket('feet')}
          {renderSocket('relic')}
        </div>
      </div>

      {/* Live Aggregated Stats Matrix */}
      <div className="grid grid-cols-2 gap-2 p-2 mt-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-amber-300">
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>Attack:</span>
          <span className="font-bold text-white ml-auto">{totalAttack}</span>
        </div>

        <div className="flex items-center gap-1.5 text-cyan-300">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Defense:</span>
          <span className="font-bold text-white ml-auto">{totalDefense}</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-300">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Speed:</span>
          <span className="font-bold text-white ml-auto">
            {totalSpeed >= 0 ? `+${totalSpeed}` : totalSpeed}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-rose-300">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Max HP:</span>
          <span className="font-bold text-white ml-auto">{100 + bonusHp}</span>
        </div>
      </div>

      {/* Gold Tally */}
      <div className="flex items-center justify-between p-2 mt-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Realm Gold:</span>
        </div>
        <span className="text-white text-sm">🪙 {inventory.gold.toLocaleString()}</span>
      </div>
    </div>
  );
};
