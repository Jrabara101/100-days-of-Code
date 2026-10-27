import { randomUUID } from 'crypto';
import type {
  ActiveTradeSession,
  ItemInstance,
  ServerPlayer,
  InventoryState,
} from './types.js';
import { ItemLedgerManager } from './itemLedger.js';
import { SpatialHashGrid } from './spatialGrid.js';

export const MAX_TRADE_DISTANCE = 220; // 220px maximum distance to maintain trade

export class TradeManager {
  // tradeId -> ActiveTradeSession
  private activeSessions: Map<string, {
    tradeId: string;
    player1Id: string;
    player2Id: string;
    player1Offer: { items: ItemInstance[]; gold: number; locked: boolean; confirmed: boolean };
    player2Offer: { items: ItemInstance[]; gold: number; locked: boolean; confirmed: boolean };
    stage: 'STAGING' | 'LOCKED' | 'COUNTDOWN' | 'CONFIRMED' | 'CANCELLED';
    countdownTimer?: NodeJS.Timeout;
    countdownRemainingMs?: number;
  }> = new Map();

  // playerId -> tradeId
  private playerToTrade: Map<string, string> = new Map();

  public getPlayerActiveTrade(playerId: string) {
    const tradeId = this.playerToTrade.get(playerId);
    if (!tradeId) return null;
    return this.activeSessions.get(tradeId) || null;
  }

  // Create or initiate a trade session
  public startTrade(player1: ServerPlayer, player2: ServerPlayer): { success: boolean; tradeId?: string; reason?: string } {
    if (this.playerToTrade.has(player1.id) || this.playerToTrade.has(player2.id)) {
      return { success: false, reason: 'One of the players is already engaged in a trade.' };
    }

    const dist = SpatialHashGrid.distance(player1.x, player1.y, player2.x, player2.y);
    if (dist > MAX_TRADE_DISTANCE) {
      return { success: false, reason: 'Too far away to trade.' };
    }

    const tradeId = `trade_${randomUUID().substring(0, 8)}`;
    this.activeSessions.set(tradeId, {
      tradeId,
      player1Id: player1.id,
      player2Id: player2.id,
      player1Offer: { items: [], gold: 0, locked: false, confirmed: false },
      player2Offer: { items: [], gold: 0, locked: false, confirmed: false },
      stage: 'STAGING',
    });

    this.playerToTrade.set(player1.id, tradeId);
    this.playerToTrade.set(player2.id, tradeId);

    return { success: true, tradeId };
  }

  // Stage an item in the trade chamber
  public stageItem(playerId: string, itemUid: string, playerInventory: InventoryState): boolean {
    const session = this.getPlayerActiveTrade(playerId);
    if (!session || session.stage === 'CONFIRMED' || session.stage === 'CANCELLED') return false;

    // Reset locks on mutation!
    this.resetLocks(session);

    const isP1 = session.player1Id === playerId;
    const offer = isP1 ? session.player1Offer : session.player2Offer;

    // Check if already staged
    if (offer.items.some(i => i.uid === itemUid)) return true;

    // Find item in inventory
    const slot = playerInventory.slots.find(s => s.item.uid === itemUid);
    if (!slot) return false;

    offer.items.push({ ...slot.item });
    return true;
  }

  // Unstage an item from trade chamber
  public unstageItem(playerId: string, itemUid: string): boolean {
    const session = this.getPlayerActiveTrade(playerId);
    if (!session || session.stage === 'CONFIRMED' || session.stage === 'CANCELLED') return false;

    this.resetLocks(session);

    const isP1 = session.player1Id === playerId;
    const offer = isP1 ? session.player1Offer : session.player2Offer;
    const initialLen = offer.items.length;
    offer.items = offer.items.filter(i => i.uid !== itemUid);
    return offer.items.length !== initialLen;
  }

  // Set gold in trade chamber
  public setGold(playerId: string, amount: number, playerGold: number): boolean {
    const session = this.getPlayerActiveTrade(playerId);
    if (!session || session.stage === 'CONFIRMED' || session.stage === 'CANCELLED') return false;

    this.resetLocks(session);

    const validAmount = Math.max(0, Math.min(amount, playerGold));
    const isP1 = session.player1Id === playerId;
    const offer = isP1 ? session.player1Offer : session.player2Offer;
    offer.gold = validAmount;
    return true;
  }

  // Toggle lock state
  public toggleLock(playerId: string, locked: boolean): boolean {
    const session = this.getPlayerActiveTrade(playerId);
    if (!session || session.stage === 'CONFIRMED' || session.stage === 'CANCELLED') return false;

    const isP1 = session.player1Id === playerId;
    const offer = isP1 ? session.player1Offer : session.player2Offer;
    offer.locked = locked;

    // If both locked, advance to COUNTDOWN
    if (session.player1Offer.locked && session.player2Offer.locked) {
      session.stage = 'COUNTDOWN';
      session.countdownRemainingMs = 3000;
    } else {
      session.stage = 'STAGING';
      if (session.countdownTimer) {
        clearTimeout(session.countdownTimer);
        session.countdownTimer = undefined;
      }
      session.player1Offer.confirmed = false;
      session.player2Offer.confirmed = false;
    }

    return true;
  }

