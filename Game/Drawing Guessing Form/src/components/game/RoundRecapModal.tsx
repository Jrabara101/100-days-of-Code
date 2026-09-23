import React from 'react';
import { Award, ArrowRight, Trophy } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { DrawAction, Player } from '@/types/game';
import { TimelapseReplay } from '@/components/canvas/TimelapseReplay';

interface RoundRecapModalProps {
  open: boolean;
  targetWord: string;
  category: string;
  actions: DrawAction[];
  players: Player[];
  round: { current: number; total: number };
  onNextRound: () => void;
}

export const RoundRecapModal: React.FC<RoundRecapModalProps> = ({
  open,
  targetWord,
  category,
  actions,
  players,
  round,
  onNextRound,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Dialog open={open} onOpenChange={() => {}} showClose={false} className="max-w-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#D5C7B0] mb-3">
        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-studio-sienna font-sans">
            Round {round.current} Recap
          </span>
          <h2 className="text-xl font-serif font-bold text-studio-ink">
            The Word was <span className="text-studio-sienna underline decoration-amber-400">{targetWord}</span>
          </h2>
          <span className="text-xs text-studio-charcoal/80 font-sans italic">{category}</span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
          <Award className="w-5 h-5" />
        </div>
      </div>

      {/* 3-Second Vector Stroke Replay Engine */}
      <div className="mb-4">
        <TimelapseReplay actions={actions} durationMs={3000} autoPlay={true} />
      </div>

      {/* Podium Mini Leaderboard */}
      <div className="bg-white/80 border border-[#D5C7B0] rounded-2xl p-3 mb-4 shadow-sm text-left">
        <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-studio-ink mb-2">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Atelier Standings</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-1.5 rounded-lg bg-studio-paper/70 border border-[#E5DAC6]"
            >
              <span className="truncate font-semibold text-studio-ink">
                #{idx + 1} {p.username}
              </span>
              <span className="font-mono text-[11px] font-bold text-studio-sienna shrink-0">
                {p.score} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action to proceed */}
      <button
        onClick={onNextRound}
        className="w-full py-2.5 bg-studio-sienna hover:bg-studio-siennaLight text-white rounded-xl text-sm font-serif font-bold transition flex items-center justify-center gap-2 shadow-md active:scale-98"
      >
        <span>
          {round.current >= round.total ? 'View Match Champions Podium' : 'Begin Next Studio Round'}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </Dialog>
  );
};
