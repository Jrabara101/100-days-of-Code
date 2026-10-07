import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar, NavTab } from "./components/Sidebar";
import { TableToolbar } from "./components/InventoryGrid/TableToolbar";
import { InventoryTable } from "./components/InventoryGrid/InventoryTable";
import { SkuDetailDrawer } from "./components/SkuDrawer/SkuDetailDrawer";
import { ScanAndStashModal } from "./components/Scanner/ScanAndStashModal";
import { WarehouseSchematic } from "./components/DigitalTwin/WarehouseSchematic";
import { DepletionForecaster } from "./components/Forecaster/DepletionForecaster";
import { SupplierDriftRadar } from "./components/SupplierRadar/SupplierDriftRadar";
import { CycleCountSentry } from "./components/CycleCounting/CycleCountSentry";
import { ChannelReservationLocks } from "./components/ChannelLocks/ChannelReservationLocks";
import { InboundReceiveModal } from "./components/Modals/InboundReceiveModal";
import { TransferModal } from "./components/Modals/TransferModal";
import { QuickAdjustModal } from "./components/Modals/QuickAdjustModal";
import { CommandMenu } from "./components/CommandMenu";

import {
  InventoryItem,
  LocationBin,
  ReservationLock,
  DepletionForecast,
  CycleCountTask,
  StockStatus,
} from "./types/inventory";
import { api } from "./lib/api";
import { exportToCSV, formatCurrency, formatNumber } from "./lib/utils";
import { soundFx } from "./lib/audio";
import {
  Layers,
  MapPin,
  TrendingDown,
  ScanBarcode,
  Compass,
  CheckCircle2,
  Lock,
  Boxes,
  Activity,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

export function App() {
  // Navigation & Modal states
  const [currentTab, setCurrentTab] = useState<NavTab>("live-inventory");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<InventoryItem | null>(null);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Core Data Stores
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [bins, setBins] = useState<LocationBin[]>([]);
  const [locks, setLocks] = useState<ReservationLock[]>([]);
  const [forecasts, setForecasts] = useState<DepletionForecast[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [cycleCounts, setCycleCounts] = useState<CycleCountTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Table Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Load all initial data from backend
  const loadData = useCallback(async () => {
    try {
      const [invData, binData, lockData, forecastData, driftData, ccData] =
        await Promise.all([
          api.getInventory(),
          api.getBins(),
          api.getReservations(),
          api.getForecasts(),
          api.getSupplierDrift(),
          api.getCycleCounts(),
        ]);

      setItems(invData);
      setBins(binData);
      setLocks(lockData);
      setForecasts(forecastData);
      setSuppliers(driftData);
      setCycleCounts(ccData);
    } catch (err) {
      console.error("Error loading inventory data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // WebSocket live synchronization
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Vite proxy handles /ws or direct to port 3005
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsWsConnected(true);
        console.log("[AeroLogix WS] Connected to warehouse telemetry stream");
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          if (type === "STOCK_MUTATED" || type === "BIN_TRANSFERRED") {
            // Re-fetch fresh state or update in-memory
            loadData();
          } else if (type === "STOCK_RESERVED" || type === "LOCK_CREATED" || type === "LOCK_RELEASED") {
            api.getReservations().then(setLocks).catch(console.error);
            api.getInventory().then(setItems).catch(console.error);
          } else if (type === "LOW_STOCK_ALERT") {
            if (soundEnabled) soundFx.playErrorTone();
          }
        } catch (e) {
          console.error("WS Parse Error", e);
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [loadData, soundEnabled]);

  // Global hotkeys (CMD+K, F2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setIsScannerOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter items for Grid view
  const categories = Array.from(new Set(items.map((i) => i.category)));

  const filteredItems = items.filter((item) => {
    if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        item.sku.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.upc.includes(q) ||
        item.primaryLocation.bin.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Bulk row selection toggles
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === filteredItems.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const dataToExport = filteredItems.map((it) => ({
      SKU: it.sku,
      UPC: it.upc,
      Title: it.title,
      Category: it.category,
      QuantityOnHand: it.quantityOnHand,
      QuantityAllocated: it.quantityAllocated,
      QuantityAvailable: it.quantityAvailable,
      BurnRateDaily: it.burnRateDaily,
      DaysRemaining: it.daysRemaining,
      Status: it.status,
      Bin: it.primaryLocation.bin,
      Aisle: it.primaryLocation.aisle,
      Zone: it.primaryLocation.zone,
      CostPriceUSD: it.costPrice,
      SellingPriceUSD: it.sellingPrice,
      TotalValuationUSD: (it.quantityOnHand * it.costPrice).toFixed(2),
      Supplier: it.supplier.name,
      LeadTimeDays: it.supplier.leadTimeDays,
    }));
    exportToCSV(dataToExport, `aerologix_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Metrics for Top Operational Ribbon
  const totalValuation = items.reduce((sum, it) => sum + it.quantityOnHand * it.costPrice, 0);
  const criticalItems = items.filter((it) => it.status === "CRITICAL" || it.status === "OUT_OF_STOCK");
  const totalAvailable = items.reduce((sum, it) => sum + it.quantityAvailable, 0);
  const activeHoldsCount = locks.filter((l) => l.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header */}
      <Header
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenCommand={() => setIsCommandOpen(true)}
        isWsConnected={isWsConnected}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        totalSkus={items.length}
      />

      <div className="flex flex-1">
        {/* Operations Matrix Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          counts={{
            criticalCount: criticalItems.length,
            pendingCycleCounts: cycleCounts.filter((c) => c.status === "PENDING").length,
            activeLocks: activeHoldsCount,
          }}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 lg:p-5 overflow-y-auto space-y-4 max-w-[1600px] w-full">
          {/* Top Operational Control Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
            {/* Metric Tile 1: Total Valuation */}
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="uppercase tracking-wider">Total Valuation [USD]</span>
                <span className="text-cyan-400 font-bold">WH-04</span>
              </div>
              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-xl font-bold text-white tracking-tight">
                  {formatCurrency(totalValuation)}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +2.4%
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>ON-HAND ASSETS: {formatNumber(totalAvailable)} u</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded">
                  AUDITED 06:00
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
            </div>

            {/* Metric Tile 2: Critical Low-Stock Deficit */}
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="uppercase tracking-wider">Critical Low-Stock</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <div className="my-1.5 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-red-400">
                    {criticalItems.length}
                  </span>
                  <span className="text-xs text-zinc-400">SKUS DEFICIT</span>
                </div>
                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 font-bold">
                  AUTO REORDER
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>EST. STOCKOUT: &lt;48 HRS</span>
                <span className="text-red-400 font-semibold">HIGH PRIORITY</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 to-transparent" />
            </div>

            {/* Metric Tile 3: Omnichannel Holds */}
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="uppercase tracking-wider">Omnichannel Holds</span>
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-xl font-bold text-cyan-300">
                  {activeHoldsCount}{" "}
                  <span className="text-xs font-normal text-zinc-400">Carts</span>
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  TTL SYNCED
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>SHOPIFY • AMZN • B2B</span>
                <span className="text-emerald-400">0% OVERSOLD</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
            </div>

            {/* Metric Tile 4: Automation Mesh */}
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="uppercase tracking-wider">Spot-Audit Telemetry</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-xl font-bold text-emerald-400">
                  98.4%{" "}
                  <span className="text-xs font-normal text-zinc-400">Confidence</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  OPTIMAL
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>CYCLE AUDITS: 3 PENDING</span>
                <span className="text-zinc-300">OP-7740 ACTIVE</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent" />
            </div>
          </div>

          {/* Active Tab Viewport */}
          {currentTab === "live-inventory" && (
            <div className="space-y-3">
              <TableToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                totalResults={filteredItems.length}
                onExportCSV={handleExportCSV}
                onOpenReceiveModal={() => setIsReceiveOpen(true)}
                onOpenTransferModal={() => setIsTransferOpen(true)}
                selectedRowCount={selectedRowIds.size}
              />

              <InventoryTable
                items={filteredItems}
                onSelectItem={(item) => setSelectedItemForDrawer(item)}
                onQuickAdjust={(item) => {
                  setSelectedItemForAdjust(item);
                  setIsAdjustOpen(true);
                }}
                onQuickTransfer={(item) => {
                  setSelectedItemForDrawer(item);
                  setIsTransferOpen(true);
                }}
                selectedRowIds={selectedRowIds}
                onToggleSelectRow={handleToggleSelectRow}
                onToggleSelectAll={handleToggleSelectAll}
              />
            </div>
          )}

          {currentTab === "digital-twin" && (
            <WarehouseSchematic
              bins={bins}
              items={items}
              onSelectBinItem={(item) => setSelectedItemForDrawer(item)}
              onOpenTransferModal={() => setIsTransferOpen(true)}
            />
          )}

          {currentTab === "burn-forecaster" && (
            <DepletionForecaster
              forecasts={forecasts}
              items={items}
              onRestockSuccess={loadData}
              onSelectItem={(item) => setSelectedItemForDrawer(item)}
            />
          )}

          {currentTab === "scan-stash" && (
            <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                    <ScanBarcode className="w-5 h-5 text-cyan-400" />
                    Zero-Hardware "Scan & Stash" Mobile Hub
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Launch camera-based barcode scanning reticle with zero specialized hardware.
                  </p>
                </div>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs font-mono shadow-md shadow-cyan-500/20"
                >
                  Open Scanner Terminal (F2)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs pt-2">
                <div className="p-4 rounded bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-cyan-400 font-bold">1. Universal Camera Reticle</span>
                  <p className="text-zinc-400 text-[11px] font-sans">
                    Utilizes HTML5 BarcodeDetector and video stream reticles on any phone, iPad, or laptop.
                  </p>
                </div>
                <div className="p-4 rounded bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-emerald-400 font-bold">2. Packing Slip Matching</span>
                  <p className="text-zinc-400 text-[11px] font-sans">
                    Instantly verifies cartons against supplier PO manifests and flags damaged cartons.
                  </p>
                </div>
                <div className="p-4 rounded bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-amber-400 font-bold">3. Web Audio Laser Beeps</span>
                  <p className="text-zinc-400 text-[11px] font-sans">
                    Zero latency sound effects using Web Audio API synthesis for verified scans and errors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentTab === "supplier-radar" && (
            <SupplierDriftRadar suppliers={suppliers} />
          )}

          {currentTab === "cycle-sentry" && (
            <CycleCountSentry tasks={cycleCounts} onAuditCompleted={loadData} />
          )}

          {currentTab === "channel-locks" && (
            <ChannelReservationLocks
              locks={locks}
              items={items}
              onLocksUpdated={loadData}
            />
          )}
        </main>
      </div>

      {/* Slide-out SKU Details Drawer */}
      <SkuDetailDrawer
        item={selectedItemForDrawer}
        open={Boolean(selectedItemForDrawer)}
        onOpenChange={(open) => !open && setSelectedItemForDrawer(null)}
        onRestockSuccess={loadData}
      />

      {/* Zero-Hardware Scan and Stash Modal */}
      <ScanAndStashModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        items={items}
        onScanSuccess={loadData}
      />

      {/* Global Command Menu (CMD+K / F2) */}
      <CommandMenu
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        items={items}
        onSelectItem={(item) => setSelectedItemForDrawer(item)}
        onSelectTab={setCurrentTab}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Inbound Receive Modal Wizard */}
      <InboundReceiveModal
        open={isReceiveOpen}
        onOpenChange={setIsReceiveOpen}
        items={items}
        onSuccess={loadData}
      />

      {/* Transfer Between Bins Modal */}
      <TransferModal
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        items={items}
        bins={bins}
        initialItem={selectedItemForDrawer}
        onSuccess={loadData}
      />

      {/* Quick Adjust Modal */}
      <QuickAdjustModal
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        item={selectedItemForAdjust}
        onSuccess={loadData}
      />
    </div>
  );
}
export default App;
