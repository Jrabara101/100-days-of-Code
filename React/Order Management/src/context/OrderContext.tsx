import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Order,
  OrderLineItem,
  FulfillmentParcel,
  ReturnAuthorization,
  InventoryLevel,
  OrderAuditEvent,
  CarrierRateOption,
  CarrierType,
  ConditionGrade,
  RmaResolutionType,
} from '../types';
import {
  INITIAL_ORDERS,
  MOCK_WAREHOUSES,
  MOCK_RMAS,
  MOCK_INVENTORY,
  INITIAL_AUDIT_LOGS,
} from '../utils/mockData';
import { audioEngine } from '../utils/audio';
import confetti from 'canvas-confetti';

export type FilterTab =
  | 'all'
  | 'exceptions'
  | 'vip'
  | 'ready_to_ship'
  | 'grace_hold'
  | 'split_shipments'
  | 'in_transit'
  | 'delivered';

export interface OrderContextType {
  orders: Order[];
  selectedOrderId: string | null;
  selectedOrder: Order | null;
  activeFilterTab: FilterTab;
  setActiveFilterTab: (tab: FilterTab) => void;
  selectedWarehouseId: string; // 'all' or specific node
  setSelectedWarehouseId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  // High density table keyboard focus & selection
  keyboardFocusedIndex: number;
  setKeyboardFocusedIndex: (idx: number | ((prev: number) => number)) => void;
  selectedRowIds: Set<string>;
  toggleSelectRow: (id: string) => void;
  selectAllRows: (select: boolean) => void;
  clearRowSelection: () => void;

  // Inspector & Modals
  openOrderInspector: (orderId: string) => void;
  closeOrderInspector: () => void;
  
  // Split Fulfillment
  isSplitModalOpen: boolean;
  orderToSplit: Order | null;
  openSplitModal: (order: Order) => void;
  closeSplitModal: () => void;
  executeOrderSplit: (
    orderId: string,
    parcelAItems: { itemId: string; qty: number }[],
    parcelBItems: { itemId: string; qty: number }[],
    parcelBWarehouseId: string,
    parcelBRestockDate?: string
  ) => void;

  // Scan-to-Pack Station Mode
  isPackStationOpen: boolean;
  packStationOrderId: string | null;
  openPackStation: (orderId: string) => void;
  closePackStation: () => void;
  handlePackBarcodeScan: (barcodeOrSku: string) => { success: boolean; message: string };
  updateSelectedCarrierRate: (rate: CarrierRateOption) => void;
  activeCarrierRate: CarrierRateOption;
  purchaseLabelAndPrint: () => void;
  isPrintingLabel: boolean;
  lastPurchasedLabelUrl: string | null;

  // Wave Picking Modal
  isWaveModalOpen: boolean;
  openWaveModal: (orderIds?: string[]) => void;
  closeWaveModal: () => void;
  executeBatchWave: () => void;

  // Command Palette & Keyboard Guide Modals
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isKeyboardGuideOpen: boolean;
  setIsKeyboardGuideOpen: (open: boolean) => void;
  isThermalLabelModalOpen: boolean;
  setIsThermalLabelModalOpen: (open: boolean) => void;
  thermalLabelData: { order: Order; parcel: FulfillmentParcel; carrier: string } | null;
  showThermalLabel: (order: Order, parcel: FulfillmentParcel) => void;

  // Operational Action Handlers
  healAddressWithUsps: (orderId: string) => void;
  releaseGraceHoldNow: (orderId: string) => void;
  approveFraudHold: (orderId: string) => void;
  issueCxStalledCredit: (orderId: string) => void;
  placeOrderOnHold: (orderId: string, reason: string) => void;

  // Returns / RMAs
  rmas: ReturnAuthorization[];
  selectedRmaId: string | null;
  setSelectedRmaId: (id: string | null) => void;
  gradeRmaCondition: (rmaId: string, grade: ConditionGrade, restockNodeId: string) => void;
  resolveRmaWithKeepItem: (rmaId: string) => void;

  // Inventory
  inventory: InventoryLevel[];

  // Audit Log
  auditEvents: OrderAuditEvent[];
  getOrderAuditEvents: (orderId: string) => OrderAuditEvent[];

