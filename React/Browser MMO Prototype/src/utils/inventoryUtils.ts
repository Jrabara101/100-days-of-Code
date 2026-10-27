import type { InventorySlot, ItemInstance, InventoryState, ItemRarity } from '../types/mmo.js';

export const INVENTORY_COLS = 8;
export const INVENTORY_ROWS = 5;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Spatial Grid Collision Checker
export function canPlaceItemInGrid(
  slots: InventorySlot[],
  item: ItemInstance,
  targetX: number,
  targetY: number,
  cols = INVENTORY_COLS,
  rows = INVENTORY_ROWS,
  excludeUid?: string
): boolean {
  const effectiveW = item.isRotated ? item.height : item.width;
  const effectiveH = item.isRotated ? item.width : item.height;

  // Check bounds
  if (targetX < 0 || targetY < 0 || targetX + effectiveW > cols || targetY + effectiveH > rows) {
    return false;
  }

  // Check overlap with existing items
  for (const slot of slots) {
    if (excludeUid && slot.item.uid === excludeUid) {
      continue;
    }
    const otherW = slot.item.isRotated ? slot.item.height : slot.item.width;
    const otherH = slot.item.isRotated ? slot.item.width : slot.item.height;

    // Overlap test between rect 1 and rect 2
    const overlapX = targetX < slot.gridX + otherW && targetX + effectiveW > slot.gridX;
    const overlapY = targetY < slot.gridY + otherH && targetY + effectiveH > slot.gridY;

    if (overlapX && overlapY) {
      return false;
    }
  }

  return true;
}

// Find first vacant slot in spatial grid
export function findVacantPositionInGrid(
  slots: InventorySlot[],
  item: ItemInstance,
  cols = INVENTORY_COLS,
  rows = INVENTORY_ROWS
): { x: number; y: number } | null {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (canPlaceItemInGrid(slots, item, x, y, cols, rows)) {
        return { x, y };
      }
    }
  }
  return null;
}

// Auto-sort items in inventory
export function autoSortInventory(inventory: InventoryState): InventoryState {
  const allItems = [...inventory.slots.map(s => s.item)];
  const rarityRank: Record<ItemRarity, number> = {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
  };

  allItems.sort((a, b) => {
    const rankDiff = rarityRank[b.rarity] - rarityRank[a.rarity];
    if (rankDiff !== 0) return rankDiff;
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });

  const newSlots: InventorySlot[] = [];
  for (const item of allItems) {
    item.isRotated = false;
    let pos = findVacantPositionInGrid(newSlots, item, inventory.cols, inventory.rows);
    if (!pos && item.width !== item.height) {
      item.isRotated = true;
      pos = findVacantPositionInGrid(newSlots, item, inventory.cols, inventory.rows);
      if (!pos) item.isRotated = false;
    }

    if (pos) {
      newSlots.push({ item, gridX: pos.x, gridY: pos.y });
    } else {
      newSlots.push({ item, gridX: 0, gridY: 0 });
    }
  }

  return {
    ...inventory,
    slots: newSlots,
  };
}
