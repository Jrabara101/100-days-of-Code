import { ExternalLink, Globe } from 'lucide-react';
import type { LinkUnfurlAttachment } from '../../types/chat';
import { cn } from '../../lib/utils';

interface LinkUnfurlCardProps {
  attachment: LinkUnfurlAttachment;
  isOutbound: boolean;
}

export function LinkUnfurlCard({ attachment, isOutbound }: LinkUnfurlCardProps) {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'mt-2 block rounded-xl border overflow-hidden transition-colors',
        isOutbound
          ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
          : 'bg-surface-secondary border-divider hover:border-blue-500/40 text-txt-primary'
      )}
    >
      {attachment.imageUrl && (
        <img
          src={attachment.imageUrl}
          alt={attachment.title}
          className="w-full h-28 object-cover border-b border-white/10"
        />
      )}
      <div className="p-2.5 space-y-1">
        <div className="flex items-center justify-between gap-2 text-[10px] opacity-75">
          <span className="inline-flex items-center gap-1 font-medium">
            <Globe className="w-3 h-3" />
            {attachment.domain}
          </span>
          <ExternalLink className="w-3 h-3" />
        </div>
        <p className="text-xs font-semibold leading-snug line-clamp-1">{attachment.title}</p>
        <p className="text-[11px] opacity-80 line-clamp-2 leading-relaxed">
          {attachment.description}
        </p>
      </div>
    </a>
  );
}

