import React, { useState } from 'react';
import {
  X,
  Clock,
  Zap,
  Split,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  User,
  MapPin,
  ExternalLink,
  Edit3,
  Mail,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { AddressHealerCard } from './AddressHealerCard';
import { NetMarginWaterfallCard } from './NetMarginWaterfallCard';
import { ParcelCard } from './ParcelCard';
import { AuditTimeline } from './AuditTimeline';
import {
  formatCents,
  calculateGraceSecondsRemaining,
  formatGraceCountdown,
} from '../../utils/formatters';

export const Order360Drawer: React.FC = () => {
  const {
    selectedOrder,
    closeOrderInspector,
    healAddressWithUsps,
    releaseGraceHoldNow,
    approveFraudHold,
    issueCxStalledCredit,
    openSplitModal,
    openPackStation,
    showThermalLabel,
    getOrderAuditEvents,
  } = useOrders();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [operatorNotes, setOperatorNotes] = useState(
    'Customer requested Saturday delivery if possible. Verified apartment gate code #4491.'
  );

  if (!selectedOrder) return null;

  const graceSeconds = calculateGraceSecondsRemaining(selectedOrder.grace_period_ends_at);
  const auditEvents = getOrderAuditEvents(selectedOrder.id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeOrderInspector}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer Panel (640px wide) */}
      <div className="relative w-full max-w-[640px] bg-surface-elevated-light dark:bg-surface-elevated-dark border-l border-divider-light dark:border-divider-dark shadow-2xl flex flex-col h-full z-10 transition-transform duration-300">
        {/* Sticky Header */}
        <div className="h-16 px-6 border-b border-divider-light dark:border-divider-dark bg-surface-secondary-light/90 dark:bg-surface-secondary-dark/90 backdrop-blur flex items-center justify-between shrink-0 select-none">
          {/* Order Title + Grace Pill */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {selectedOrder.order_number}
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                  {selectedOrder.channel}
                </span>
                {selectedOrder.is_vip && (
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    ⭐ VIP BUYER
                  </span>
                )}
              </div>

              {/* Grace countdown or routing note */}
              {selectedOrder.order_status === 'grace_hold' && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    <Clock className="w-3 h-3 animate-spin" />
                    Grace Window: {formatGraceCountdown(graceSeconds)} left
                  </span>
                  <button
                    onClick={() => releaseGraceHoldNow(selectedOrder.id)}
                    className="text-[10px] font-mono font-bold text-brand-primary hover:underline"
                  >
                    Release to Warehouse Now →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar & Close */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openSplitModal(selectedOrder)}
              title="Split Order into Multiple Parcels"
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark hover:border-purple-500 text-purple-600 dark:text-purple-400 transition-colors"
            >
              <Split className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>

            <button
              onClick={() => openPackStation(selectedOrder.id)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-primary hover:bg-blue-500 text-white shadow-2xs transition-colors"
            >
              <span>Pack / Ship (P)</span>
            </button>

            <button
              onClick={closeOrderInspector}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Conditional Exception Resolution Banners */}
          {selectedOrder.exception_code === 'invalid_address' && selectedOrder.address_suggestion && (
            <AddressHealerCard
              orderId={selectedOrder.id}
              diff={selectedOrder.address_suggestion}
              onApplyVerified={healAddressWithUsps}
            />
          )}

          {selectedOrder.exception_code === 'fraud_review' && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    High-Risk Fraud Velocity Alert (Score: {selectedOrder.customer_profile.fraud_risk_score}/100)
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-bold">
                  HELD
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mb-3">
                {selectedOrder.exception_details || 'Mismatched billing and shipping countries with residential proxy IP detected.'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => approveFraudHold(selectedOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approve KYC & Fast-Track (A)</span>
                </button>
                <button className="px-3 py-1.5 rounded-lg border border-divider-light dark:border-divider-dark text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Request ID Verification
                </button>
              </div>
            </div>
          )}

          {selectedOrder.exception_code === 'carrier_stalled' && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Carrier Transit Delay Detected (&gt;48 Hours Zero Movement)
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                  SLA BREACH RISK
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mb-3 font-mono">
                {selectedOrder.fulfillments[0]?.last_carrier_scan_text || 'Package held at sorting facility.'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => issueCxStalledCredit(selectedOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Issue $15 Courtesy Credit & Message Customer</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Customer & Shipping Destination Card (2-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 text-xs">
            {/* Customer & LTV Profile */}
            <div className="space-y-1.5 pr-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Customer & LTV Trust</span>
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">
                {selectedOrder.customer_name}
              </div>
              <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                {selectedOrder.customer_email}
              </div>
              <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                {selectedOrder.customer_phone}
              </div>

              {/* LTV badge pill */}
              <div className="mt-2 pt-2 border-t border-divider-light dark:border-divider-dark font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                <div>
                  <span className="text-slate-400">Total Orders: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedOrder.customer_profile.total_orders} ({formatCents(selectedOrder.customer_profile.total_spent_cents)} LTV)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Return Rate: </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {selectedOrder.customer_profile.return_rate_pct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Destination Address & Routing Note */}
            <div className="space-y-1.5 pl-2 border-t md:border-t-0 md:border-l border-divider-light dark:border-divider-dark pt-2 md:pt-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-primary" />
                  <span>Destination Address</span>
                </span>
                {selectedOrder.address_validation_status === 'verified' && (
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ VERIFIED
                  </span>
                )}
              </div>

              <div className="font-mono text-slate-800 dark:text-slate-200 text-xs">
                <div>{selectedOrder.shipping_address.name}</div>
                <div>{selectedOrder.shipping_address.street1}</div>
                {selectedOrder.shipping_address.street2 && <div>{selectedOrder.shipping_address.street2}</div>}
                <div>
                  {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                  {selectedOrder.shipping_address.postalCode}
                </div>
                <div>{selectedOrder.shipping_address.country}</div>
              </div>

              <div className="mt-2 pt-2 border-t border-divider-light dark:border-divider-dark text-[11px] text-slate-500 font-mono">
                <span className="text-slate-400 font-sans">Routing Rule: </span>
                {selectedOrder.routing_logic_explanation}
              </div>
            </div>
          </div>

          {/* 3. Parcel & Split-Fulfillment Containers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>Fulfillment Packages ({selectedOrder.fulfillments.length})</span>
              </div>
              {selectedOrder.fulfillments.length === 1 && (
                <button
                  onClick={() => openSplitModal(selectedOrder)}
                  className="text-[11px] font-mono text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Split className="w-3 h-3" />
                  <span>Split into Parcels</span>
                </button>
              )}
            </div>

            {selectedOrder.fulfillments.map((parcel, idx) => {
              const parcelItems = selectedOrder.line_items.filter((item) =>
                parcel.item_ids.includes(item.id)
              );
              return (
                <ParcelCard
                  key={parcel.id}
                  order={selectedOrder}
                  parcel={parcel}
                  parcelIndex={idx}
                  totalParcels={selectedOrder.fulfillments.length}
                  items={parcelItems.length > 0 ? parcelItems : selectedOrder.line_items}
                  onOpenPackStation={openPackStation}
                  onShowThermalLabel={showThermalLabel}
                />
              );
            })}
          </div>

          {/* 4. True Net Margin Waterfall */}
          <NetMarginWaterfallCard order={selectedOrder} />

          {/* 5. Internal Operations Notes */}
          <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                <span>Warehouse Floor & CX Notes</span>
              </span>
              <button
                onClick={() => setIsEditingNotes(!isEditingNotes)}
                className="text-brand-primary text-[11px] font-mono font-medium hover:underline"
              >
                {isEditingNotes ? 'Done' : 'Edit'}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                className="w-full h-16 p-2 rounded border border-divider-light dark:border-divider-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none"
              />
            ) : (
              <div className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                {operatorNotes}
              </div>
            )}
          </div>

          {/* 6. Immutable Operational Audit Timeline */}
          <div className="pt-2 border-t border-divider-light dark:border-divider-dark">
            <AuditTimeline events={auditEvents} />
          </div>
        </div>
      </div>
    </div>
  );
};

