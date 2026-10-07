import React from 'react';
import { Award, Sparkles, ChevronRight, X } from 'lucide-react';
import { AchievementNode } from '../../types/achievement';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface CelebrationToastProps {
  achievement: AchievementNode | null;
  onInspect: (id: string) => void;
  onClose: () => void;
}

export const CelebrationToast: React.FC<CelebrationToastProps> = ({
  achievement,
  onInspect,
  onClose,
}) => {
  if (!achievement) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/98 border border-amber-500/40 shadow-[0_10px_35px_rgba(245,158,11,0.25)] backdrop-blur-2xl text-slate-100 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300 select-none">
      {/* Golden Celebration Icon Box */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
        <Sparkles className="w-6 h-6 text-slate-950 font-bold" />
      </div>

      {/* Achievement Content */}
      <div className="flex flex-col min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            Milestone Conquered!
          </span>
          <Badge tier={achievement.tier} className="text-[9px] py-0">
            {achievement.tier}
          </Badge>
        </div>
        <h3 className="text-sm font-bold text-white truncate max-w-[260px] font-display">
          {achievement.title}
        </h3>
        <span className="text-[11px] font-mono text-emerald-400 font-semibold">
          +{achievement.points} Trophy Points Claimed
        </span>
      </div>

      {/* Inspect Button */}
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          onInspect(achievement.id);
          onClose();
        }}
        className="h-8 px-3 text-xs gap-1 font-bold shrink-0"
      >
        <span>Inspect</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>

      {/* Dismiss */}
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-surface-high transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
