import React from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Printer,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import { FulfillmentParcel, OrderLineItem, Order } from '../../types';
import { formatCents, formatShortDate } from '../../utils/formatters';

interface ParcelCardProps {
  order: Order;
  parcel: FulfillmentParcel;
  parcelIndex: number;
  totalParcels: number;
  items: OrderLineItem[];
  onOpenPackStation: (orderId: string) => void;
  onShowThermalLabel: (order: Order, parcel: FulfillmentParcel) => void;
  onRerouteNode?: (orderId: string, parcelId: string, newNodeId: string) => void;
}

export const ParcelCard: React.FC<ParcelCardProps> = ({
  order,
  parcel,
  parcelIndex,
  totalParcels,
  items,
  onOpenPackStation,
  onShowThermalLabel,
  onRerouteNode,
}) => {
  const isBackordered = parcel.is_backordered;

  return (
    <div className="rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 p-4 transition-all">
      {/* Parcel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-divider-light dark:border-divider-dark">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/10 text-brand-primary flex items-center justify-center">
            <Package className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              Parcel {parcel.fulfillment_number}
              <span className="text-[10px] text-slate-400 font-sans ml-1.5 font-normal">
                ({parcelIndex + 1} of {totalParcels})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <MapPin className="w-2.5 h-2.5 text-slate-400" />
              <span>Node: {parcel.warehouse_name}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="uppercase text-[10px]">{parcel.carrier} {parcel.service_level}</span>
            </div>
          </div>
        </div>

        {/* Parcel Status Pill */}
        <div className="flex items-center gap-2">
          {parcel.status === 'in_transit' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              <Truck className="w-3 h-3" />
              In Transit
            </span>
          )}
          {parcel.status === 'exception_stalled' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Stalled ({parcel.transit_stalled_hours}h)
            </span>
          )}
          {parcel.status === 'queued_for_wave' && !isBackordered && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Clock className="w-3 h-3" />
              Ready to Pick
            </span>
          )}
          {isBackordered && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              <Clock className="w-3 h-3" />
              Restock {parcel.backorder_restock_date || 'Nov 12'}
            </span>
          )}
          {parcel.status === 'label_purchased' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Label Purchased
            </span>
          )}
          {parcel.status === 'delivered' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Delivered
            </span>
          )}
        </div>
      </div>

      {/* Tracking Number Bar (If generated) */}
      {parcel.tracking_number && (
        <div className="mt-2.5 p-2 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Tracking #:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {parcel.tracking_number}
            </span>
          </div>
          <button
            onClick={() => onShowThermalLabel(order, parcel)}
            className="flex items-center gap-1 text-[11px] text-brand-primary hover:underline font-semibold"
          >
            <Printer className="w-3 h-3" />
            <span>Thermal Label ZPL</span>
          </button>
        </div>
      )}

      {/* Last carrier scan text if available */}
      {parcel.last_carrier_scan_text && (
        <div className="mt-2 p-2 rounded bg-slate-100 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
          <span className="text-slate-400">Scan event: </span>
          {parcel.last_carrier_scan_text}
        </div>
      )}

      {/* Backorder Reroute Suggestion Pill */}
      {isBackordered && (
        <div className="mt-3 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs flex items-center justify-between">
          <div className="text-purple-800 dark:text-purple-300 font-medium text-[11px]">
            💡 Optimization Alert: 1 unit available at NJ-East Hub
          </div>
          <button
            onClick={() => onRerouteNode && onRerouteNode(order.id, parcel.id, 'wh-nj-east')}
            className="text-[10px] font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded transition-colors"
          >
            Re-route to NJ-East →
          </button>
        </div>
      )}

      {/* Items list */}
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-10 h-10 rounded-md object-cover ring-1 ring-divider-light dark:ring-divider-dark shrink-0"
              />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {item.variant_title}
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 mt-0.5">
                  <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{item.sku}</span>
                  <span className="text-brand-primary font-semibold flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {item.bin_location}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 pl-3 font-mono">
              <div className="font-semibold text-slate-900 dark:text-slate-200">
                {item.quantity_ordered} × {formatCents(item.unit_price_cents)}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                {item.quantity_allocated}/{item.quantity_ordered} Reserved ✓
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Footer */}
      {!parcel.tracking_number && !isBackordered && (
        <div className="mt-3 pt-2 flex items-center justify-end">
          <button
            onClick={() => onOpenPackStation(order.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-blue-500 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Open in Scan-to-Pack Station</span>
          </button>
        </div>
      )}
    </div>
  );
};

