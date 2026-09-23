import React, { useEffect } from 'react';
import { Trophy, Sparkles, RotateCcw } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Player } from '@/types/game';
import { Avatar } from '@/components/ui/avatar';
import { fireStudioConfetti } from '@/components/react-bits/ConfettiBurst';

interface MatchPodiumModalProps {
  open: boolean;
  players: Player[];
  onRestart: () => void;
}

export const MatchPodiumModal: React.FC<MatchPodiumModalProps> = ({
  open,
  players,
  onRestart,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  useEffect(() => {
    if (open) {
      fireStudioConfetti();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}} showClose={false} className="max-w-md">
      <div className="w-14 h-14 rounded-3xl bg-amber-100 border-2 border-amber-300 text-amber-700 mx-auto flex items-center justify-center mb-3 shadow-md">
        <Trophy className="w-7 h-7 animate-bounce" />
      </div>

      <h2 className="text-2xl font-serif font-extrabold text-studio-ink">
        Match Champions Podium!
      </h2>
      <p className="text-xs font-sans text-studio-charcoal mt-1 mb-4">
        The sketchbook session has concluded. Congratulations to our master scribes!
      </p>

      {/* Winner Spotlight */}
      {winner && (
        <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/60 border-2 border-amber-300/80 mb-4 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-amber-900">
              Grand Master Artist
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 my-2">
            <Avatar
              initials={winner.initials}
              className="w-14 h-14 border-amber-500 text-amber-800 text-lg shadow-sm"
            />
            <div className="text-left">
              <div className="text-lg font-serif font-bold text-studio-ink">{winner.username}</div>
              <div className="font-mono text-sm font-extrabold text-studio-sienna">
                {winner.score} PTS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standings List */}
      <div className="space-y-1.5 mb-5 text-left text-xs font-serif">
        {sorted.slice(1).map((p, idx) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#D5C7B0]"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-stone-500 text-[11px]">#{idx + 2}</span>
              <span className="font-bold text-studio-ink">{p.username}</span>
            </div>
            <span className="font-mono font-bold text-studio-charcoal">{p.score} pts</span>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="w-full py-2.5 bg-studio-sienna hover:bg-studio-siennaLight text-white rounded-xl text-sm font-serif font-bold transition flex items-center justify-center gap-2 shadow-md active:scale-98"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Open Fresh Sketchbook Session</span>
      </button>
    </Dialog>
  );
};
