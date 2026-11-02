import React, { useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Globe,
  Building,
  Store,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Printer,
  Split,
  Eye,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useOrders, FilterTab } from '../../context/OrderContext';
import { Order, OrderChannel } from '../../types';
import {
  formatCents,
  calculateSlaRemaining,
  calculateGraceSecondsRemaining,
  formatGraceCountdown,
} from '../../utils/formatters';

export const OrderTable: React.FC = () => {
  const {
    orders,
    activeFilterTab,
    setActiveFilterTab,
    selectedWarehouseId,
    searchQuery,
    keyboardFocusedIndex,
    setKeyboardFocusedIndex,
    selectedRowIds,
    toggleSelectRow,
    selectAllRows,
    openOrderInspector,
    openSplitModal,
    openPackStation,
    healAddressWithUsps,
    approveFraudHold,
    releaseGraceHoldNow,
  } = useOrders();

  const tableRef = useRef<HTMLDivElement>(null);

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    // Warehouse node filter
    if (selectedWarehouseId !== 'all' && order.allocated_warehouse_id !== selectedWarehouseId) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.order_number.toLowerCase().includes(q);
      const matchCustomer = order.customer_name.toLowerCase().includes(q) || order.customer_email.toLowerCase().includes(q);
      const matchSku = order.line_items.some((i) => i.sku.toLowerCase().includes(q) || i.title.toLowerCase().includes(q));
      const matchTracking = order.fulfillments.some((f) => f.tracking_number?.toLowerCase().includes(q));
      if (!matchOrderNum && !matchCustomer && !matchSku && !matchTracking) {
        return false;
      }
    }

    // Segmented tab filter
    switch (activeFilterTab) {
      case 'exceptions':
        return order.order_status === 'on_hold_exception';
      case 'vip':
        return order.is_vip;
      case 'ready_to_ship':
        return order.order_status === 'ready_to_fulfill';
      case 'grace_hold':
        return order.order_status === 'grace_hold';
      case 'split_shipments':
        return order.fulfillments.length > 1;
      case 'in_transit':
        return order.fulfillments.some((f) => f.status === 'in_transit' || f.status === 'exception_stalled');
      case 'delivered':
        return order.order_status === 'delivered';
      case 'all':
      default:
        return true;
    }
  });

  // Hotkey orchestration: J / K navigation, Space preview, P print, S split, A approve/heal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setKeyboardFocusedIndex((prev) => Math.min(filteredOrders.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setKeyboardFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const target = filteredOrders[keyboardFocusedIndex];
        if (target) openOrderInspector(target.id);
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        const target = filteredOrders[keyboardFocusedIndex];
        if (target) openPackStation(target.id);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        const target = filteredOrders[keyboardFocusedIndex];
        if (target) openSplitModal(target);
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const target = filteredOrders[keyboardFocusedIndex];
        if (target) {
          if (target.exception_code === 'invalid_address') {
            healAddressWithUsps(target.id);
          } else if (target.exception_code === 'fraud_review') {
            approveFraudHold(target.id);
          } else if (target.order_status === 'grace_hold') {
            releaseGraceHoldNow(target.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredOrders,
    keyboardFocusedIndex,
    setKeyboardFocusedIndex,
    openOrderInspector,
    openPackStation,
    openSplitModal,
    healAddressWithUsps,
    approveFraudHold,
    releaseGraceHoldNow,
  ]);

  const allFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedRowIds.has(o.id));

  const handleSelectAll = (checked: boolean) => {
    selectAllRows(checked);
  };

  const getChannelBadge = (channel: OrderChannel) => {
    switch (channel) {
      case 'shopify':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <ShoppingBag className="w-2.5 h-2.5" />
            Shopify
          </span>
        );
      case 'dtc_web':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            <Globe className="w-2.5 h-2.5" />
            DTC Web
          </span>
        );
      case 'b2b_wholesale':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            <Building className="w-2.5 h-2.5" />
            B2B
          </span>
        );
      case 'pos':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Store className="w-2.5 h-2.5" />
            Retail POS
          </span>
        );
      case 'amazon':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            Amazon
          </span>
        );
    }
  };

  const renderStatusBadge = (order: Order) => {
    if (order.order_status === 'on_hold_exception') {
      let label = 'Hold: Exception';
      if (order.exception_code === 'invalid_address') label = '🚨 Hold: Address Fix';
      if (order.exception_code === 'fraud_review') label = '🛡️ Hold: Fraud Review';
      if (order.exception_code === 'stock_shortage') label = '📦 Hold: Stock Shortage';
      if (order.exception_code === 'carrier_stalled') label = '⚠️ Carrier Stalled';
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {label}
        </span>
      );
    }

    if (order.order_status === 'grace_hold') {
      const secLeft = calculateGraceSecondsRemaining(order.grace_period_ends_at);
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
          <Clock className="w-3 h-3 text-purple-500 animate-spin" />
          Grace ({formatGraceCountdown(secLeft)})
        </span>
      );
    }

    if (order.order_status === 'ready_to_fulfill') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          ⚡ Ready for Wave Pick
        </span>
      );
    }

    if (order.order_status === 'partially_fulfilled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          🔀 Split (Parcel A Shipped)
        </span>
      );
    }

    if (order.order_status === 'fulfilled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Packed / Label Bought
        </span>
      );
    }

    if (order.order_status === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          ✓ Delivered
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
        {order.order_status}
      </span>
    );
  };

  const renderSlaTimer = (order: Order) => {
    if (order.order_status === 'delivered' || order.order_status === 'fulfilled') {
      return (
        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          ✓ On Target
        </span>
      );
    }

    const sla = calculateSlaRemaining(order.sla_ship_by_at);
    if (sla.isOverdue) {
      return (
        <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
          BREACHED
        </span>
      );
    }

    if (sla.isCritical) {
      return (
        <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
          ⏱ {sla.text}
        </span>
      );
    }

    return (
      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
        ⏱ {sla.text}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas-light dark:bg-canvas-dark select-none overflow-hidden transition-colors">
      {/* Segmented Filter Tab Bar */}
      <div className="px-6 py-2.5 border-b border-divider-light dark:border-divider-dark bg-surface-secondary-light/60 dark:bg-surface-secondary-dark/60 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1 text-xs font-medium">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            {
              id: 'exceptions',
              label: '🚨 Needs Attention',
              count: orders.filter((o) => o.order_status === 'on_hold_exception').length,
              highlight: true,
            },
            {
              id: 'vip',
              label: '⭐ VIP Priority',
              count: orders.filter((o) => o.is_vip).length,
            },
            {
              id: 'ready_to_ship',
              label: '⚡ Ready for Wave',
              count: orders.filter((o) => o.order_status === 'ready_to_fulfill').length,
            },
            {
              id: 'grace_hold',
              label: '⏳ Grace Hold',
              count: orders.filter((o) => o.order_status === 'grace_hold').length,
            },
            {
              id: 'split_shipments',
              label: '🔀 Split Shipments',
              count: orders.filter((o) => o.fulfillments.length > 1).length,
            },
            {
              id: 'in_transit',
              label: '🚚 In Transit',
              count: orders.filter((o) => o.fulfillments.some((f) => f.status === 'in_transit' || f.status === 'exception_stalled')).length,
            },
            {
              id: 'delivered',
              label: '✓ Delivered',
              count: orders.filter((o) => o.order_status === 'delivered').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id as FilterTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeFilterTab === tab.id
                  ? 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-slate-900 dark:text-white font-semibold shadow-xs border border-divider-light dark:border-divider-dark'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[10px] px-1 rounded ${
                  tab.highlight && tab.count > 0
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Hotkey Helper Tag */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
          <span>Navigate:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark">
            J
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark">
            K
          </kbd>
          <span>Preview:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark">
            Space
          </kbd>
        </div>
      </div>

      {/* High-Density Virtual Table Stage */}
      <div ref={tableRef} className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header (Sticky) */}
          <thead className="sticky top-0 z-10 bg-surface-secondary-light dark:bg-surface-secondary-dark border-b border-divider-light dark:border-divider-dark text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr className="h-9">
              <th className="w-10 px-3 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-brand-primary focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="px-3 min-w-[170px]">Order # & Channel</th>
              <th className="px-3 min-w-[200px]">Customer & Address</th>
              <th className="px-3 min-w-[190px]">Items & Node Allocation</th>
              <th className="px-3 min-w-[170px]">Fulfillment Status</th>
              <th className="px-3 min-w-[120px]">SLA Cutoff</th>
              <th className="px-3 min-w-[140px] text-right">Total & Net Margin</th>
              <th className="w-28 px-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-divider-light dark:divide-divider-dark">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400 font-mono">
                  No orders match active filter criteria
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => {
                const isSelected = selectedRowIds.has(order.id);
                const isFocused = idx === keyboardFocusedIndex;
                const totalItemsCount = order.line_items.reduce((acc, i) => acc + i.quantity_ordered, 0);
                const marginPct = ((order.net_margin_cents / order.total_paid_cents) * 100).toFixed(0);

                return (
                  <tr
                    key={order.id}
                    onClick={() => setKeyboardFocusedIndex(idx)}
                    onDoubleClick={() => openOrderInspector(order.id)}
                    className={`h-11 transition-colors cursor-pointer group ${
                      isFocused
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 ring-1 ring-inset ring-brand-primary'
                        : isSelected
                        ? 'bg-blue-50/40 dark:bg-blue-950/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectRow(order.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-primary focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Order # + Channel + VIP Badge */}
                    <td className="px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 hover:text-brand-primary transition-colors">
                          {order.order_number}
                        </span>
                        {getChannelBadge(order.channel)}
                        {order.is_vip && (
                          <span
                            title="VIP Customer (Elevated LTV)"
                            className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-1 rounded flex items-center gap-0.5 border border-amber-500/30"
                          >
                            <Star className="w-2.5 h-2.5 fill-current" />
                            VIP
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer & Destination */}
                    <td className="px-3">
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className="font-medium text-slate-900 dark:text-slate-200">
                          {order.customer_name}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate">
                          • {order.shipping_address.city}, {order.shipping_address.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] mt-0.5">
                        {order.address_validation_status === 'verified' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                            ✓ USPS Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold flex items-center gap-0.5 bg-amber-500/10 px-1 rounded">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            ⚠️ Address Diff
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Items & Allocation */}
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        {/* Thumbnail stack */}
                        <div className="flex -space-x-2 overflow-hidden shrink-0">
                          {order.line_items.slice(0, 3).map((item) => (
                            <img
                              key={item.id}
                              src={item.thumbnail_url}
                              alt={item.title}
                              className="inline-block h-6 w-6 rounded-md object-cover ring-1 ring-white dark:ring-slate-900"
                            />
                          ))}
                        </div>

                        <div className="truncate">
                          <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} ({order.line_items.length} SKUs)
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {order.fulfillments.length > 1 ? (
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                🔀 Split ({order.fulfillments.length} Parcels)
                              </span>
                            ) : (
                              <span>[ {order.allocated_warehouse_id.replace('wh-', '').toUpperCase()} ]</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Fulfillment Status */}
                    <td className="px-3">{renderStatusBadge(order)}</td>

                    {/* SLA Cutoff */}
                    <td className="px-3">{renderSlaTimer(order)}</td>

                    {/* Total & Net Margin */}
                    <td className="px-3 text-right font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCents(order.total_paid_cents)}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCents(order.net_margin_cents)} Net ({marginPct}%)
                      </div>
                    </td>

                    {/* Quick Action Hover Toolbar */}
                    <td className="px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPackStation(order.id);
                          }}
                          title="Open Scan-to-Pack Station (P)"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-brand-primary transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSplitModal(order);
                          }}
                          title="Split Fulfillment (S)"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-purple-500 transition-colors"
                        >
                          <Split className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderInspector(order.id);
                          }}
                          title="Inspect Order (Space)"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

