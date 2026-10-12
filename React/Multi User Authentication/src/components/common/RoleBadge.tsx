import React from 'react';
import { RoleName } from '../../types/auth';
import { Crown, Shield, Users, User, Eye, Sparkles } from 'lucide-react';

interface RoleBadgeProps {
  role: RoleName;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md', showIcon = true }) => {
  const normalized = role.toLowerCase();

  let styles = {
    border: 'border-[#64748B]',
    text: 'text-[#64748B] dark:text-[#94A3B8]',
    bg: 'bg-[rgba(100,116,139,0.08)]',
    icon: Eye
  };

  if (normalized === 'owner') {
    styles = {
      border: 'border-[#7C3AED]',
      text: 'text-[#7C3AED] dark:text-[#A78BFA]',
      bg: 'bg-[rgba(124,58,237,0.1)]',
      icon: Crown
    };
  } else if (normalized === 'admin') {
    styles = {
      border: 'border-[#2563EB]',
      text: 'text-[#2563EB] dark:text-[#60A5FA]',
      bg: 'bg-[rgba(37,99,235,0.1)]',
      icon: Shield
    };
  } else if (normalized === 'manager') {
    styles = {
      border: 'border-[#0D9488]',
      text: 'text-[#0D9488] dark:text-[#2DD4BF]',
      bg: 'bg-[rgba(13,148,136,0.1)]',
      icon: Users
    };
  } else if (normalized === 'member') {
    styles = {
      border: 'border-[#10B981]',
      text: 'text-[#10B981] dark:text-[#34D399]',
      bg: 'bg-[rgba(16,185,129,0.1)]',
      icon: User
    };
  } else if (normalized === 'auditor' || normalized === 'viewer') {
    styles = {
      border: 'border-[#64748B]',
      text: 'text-[#64748B] dark:text-[#94A3B8]',
      bg: 'bg-[rgba(100,116,139,0.1)]',
      icon: Eye
    };
  } else {
    // Custom Role
    styles = {
      border: 'border-[#F59E0B]',
      text: 'text-[#D97706] dark:text-[#FBBF24]',
      bg: 'bg-[rgba(245,158,11,0.1)]',
      icon: Sparkles
    };
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium'
  };

  const IconComponent = styles.icon;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${styles.border} ${styles.text} ${styles.bg} ${sizeClasses[size]} tracking-tight transition-all duration-150 select-none shadow-sm`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{role}</span>
    </span>
  );
};
