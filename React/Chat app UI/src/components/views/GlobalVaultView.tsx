import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderArchive, FileText, Globe, Mic, Image as ImageIcon, Code2 } from 'lucide-react';
import { api } from '../../lib/api';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { cn, formatBytes, formatDuration, formatShortTime } from '../../lib/utils';

type FilterKind = 'all' | 'image' | 'file' | 'link' | 'voice' | 'code';

export function GlobalVaultView() {
  const { data: vaultMsgs = [], isLoading } = useQuery({
    queryKey: ['vault'],
    queryFn: api.getVault,
  });
  const usersById = usePresenceStore((s) => s.usersById);
  const setLightboxMedia = useChatWorkspaceStore((s) => s.setLightboxMedia);
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);

  const [filter, setFilter] = useState<FilterKind>('all');

  const items = useMemo(() => {
    const out: Array<{ msgId: string; conversationId: string; senderId: string; createdAt: string; att: any }> = [];
    for (const m of vaultMsgs) {
      for (const att of m.attachments) {
        if (filter === 'all' || att.kind === filter) {
          out.push({
            msgId: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            createdAt: m.createdAt,
            att,
          });
        }
      }
    }
    return out;
  }, [vaultMsgs, filter]);

  return (
    <div className="flex-1 h-full bg-canvas flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-divider bg-canvas/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-txt-primary">Shared Memory Vault</h1>
            <p className="text-xs text-txt-muted">
              Every media asset, document, voice note, code block, and link across chats
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              ['all', 'All'],
              ['image', 'Media'],
              ['file', 'Files'],
              ['link', 'Links'],
              ['voice', 'Voice'],
              ['code', 'Code'],
            ] as Array<[FilterKind, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                filter === k
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-secondary border border-divider text-txt-muted hover:text-txt-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p className="text-xs text-txt-muted">Indexing Shared Memory Vault...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
            {items.map((item) => {
              const senderName = usersById[item.senderId]?.displayName ?? 'Member';
              const { att } = item;

              return (
                <div
                  key={`${item.msgId}-${att.id}`}
                  className="rounded-2xl border border-divider bg-surface-elevated p-4 flex flex-col justify-between gap-3"
                >
                  {att.kind === 'image' && (
                    <button
                      type="button"
                      onClick={() => setLightboxMedia(att)}
                      className="rounded-xl overflow-hidden border border-divider h-36 cursor-zoom-in"
                    >
                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                    </button>
                  )}

                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center text-blue-500 shrink-0">
                      {att.kind === 'image' ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : att.kind === 'file' ? (
                        <FileText className="w-4 h-4" />
                      ) : att.kind === 'link' ? (
                        <Globe className="w-4 h-4" />
                      ) : att.kind === 'voice' ? (
                        <Mic className="w-4 h-4" />
                      ) : (
                        <Code2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-txt-primary truncate">
                        {att.name ?? att.title ?? att.filename ?? att.question ?? 'Voice Note'}
                      </p>
                      <p className="tabular-nums-meta text-[11px] text-txt-muted mt-0.5">
                        {att.kind === 'file'
                          ? `${att.ext} • ${formatBytes(att.sizeBytes)}`
                          : att.kind === 'voice'
                            ? `${formatDuration(att.durationSec)} audio`
                            : att.domain ?? att.language ?? 'Shared asset'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-divider text-[11px] text-txt-muted">
                    <span>
                      {senderName} • {formatShortTime(item.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectConversation(item.conversationId)}
                      className="text-blue-500 font-medium hover:underline"
                    >
                      Open Chat →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

