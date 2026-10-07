import { DepletionForecast, CycleCountTask } from '../../src/types/inventory';
import { ledgerEngine } from './ledger';
import { INITIAL_SUPPLIERS } from '../seed';

export function calculateDepletionForecasts(): DepletionForecast[] {
  const items = ledgerEngine.getItems();
  const now = new Date();

  return items.map(item => {
    const burn7d = +(item.burnRateDaily * (item.seasonalityFactor || 1.0)).toFixed(1);
    const burn30d = +(item.burnRateDaily * 0.94).toFixed(1);
    const effectiveBurn = Math.max(0.1, burn7d);

    const daysRemaining = +(item.quantityAvailable / effectiveBurn).toFixed(1);
    const stockoutMs = now.getTime() + daysRemaining * 24 * 60 * 60 * 1000;
    const stockoutDate = new Date(stockoutMs).toISOString().split('T')[0];

    // EOQ Formula: sqrt((2 * Demand * OrderCost) / HoldingCost)
    const annualDemand = item.burnRateDaily * 365;
    const S = item.orderCostFixed || 120;
    const H = item.holdingCostPerUnitYear || Math.max(5, item.costPrice * 0.15);
    const rawEOQ = Math.sqrt((2 * annualDemand * S) / H);
    const economicOrderQty = Math.max(10, Math.round(rawEOQ));

    let reorderPriority: 'CRITICAL' | 'ELEVATED' | 'NORMAL' | 'SECURE' = 'NORMAL';
    if (daysRemaining <= (item.supplier.leadTimeDays + 2)) {
      reorderPriority = 'CRITICAL';
    } else if (daysRemaining <= (item.supplier.leadTimeDays + 7)) {
      reorderPriority = 'ELEVATED';
    } else if (daysRemaining > 60) {
      reorderPriority = 'SECURE';
    }

    return {
      sku: item.sku,
      title: item.title,
      currentStock: item.quantityAvailable,
      burnRate7d: burn7d,
      burnRate30d: burn30d,
      daysRemaining: Number(daysRemaining),
      stockoutDate,
      leadTimeDays: item.supplier.leadTimeDays,
      economicOrderQty,
      reorderPriority,
      estimatedRestockCost: +(economicOrderQty * item.costPrice).toFixed(2),
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function getSupplierDriftAnalysis() {
  return INITIAL_SUPPLIERS.map(s => {
    const riskLevel = s.priceDriftPercentage > 10 || s.punctualityScore < 75 ? 'HIGH_RISK'
      : s.priceDriftPercentage > 4 || s.punctualityScore < 88 ? 'MODERATE' : 'HEALTHY';
    
    return {
      ...s,
      riskLevel,
      projectedAnnualCreepLoss: +(s.contractPrice * (s.priceDriftPercentage / 100) * 1200).toFixed(2),
      recommendation: riskLevel === 'HIGH_RISK' 
        ? 'Audit purchase orders & renegotiate contract rates' 
        : riskLevel === 'MODERATE' 
        ? 'Monitor 90-day lead time variance' 
        : 'Preferred vendor benchmark',
    };
  });
}

// In-memory Cycle Count Micro-Audits
let cycleCountTasks: CycleCountTask[] = [
  {
    id: 'CC-001',
    itemId: 'item-001',
    sku: 'AVN-4420-TX',
    title: 'Dual-Band Flight Controller Reticle V4',
    binLocation: 'BIN-A1-01',
    expectedQuantity: 48,
    status: 'PENDING',
    varianceConfidenceInterval: '±1.2% (95% CI)',
    scheduledTime: 'Today 14:00 - High-Velocity Pick Zone Spot-Audit',
    operator: 'OP-7740',
  },
  {
    id: 'CC-002',
    itemId: 'item-002',
    sku: 'RBT-8890-SV',
    title: 'Harmonic Drive Robotic Servo Actuator 35Nm',
    binLocation: 'BIN-B1-01',
    expectedQuantity: 18,
    status: 'PENDING',
    varianceConfidenceInterval: '±3.8% (90% CI)',
    scheduledTime: 'Today 15:30 - Secure Vault High-Value Spot-Check',
    operator: 'OP-7740',
  },
  {
    id: 'CC-003',
    itemId: 'item-006',
    sku: 'FIB-3301-CF',
    title: 'Toray Carbon Fiber Prepreg Roll (100m²)',
    binLocation: 'BIN-D1-02',
    expectedQuantity: 8,
    status: 'DISCREPANCY_FLAGGED',
    discrepancyDelta: -1,
    countedQuantity: 7,
    varianceConfidenceInterval: '±6.5% (High Variance Warning)',
    scheduledTime: 'Yesterday 17:00 - Discrepancy under investigation',
    operator: 'OP-4412',
  },
];

export function getCycleCounts() {
  return cycleCountTasks;
}

export function submitCycleCount(params: {
  taskId: string;
  countedQuantity: number;
  operatorId: string;
  notes?: string;
}) {
  const task = cycleCountTasks.find(t => t.id === params.taskId);
  if (!task) throw new Error('Cycle count task not found');

  const discrepancy = params.countedQuantity - task.expectedQuantity;
  task.countedQuantity = params.countedQuantity;
  task.discrepancyDelta = discrepancy;
  task.status = discrepancy === 0 ? 'VERIFIED' : 'DISCREPANCY_FLAGGED';

  if (discrepancy !== 0) {
    // Record audit adjustment in transactional ledger
    ledgerEngine.appendTransaction({
      itemId: task.itemId,
      type: 'CYCLE_COUNT',
      quantityDelta: discrepancy,
      operatorId: params.operatorId,
      reasonNotes: `Cycle Count micro-audit adjustment: counted ${params.countedQuantity} vs expected ${task.expectedQuantity}. Delta: ${discrepancy}. Notes: ${params.notes || 'Routine audit'}`,
    });
  }

  return task;
}
