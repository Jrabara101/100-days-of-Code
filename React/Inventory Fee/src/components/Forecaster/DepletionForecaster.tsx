import React, { useState } from "react";
import {
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Send,
  Zap,
  Clock,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { DepletionForecast, InventoryItem } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { api } from "@/lib/api";

interface DepletionForecasterProps {
  forecasts: DepletionForecast[];
  items: InventoryItem[];
  onRestockSuccess: () => void;
  onSelectItem: (item: InventoryItem) => void;
}

export function DepletionForecaster({
  forecasts,
  items,
  onRestockSuccess,
  onSelectItem,
}: DepletionForecasterProps) {
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [submittingSku, setSubmittingSku] = useState<string | null>(null);

  const filtered = forecasts.filter((f) =>
    filterPriority === "ALL" ? true : f.reorderPriority === filterPriority
  );

  const criticalCount = forecasts.filter((f) => f.reorderPriority === "CRITICAL").length;
  const elevatedCount = forecasts.filter((f) => f.reorderPriority === "ELEVATED").length;
  const totalRestockPipelineUSD = forecasts
    .filter((f) => f.reorderPriority === "CRITICAL" || f.reorderPriority === "ELEVATED")
    .reduce((sum, f) => sum + f.estimatedRestockCost, 0);

  const handleAuthorizePO = async (forecast: DepletionForecast) => {
    const item = items.find((i) => i.sku === forecast.sku);
    if (!item) return;

    try {
      setSubmittingSku(forecast.sku);
      await api.receiveShipment({
        itemId: item.id,
        quantity: forecast.economicOrderQty,
        poNumber: `PO-EOQ-${Date.now().toString().slice(-4)}`,
        operatorId: "OP-FORECASTER",
        notes: `Automated replenishment PO dispatched. Predicted stockout was ${forecast.stockoutDate}. EOQ: ${forecast.economicOrderQty} units.`,
      });
      alert(`Restock order authorized for ${forecast.sku} (+${forecast.economicOrderQty} units received into inventory)`);
      onRestockSuccess();
    } catch (err: any) {
      alert(`Failed to authorize PO: ${err.message}`);
    } finally {
      setSubmittingSku(null);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* High-Impact Executive Summary Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              CRITICAL STOCKOUT HAZARD (&lt;7D)
            </span>
            <div className="text-xl font-bold text-red-400 mt-1 flex items-baseline gap-2">
              <span>{criticalCount} SKUs</span>
              <span className="text-xs text-red-500/80 font-normal">Immediate Action</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              ELEVATED DEPLETION VELOCITY
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1 flex items-baseline gap-2">
              <span>{elevatedCount} SKUs</span>
              <span className="text-xs text-amber-400/80 font-normal">Draft PO Prepared</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">
              RECOMMENDED EOQ REORDER COMMIT
            </span>
            <div className="text-xl font-bold text-cyan-300 mt-1">
              {formatCurrency(totalRestockPipelineUSD)}
            </div>
          </div>
          <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-zinc-900 border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-[11px]">URGENCY FILTER:</span>
          {["ALL", "CRITICAL", "ELEVATED", "NORMAL", "SECURE"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                filterPriority === p
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <span className="text-zinc-400 text-xs">
          Showing {filtered.length} of {forecasts.length} Analyzed Depletion Trajectories
        </span>
      </div>

      {/* Predictive Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((f) => {
          const item = items.find((i) => i.sku === f.sku);
          const isCritical = f.reorderPriority === "CRITICAL";

          return (
            <div
              key={f.sku}
              className={`p-4 rounded-lg bg-zinc-950 border transition-all duration-150 space-y-3 relative overflow-hidden shadow-lg ${
                isCritical
                  ? "border-red-500/60 shadow-red-950/20"
                  : f.reorderPriority === "ELEVATED"
                  ? "border-amber-500/50 shadow-amber-950/20"
                  : "border-zinc-800"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{f.sku}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                        isCritical
                          ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                          : f.reorderPriority === "ELEVATED"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                    >
                      {f.reorderPriority} PRIORITY
                    </span>
                  </div>
                  <h4 className="text-xs text-zinc-300 font-sans mt-0.5">{f.title}</h4>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-400">Days Remaining</div>
                  <div
                    className={`text-lg font-bold ${
                      isCritical ? "text-red-400" : "text-cyan-300"
                    }`}
                  >
                    {f.daysRemaining} Days
                  </div>
                </div>
              </div>

              {/* Exact Stockout Calendar Day & Velocity Metrics */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-zinc-900/80 border border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block">EXACT STOCKOUT DAY:</span>
                  <span className="font-bold text-red-300 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-red-400" />
                    {f.stockoutDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block">7D / 30D BURN RATE:</span>
                  <span className="font-bold text-zinc-200 mt-0.5 block">
                    {f.burnRate7d} / {f.burnRate30d} u/day
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block">SUPPLIER LEAD:</span>
                  <span className="font-bold text-zinc-200 mt-0.5 block">
                    {f.leadTimeDays} Days
                  </span>
                </div>
              </div>

              {/* Recommended EOQ Draft PO & Action Trigger */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-zinc-400 block">
                    OPTIMAL ECONOMIC ORDER QTY (EOQ):
                  </span>
                  <div className="text-xs font-bold text-emerald-400">
                    {f.economicOrderQty} Units{" "}
                    <span className="text-zinc-400 font-normal">
                      ({formatCurrency(f.estimatedRestockCost)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item && (
                    <Button
                      onClick={() => onSelectItem(item)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-zinc-400 hover:text-cyan-300"
                    >
                      Details
                    </Button>
                  )}

                  <Button
                    onClick={() => handleAuthorizePO(f)}
                    disabled={submittingSku === f.sku}
                    variant={isCritical ? "default" : "cyan"}
                    size="sm"
                    className="font-mono text-xs gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    {submittingSku === f.sku ? "Authorizing..." : "Authorize PO"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
