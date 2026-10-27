import type {
  Direction,
  ChatChannel,
  ItemRarity,
  EquipSlot,
  ItemInstance,
  InventorySlot,
  InventoryState,
  WorldPlayerEntity,
  GroundLootEntity,
  ChatMessage,
  TradeOffer,
  ActiveTradeSession,
  MoveInputPacket,
  TileMapMeta,
} from '../../src/types/mmo.js';

export type {
  Direction,
  ChatChannel,
  ItemRarity,
  EquipSlot,
  ItemInstance,
  InventorySlot,
  InventoryState,
  WorldPlayerEntity,
  GroundLootEntity,
  ChatMessage,
  TradeOffer,
  ActiveTradeSession,
  MoveInputPacket,
  TileMapMeta,
};

export interface ServerPlayer extends WorldPlayerEntity {
  stamina: number;
  maxStamina: number;
  inventory: InventoryState;
  pendingInputs: MoveInputPacket[];
  lastProcessedSeq: number;
  lastActive: number;
  partyId?: string;
}

export type ClientPacket =
  | { type: 'JOIN'; shardId: string; username: string; title?: string; avatarColor?: string }
  | { type: 'MOVE_INPUT'; seq: number; dt: number; inputVector: { dx: number; dy: number }; facing: Direction }
  | { type: 'CHAT'; channel: ChatChannel; content: string; recipientId?: string }
  | { type: 'EMOTE'; emoji: string }
  | { type: 'ITEM_MOVE'; uid: string; toGridX: number; toGridY: number; rotate?: boolean }
  | { type: 'ITEM_EQUIP'; uid: string; targetSlot?: EquipSlot }
  | { type: 'ITEM_UNEQUIP'; slot: EquipSlot; toGridX?: number; toGridY?: number }
  | { type: 'ITEM_DROP'; uid: string }
  | { type: 'ITEM_PICKUP'; lootId: string }
  | { type: 'ITEM_USE'; uid: string }
  | { type: 'ITEM_SORT' }
  | { type: 'TRADE_REQUEST'; targetPlayerId: string }
  | { type: 'TRADE_RESPOND'; tradeId: string; accept: boolean }
  | { type: 'TRADE_STAGE_ITEM'; tradeId: string; itemUid: string }
  | { type: 'TRADE_UNSTAGE_ITEM'; tradeId: string; itemUid: string }
  | { type: 'TRADE_SET_GOLD'; tradeId: string; amount: number }
  | { type: 'TRADE_LOCK'; tradeId: string; locked: boolean }
  | { type: 'TRADE_CONFIRM'; tradeId: string }
  | { type: 'TRADE_CANCEL'; tradeId: string }
  | { type: 'PING'; clientTimestamp: number };

export type ServerPacket =
  | {
      type: 'INIT_STATE';
      myPlayerId: string;
      shardId: string;
      worldMap: TileMapMeta;
      player: WorldPlayerEntity;
      inventory: InventoryState;
      players: Record<string, WorldPlayerEntity>;
      groundLoot: Record<string, GroundLootEntity>;
    }
  | {
      type: 'TICK_SNAPSHOT';
      tick: number;
      timestamp: number;
      lastProcessedSeqs: Record<string, number>;
      players: Record<string, WorldPlayerEntity>;
      groundLootDeltas?: { added?: GroundLootEntity[]; removed?: string[] };
    }
  | { type: 'INVENTORY_UPDATE'; inventory: InventoryState }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'CHAT_BUBBLE'; playerId: string; text: string; expiresAt: number }
  | { type: 'EMOTE_POP'; playerId: string; emoji: string; expiresAt: number }
  | { type: 'LOOT_SPAWNED'; loot: GroundLootEntity }
  | { type: 'LOOT_DESPAWNED'; lootId: string; pickedUpBy?: string }
  | { type: 'TRADE_INVITE'; tradeId: string; initiatorId: string; initiatorName: string }
  | { type: 'TRADE_UPDATE'; trade: ActiveTradeSession | null; errorReason?: string }
  | { type: 'PONG'; clientTimestamp: number; serverTimestamp: number }
  | { type: 'SYSTEM_ALERT'; message: string; alertType?: 'info' | 'warning' | 'success' | 'error' };
