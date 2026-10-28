import React from 'react';
import { InvoiceStatus, DocumentType } from '../../types';

interface BadgeProps {
  status?: InvoiceStatus;
  documentType?: DocumentType;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, children, className = '', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (!status) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses} ${className}`}>
        {children}
      </span>
    );
  }

  switch (status) {
    case 'paid':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          {children || 'Paid In Full'}
        </span>
      );
    case 'processing_ach':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          {children || 'ACH In Transit'}
        </span>
      );
    case 'viewed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          {children || 'Viewed by Client'}
        </span>
      );
    case 'sent':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          {children || 'Awaiting Payment'}
        </span>
      );
    case 'overdue':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          {children || 'Overdue'}
        </span>
      );
    case 'partially_paid':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          {children || 'Deposit Paid'}
        </span>
      );
    case 'refunded':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          {children || 'Refunded / CN'}
        </span>
      );
    case 'draft':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-700/50 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          {children || 'Draft'}
        </span>
      );
  }
};
