import React from "react";
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  ArrowRightLeft,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { StockStatus } from "@/types/inventory";

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: StockStatus | "ALL";
  onStatusChange: (status: StockStatus | "ALL") => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  totalResults: number;
  onExportCSV: () => void;
  onOpenReceiveModal: () => void;
  onOpenTransferModal: () => void;
  selectedRowCount: number;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalResults,
  onExportCSV,
  onOpenReceiveModal,
  onOpenTransferModal,
  selectedRowCount,
}: TableToolbarProps) {
  const statuses: { label: string; value: StockStatus | "ALL" }[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "Optimal", value: "OPTIMAL" },
    { label: "Low Stock", value: "LOW_STOCK" },
    { label: "Critical", value: "CRITICAL" },
    { label: "Out of Stock", value: "OUT_OF_STOCK" },
    { label: "Overstocked", value: "OVERSTOCKED" },
  ];

  return (
    <div className="space-y-2.5 pb-3">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Search input with instant fuzzy clearing */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Fuzzy search SKU, Title, UPC, or Bin (e.g. 'AVN', 'LIDAR', 'BIN-A1')..."
            className="pl-8 pr-7 bg-zinc-900 border-zinc-800 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-2 p-0.5 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {selectedRowCount > 0 && (
            <div className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 animate-pulse">
              <span>{selectedRowCount} SKUs Selected</span>
            </div>
          )}

          <Button
            onClick={onOpenReceiveModal}
            variant="cyan"
            size="sm"
            className="gap-1.5 font-mono"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Receive Inbound
          </Button>

          <Button
            onClick={onOpenTransferModal}
            variant="outline"
            size="sm"
            className="gap-1.5 font-mono"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            Transfer Bins
          </Button>

          <Button
            onClick={onExportCSV}
            variant="outline"
            size="sm"
            className="gap-1.5 font-mono"
            title="Export filtered SKU table to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV Export
          </Button>
        </div>
      </div>

      {/* Filter Chips row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-cyan-400" /> STATUS:
          </span>
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => onStatusChange(s.value)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors border ${
                selectedStatus === s.value
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold"
                  : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {s.label}
            </button>
          ))}

          {/* Category Dropdown */}
          <div className="ml-2 flex items-center gap-1">
            <span className="text-[11px] font-mono text-zinc-400">CATEGORY:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded px-2 py-0.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-mono text-zinc-400">
          Showing <span className="text-zinc-200 font-semibold">{totalResults}</span> Records
        </div>
      </div>
    </div>
  );
}
