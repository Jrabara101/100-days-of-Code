export type Direction = 'up' | 'down' | 'left' | 'right';
export type ChatChannel = 'LOCAL' | 'GLOBAL' | 'PARTY' | 'WHISPER' | 'SYSTEM';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EquipSlot = 'main_hand' | 'off_hand' | 'head' | 'chest' | 'feet' | 'relic';

export interface ItemInstance {
  uid: string;
  templateId: string;
  name: string;
  category: 'weapon' | 'armor' | 'consumable' | 'material';
  rarity: ItemRarity;
  width: number; // Grid cells (1-2)
  height: number; // Grid cells (1-3)
  isRotated: boolean;
  quantity: number;
  maxStack: number;
  equipSlot?: EquipSlot;
  stats?: {
    attack?: number;
    defense?: number;
    speed?: number;
    hpRestore?: number;
  };
  iconKey: string;
  flavor?: string;
}

export interface InventorySlot {
  item: ItemInstance;
  gridX: number;
  gridY: number;
}

export interface InventoryState {
  cols: number;
  rows: number;
  slots: InventorySlot[];
  equipped: Partial<Record<EquipSlot, ItemInstance>>;
  gold: number;
}

export interface WorldPlayerEntity {
  id: string;
  username: string;
  title: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  facing: Direction;
  isMoving: boolean;
  hp: number;
  maxHp: number;
  stamina?: number;
  maxStamina?: number;
  level: number;
  equippedVisuals: Partial<Record<EquipSlot, string>>; // templateIds for sprite layering
  avatarColor?: string;
  isBot?: boolean;
  activeChatBubble?: {
    text: string;
    expiresAt: number;
  };
  activeEmote?: {
    emoji: string;
    expiresAt: number;
  };
}

export interface GroundLootEntity {
  id: string;
  item: ItemInstance;
  x: number;
  y: number;
  spawnedAt: number;
  expiresAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  channel: ChatChannel;
  content: string;
  timestamp: number;
  recipientId?: string;
  proximityDist?: number;
}

export interface TradeOffer {
  items: ItemInstance[];
  gold: number;
  locked: boolean;
  confirmed: boolean;
}

export interface ActiveTradeSession {
  tradeId: string;
  partnerId: string;
  partnerName: string;
  myOffer: TradeOffer;
  partnerOffer: TradeOffer;
  stage: 'STAGING' | 'LOCKED' | 'COUNTDOWN' | 'CONFIRMED' | 'CANCELLED';
  countdownRemainingMs?: number;
}

export interface MMOGameState {
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
  shardId: string;
  pingMs: number;
  myPlayerId: string;
  players: Record<string, WorldPlayerEntity>;
  groundLoot: Record<string, GroundLootEntity>;
  inventory: InventoryState;
  chatHistory: ChatMessage[];
  selectedTargetId: string | null;
  activeTrade: ActiveTradeSession | null;
  tradeInvite: { tradeId: string; initiatorId: string; initiatorName: string } | null;
}

// Client Input Command
export interface MoveInputPacket {
  seq: number;
  dt: number;
  inputVector: { dx: number; dy: number };
  facing: Direction;
}

export interface TileMapMeta {
  width: number;
  height: number;
  tileSize: number;
  spawnPoint: { x: number; y: number };
}
