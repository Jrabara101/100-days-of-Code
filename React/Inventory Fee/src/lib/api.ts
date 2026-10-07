import { InventoryItem, StockTransaction, LocationBin, ReservationLock, DepletionForecast, CycleCountTask } from '../types/inventory';

const BASE_URL = '/api';

export const api = {
  // Get all inventory with search, status, and category
  async getInventory(params?: { q?: string; status?: string; category?: string }): Promise<InventoryItem[]> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);

    const res = await fetch(`${BASE_URL}/inventory?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    const json = await res.json();
    return json.data;
  },

  // Get single SKU telemetry
  async getItemDetails(id: string): Promise<{
    item: InventoryItem;
    history: StockTransaction[];
    forecast?: DepletionForecast;
  }> {
    const res = await fetch(`${BASE_URL}/inventory/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch item details');
    const json = await res.json();
    return json.data;
  },

  // Inbound receive shipment
  async receiveShipment(payload: {
    itemId: string;
    quantity: number;
    poNumber: string;
    operatorId: string;
    notes?: string;
  }): Promise<{ item: InventoryItem; transaction: StockTransaction }> {
    const res = await fetch(`${BASE_URL}/inventory/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to receive shipment');
    }
    const json = await res.json();
    return json.data;
  },

  // Stock adjustment (Audit, scrap, shrinkage)
  async adjustStock(payload: {
    itemId: string;
    delta: number;
    reasonType: 'CYCLE_COUNT' | 'SCRAP' | 'OUTBOUND';
    notes: string;
    operatorId: string;
  }): Promise<{ item: InventoryItem; transaction: StockTransaction }> {
    const res = await fetch(`${BASE_URL}/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to adjust stock');
    }
    const json = await res.json();
    return json.data;
  },

  // Transfer between bins
  async transferBin(payload: {
    itemId: string;
    sourceBinId: string;
    destinationBinId: string;
    quantity: number;
    operatorId: string;
    notes?: string;
  }): Promise<{ item: InventoryItem; transaction: StockTransaction }> {
    const res = await fetch(`${BASE_URL}/inventory/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to transfer bin');
    }
    const json = await res.json();
    return json.data;
  },

  // Get Bins
  async getBins(): Promise<LocationBin[]> {
    const res = await fetch(`${BASE_URL}/inventory/bins`);
    if (!res.ok) throw new Error('Failed to fetch bins');
    const json = await res.json();
    return json.data;
  },

  // Get active reservation locks
  async getReservations(): Promise<ReservationLock[]> {
    const res = await fetch(`${BASE_URL}/reservations`);
    if (!res.ok) throw new Error('Failed to fetch reservations');
    const json = await res.json();
    return json.data;
  },

  // Create reservation lock
  async createReservation(payload: {
    itemId: string;
    sku: string;
    quantity: number;
    channel: 'SHOPIFY' | 'AMAZON' | 'B2B_WHOLESALE' | 'SHOWROOM';
    orderRef: string;
    ttlMinutes?: number;
  }): Promise<ReservationLock> {
    const res = await fetch(`${BASE_URL}/inventory/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to place reservation lock');
    }
    const json = await res.json();
    return json.data;
  },

  // Commit reservation lock into outbound pick
  async commitReservation(lockId: string, operatorId?: string): Promise<ReservationLock> {
    const res = await fetch(`${BASE_URL}/inventory/commit-reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lockId, operatorId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to commit reservation');
    }
    const json = await res.json();
    return json.data;
  },

  // Release reservation lock
  async releaseReservation(lockId: string, reason?: string): Promise<ReservationLock> {
    const res = await fetch(`${BASE_URL}/inventory/release-reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lockId, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to release reservation');
    }
    const json = await res.json();
    return json.data;
  },

  // Depletion Forecasts
  async getForecasts(): Promise<DepletionForecast[]> {
    const res = await fetch(`${BASE_URL}/analytics/forecast`);
    if (!res.ok) throw new Error('Failed to fetch forecasts');
    const json = await res.json();
    return json.data;
  },

  // Supplier Drift
  async getSupplierDrift(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/suppliers/drift`);
    if (!res.ok) throw new Error('Failed to fetch supplier drift');
    const json = await res.json();
    return json.data;
  },

  // Cycle Counts
  async getCycleCounts(): Promise<CycleCountTask[]> {
    const res = await fetch(`${BASE_URL}/cycle-count`);
    if (!res.ok) throw new Error('Failed to fetch cycle counts');
    const json = await res.json();
    return json.data;
  },

  // Submit Cycle Count
  async submitCycleCount(payload: {
    taskId: string;
    countedQuantity: number;
    operatorId: string;
    notes?: string;
  }): Promise<CycleCountTask> {
    const res = await fetch(`${BASE_URL}/cycle-count/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to submit cycle count');
    }
    const json = await res.json();
    return json.data;
  },

  // Warehouse Digital Twin
  async getWarehouseDigitalTwin(): Promise<any> {
    const res = await fetch(`${BASE_URL}/warehouse/digital-twin`);
    if (!res.ok) throw new Error('Failed to fetch digital twin');
    const json = await res.json();
    return json.data;
  },
};
