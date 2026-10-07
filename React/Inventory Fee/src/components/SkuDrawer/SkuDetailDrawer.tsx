import React, { useState, useEffect } from "react";
import {
  Clock,
  Flame,
  TrendingDown,
  Truck,
  Layers,
  History,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ShieldAlert,
} from "lucide-react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { InventoryItem, StockTransaction, DepletionForecast } from "@/types/inventory";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, getStatusBadgeConfig } from "@/lib/utils";

interface SkuDetailDrawerProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestockSuccess: () => void;
}

export function SkuDetailDrawer({
  item,
  open,
  onOpenChange,
  onRestockSuccess,
}: SkuDetailDrawerProps) {
  const [history, setHistory] = useState<StockTransaction[]>([]);
  const [forecast, setForecast] = useState<DepletionForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restockSuccessMsg, setRestockSuccessMsg] = useState("");

  useEffect(() => {
    if (item && open) {
      setLoading(true);
      api
        .getItemDetails(item.id)
        .then((data) => {
          setHistory(data.history);
          if (data.forecast) {
            setForecast(data.forecast);
            setRestockQty(data.forecast.economicOrderQty || 50);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [item, open]);

  if (!item) return null;

  const statusConfig = getStatusBadgeConfig(item.status);
  const marginPercent = ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100;

  const handleCreateRestockPO = async () => {
    try {
      setIsSubmitting(true);
      await api.receiveShipment({
        itemId: item.id,
        quantity: restockQty,
        poNumber: `PO-AUTO-${Date.now().toString().slice(-4)}`,
        operatorId: "OP-TACTICIAN",
        notes: `Automated EOQ restock order generated via SKU Drawer (${restockQty} units)`,
      });
      setRestockSuccessMsg(`Restocked +${restockQty} units successfully!`);
      setTimeout(() => setRestockSuccessMsg(""), 4000);
      onRestockSuccess();
      // Reload history
      const updated = await api.getItemDetails(item.id);
      setHistory(updated.history);
    } catch (err: any) {
      alert(`Restock failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`${item.sku} - Telemetry`}
      description={item.title}
      width="max-w-2xl"
    >
      {/* Top Banner Status */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
        <div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase">
            Current Operational State
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            <span className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Bin {item.primaryLocation.bin} ({item.primaryLocation.zone})
            </span>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-xs text-zinc-400">Days of Inventory Left</div>
          <div className="text-lg font-bold text-cyan-300">
            {item.daysRemaining} Days
          </div>
        </div>
      </div>

      {/* Stock Balances 3-way split */}
      <div className="grid grid-cols-3 gap-2.5 font-mono">
        <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800">
          <div className="text-[10px] text-zinc-400 uppercase">On Hand</div>
          <div className="text-lg font-bold text-zinc-100 mt-0.5">
            {formatNumber(item.quantityOnHand)}{" "}
            <span className="text-xs font-normal text-zinc-400">{item.unitOfMeasure}</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            Physical Warehouse
          </div>
        </div>

        <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800">
          <div className="text-[10px] text-amber-400 uppercase flex items-center gap-1">
            <span>Allocated</span>
          </div>
          <div className="text-lg font-bold text-amber-300 mt-0.5">
            {formatNumber(item.quantityAllocated)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            Active Cart TTL Holds
          </div>
        </div>

        <div className="p-3 rounded bg-zinc-900/80 border border-cyan-500/30 bg-cyan-950/20">
          <div className="text-[10px] text-cyan-300 uppercase">Available to Sell</div>
          <div className="text-lg font-bold text-cyan-400 mt-0.5">
            {formatNumber(item.quantityAvailable)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            Safety Stock: {item.safetyStock}
          </div>
        </div>
      </div>

      {/* Financials & Valuation */}
      <div className="p-3.5 rounded bg-zinc-900/60 border border-zinc-800 space-y-2 font-mono">
        <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
          <span className="text-zinc-400">UNIT COST / SELL PRICE:</span>
          <span className="text-zinc-200">
            {formatCurrency(item.costPrice)} / {formatCurrency(item.sellingPrice)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
          <span className="text-zinc-400">GROSS MARGIN:</span>
          <span className="text-emerald-400 font-semibold">
            {marginPercent.toFixed(1)}% (${(item.sellingPrice - item.costPrice).toFixed(2)}/u)
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">TOTAL ON-HAND ASSET VALUE:</span>
          <span className="text-cyan-300 font-bold">
            {formatCurrency(item.quantityOnHand * item.costPrice)}
          </span>
        </div>
      </div>

      {/* Predictive Restock Intelligence & PO Trigger */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-cyan-950/30 border border-cyan-500/30 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
              Automated EOQ Replenishment Engine
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            AI DRAFT READY
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-zinc-400 text-[10px]">DAILY BURN VELOCITY:</span>
            <div className="text-zinc-200 font-bold mt-0.5">{item.burnRateDaily} units/day</div>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px]">SUPPLIER LEAD TIME:</span>
            <div className="text-zinc-200 font-bold mt-0.5">
              {item.supplier.leadTimeDays} Days ({item.supplier.name})
            </div>
          </div>
          {forecast && (
            <>
              <div>
                <span className="text-zinc-400 text-[10px]">PREDICTED STOCKOUT DATE:</span>
                <div className="text-red-400 font-bold mt-0.5">{forecast.stockoutDate}</div>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px]">OPTIMAL EOQ RECOMMENDATION:</span>
                <div className="text-emerald-400 font-bold mt-0.5">
                  {forecast.economicOrderQty} Units
                </div>
              </div>
            </>
          )}
        </div>

        {/* Instant PO Trigger Input */}
        <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-zinc-400 block mb-1">
              REORDER QUANTITY (UNITS):
            </label>
            <Input
              type="number"
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              className="h-8 font-mono"
            />
          </div>
          <div className="pt-3.5">
            <Button
              onClick={handleCreateRestockPO}
              disabled={isSubmitting || restockQty <= 0}
              variant="default"
              size="sm"
              className="h-8 px-4 font-mono gap-1.5"
            >
              <Send className="w-3 h-3" />
              {isSubmitting ? "Dispatching..." : "Transmit Restock PO"}
            </Button>
          </div>
        </div>

        {restockSuccessMsg && (
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {restockSuccessMsg}
          </div>
        )}
      </div>

      {/* Transactional Movement History Timeline */}
      <div className="space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-zinc-200 uppercase">
              Immutable Movement Audit Ledger
            </span>
          </div>
          <span className="text-[10px] text-zinc-400">{history.length} Event Logs</span>
        </div>

        <div className="divide-y divide-zinc-800/80 rounded border border-zinc-800 bg-zinc-900/40 max-h-64 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              No historical transactions recorded yet.
            </div>
          ) : (
            history.map((txn) => {
              const isPositive = txn.quantityDelta > 0;
              return (
                <div key={txn.id} className="p-3 text-xs space-y-1 hover:bg-zinc-800/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          txn.type === "INBOUND"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : txn.type === "OUTBOUND"
                            ? "bg-red-500/20 text-red-300"
                            : txn.type === "TRANSFER"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {txn.type}
                      </span>
                      <span className="text-zinc-400 text-[10px]">
                        {new Date(txn.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="font-bold tabular-nums">
                      <span className={isPositive ? "text-emerald-400" : txn.quantityDelta < 0 ? "text-red-400" : "text-zinc-300"}>
                        {isPositive ? `+${txn.quantityDelta}` : txn.quantityDelta}
                      </span>
                      <span className="text-zinc-400 text-[10px] ml-1">
                        ({txn.previousQuantity} → {txn.newQuantity})
                      </span>
                    </div>
                  </div>

                  <div className="text-zinc-300 text-[11px]">{txn.reasonNotes}</div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                    <span>OP: {txn.operatorId}</span>
                    <span>Channel: {txn.channel || "WAREHOUSE"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Sheet>
  );
}
