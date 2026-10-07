import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { StockStatus } from "@/types/inventory";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}

export function getStatusBadgeConfig(status: StockStatus): {
  label: string;
  badgeClass: string;
  borderClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'OPTIMAL':
      return {
        label: 'Optimal',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        borderClass: 'border-l-emerald-500',
        dotClass: 'bg-emerald-400',
      };
    case 'LOW_STOCK':
      return {
        label: 'Low Stock',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        borderClass: 'border-l-amber-500',
        dotClass: 'bg-amber-400',
      };
    case 'CRITICAL':
      return {
        label: 'Critical Deficit',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse',
        borderClass: 'border-l-rose-500',
        dotClass: 'bg-rose-500',
      };
    case 'OUT_OF_STOCK':
      return {
        label: 'Stockout',
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/50 font-bold',
        borderClass: 'border-l-red-600',
        dotClass: 'bg-red-500',
      };
    case 'OVERSTOCKED':
      return {
        label: 'Overstocked',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        borderClass: 'border-l-blue-500',
        dotClass: 'bg-blue-400',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
        borderClass: 'border-l-zinc-500',
        dotClass: 'bg-zinc-400',
      };
  }
}

export function exportToCSV(data: Record<string, unknown>[], filename = 'inventory_export.csv') {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(field => {
      const val = row[field];
      if (typeof val === 'object' && val !== null) {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
