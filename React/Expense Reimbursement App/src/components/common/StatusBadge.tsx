import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert, Sparkles } from 'lucide-react';
import type { ItemStatus, ReportStatus } from '../../types';

interface StatusBadgeProps {
  status: ItemStatus | ReportStatus | 'in_policy' | 'soft_warning' | 'duplicate_risk';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Settled in Bank</span>
        </span>
      );

    case 'approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-blue-400" />
          <span>Approved / ACH Queued</span>
        </span>
      );

    case 'partially_approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/25 ${sizeClasses}`}
        >
          <Sparkles className="w-3 h-3 text-teal-400" />
          <span>Partially Approved</span>
        </span>
      );

    case 'submitted':
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Under Review</span>
        </span>
      );

    case 'flagged':
    case 'soft_warning':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 ${sizeClasses}`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Note Required</span>
        </span>
      );

    case 'duplicate_risk':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-semibold ${sizeClasses}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>Duplicate Risk</span>
        </span>
      );

    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20 ${sizeClasses}`}
        >
          <XCircle className="w-3 h-3 text-red-400" />
          <span>Rejected</span>
        </span>
      );

    case 'in_policy':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/25 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-teal-400" />
          <span>In Policy</span>
        </span>
      );

    case 'draft':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span>Draft</span>
        </span>
      );
  }
};
