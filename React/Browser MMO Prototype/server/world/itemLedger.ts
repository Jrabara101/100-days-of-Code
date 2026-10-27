import { randomUUID } from 'crypto';
import type {
  ItemInstance,
  InventorySlot,
  InventoryState,
  EquipSlot,
  GroundLootEntity,
  ItemRarity,
} from './types.js';

export const INVENTORY_COLS = 8;
export const INVENTORY_ROWS = 5;

// Item Catalog Templates
export interface ItemTemplate {
  templateId: string;
  name: string;
  category: 'weapon' | 'armor' | 'consumable' | 'material';
  rarity: ItemRarity;
  width: number;
  height: number;
  maxStack: number;
  equipSlot?: EquipSlot;
  stats?: { attack?: number; defense?: number; speed?: number; hpRestore?: number };
  iconKey: string;
  flavor: string;
}

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  // Weapons
  sword_iron: {
    templateId: 'sword_iron',
    name: 'Iron Broadsword',
    category: 'weapon',
    rarity: 'common',
    width: 1,
    height: 3,
    maxStack: 1,
    equipSlot: 'main_hand',
    stats: { attack: 14, speed: -2 },
    iconKey: 'sword',
    flavor: 'A well-balanced standard forge blade with a polished crossguard.',
  },
  dagger_shadow: {
    templateId: 'dagger_shadow',
    name: 'Shadow Stiletto',
    category: 'weapon',
    rarity: 'rare',
    width: 1,
    height: 2,
    maxStack: 1,
    equipSlot: 'main_hand',
    stats: { attack: 22, speed: 6 },
    iconKey: 'dagger',
    flavor: 'Forged in darkened obsidian, whispering swift lethality.',
  },
  staff_aether: {
    templateId: 'staff_aether',
    name: 'Aether Archstaff',
    category: 'weapon',
    rarity: 'epic',
    width: 1,
    height: 3,
    maxStack: 1,
    equipSlot: 'main_hand',
    stats: { attack: 36, speed: 2 },
    iconKey: 'staff',
    flavor: 'Harnesses atmospheric ley lines to channel astral surges.',
  },
  blade_runic: {
    templateId: 'blade_runic',
    name: 'Mythic Sunblade',
    category: 'weapon',
    rarity: 'legendary',
    width: 1,
    height: 3,
    maxStack: 1,
    equipSlot: 'main_hand',
    stats: { attack: 52, speed: 8 },
    iconKey: 'sunblade',
    flavor: 'Radiates the inextinguishable dawn fire of the First Ascendants.',
  },

  // Armor & Gear
  helm_bronze: {
    templateId: 'helm_bronze',
    name: 'Plated Visor',
    category: 'armor',
    rarity: 'common',
    width: 2,
    height: 1,
    maxStack: 1,
    equipSlot: 'head',
    stats: { defense: 8 },
    iconKey: 'helm',
    flavor: 'Sturdy hammered bronze cap protecting against glancing blows.',
  },
  helm_crown: {
    templateId: 'helm_crown',
    name: 'Crown of Solitude',
    category: 'armor',
    rarity: 'epic',
    width: 2,
    height: 1,
    maxStack: 1,
    equipSlot: 'head',
    stats: { defense: 24, attack: 8 },
    iconKey: 'crown',
    flavor: 'Adorned with raw cobalt crystals that sharpen mental clarity.',
  },
  armor_leather: {
    templateId: 'armor_leather',
    name: 'Scout Tunic',
    category: 'armor',
    rarity: 'uncommon',
    width: 2,
    height: 2,
    maxStack: 1,
    equipSlot: 'chest',
    stats: { defense: 14, speed: 4 },
    iconKey: 'tunic',
    flavor: 'Lightweight cured buckskin providing nimble woodland stride.',
  },
  armor_plate: {
    templateId: 'armor_plate',
    name: 'Dragon Knight Cuirass',
    category: 'armor',
    rarity: 'legendary',
    width: 2,
    height: 2,
    maxStack: 1,
    equipSlot: 'chest',
    stats: { defense: 48, speed: -2 },
    iconKey: 'plate',
    flavor: 'Tempered in wyrm breath; deflects both steel and spellfire.',
  },
  shield_kite: {
    templateId: 'shield_kite',
    name: 'Tower Pavise',
    category: 'armor',
    rarity: 'epic',
    width: 2,
    height: 2,
    maxStack: 1,
    equipSlot: 'off_hand',
    stats: { defense: 28 },
    iconKey: 'shield',
    flavor: 'Heavy oak bulwark reinforced with iron rivets and heraldic crest.',
  },
  boots_wanderer: {
    templateId: 'boots_wanderer',
    name: 'Swiftwind Greaves',
    category: 'armor',
    rarity: 'rare',
    width: 2,
    height: 1,
    maxStack: 1,
    equipSlot: 'feet',
    stats: { defense: 10, speed: 14 },
    iconKey: 'boots',
    flavor: 'Enchanted soles that feel weightless upon rough cobblestone.',
  },
  relic_phoenix: {
    templateId: 'relic_phoenix',
    name: 'Phoenix Heart Censer',
    category: 'armor',
    rarity: 'epic',
    width: 1,
    height: 1,
    maxStack: 1,
    equipSlot: 'relic',
    stats: { hpRestore: 25, defense: 12 },
    iconKey: 'relic_fire',
    flavor: 'Smolders with eternal embers, continually soothing bodily wear.',
  },
  relic_astral: {
    templateId: 'relic_astral',
    name: 'Astral Astrolabe',
    category: 'armor',
    rarity: 'legendary',
    width: 1,
    height: 1,
    maxStack: 1,
    equipSlot: 'relic',
    stats: { attack: 18, speed: 10 },
    iconKey: 'relic_star',
    flavor: 'An intricate celestial mechanism mapping dimensional shifts.',
  },

  // Consumables & Valuables
  pot_health: {
    templateId: 'pot_health',
    name: 'Sunfire Draught',
    category: 'consumable',
    rarity: 'common',
    width: 1,
    height: 1,
    maxStack: 10,
    stats: { hpRestore: 60 },
    iconKey: 'potion_red',
    flavor: 'Bubbling crimson draught brewed from wild firebloom petals.',
  },
  pot_elixir: {
    templateId: 'pot_elixir',
    name: 'Star Elixir',
    category: 'consumable',
    rarity: 'rare',
    width: 1,
    height: 1,
    maxStack: 5,
    stats: { hpRestore: 120, speed: 8 },
    iconKey: 'potion_cyan',
    flavor: 'Distilled twilight ether granting surge of restorative vitality.',
  },
  gem_ruby: {
    templateId: 'gem_ruby',
    name: 'Flawless Star Ruby',
    category: 'material',
    rarity: 'epic',
    width: 1,
    height: 1,
    maxStack: 20,
    iconKey: 'gem',
    flavor: 'Pristine crystalline facet prized by royal jewelers and enchanters.',
  },
  scroll_tp: {
    templateId: 'scroll_tp',
    name: 'Town Warp Scroll',
    category: 'consumable',
    rarity: 'uncommon',
    width: 1,
    height: 2,
    maxStack: 5,
    iconKey: 'scroll',
    flavor: 'Runic parchment inscribed with immediate coordinates to Olde Haven.',
  },
};

