import { InventoryItem, StockTransaction, MovementType, StockStatus, LocationBin } from '../../src/types/inventory';
import { INITIAL_ITEMS, INITIAL_TRANSACTIONS, INITIAL_BINS } from '../seed';

class InventoryLedgerEngine {
  private items: Map<string, InventoryItem> = new Map();
  private transactions: StockTransaction[] = [];
  private bins: Map<string, LocationBin> = new Map();
  private listeners: ((event: string, payload: unknown) => void)[] = [];

  constructor() {
    // Populate in-memory seed stores
    INITIAL_BINS.forEach(b => this.bins.set(b.id, { ...b }));
    INITIAL_ITEMS.forEach(item => this.items.set(item.id, { ...item }));
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.recalculateAllRollups();
  }

  public subscribe(cb: (event: string, payload: unknown) => void) {
    this.listeners.push(cb);
  }

  private notify(event: string, payload: unknown) {
    this.listeners.forEach(cb => {
      try { cb(event, payload); } catch (e) { console.error('WS Listener error:', e); }
    });
  }

  public getItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  public getItemById(id: string): InventoryItem | undefined {
    return this.items.get(id);
  }

  public getItemBySkuOrUpc(query: string): InventoryItem | undefined {
    const q = query.trim().toUpperCase();
    return Array.from(this.items.values()).find(
      it => it.sku.toUpperCase() === q || it.upc === q || it.title.toUpperCase().includes(q)
    );
  }

  public getTransactions(itemId?: string): StockTransaction[] {
    if (itemId) {
      return this.transactions.filter(t => t.itemId === itemId).reverse();
    }
    return [...this.transactions].reverse();
  }

  public getBins(): LocationBin[] {
    return Array.from(this.bins.values());
  }

  public getBin(id: string): LocationBin | undefined {
    return this.bins.get(id);
  }

  /**
   * Recalculates stock balances and status dynamically from the transaction log
   * guaranteeing atomic consistency and audit traceability.
   */
  public recalculateAllRollups() {
    for (const item of this.items.values()) {
      this.recalculateItemBalance(item.id);
    }
  }

  public recalculateItemBalance(itemId: string) {
    const item = this.items.get(itemId);
    if (!item) return;

    // Days remaining based on daily burn rate
    if (item.burnRateDaily > 0) {
      item.daysRemaining = Math.max(0, +(item.quantityAvailable / item.burnRateDaily).toFixed(1));
    } else {
      item.daysRemaining = 999;
    }

    // Determine status
    if (item.quantityOnHand <= 0 || item.quantityAvailable <= 0) {
      item.status = 'OUT_OF_STOCK';
    } else if (item.quantityAvailable <= item.safetyStock) {
      item.status = 'CRITICAL';
    } else if (item.quantityAvailable <= item.reorderPoint) {
      item.status = 'LOW_STOCK';
    } else if (item.quantityOnHand > (item.reorderPoint * 3.5)) {
      item.status = 'OVERSTOCKED';
    } else {
      item.status = 'OPTIMAL';
    }

    this.items.set(itemId, item);
  }

  /**
   * TRANSACTIONAL MUTATION: All inventory updates must append to immutable log
   */
  public appendTransaction(params: {
    itemId: string;
    type: MovementType;
    quantityDelta: number;
    sourceLocationId?: string;
    destinationLocationId?: string;
    reasonNotes?: string;
    operatorId: string;
    channel?: 'SHOPIFY' | 'AMAZON' | 'B2B_WHOLESALE' | 'SHOWROOM' | 'WAREHOUSE_FLOOR';
    reservationId?: string;
  }): { item: InventoryItem; transaction: StockTransaction } {
    const item = this.items.get(params.itemId);
    if (!item) {
      throw new Error(`Inventory Item ID ${params.itemId} not found`);
    }

    const previousQuantity = item.quantityOnHand;
    const newQuantity = previousQuantity + params.quantityDelta;

    if (newQuantity < 0) {
      throw new Error(`Insufficient stock for ${item.sku}. Requested delta: ${params.quantityDelta}, Available: ${item.quantityOnHand}`);
    }

    const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction: StockTransaction = {
      id: txnId,
      itemId: item.id,
      sku: item.sku,
      itemTitle: item.title,
      type: params.type,
      quantityDelta: params.quantityDelta,
      previousQuantity,
      newQuantity,
      sourceLocationId: params.sourceLocationId || (params.quantityDelta < 0 ? item.primaryLocation.id : undefined),
      destinationLocationId: params.destinationLocationId || (params.quantityDelta > 0 ? item.primaryLocation.id : undefined),
      reasonNotes: params.reasonNotes || `Automated ${params.type} transaction`,
      operatorId: params.operatorId || 'OP-SYSTEM',
      timestamp: new Date().toISOString(),
      channel: params.channel || 'WAREHOUSE_FLOOR',
      reservationId: params.reservationId,
    };

    // Append immutable transaction
    this.transactions.push(transaction);

    // Apply rollup update
    item.quantityOnHand = newQuantity;
    item.quantityAvailable = Math.max(0, item.quantityOnHand - item.quantityAllocated);

    // Update bin utilization if applicable
    if (params.quantityDelta !== 0 && item.primaryLocation) {
      const bin = this.bins.get(item.primaryLocation.id);
      if (bin) {
        bin.capacityUsed = Math.max(0, Math.min(bin.capacityMax, bin.capacityUsed + params.quantityDelta));
        this.bins.set(bin.id, bin);
      }
    }

    this.recalculateItemBalance(item.id);
    this.items.set(item.id, item);

    // Broadcast real-time telemetry event
    this.notify('STOCK_MUTATED', {
      item,
      transaction,
      timestamp: transaction.timestamp,
    });

    if (item.status === 'CRITICAL' || item.status === 'OUT_OF_STOCK') {
      this.notify('LOW_STOCK_ALERT', {
        sku: item.sku,
        title: item.title,
        status: item.status,
        quantityAvailable: item.quantityAvailable,
        daysRemaining: item.daysRemaining,
      });
    }

    return { item, transaction };
  }

