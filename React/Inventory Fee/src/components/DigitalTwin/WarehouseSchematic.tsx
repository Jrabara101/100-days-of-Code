import React, { useState } from "react";
import {
  MapPin,
  Flame,
  Thermometer,
  Layers,
  Compass,
  ArrowRight,
  Info,
  CheckCircle2,
  Box,
} from "lucide-react";
import { LocationBin, InventoryItem } from "@/types/inventory";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface WarehouseSchematicProps {
  bins: LocationBin[];
  items: InventoryItem[];
  onSelectBinItem: (item: InventoryItem) => void;
  onOpenTransferModal: () => void;
}

export function WarehouseSchematic({
  bins,
  items,
  onSelectBinItem,
  onOpenTransferModal,
}: WarehouseSchematicProps) {
  const [selectedBinId, setSelectedBinId] = useState<string>("BIN-A1-01");
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>("ALL");
  const [showPickPath, setShowPickPath] = useState<boolean>(true);

  const selectedBin = bins.find((b) => b.id === selectedBinId) || bins[0];
  const itemsInSelectedBin = items.filter(
    (it) => it.primaryLocation && it.primaryLocation.id === selectedBin?.id
  );

  const zones = [
    { id: "ALL", name: "Full Facility View" },
    { id: "Zone A", name: "Zone A - High Velocity" },
    { id: "Zone B", name: "Zone B - Cleanroom Vault" },
    { id: "Zone C", name: "Zone C - Cold Chain (-20°C)" },
    { id: "Zone D", name: "Zone D - Heavy Bulk" },
  ];

  const filteredBins = bins.filter((b) =>
    activeZoneFilter === "ALL" ? true : b.zone.startsWith(activeZoneFilter)
  );

  return (
    <div className="space-y-4 font-mono">
      {/* Top Controls & Schematic Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            FACILITY ZONE:
          </span>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setActiveZoneFilter(z.id)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                activeZoneFilter === z.id
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={showPickPath}
              onChange={(e) => setShowPickPath(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-cyan-400 font-semibold">Render Optimal Pick Path</span>
          </label>
          <Button
            onClick={onOpenTransferModal}
            variant="cyan"
            size="sm"
            className="font-mono text-xs"
          >
            Rebalance Bins
          </Button>
        </div>
      </div>

      {/* Main Schematic & Bin Inspector Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 2D Interactive Warehouse Floorplan Schematic */}
        <div className="lg:col-span-2 p-4 rounded-lg bg-zinc-950 border border-zinc-800 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800 text-xs text-zinc-400">
            <span className="flex items-center gap-2 text-zinc-200 font-semibold">
              <MapPin className="w-4 h-4 text-cyan-400" />
              WH-04 Austin Backroom & Bay Schematic (Scale: 1:50m)
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/80"></span>
                &lt;70% Cap
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/80"></span>
                70-90% Cap
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/80"></span>
                &gt;90% Congested
              </span>
            </div>
          </div>

          {/* SVG Map Canvas with Interactive Bins and Pick Path */}
          <div className="relative min-h-[360px] bg-zinc-900/50 rounded border border-zinc-800 p-4 select-none">
            {/* Warehouse Floor Grid Background lines */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
              }}
            />

            {/* Calculated Optimal Pick Path Line Overlay */}
            {showPickPath && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <polyline
                  points="70,90 190,90 190,210 320,210 320,310 460,310 560,180"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
                <circle cx="70" cy="90" r="5" fill="#10b981" />
                <text x="80" y="85" fill="#10b981" fontSize="10" fontFamily="monospace">
                  START: AGV DOCK
                </text>
                <circle cx="560" cy="180" r="5" fill="#f59e0b" />
                <text x="500" y="170" fill="#f59e0b" fontSize="10" fontFamily="monospace">
                  END: PACK STN 4
                </text>
              </svg>
            )}

            {/* Grid of Warehouse Bins */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 relative z-20">
              {filteredBins.map((bin) => {
                const isSelected = bin.id === selectedBin?.id;
                const fillRatio = bin.capacityUsed / bin.capacityMax;
                const fillPercent = Math.round(fillRatio * 100);

                const heatmapColor =
                  fillPercent > 90
                    ? "border-rose-500/70 bg-rose-950/20 text-rose-300"
                    : fillPercent > 70
                    ? "border-amber-500/70 bg-amber-950/20 text-amber-300"
                    : "border-emerald-500/70 bg-emerald-950/20 text-emerald-300";

                return (
                  <button
                    key={bin.id}
                    onClick={() => setSelectedBinId(bin.id)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? "ring-2 ring-cyan-400 bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/50"
                        : "bg-zinc-900/90 hover:border-zinc-500 border-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{bin.bin}</span>
                        <span className="text-[10px] text-zinc-400">{bin.shelf}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                        {bin.aisle} • {bin.zone.split("-")[0]}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">Fill:</span>
                        <span className="font-bold font-mono">{fillPercent}%</span>
                      </div>

                      <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-300 ${
                            fillPercent > 90
                              ? "bg-rose-500"
                              : fillPercent > 70
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.min(100, fillPercent)}%` }}
                        />
                      </div>

                      <div className="text-[9px] text-zinc-400 flex items-center justify-between">
                        <span>{bin.capacityUsed}u</span>
                        <span className="text-zinc-500">/{bin.capacityMax}u</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Bin Inspector Panel */}
        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 uppercase">Selected Spatial Bin</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                {selectedBin?.id}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Bin {selectedBin?.bin} ({selectedBin?.shelf})
            </h3>
            <div className="text-xs text-zinc-400 mt-0.5">
              {selectedBin?.zone} • Aisle {selectedBin?.aisle}
            </div>
          </div>

          {/* Bin Telemetry Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 text-[10px] block">TEMP CLIMATE:</span>
              <span className="text-cyan-300 font-bold mt-0.5 block">
                {selectedBin?.temperatureZone || "AMBIENT (21°C)"}
              </span>
            </div>

            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 text-[10px] block">UTILIZATION:</span>
              <span className="text-emerald-400 font-bold mt-0.5 block">
                {selectedBin?.capacityUsed} / {selectedBin?.capacityMax} Units (
                {Math.round(((selectedBin?.capacityUsed || 0) / (selectedBin?.capacityMax || 1)) * 100)}%)
              </span>
            </div>
          </div>

          {/* Stashed Items in this Bin */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-300 font-semibold block">
              STASHED SKUs IN BIN ({itemsInSelectedBin.length})
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {itemsInSelectedBin.length === 0 ? (
                <div className="p-4 rounded bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400">
                  No active SKUs assigned to this bin reticle.
                </div>
              ) : (
                itemsInSelectedBin.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectBinItem(item)}
                    className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 cursor-pointer transition-colors space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300 group-hover:text-cyan-200">
                        {item.sku}
                      </span>
                      <span className="text-zinc-100 font-bold">
                        {item.quantityOnHand} {item.unitOfMeasure}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-300 truncate">{item.title}</div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
                      <span>Available: {item.quantityAvailable}</span>
                      <span className="text-cyan-400 flex items-center gap-0.5">
                        Inspect SKU <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
