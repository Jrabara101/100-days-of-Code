import type { PresenceStatus } from '../../types/chat';
import { cn } from '../../lib/utils';

interface PresenceDotProps {
  status: PresenceStatus;
  size?: 'xs' | 'sm' | 'md';
  ringClass?: string;
  className?: string;
}

export function PresenceDot({
  status,
  size = 'sm',
  ringClass = 'ring-2 ring-surface-secondary',
  className,
}: PresenceDotProps) {
  const sizeClass =
    size === 'xs' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span
      title={status}
      className={cn(
        'inline-flex items-center justify-center rounded-full shrink-0',
        sizeClass,
        ringClass,
        status === 'online' && 'bg-[#10B981]',
        status === 'idle' && 'bg-[#F59E0B]',
        status === 'dnd' && 'bg-[#F43F5E]',
        status === 'offline' && 'bg-[#64748B]',
        className
      )}
    >
      {status === 'dnd' && (
        <span className="block w-1.5 h-[1.5px] rounded-full bg-white" />
      )}
      {status === 'offline' && (
        <span className="block w-1.5 h-1.5 rounded-full bg-canvas" />
      )}
    </span>
  );
}

