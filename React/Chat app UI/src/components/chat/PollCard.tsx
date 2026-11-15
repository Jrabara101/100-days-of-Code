import { BarChart3, Check } from 'lucide-react';
import type { PollAttachment } from '../../types/chat';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { cn } from '../../lib/utils';

interface PollCardProps {
  poll: PollAttachment;
  isOutbound: boolean;
  onVote: (optionId: string) => void;
}

export function PollCard({ poll, isOutbound, onVote }: PollCardProps) {
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voterIds.length, 0);

  return (
    <div
      className={cn(
        'mt-2 rounded-xl border p-3 space-y-2.5 min-w-[250px]',
        isOutbound
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-surface-secondary border-divider text-txt-primary'
      )}
    >
      <div className="flex items-start gap-2">
        <BarChart3 className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <p className="text-xs font-semibold leading-snug">{poll.question}</p>
      </div>

      <div className="space-y-1.5">
        {poll.options.map((opt) => {
          const count = opt.voterIds.length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const votedByMe = opt.voterIds.includes(currentUserId);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onVote(opt.id)}
              className={cn(
                'relative w-full text-left rounded-lg border px-2.5 py-2 overflow-hidden transition-all',
                votedByMe
                  ? isOutbound
                    ? 'border-white/60 bg-white/15'
                    : 'border-blue-500/60 bg-blue-500/10'
                  : isOutbound
                    ? 'border-white/20 hover:bg-white/10'
                    : 'border-divider hover:bg-surface-tertiary'
              )}
            >
              <div
                style={{ width: `${pct}%` }}
                className={cn(
                  'absolute inset-y-0 left-0 transition-all duration-300',
                  isOutbound ? 'bg-white/15' : 'bg-blue-500/15'
                )}
              />
              <div className="relative flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  {votedByMe && <Check className="w-3.5 h-3.5 shrink-0" />}
                  {opt.label}
                </span>
                <span className="tabular-nums-meta text-[11px] opacity-80 shrink-0">
                  {pct}% ({count})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="tabular-nums-meta text-[10px] opacity-75">
        {totalVotes} vote{totalVotes === 1 ? '' : 's'} • {poll.allowMultiple ? 'Multiple choice' : 'Single choice'}
      </p>
    </div>
  );
}

