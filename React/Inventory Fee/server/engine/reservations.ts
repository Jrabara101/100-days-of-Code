import { ReservationLock } from '../../src/types/inventory';
import { ledgerEngine } from './ledger';

class ReservationLockEngine {
  private locks: Map<string, ReservationLock> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private listeners: ((event: string, payload: unknown) => void)[] = [];

  constructor() {
    // Seed initial active locks across channels to showcase multi-channel stock pooling
    this.createLock({
      itemId: 'item-003',
      sku: 'PWR-6620-BT',
      quantity: 18,
      channel: 'SHOPIFY',
      orderRef: 'CART-SHOP-99120',
      ttlMinutes: 15,
    });

    this.createLock({
      itemId: 'item-004',
      sku: 'CHS-1090-TI',
      quantity: 12,
      channel: 'AMAZON',
      orderRef: 'AMZN-CHCK-4401',
      ttlMinutes: 12,
    });

    this.createLock({
      itemId: 'item-007',
      sku: 'SNS-2022-IMU',
      quantity: 15,
      channel: 'B2B_WHOLESALE',
      orderRef: 'B2B-PO-HOLD-88',
      ttlMinutes: 30,
    });

    // Run active TTL sweep every 5 seconds
    this.cleanupInterval = setInterval(() => {
      this.sweepExpiredLocks();
    }, 5000);
  }

  public subscribe(cb: (event: string, payload: unknown) => void) {
    this.listeners.push(cb);
  }

  private notify(event: string, payload: unknown) {
    this.listeners.forEach(cb => {
      try { cb(event, payload); } catch (e) { console.error('WS Lock Listener error:', e); }
    });
  }

  public getActiveLocks(): ReservationLock[] {
    return Array.from(this.locks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createLock(params: {
    itemId: string;
    sku: string;
    quantity: number;
    channel: 'SHOPIFY' | 'AMAZON' | 'B2B_WHOLESALE' | 'SHOWROOM';
    orderRef: string;
    ttlMinutes?: number;
  }): ReservationLock {
    const ttl = params.ttlMinutes || 15;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
    const id = `LOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const success = ledgerEngine.holdReservation(params.itemId, params.quantity);
    if (!success) {
      throw new Error(`Unable to place hold for ${params.sku}: Insufficient unallocated stock.`);
    }

    const lock: ReservationLock = {
      id,
      itemId: params.itemId,
      sku: params.sku,
      quantity: params.quantity,
      channel: params.channel,
      orderRef: params.orderRef,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'ACTIVE',
    };

    this.locks.set(id, lock);

    this.notify('LOCK_CREATED', lock);
    return lock;
  }

  public commitLock(lockId: string, operatorId = 'OP-CHECKOUT'): ReservationLock {
    const lock = this.locks.get(lockId);
    if (!lock || lock.status !== 'ACTIVE') {
      throw new Error('Lock is invalid or already resolved');
    }

    // Convert hold into permanent OUTBOUND pick
    ledgerEngine.releaseReservation(lock.itemId, lock.quantity);
    ledgerEngine.appendTransaction({
      itemId: lock.itemId,
      type: 'OUTBOUND',
      quantityDelta: -lock.quantity,
      operatorId,
      reasonNotes: `Order committed from reservation lock ${lock.orderRef} via ${lock.channel}`,
      channel: lock.channel,
      reservationId: lock.id,
    });

    lock.status = 'COMMITTED';
    this.locks.set(lockId, lock);
    this.notify('LOCK_COMMITTED', lock);
    return lock;
  }

  public releaseLock(lockId: string, reason = 'EXPIRED'): ReservationLock {
    const lock = this.locks.get(lockId);
    if (!lock || lock.status !== 'ACTIVE') {
      throw new Error('Lock is not active');
    }

    ledgerEngine.releaseReservation(lock.itemId, lock.quantity);
    lock.status = reason === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED';
    this.locks.set(lockId, lock);

    this.notify('LOCK_RELEASED', { lock, reason });
    return lock;
  }

  private sweepExpiredLocks() {
    const now = Date.now();
    for (const lock of this.locks.values()) {
      if (lock.status === 'ACTIVE' && new Date(lock.expiresAt).getTime() <= now) {
        console.log(`[TTL Engine] Expiring checkout hold ${lock.id} (${lock.sku} x${lock.quantity})`);
        this.releaseLock(lock.id, 'EXPIRED');
      }
    }
  }

  public destroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }
}

export const reservationEngine = new ReservationLockEngine();
