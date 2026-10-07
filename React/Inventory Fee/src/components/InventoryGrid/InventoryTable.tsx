import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  SlidersHorizontal,
  Flame,
  Clock,
  Layers,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { formatCurrency, formatNumber, getStatusBadgeConfig } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface InventoryTableProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onQuickAdjust: (item: InventoryItem) => void;
  onQuickTransfer: (item: InventoryItem) => void;
  selectedRowIds: Set<string>;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function InventoryTable({
  items,
  onSelectItem,
  onQuickAdjust,
  onQuickTransfer,
  selectedRowIds,
  onToggleSelectRow,
  onToggleSelectAll,
}: InventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "daysRemaining", desc: false }, // Sort by urgency by default
  ]);

  const allSelected = items.length > 0 && selectedRowIds.size === items.length;

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <button
            onClick={onToggleSelectAll}
            className="p-1 text-zinc-400 hover:text-cyan-400"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const isSelected = selectedRowIds.has(row.original.id);
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelectRow(row.original.id);
              }}
              className="p-1 text-zinc-400 hover:text-cyan-400"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-cyan-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          );
        },
        enableSorting: false,
        size: 36,
      },
      {
        accessorKey: "sku",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-mono text-zinc-300 hover:text-cyan-400"
          >
            SKU / UPC
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="font-mono">
              <div className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                {item.sku}
              </div>
              <div className="text-[10px] text-zinc-400 tracking-wider">
                {item.upc}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-zinc-300 hover:text-cyan-400"
          >
            ITEM SPECIFICATION
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="max-w-[280px]">
              <div className="text-xs font-medium text-zinc-200 truncate hover:text-cyan-200">
                {item.title}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  UOM: {item.unitOfMeasure}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "primaryLocation.bin",
        header: "SPATIAL BIN",
        cell: ({ row }) => {
          const loc = row.original.primaryLocation;
          const tempColor =
            loc.temperatureZone === "COLD_CHAIN"
              ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
              : loc.temperatureZone === "SECURE_VAULT"
              ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
              : "text-zinc-400 bg-zinc-800/80 border-zinc-700";

          return (
            <div className="font-mono">
              <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-semibold">
                <span className="text-cyan-400">{loc.bin}</span>
                <span className="text-zinc-400 font-normal">({loc.shelf})</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] px-1 py-0.2 rounded border ${tempColor}`}>
                  {loc.aisle} • {loc.temperatureZone || 'AMBIENT'}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "quantityAvailable",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-mono text-zinc-300 hover:text-cyan-400 text-right w-full justify-end"
          >
            AVAILABLE / ON HAND
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const pct = Math.min(100, Math.round((item.quantityOnHand / (item.reorderPoint * 2)) * 100));

          return (
            <div className="text-right font-mono">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-bold text-zinc-100 tabular-nums">
                  {formatNumber(item.quantityAvailable)}
                </span>
                <span className="text-[10px] text-zinc-400">
                  / {formatNumber(item.quantityOnHand)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 mt-0.5">
                {item.quantityAllocated > 0 && (
                  <span className="text-amber-400 bg-amber-500/10 px-1 rounded">
                    {item.quantityAllocated} locked hold
                  </span>
                )}
                <span>R点: {item.reorderPoint}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "daysRemaining",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-mono text-zinc-300 hover:text-cyan-400"
          >
            BURN VELOCITY & DIR
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isUrgent = item.daysRemaining <= item.supplier.leadTimeDays;

          return (
            <div className="font-mono">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Clock className={`w-3 h-3 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`} />
                <span className={isUrgent ? 'text-red-300 font-bold' : 'text-zinc-200'}>
                  {item.daysRemaining > 90 ? '90+ Days' : `${item.daysRemaining} Days Left`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                <span className="flex items-center gap-0.5 text-cyan-400">
                  <Flame className="w-2.5 h-2.5" />
                  {item.burnRateDaily} / day
                </span>
                <span>Lead: {item.supplier.leadTimeDays}d</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
          const item = row.original;
          const config = getStatusBadgeConfig(item.status);
          return (
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${config.badgeClass}`}>
                {config.label}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "costPrice",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-mono text-zinc-300 hover:text-cyan-400 text-right w-full justify-end"
          >
            VALUATION
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const totalVal = item.quantityOnHand * item.costPrice;
          return (
            <div className="text-right font-mono">
              <div className="text-xs font-semibold text-zinc-200 tabular-nums">
                {formatCurrency(totalVal)}
              </div>
              <div className="text-[10px] text-zinc-400">
                @{formatCurrency(item.costPrice)}/u
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-2">ACTIONS</div>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-zinc-400 hover:text-cyan-300"
                onClick={() => onQuickAdjust(item)}
                title="Quick Stock Adjustment"
              >
                Adjust
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-zinc-400 hover:text-cyan-300"
                onClick={() => onQuickTransfer(item)}
                title="Transfer Bin"
              >
                Transfer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] text-cyan-400 hover:bg-cyan-500/10 border-cyan-500/30 font-mono"
                onClick={() => onSelectItem(item)}
                title="Open SKU Drawer"
              >
                Inspect
                <ArrowRight className="w-2.5 h-2.5 ml-1" />
              </Button>
            </div>
          );
        },
      },
    ],
    [selectedRowIds, allSelected, onSelectItem, onQuickAdjust, onQuickTransfer, onToggleSelectRow, onToggleSelectAll]
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full rounded-md border border-zinc-800 bg-zinc-950/70 overflow-hidden shadow-xl">
      <div className="overflow-x-auto max-h-[calc(100vh-270px)] relative">
        <table className="w-full text-left border-collapse text-xs">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase tracking-wider shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="py-2.5 px-3 font-semibold select-none bg-zinc-900"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-zinc-500 font-mono">
                  No SKUs match the active search or filter criteria.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const item = row.original;
                const isSelected = selectedRowIds.has(item.id);

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectItem(item)}
                    className={`cursor-pointer transition-colors duration-100 group ${
                      isSelected
                        ? "bg-cyan-950/30 hover:bg-cyan-950/40"
                        : "hover:bg-zinc-900/60"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2.5 px-3 text-zinc-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