  // Confirm trade
  public confirmTrade(playerId: string): { readyToExecute: boolean; session: any } {
    const session = this.getPlayerActiveTrade(playerId);
    if (!session || (session.stage !== 'LOCKED' && session.stage !== 'COUNTDOWN')) {
      return { readyToExecute: false, session: null };
    }

    const isP1 = session.player1Id === playerId;
    if (isP1) {
      session.player1Offer.confirmed = true;
    } else {
      session.player2Offer.confirmed = true;
    }

    if (session.player1Offer.confirmed && session.player2Offer.confirmed) {
      session.stage = 'CONFIRMED';
      return { readyToExecute: true, session };
    }

    return { readyToExecute: false, session };
  }

  // Execute atomic item & gold swap
  public executeAtomicSwap(
    player1: ServerPlayer,
    player2: ServerPlayer
  ): {
    success: boolean;
    reason?: string;
  } {
    const session = this.getPlayerActiveTrade(player1.id);
    if (!session) return { success: false, reason: 'No active trade session.' };

    const p1Offer = session.player1Offer;
    const p2Offer = session.player2Offer;

    // 1. Verify player 1 still owns all staged items & gold
    for (const item of p1Offer.items) {
      if (!player1.inventory.slots.some(s => s.item.uid === item.uid)) {
        return { success: false, reason: `${player1.username} no longer has the staged items.` };
      }
    }
    if (player1.inventory.gold < p1Offer.gold) {
      return { success: false, reason: `${player1.username} has insufficient gold.` };
    }

    // 2. Verify player 2 still owns all staged items & gold
    for (const item of p2Offer.items) {
      if (!player2.inventory.slots.some(s => s.item.uid === item.uid)) {
        return { success: false, reason: `${player2.username} no longer has the staged items.` };
      }
    }
    if (player2.inventory.gold < p2Offer.gold) {
      return { success: false, reason: `${player2.username} has insufficient gold.` };
    }

    // 3. Remove staged items and gold from both players
    player1.inventory.slots = player1.inventory.slots.filter(
      s => !p1Offer.items.some(offered => offered.uid === s.item.uid)
    );
    player2.inventory.slots = player2.inventory.slots.filter(
      s => !p2Offer.items.some(offered => offered.uid === s.item.uid)
    );

    player1.inventory.gold -= p1Offer.gold;
    player2.inventory.gold -= p2Offer.gold;

    // 4. Place player 2's offer into player 1's inventory
    for (const item of p2Offer.items) {
      const pos = ItemLedgerManager.findVacantPosition(
        player1.inventory.slots,
        item,
        player1.inventory.cols,
        player1.inventory.rows
      );
      if (pos) {
        player1.inventory.slots.push({ item, gridX: pos.x, gridY: pos.y });
      } else {
        // Fallback slot
        player1.inventory.slots.push({ item, gridX: 0, gridY: 0 });
      }
    }
    player1.inventory.gold += p2Offer.gold;

    // 5. Place player 1's offer into player 2's inventory
    for (const item of p1Offer.items) {
      const pos = ItemLedgerManager.findVacantPosition(
        player2.inventory.slots,
        item,
        player2.inventory.cols,
        player2.inventory.rows
      );
      if (pos) {
        player2.inventory.slots.push({ item, gridX: pos.x, gridY: pos.y });
      } else {
        player2.inventory.slots.push({ item, gridX: 0, gridY: 0 });
      }
    }
    player2.inventory.gold += p1Offer.gold;

    // Clean up trade session
    this.cancelTrade(session.tradeId);
    return { success: true };
  }

  // Cancel trade and release both players
  public cancelTrade(tradeId: string) {
    const session = this.activeSessions.get(tradeId);
    if (!session) return;

    if (session.countdownTimer) {
      clearTimeout(session.countdownTimer);
    }

    this.playerToTrade.delete(session.player1Id);
    this.playerToTrade.delete(session.player2Id);
    this.activeSessions.delete(tradeId);
  }

  // Reset locks and countdown if either party mutates offer
  private resetLocks(session: any) {
    session.player1Offer.locked = false;
    session.player2Offer.locked = false;
    session.player1Offer.confirmed = false;
    session.player2Offer.confirmed = false;
    session.stage = 'STAGING';
    if (session.countdownTimer) {
      clearTimeout(session.countdownTimer);
      session.countdownTimer = undefined;
    }
    session.countdownRemainingMs = undefined;
  }

  // Build client-facing ActiveTradeSession format for a player
  public buildClientTradeSession(
    tradeId: string,
    forPlayerId: string,
    player1Name: string,
    player2Name: string
  ): ActiveTradeSession | null {
    const session = this.activeSessions.get(tradeId);
    if (!session) return null;

    const isP1 = session.player1Id === forPlayerId;
    return {
      tradeId: session.tradeId,
      partnerId: isP1 ? session.player2Id : session.player1Id,
      partnerName: isP1 ? player2Name : player1Name,
      myOffer: isP1 ? session.player1Offer : session.player2Offer,
      partnerOffer: isP1 ? session.player2Offer : session.player1Offer,
      stage: session.stage,
      countdownRemainingMs: session.countdownRemainingMs,
    };
  }
}
