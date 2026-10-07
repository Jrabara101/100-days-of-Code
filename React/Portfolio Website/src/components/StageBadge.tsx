import React from 'react';
import { PostStage } from '../types';
import { Sprout, Leaf, TreePine } from 'lucide-react';

interface StageBadgeProps {
  stage: PostStage;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, showIcon = true, size = 'sm' }) => {
  const config = {
    seedling: {
      label: 'Seedling',
      icon: Sprout,
      classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-500',
      description: 'Quick thought / early exploratory note',
    },
    budding: {
      label: 'Budding',
      icon: Leaf,
      classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dot: 'bg-amber-500',
      description: 'Developing essay / actively expanding',
    },
    evergreen: {
      label: 'Evergreen',
      icon: TreePine,
      classes: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      dot: 'bg-indigo-500',
      description: 'Definitive guide / mature synthesis',
    },
  }[stage];

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full font-mono border ${config.classes} ${padding}`}
      title={config.description}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span className="font-medium">{config.label}</span>
    </span>
  );
};