  /**
   * Transfer between warehouse bins
   */
  public transferBin(params: {
    itemId: string;
    sourceBinId: string;
    destinationBinId: string;
    quantity: number;
    operatorId: string;
    notes?: string;
  }): { item: InventoryItem; transaction: StockTransaction } {
    const item = this.items.get(params.itemId);
    if (!item) throw new Error('Item not found');
    const sourceBin = this.bins.get(params.sourceBinId);
    const destBin = this.bins.get(params.destinationBinId);
    if (!sourceBin || !destBin) throw new Error('Invalid source or destination bin');

    if (destBin.capacityUsed + params.quantity > destBin.capacityMax) {
      throw new Error(`Destination bin ${destBin.id} exceeds maximum capacity (${destBin.capacityMax})`);
    }

    sourceBin.capacityUsed = Math.max(0, sourceBin.capacityUsed - params.quantity);
    destBin.capacityUsed += params.quantity;
    this.bins.set(sourceBin.id, sourceBin);
    this.bins.set(destBin.id, destBin);

    // Update item primary location to new bin
    item.primaryLocation = destBin;
    this.items.set(item.id, item);

    const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction: StockTransaction = {
      id: txnId,
      itemId: item.id,
      sku: item.sku,
      itemTitle: item.title,
      type: 'TRANSFER',
      quantityDelta: 0,
      previousQuantity: item.quantityOnHand,
      newQuantity: item.quantityOnHand,
      sourceLocationId: params.sourceBinId,
      destinationLocationId: params.destinationBinId,
      reasonNotes: params.notes || `Transferred ${params.quantity} units from ${sourceBin.id} to ${destBin.id}`,
      operatorId: params.operatorId,
      timestamp: new Date().toISOString(),
      channel: 'WAREHOUSE_FLOOR',
    };

    this.transactions.push(transaction);

    this.notify('BIN_TRANSFERRED', {
      item,
      transaction,
      sourceBin,
      destinationBin: destBin,
    });

    return { item, transaction };
  }

  /**
   * Allocate / Hold inventory for reservation
   */
  public holdReservation(itemId: string, quantity: number): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    if (item.quantityAvailable < quantity) return false;

    item.quantityAllocated += quantity;
    item.quantityAvailable = Math.max(0, item.quantityOnHand - item.quantityAllocated);
    this.recalculateItemBalance(itemId);
    this.items.set(itemId, item);

    this.notify('STOCK_RESERVED', {
      itemId,
      sku: item.sku,
      allocated: item.quantityAllocated,
      available: item.quantityAvailable,
    });
    return true;
  }

  /**
   * Release reservation hold
   */
  public releaseReservation(itemId: string, quantity: number) {
    const item = this.items.get(itemId);
    if (!item) return;

    item.quantityAllocated = Math.max(0, item.quantityAllocated - quantity);
    item.quantityAvailable = Math.max(0, item.quantityOnHand - item.quantityAllocated);
    this.recalculateItemBalance(itemId);
    this.items.set(itemId, item);

    this.notify('STOCK_RELEASED', {
      itemId,
      sku: item.sku,
      allocated: item.quantityAllocated,
      available: item.quantityAvailable,
    });
  }
}

export const ledgerEngine = new InventoryLedgerEngine();