export class ItemLedgerManager {
  private groundLoot: Map<string, GroundLootEntity> = new Map();
  // Mutex lock for atomic pickups to prevent duplicate race conditions
  private pickupLocks: Set<string> = new Set();

  constructor() {
    this.seedInitialWorldLoot();
  }

  public getGroundLoot(): Record<string, GroundLootEntity> {
    const result: Record<string, GroundLootEntity> = {};
    for (const [id, loot] of this.groundLoot.entries()) {
      result[id] = loot;
    }
    return result;
  }

  public createItemInstance(templateId: string, quantity = 1): ItemInstance {
    const template = ITEM_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Item template not found: ${templateId}`);
    }
    return {
      uid: randomUUID(),
      templateId: template.templateId,
      name: template.name,
      category: template.category,
      rarity: template.rarity,
      width: template.width,
      height: template.height,
      isRotated: false,
      quantity,
      maxStack: template.maxStack,
      equipSlot: template.equipSlot,
      stats: template.stats ? { ...template.stats } : undefined,
      iconKey: template.iconKey,
      flavor: template.flavor,
    };
  }

  // Create starting player inventory
  public createStarterInventory(): InventoryState {
    const slots: InventorySlot[] = [];
    const sword = this.createItemInstance('sword_iron');
    const potion = this.createItemInstance('pot_health', 3);
    const tunic = this.createItemInstance('armor_leather');
    const scroll = this.createItemInstance('scroll_tp', 2);

    // Place starting gear cleanly
    slots.push({ item: sword, gridX: 0, gridY: 0 });
    slots.push({ item: tunic, gridX: 2, gridY: 0 });
    slots.push({ item: potion, gridX: 5, gridY: 0 });
    slots.push({ item: scroll, gridX: 7, gridY: 0 });

    return {
      cols: INVENTORY_COLS,
      rows: INVENTORY_ROWS,
      slots,
      equipped: {},
      gold: 250,
    };
  }

  // Spatial Grid Collision Checker
  public static canPlaceItem(
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

    // Build occupied grid
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

  // Find first vacant slot in inventory that fits the item
  public static findVacantPosition(
    slots: InventorySlot[],
    item: ItemInstance,
    cols = INVENTORY_COLS,
    rows = INVENTORY_ROWS
  ): { x: number; y: number } | null {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (ItemLedgerManager.canPlaceItem(slots, item, x, y, cols, rows)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  // Auto-sort algorithm: organizes inventory cleanly
  public static autoSort(inventory: InventoryState): InventoryState {
    const allItems = [...inventory.slots.map(s => s.item)];
    // Sort items by rarity (legendary first) then size descending
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
      let pos = ItemLedgerManager.findVacantPosition(newSlots, item, inventory.cols, inventory.rows);
      if (!pos && item.width !== item.height) {
        // Try rotated
        item.isRotated = true;
        pos = ItemLedgerManager.findVacantPosition(newSlots, item, inventory.cols, inventory.rows);
        if (!pos) {
          item.isRotated = false; // Revert
        }
      }

      if (pos) {
        newSlots.push({ item, gridX: pos.x, gridY: pos.y });
      } else {
        // Fallback keep where possible
        newSlots.push({ item, gridX: 0, gridY: 0 });
      }
    }

    return {
      ...inventory,
      slots: newSlots,
    };
  }

  // Drop an item onto the world ground
  public dropItem(item: ItemInstance, x: number, y: number): GroundLootEntity {
    // Add subtle jitter so stacked drops don't sit on identical exact pixel
    const jitterX = (Math.random() - 0.5) * 32;
    const jitterY = (Math.random() - 0.5) * 32;

    const lootId = `loot_${randomUUID().substring(0, 8)}`;
    const now = Date.now();
    const lootEntity: GroundLootEntity = {
      id: lootId,
      item,
      x: Math.round(x + jitterX),
      y: Math.round(y + jitterY),
      spawnedAt: now,
      expiresAt: now + 60000, // 60s despawn timer
    };

    this.groundLoot.set(lootId, lootEntity);
    return lootEntity;
  }

  // Atomic pickup with mutex lock
  public atomicPickup(lootId: string, playerX: number, playerY: number, inventory: InventoryState): {
    success: boolean;
    item?: ItemInstance;
    updatedInventory?: InventoryState;
    reason?: string;
  } {
    // 1. Check if loot exists
    const loot = this.groundLoot.get(lootId);
    if (!loot) {
      return { success: false, reason: 'Item already claimed or expired.' };
    }

    // 2. Check pickup distance (< 110px Euclidean distance)
    const distSq = (loot.x - playerX) ** 2 + (loot.y - playerY) ** 2;
    if (distSq > 110 * 110) {
      return { success: false, reason: 'Too far away to pick up.' };
    }

    // 3. Mutex Lock check
    if (this.pickupLocks.has(lootId)) {
      return { success: false, reason: 'Someone else is claiming this item.' };
    }
    this.pickupLocks.add(lootId);

    try {
      // 4. Check if stackable with existing inventory slot
      if (loot.item.maxStack > 1) {
        const existingSlot = inventory.slots.find(
          s => s.item.templateId === loot.item.templateId && s.item.quantity < s.item.maxStack
        );
        if (existingSlot) {
          const space = existingSlot.item.maxStack - existingSlot.item.quantity;
          const transfer = Math.min(space, loot.item.quantity);
          existingSlot.item.quantity += transfer;
          loot.item.quantity -= transfer;

          if (loot.item.quantity <= 0) {
            this.groundLoot.delete(lootId);
            return {
              success: true,
              item: existingSlot.item,
              updatedInventory: { ...inventory },
            };
          }
        }
      }

      // 5. Find vacant position in spatial grid
      const pos = ItemLedgerManager.findVacantPosition(inventory.slots, loot.item, inventory.cols, inventory.rows);
      if (!pos) {
        return { success: false, reason: 'Backpack is full. Make space to pick up.' };
      }

      // Add to inventory
      inventory.slots.push({
        item: loot.item,
        gridX: pos.x,
        gridY: pos.y,
      });

      // Remove from world ground
      this.groundLoot.delete(lootId);

      return {
        success: true,
        item: loot.item,
        updatedInventory: { ...inventory },
      };
    } finally {
      this.pickupLocks.delete(lootId);
    }
  }

  // Periodic tick: prune expired loot (60s timer)
  public pruneExpiredLoot(): string[] {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, loot] of this.groundLoot.entries()) {
      if (now > loot.expiresAt) {
        expiredIds.push(id);
        this.groundLoot.delete(id);
      }
    }

    return expiredIds;
  }

  // Seed initial discoverable ground drops in town
  private seedInitialWorldLoot() {
    const drops = [
      { template: 'dagger_shadow', x: 23 * 48 + 20, y: 26 * 48 },
      { template: 'helm_bronze', x: 27 * 48, y: 26 * 48 },
      { template: 'pot_health', x: 24 * 48, y: 29 * 48, qty: 3 },
      { template: 'boots_wanderer', x: 22 * 48, y: 23 * 48 },
      { template: 'gem_ruby', x: 28 * 48, y: 23 * 48, qty: 2 },
      { template: 'staff_aether', x: 19 * 48 + 30, y: 24 * 48 },
      { template: 'shield_kite', x: 31 * 48, y: 25 * 48 },
      { template: 'blade_runic', x: 25 * 48, y: 20 * 48 },
      { template: 'relic_phoenix', x: 25 * 48, y: 31 * 48 },
    ];

    const now = Date.now();
    for (const d of drops) {
      const item = this.createItemInstance(d.template, d.qty || 1);
      const id = `loot_starter_${randomUUID().substring(0, 6)}`;
      this.groundLoot.set(id, {
        id,
        item,
        x: d.x,
        y: d.y,
        spawnedAt: now,
        // Starter loot stays active longer (5 minutes) so new players have items to discover
        expiresAt: now + 300000,
      });
    }
  }
}