  // Global settings
  soundEnabled: boolean;
  toggleSound: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = 'dispatch_core_orders_v1';

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ORDERS;
  });

  const [rmas, setRmas] = useState<ReturnAuthorization[]>(MOCK_RMAS);
  const [selectedRmaId, setSelectedRmaId] = useState<string | null>(MOCK_RMAS[0].id);
  const [inventory, setInventory] = useState<InventoryLevel[]>(MOCK_INVENTORY);
  const [auditEvents, setAuditEvents] = useState<OrderAuditEvent[]>(INITIAL_AUDIT_LOGS);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [keyboardFocusedIndex, setKeyboardFocusedIndex] = useState<number>(0);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [orderToSplit, setOrderToSplit] = useState<Order | null>(null);
  const [isPackStationOpen, setIsPackStationOpen] = useState<boolean>(false);
  const [packStationOrderId, setPackStationOrderId] = useState<string | null>(null);
  const [isWaveModalOpen, setIsWaveModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isKeyboardGuideOpen, setIsKeyboardGuideOpen] = useState<boolean>(false);
  const [isThermalLabelModalOpen, setIsThermalLabelModalOpen] = useState<boolean>(false);
  const [thermalLabelData, setThermalLabelData] = useState<{ order: Order; parcel: FulfillmentParcel; carrier: string } | null>(null);

  // Sound & Dark mode
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || true;
    }
    return true;
  });

  // Carrier rate active in pack station
  const [activeCarrierRate, setActiveCarrierRate] = useState<CarrierRateOption>({
    carrier: 'usps',
    service_level: 'Ground Advantage',
    transit_days: 2,
    estimated_delivery_date: 'Thu, Nov 5',
    rate_cents: 645,
    is_optimal_margin: true,
    savings_vs_default_cents: 295,
  });
  const [isPrintingLabel, setIsPrintingLabel] = useState<boolean>(false);
  const [lastPurchasedLabelUrl, setLastPurchasedLabelUrl] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  // Sync dark mode class to html
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioEngine.setSoundEnabled(next);
  };

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const addAuditEvent = (orderId: string, actor: 'system_router' | 'operator' | 'carrier_webhook' | 'customer', summary: string, eventType: string = 'OPERATION') => {
    const newEvent: OrderAuditEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: orderId,
      actor_type: actor,
      actor_name: actor === 'operator' ? 'Alex R. (Ops Dispatcher)' : 'Automated Routing Engine',
      event_type: eventType,
      summary,
      created_at: new Date().toISOString(),
    };
    setAuditEvents((prev) => [newEvent, ...prev]);
  };

  const openOrderInspector = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const closeOrderInspector = () => {
    setSelectedOrderId(null);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllRows = (select: boolean) => {
    if (select) {
      setSelectedRowIds(new Set(orders.map((o) => o.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const clearRowSelection = () => {
    setSelectedRowIds(new Set());
  };

  // 1-Click USPS Address Healing
  const healAddressWithUsps = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId || !ord.address_suggestion) return ord;
        const verified = ord.address_suggestion.suggested;
        return {
          ...ord,
          shipping_address: verified,
          address_validation_status: 'verified',
          order_status: ord.order_status === 'on_hold_exception' ? 'ready_to_fulfill' : ord.order_status,
          exception_code: ord.exception_code === 'invalid_address' ? 'none' : ord.exception_code,
          exception_details: undefined,
        };
      })
    );
    addAuditEvent(orderId, 'operator', 'Applied verified USPS standardized address format & released exception hold', 'ADDRESS_HEALED');
    audioEngine.playScanSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#3B82F6', '#8B5CF6'],
    });
  };

  // Customer 15-Minute Grace Window Release
  const releaseGraceHoldNow = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          order_status: 'ready_to_fulfill',
          grace_period_ends_at: undefined,
        };
      })
    );
    addAuditEvent(orderId, 'operator', 'Manual grace period override: Released directly to warehouse floor for wave picking', 'GRACE_OVERRIDE');
    audioEngine.playScanSuccess();
  };

  // Fraud Review Fast-Track
  const approveFraudHold = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          order_status: 'ready_to_fulfill',
          exception_code: 'none',
          exception_details: undefined,
          is_vip: true,
        };
      })
    );
    addAuditEvent(orderId, 'operator', 'Approved manual KYC fraud check & elevated buyer to VIP tier', 'FRAUD_CLEARED');
    audioEngine.playScanSuccess();
  };

  // Proactive CX Credit for Stalled Carrier
  const issueCxStalledCredit = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          exception_details: 'CX proactive outreach sent: $15 courtesy store credit issued for carrier transit stall',
        };
      })
    );
    addAuditEvent(orderId, 'operator', 'Sent proactive CX notification with $15.00 store credit to buyer regarding UPS weather delay', 'CX_CREDIT_ISSUED');
    audioEngine.playScanSuccess();
  };

  // Place on hold
  const placeOrderOnHold = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          order_status: 'on_hold_exception',
          exception_code: 'fraud_review',
          exception_details: reason,
        };
      })
    );
    addAuditEvent(orderId, 'operator', `Order manually placed on operational hold: ${reason}`, 'MANUAL_HOLD');
  };

  // Split fulfillment modal
  const openSplitModal = (order: Order) => {
    setOrderToSplit(order);
    setIsSplitModalOpen(true);
  };

  const closeSplitModal = () => {
    setIsSplitModalOpen(false);
    setOrderToSplit(null);
  };

  const executeOrderSplit = (
    orderId: string,
    parcelAItems: { itemId: string; qty: number }[],
    parcelBItems: { itemId: string; qty: number }[],
    parcelBWarehouseId: string,
    parcelBRestockDate?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const warehouseB = MOCK_WAREHOUSES.find((w) => w.id === parcelBWarehouseId) || MOCK_WAREHOUSES[1];

        const parcelA: FulfillmentParcel = {
          id: `ful-${Date.now()}-A`,
          fulfillment_number: `${ord.order_number}-F1`,
          order_id: ord.id,
          warehouse_id: ord.allocated_warehouse_id,
          warehouse_name: ord.allocated_warehouse_id.includes('austin') ? 'Austin-3PL' : 'LA-West',
          status: 'queued_for_wave',
          carrier: 'usps',
          service_level: 'Ground Advantage',
          label_cost_cents: 645,
          recommended_box_code: 'Box #B1',
          estimated_delivery_date: '2026-11-04',
          item_ids: parcelAItems.map((i) => i.itemId),
        };

        const parcelB: FulfillmentParcel = {
          id: `ful-${Date.now()}-B`,
          fulfillment_number: `${ord.order_number}-F2`,
          order_id: ord.id,
          warehouse_id: warehouseB.id,
          warehouse_name: warehouseB.code,
          status: parcelBRestockDate ? 'queued_for_wave' : 'queued_for_wave',
          carrier: 'ups',
          service_level: 'Ground Commercial',
          label_cost_cents: 780,
          recommended_box_code: 'Box #B1',
          estimated_delivery_date: parcelBRestockDate ? '2026-11-16' : '2026-11-06',
          item_ids: parcelBItems.map((i) => i.itemId),
          is_backordered: Boolean(parcelBRestockDate),
          backorder_restock_date: parcelBRestockDate,
        };

        return {
          ...ord,
          order_status: 'partially_fulfilled',
          fulfillments: [parcelA, parcelB],
          routing_logic_explanation: `Split Fulfillment: Parcel A fulfilled immediately; Parcel B rerouted to ${warehouseB.name}${parcelBRestockDate ? ` (Hold for ${parcelBRestockDate})` : ''}`,
        };
      })
    );

    addAuditEvent(
      orderId,
      'operator',
      `Partitioned line items into Parcel A (Immediate) and Parcel B (Node: ${parcelBWarehouseId})`,
      'ORDER_SPLIT'
    );
    closeSplitModal();
    audioEngine.playScanSuccess();
  };

  // Scan-to-Pack Station Mode
  const openPackStation = (orderId: string) => {
    setPackStationOrderId(orderId);
    setIsPackStationOpen(true);
  };

  const closePackStation = () => {
    setIsPackStationOpen(false);
    setPackStationOrderId(null);
  };

  const handlePackBarcodeScan = (barcodeOrSku: string): { success: boolean; message: string } => {
    if (!packStationOrderId) return { success: false, message: 'No active pack order' };

    const cleanInput = barcodeOrSku.trim().toUpperCase();
    let matchedItem: OrderLineItem | null = null;
    let orderTarget: Order | null = null;

    for (const ord of orders) {
      if (ord.id === packStationOrderId) {
        orderTarget = ord;
        for (const item of ord.line_items) {
          if (item.sku.toUpperCase() === cleanInput || item.id === cleanInput || cleanInput.includes(item.sku.slice(0, 8))) {
            matchedItem = item;
            break;
          }
        }
      }
    }

    if (!matchedItem || !orderTarget) {
      audioEngine.playScanError();
      return {
        success: false,
        message: `Barcode "${cleanInput}" does not match any SKU in Order ${orderTarget?.order_number || ''}`,
      };
    }

    // Increment scanned counter
    const currentScanned = matchedItem.scanned_qty || 0;
    if (currentScanned >= matchedItem.quantity_ordered) {
      audioEngine.playScanSuccess();
      return {
        success: true,
        message: `${matchedItem.sku} is already 100% verified (${matchedItem.quantity_ordered}/${matchedItem.quantity_ordered})`,
      };
    }

    const nextScanned = currentScanned + 1;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== packStationOrderId) return ord;
        const updatedItems = ord.line_items.map((item) => {
          if (item.id === matchedItem!.id) {
            return { ...item, scanned_qty: nextScanned };
          }
          return item;
        });

        const allPacked = updatedItems.every((i) => (i.scanned_qty || 0) >= i.quantity_ordered);

        return {
          ...ord,
          line_items: updatedItems,
          order_status: allPacked ? 'fulfilled' : ord.order_status,
        };
      })
    );

    audioEngine.playScanSuccess();

    // Check if entire order is now packed!
    const allItemsPackedNow = orderTarget.line_items.every((i) => {
      if (i.id === matchedItem!.id) {
        return nextScanned >= i.quantity_ordered;
      }
      return (i.scanned_qty || 0) >= i.quantity_ordered;
    });

    if (allItemsPackedNow) {
      setTimeout(() => {
        audioEngine.playOrderComplete();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#F59E0B'],
        });
      }, 200);
    }

    return {
      success: true,
      message: `Verified: ${matchedItem.title} (${nextScanned}/${matchedItem.quantity_ordered})`,
    };
  };

  const updateSelectedCarrierRate = (rate: CarrierRateOption) => {
    setActiveCarrierRate(rate);
  };

  const purchaseLabelAndPrint = () => {
    if (!packStationOrderId) return;
    setIsPrintingLabel(true);
    audioEngine.playPrintSound();

    setTimeout(() => {
      const generatedTracking = `94001118995629${Math.floor(10000000 + Math.random() * 90000000)}`;
      const labelUrl = `https://labels.dispatchcore.internal/${generatedTracking}.pdf`;
      setLastPurchasedLabelUrl(labelUrl);

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== packStationOrderId) return ord;
          const updatedFulfillments = ord.fulfillments.map((f, idx) => {
            if (idx === 0) {
              return {
                ...f,
                status: 'label_purchased' as const,
                carrier: activeCarrierRate.carrier,
                service_level: activeCarrierRate.service_level,
                tracking_number: generatedTracking,
                label_url: labelUrl,
                label_cost_cents: activeCarrierRate.rate_cents,
              };
            }
            return f;
          });
          return {
            ...ord,
            order_status: 'fulfilled',
            fulfillments: updatedFulfillments,
          };
        })
      );

      addAuditEvent(
        packStationOrderId,
        'operator',
        `Purchased ${activeCarrierRate.carrier.toUpperCase()} ${activeCarrierRate.service_level} label (${generatedTracking}) at rate $${(activeCarrierRate.rate_cents / 100).toFixed(2)}`,
        'LABEL_PURCHASED'
      );

      setIsPrintingLabel(false);
      audioEngine.playOrderComplete();
    }, 1200);
  };

  // Wave Picking Modal
  const openWaveModal = (orderIds?: string[]) => {
    if (orderIds && orderIds.length > 0) {
      setSelectedRowIds(new Set(orderIds));
    }
    setIsWaveModalOpen(true);
  };

  const closeWaveModal = () => {
    setIsWaveModalOpen(false);
  };

  const executeBatchWave = () => {
    const selectedCount = selectedRowIds.size || 1;
    setOrders((prev) =>
      prev.map((ord) => {
        if (selectedRowIds.has(ord.id) || ord.order_status === 'ready_to_fulfill') {
          return {
            ...ord,
            order_status: 'fulfilled',
            fulfillments: ord.fulfillments.map((f) => ({
              ...f,
              status: 'label_purchased' as const,
              tracking_number: f.tracking_number || `94001118995629${Math.floor(10000000 + Math.random() * 90000000)}`,
            })),
          };
        }
        return ord;
      })
    );

    clearRowSelection();
    closeWaveModal();
    audioEngine.playOrderComplete();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  const showThermalLabel = (order: Order, parcel: FulfillmentParcel) => {
    setThermalLabelData({
      order,
      parcel,
      carrier: parcel.carrier.toUpperCase(),
    });
    setIsThermalLabelModalOpen(true);
  };

  // RMA Condition Grading
  const gradeRmaCondition = (rmaId: string, grade: ConditionGrade, restockNodeId: string) => {
    setRmas((prev) =>
      prev.map((r) => {
        if (r.id !== rmaId) return r;
        return {
          ...r,
          condition_grade: grade,
          status: 'received_graded',
          inspected_at: new Date().toISOString(),
          dock_operator: 'Current Dock Operator',
        };
      })
    );

    // If Grade A, auto increment available stock
    if (grade === 'grade_a_restock') {
      setInventory((prev) =>
        prev.map((inv) => {
          return {
            ...inv,
            on_hand_qty: inv.on_hand_qty + 1,
            available_qty: inv.available_qty + 1,
          };
        })
      );
    }

    audioEngine.playScanSuccess();
  };

  const resolveRmaWithKeepItem = (rmaId: string) => {
    setRmas((prev) =>
      prev.map((r) => {
        if (r.id !== rmaId) return r;
        return {
          ...r,
          resolution_type: 'keep_item_credit',
          status: 'completed',
          economizer_savings_cents: 350,
        };
      })
    );
    audioEngine.playScanSuccess();
    confetti({
      particleCount: 40,
      spread: 50,
      colors: ['#10B981', '#F59E0B'],
    });
  };

  const getOrderAuditEvents = (orderId: string) => {
    return auditEvents.filter((e) => e.order_id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        selectedOrderId,
        selectedOrder,
        activeFilterTab,
        setActiveFilterTab,
        selectedWarehouseId,
        setSelectedWarehouseId,
        searchQuery,
        setSearchQuery,
        keyboardFocusedIndex,
        setKeyboardFocusedIndex,
        selectedRowIds,
        toggleSelectRow,
        selectAllRows,
        clearRowSelection,
        openOrderInspector,
        closeOrderInspector,
        isSplitModalOpen,
        orderToSplit,
        openSplitModal,
        closeSplitModal,
        executeOrderSplit,
        isPackStationOpen,
        packStationOrderId,
        openPackStation,
        closePackStation,
        handlePackBarcodeScan,
        updateSelectedCarrierRate,
        activeCarrierRate,
        purchaseLabelAndPrint,
        isPrintingLabel,
        lastPurchasedLabelUrl,
        isWaveModalOpen,
        openWaveModal,
        closeWaveModal,
        executeBatchWave,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isKeyboardGuideOpen,
        setIsKeyboardGuideOpen,
        isThermalLabelModalOpen,
        setIsThermalLabelModalOpen,
        thermalLabelData,
        showThermalLabel,
        healAddressWithUsps,
        releaseGraceHoldNow,
        approveFraudHold,
        issueCxStalledCredit,
        placeOrderOnHold,
        rmas,
        selectedRmaId,
        setSelectedRmaId,
        gradeRmaCondition,
        resolveRmaWithKeepItem,
        inventory,
        auditEvents,
        getOrderAuditEvents,
        soundEnabled,
        toggleSound,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within an OrderProvider');
  return ctx;
};

