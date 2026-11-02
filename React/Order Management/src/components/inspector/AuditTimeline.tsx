import React from 'react';
import {
  Activity,
  Bot,
  User,
  Truck,
  ShoppingBag,
  Clock,
} from 'lucide-react';
import { OrderAuditEvent, AuditActorType } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface AuditTimelineProps {
  events: OrderAuditEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  const getActorBadge = (actor: AuditActorType, actorName: string) => {
    switch (actor) {
      case 'system_router':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-brand-primary border border-blue-500/20 font-medium">
            <Bot className="w-2.5 h-2.5" />
            {actorName}
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium">
            <User className="w-2.5 h-2.5" />
            {actorName}
          </span>
        );
      case 'carrier_webhook':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
            <Truck className="w-2.5 h-2.5" />
            {actorName}
          </span>
        );
      case 'customer':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium">
            <ShoppingBag className="w-2.5 h-2.5" />
            Customer
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <Activity className="w-3.5 h-3.5 text-brand-primary" />
        <span>Immutable Operational Audit Feed</span>
      </div>

      <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-divider-light dark:before:bg-divider-dark">
        {events.length === 0 ? (
          <div className="text-xs text-slate-400 font-mono">No audit events recorded for this order yet.</div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="relative group text-xs">
              {/* Dot */}
              <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-surface-elevated-light dark:ring-surface-elevated-dark group-hover:bg-brand-primary transition-colors"></div>

              {/* Event Header */}
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-2">
                  {getActorBadge(evt.actor_type, evt.actor_name)}
                  <span className="font-mono text-[10px] text-slate-400">
                    {evt.event_type}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatDateTime(evt.created_at)}</span>
                </div>
              </div>

              {/* Summary Description */}
              <div className="font-mono text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                {evt.summary}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

