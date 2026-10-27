import React, { useState, useEffect, useRef } from 'react';
import type { InventoryState, InventorySlot, ItemInstance, EquipSlot } from '../../types/mmo.js';
import { Sparkles, RotateCw, ArrowDownAZ, Trash2, X } from 'lucide-react';
import { canPlaceItemInGrid } from '../../utils/inventoryUtils.js';
import { RARITY_COLORS } from '../../engine/spriteRenderer.js';
import { sound } from '../../engine/sound.js';

interface SpatialInventoryProps {
  inventory: InventoryState;
  onMoveItem: (uid: string, toX: number, toY: number, rotate?: boolean) => void;
  onEquipItem: (uid: string, slot?: EquipSlot) => void;
  onDropItem: (uid: string) => void;
  onUseItem: (uid: string) => void;
  onSortItems: () => void;
  onClose: () => void;
}

const CELL_SIZE = 42; // px per inventory cell

export const SpatialInventory: React.FC<SpatialInventoryProps> = ({
  inventory,
  onMoveItem,
  onEquipItem,
  onDropItem,
  onUseItem,
  onSortItems,
  onClose,
}) => {
  const [draggedItem, setDraggedItem] = useState<{
    slot: InventorySlot;
    isRotated: boolean;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<ItemInstance | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const gridRef = useRef<HTMLDivElement | null>(null);

  // [R] Key listener to rotate currently dragged or hovered item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') {
        if (draggedItem) {
          e.preventDefault();
          setDraggedItem({
            ...draggedItem,
            isRotated: !draggedItem.isRotated,
          });
          sound.playEquip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draggedItem]);

  // Handle Drag Start
  const handleItemMouseDown = (e: React.MouseEvent, slot: InventorySlot) => {
    e.stopPropagation();
    if (e.button === 2) {
      // Right click: quick equip / consume
      e.preventDefault();
      if (slot.item.category === 'weapon' || slot.item.category === 'armor') {
        onEquipItem(slot.item.uid, slot.item.equipSlot);
      } else if (slot.item.category === 'consumable') {
        onUseItem(slot.item.uid);
      }
      return;
    }

    setDraggedItem({
      slot,
      isRotated: slot.item.isRotated,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    });
    sound.playEquip();
  };

  // Handle Mouse Move over Grid
  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const cellX = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const cellY = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (cellX >= 0 && cellX < inventory.cols && cellY >= 0 && cellY < inventory.rows) {
      setHoveredCell({ x: cellX, y: cellY });
    } else {
      setHoveredCell(null);
    }
  };

  // Handle Global Mouse Up
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!draggedItem) return;

      if (!gridRef.current) {
        setDraggedItem(null);
        return;
      }

      const rect = gridRef.current.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInside) {
        const targetX = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const targetY = Math.floor((e.clientY - rect.top) / CELL_SIZE);

        const tempItem: ItemInstance = {
          ...draggedItem.slot.item,
          isRotated: draggedItem.isRotated,
        };

        const canPlace = canPlaceItemInGrid(
          inventory.slots,
          tempItem,
          targetX,
          targetY,
          inventory.cols,
          inventory.rows,
          draggedItem.slot.item.uid
        );

        if (canPlace) {
          onMoveItem(draggedItem.slot.item.uid, targetX, targetY, draggedItem.isRotated !== draggedItem.slot.item.isRotated);
          sound.playEquip();
        }
      } else {
        // Dragged outside inventory window: Physically drop item onto world ground!
        onDropItem(draggedItem.slot.item.uid);
        sound.playDrop();
      }

      setDraggedItem(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggedItem, inventory, onMoveItem, onDropItem]);

  // Check if target placement is valid for live drag preview
  const isPlacementValid = () => {
    if (!draggedItem || !hoveredCell) return false;
    const tempItem: ItemInstance = {
      ...draggedItem.slot.item,
      isRotated: draggedItem.isRotated,
    };
    return canPlaceItemInGrid(
      inventory.slots,
      tempItem,
      hoveredCell.x,
      hoveredCell.y,
      inventory.cols,
      inventory.rows,
      draggedItem.slot.item.uid
    );
  };

  return (
    <div className="relative flex flex-col p-3 rounded-2xl bg-[#0B0F19]/90 backdrop-blur-md border border-slate-700/60 shadow-2xl select-none min-w-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm text-slate-100 tracking-wide">
            Spatial Backpack
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            ({inventory.slots.length} items)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Auto-Sort Button */}
          <button
            onClick={onSortItems}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition shadow active:scale-95"
            title="Auto-pack and organize backpack by rarity and size"
          >
            <ArrowDownAZ className="w-3 h-3 text-cyan-400" />
            <span>Sort</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div
        ref={gridRef}
        onMouseMove={handleGridMouseMove}
        onContextMenu={e => e.preventDefault()}
        style={{
          width: inventory.cols * CELL_SIZE,
          height: inventory.rows * CELL_SIZE,
        }}
        className="relative bg-[#111726]/90 rounded-xl border border-slate-800/80 shadow-inner overflow-hidden cursor-default"
      >
        {/* Recessed Grid Cells */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${inventory.cols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${inventory.rows}, ${CELL_SIZE}px)`,
          }}
        >
          {Array.from({ length: inventory.cols * inventory.rows }).map((_, idx) => (
            <div
              key={idx}
              className="border-r border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
            />
          ))}
        </div>

        {/* Existing Inventory Items */}
        {inventory.slots.map(slot => {
          const item = slot.item;
          const isDragging = draggedItem?.slot.item.uid === item.uid;
          if (isDragging) return null; // Hidden while dragging

          const effW = item.isRotated ? item.height : item.width;
          const effH = item.isRotated ? item.width : item.height;
          const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

          return (
            <div
              key={item.uid}
              onMouseDown={e => handleItemMouseDown(e, slot)}
              onMouseEnter={e => {
                setHoveredItem(item);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                left: slot.gridX * CELL_SIZE + 2,
                top: slot.gridY * CELL_SIZE + 2,
                width: effW * CELL_SIZE - 4,
                height: effH * CELL_SIZE - 4,
                borderColor: rarity.main,
              }}
              className="absolute rounded-lg bg-slate-900/90 border flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:brightness-110 shadow-lg transition-transform hover:scale-[1.02] z-10 p-1 overflow-hidden"
            >
              {/* Item Icon */}
              <span className="text-xl drop-shadow select-none">
                {getItemEmoji(item.iconKey)}
              </span>

              {/* Item Name / Dimension tag */}
              <span
                className="text-[9px] font-bold text-center truncate w-full px-0.5 select-none drop-shadow"
                style={{ color: rarity.text }}
              >
                {item.name}
              </span>

              {/* Stack Quantity Badge */}
              {item.quantity > 1 && (
                <span className="absolute bottom-1 right-1.5 px-1 rounded bg-slate-950/80 font-mono text-[9px] font-bold text-amber-300 border border-slate-700">
                  x{item.quantity}
                </span>
              )}

              {/* Equip slot indicator */}
              {item.equipSlot && (
                <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow" />
              )}
            </div>
          );
        })}

        {/* Drag Ghost & Placement Preview Highlight */}
        {draggedItem && hoveredCell && (
          <div
            style={{
              left: hoveredCell.x * CELL_SIZE,
              top: hoveredCell.y * CELL_SIZE,
              width: (draggedItem.isRotated ? draggedItem.slot.item.height : draggedItem.slot.item.width) * CELL_SIZE,
              height: (draggedItem.isRotated ? draggedItem.slot.item.width : draggedItem.slot.item.height) * CELL_SIZE,
            }}
            className={`absolute pointer-events-none rounded-lg border-2 transition-all duration-75 z-20 ${
              isPlacementValid()
                ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-red-500/25 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
            }`}
          />
        )}
      </div>

      {/* Footer Instructions */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-400 font-sans">
        <div className="flex items-center gap-1.5">
          <RotateCw className="w-3 h-3 text-amber-400" />
          <span>Press [R] to rotate</span>
        </div>
        <span>Right-click: Equip/Use</span>
        <span>Drag out to Drop</span>
      </div>

      {/* Hover Comparison Tooltip */}
      {hoveredItem && !draggedItem && (
        <ItemTooltip item={hoveredItem} pos={tooltipPos} />
      )}
    </div>
  );
};

// Item Tooltip Component
function ItemTooltip({ item, pos }: { item: ItemInstance; pos: { x: number; y: number } }) {
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

  return (
    <div
      style={{
        borderColor: rarity.main,
        left: Math.min(window.innerWidth - 240, pos.x + 16),
        top: Math.min(window.innerHeight - 200, pos.y - 40),
      }}
      className="fixed pointer-events-none p-2.5 rounded-xl bg-slate-950/95 backdrop-blur-md border shadow-2xl w-56 z-50 animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-xs" style={{ color: rarity.text }}>
          {item.name}
        </span>
        <span
          className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded border"
          style={{ borderColor: rarity.main, color: rarity.text }}
        >
          {item.rarity}
        </span>
      </div>

      <div className="text-[10px] text-slate-400 font-medium capitalize mb-2">
        {item.category} {item.equipSlot ? `• ${item.equipSlot.replace('_', ' ')}` : ''}
      </div>

      {/* Stats Readout */}
      {item.stats && (
        <div className="space-y-0.5 py-1 mb-1.5 border-y border-slate-800 text-[11px] font-mono">
          {item.stats.attack !== undefined && (
            <div className="text-amber-400">⚔️ +{item.stats.attack} Attack</div>
          )}
          {item.stats.defense !== undefined && (
            <div className="text-cyan-400">🛡️ +{item.stats.defense} Defense</div>
          )}
          {item.stats.speed !== undefined && (
            <div className="text-emerald-400">⚡ +{item.stats.speed} Movement Speed</div>
          )}
          {item.stats.hpRestore !== undefined && (
            <div className="text-rose-400">❤️ Restores {item.stats.hpRestore} HP</div>
          )}
        </div>
      )}

      {/* Flavor Lore */}
      {item.flavor && (
        <div className="text-[10px] italic text-slate-400/90 leading-tight">
          "{item.flavor}"
        </div>
      )}
    </div>
  );
}

function getItemEmoji(iconKey: string): string {
  switch (iconKey) {
    case 'sword':
    case 'sunblade':
      return '⚔️';
    case 'dagger':
      return '🗡️';
    case 'staff':
      return '🪄';
    case 'shield':
      return '🛡️';
    case 'helm':
    case 'crown':
      return '👑';
    case 'plate':
    case 'tunic':
      return '🥋';
    case 'boots':
      return '👢';
    case 'potion_red':
      return '🧪';
    case 'potion_cyan':
      return '✨';
    case 'gem':
      return '💎';
    case 'scroll':
      return '📜';
    case 'relic_fire':
      return '🔥';
    case 'relic_star':
      return '🌟';
    default:
      return '📦';
  }
}
