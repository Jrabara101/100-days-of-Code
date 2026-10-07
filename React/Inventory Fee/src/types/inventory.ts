export type StockStatus = 'OPTIMAL' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK' | 'OVERSTOCKED';
export type MovementType = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'CYCLE_COUNT' | 'SCRAP' | 'RESERVATION_HOLD' | 'RESERVATION_RELEASE';

export interface LocationBin {
  id: string;
  warehouseId: string;
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
  capacityMax: number;
  capacityUsed: number;
  temperatureZone?: 'AMBIENT' | 'COLD_CHAIN' | 'HAZMAT' | 'SECURE_VAULT';
}

export interface Supplier {
  id: string;
  name: string;
  leadTimeDays: number;
  punctualityScore: number; // 0 - 100
  defectRatePercentage: number;
  contractPrice: number;
  latestPrice: number;
  priceDriftPercentage: number;
  category: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  upc: string;
  title: string;
  category: string;
  unitOfMeasure: 'pcs' | 'boxes' | 'kg' | 'liters';
  costPrice: number;
  sellingPrice: number;
  quantityOnHand: number;
  quantityAllocated: number; // Reserved in active carts/orders
  quantityAvailable: number; // onHand - allocated
  safetyStock: number;
  reorderPoint: number;
  burnRateDaily: number;
  daysRemaining: number;
  status: StockStatus;
  primaryLocation: LocationBin;
  supplier: {
    id: string;
    name: string;
    leadTimeDays: number;
  };
  holdingCostPerUnitYear?: number;
  orderCostFixed?: number;
  suggestedEOQ?: number;
  seasonalityFactor?: number;
  lastAuditedAt?: string;
  varianceHistory?: number[];
}

export interface StockTransaction {
  id: string;
  itemId: string;
  sku?: string;
  itemTitle?: string;
  type: MovementType;
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  sourceLocationId?: string;
  destinationLocationId?: string;
  reasonNotes?: string;
  operatorId: string;
  timestamp: string;
  channel?: 'SHOPIFY' | 'AMAZON' | 'B2B_WHOLESALE' | 'SHOWROOM' | 'WAREHOUSE_FLOOR';
  reservationId?: string;
}

export interface ReservationLock {
  id: string;
  itemId: string;
  sku: string;
  quantity: number;
  channel: 'SHOPIFY' | 'AMAZON' | 'B2B_WHOLESALE' | 'SHOWROOM';
  orderRef: string;
  expiresAt: string; // ISO string
  createdAt: string;
  status: 'ACTIVE' | 'COMMITTED' | 'EXPIRED' | 'CANCELLED';
}

export interface CycleCountTask {
  id: string;
  itemId: string;
  sku: string;
  title: string;
  binLocation: string;
  expectedQuantity: number;
  countedQuantity?: number;
  status: 'PENDING' | 'VERIFIED' | 'DISCREPANCY_FLAGGED';
  discrepancyDelta?: number;
  varianceConfidenceInterval?: string;
  scheduledTime: string;
  operator?: string;
}

export interface DepletionForecast {
  sku: string;
  title: string;
  currentStock: number;
  burnRate7d: number;
  burnRate30d: number;
  daysRemaining: number;
  stockoutDate: string;
  leadTimeDays: number;
  economicOrderQty: number;
  reorderPriority: 'CRITICAL' | 'ELEVATED' | 'NORMAL' | 'SECURE';
  estimatedRestockCost: number;
}
