import type { User } from '../../types/chat';
import { cn } from '../../lib/utils';
import { PresenceDot } from './PresenceDot';

interface AvatarProps {
  user?: User;
  users?: User[];
  isGroup?: boolean;
  title?: string | null;
  size?: 20 | 32 | 36 | 40 | 44 | 46 | 52 | 80;
  showPresence?: boolean;
  ringClass?: string;
  className?: string;
}

const SIZE_MAP: Record<number, string> = {
  20: 'w-5 h-5',
  32: 'w-8 h-8',
  36: 'w-9 h-9',
  40: 'w-10 h-10',
  44: 'w-11 h-11',
  46: 'w-[46px] h-[46px]',
  52: 'w-[52px] h-[52px]',
  80: 'w-20 h-20',
};

export function Avatar({
  user,
  users,
  isGroup = false,
  title,
  size = 40,
  showPresence = false,
  ringClass = 'ring-2 ring-surface-secondary',
  className,
}: AvatarProps) {
  const boxClass = SIZE_MAP[size] ?? 'w-10 h-10';

  if (isGroup && users && users.length > 0) {
    const slice = users.slice(0, 4);
    return (
      <div
        className={cn(
          'relative rounded-2xl bg-surface-tertiary border border-divider p-0.5 grid grid-cols-2 gap-0.5 shrink-0 overflow-hidden',
          boxClass,
          className
        )}
        title={title ?? 'Group'}
      >
        {slice.map((u) => (
          <img
            key={u.id}
            src={u.avatarUrl}
            alt={u.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('relative inline-flex shrink-0', boxClass, className)}>
      {user ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-semibold text-txt-muted">
          {(title ?? 'R').slice(0, 2).toUpperCase()}
        </div>
      )}
      {showPresence && user && (
        <PresenceDot
          status={user.presence}
          size={size >= 52 ? 'md' : size <= 32 ? 'xs' : 'sm'}
          ringClass={ringClass}
          className="absolute -bottom-0.5 -right-0.5"
        />
      )}
    </div>
  );
}

