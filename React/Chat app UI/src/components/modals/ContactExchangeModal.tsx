import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, QrCode, Search, UserPlus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../../stores/usePresenceStore';
import { useContactMutations } from '../../hooks/useConversations';
import { Avatar } from '../ui/Avatar';

export function ContactExchangeModal() {
  const isOpen = useChatWorkspaceStore((s) => s.isContactExchangeOpen);
  const setOpen = useChatWorkspaceStore((s) => s.setContactExchangeOpen);
  const currentUserId = usePresenceStore((s) => s.currentUserId);
  const currentUser = usePresenceStore((s) => s.usersById[currentUserId]);
  const { addContact } = useContactMutations();

  const [query, setQuery] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: discovered = [] } = useQuery({
    queryKey: ['discover-users', query],
    queryFn: () => api.discoverUsers(query),
    enabled: isOpen,
  });

  const shareUrl = `https://relay.chat/connect/${currentUser?.handle.replace('@', '') ?? 'river'}`;

  useEffect(() => {
    if (!isOpen) return;
    void QRCode.toDataURL(shareUrl, {
      width: 180,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).then(setQrDataUrl);
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-divider bg-surface-elevated shadow-2xl overflow-hidden animate-bubble-in"
      >
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-txt-primary">
              Add Contacts &amp; Share Identity Card
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-surface-tertiary text-txt-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* QR Identity Card */}
          <div className="rounded-2xl border border-divider bg-surface-secondary p-4 flex flex-col sm:flex-row items-center gap-4">
            {qrDataUrl && (
              <div className="p-2 rounded-xl bg-white shrink-0 shadow-sm">
                <img src={qrDataUrl} alt="Relay Contact QR Code" className="w-28 h-28" />
              </div>
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
              <div>
                <p className="text-sm font-bold text-txt-primary">
                  {currentUser?.displayName ?? 'River Chen'}
                </p>
                <p className="text-xs text-blue-500 font-mono">
                  {currentUser?.handle ?? '@river'}
                </p>
              </div>
              <p className="text-[11px] text-txt-muted">
                Share your QR card or invite link—new senders start in your quarantined Message Requests until approved.
              </p>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated border border-divider text-xs font-medium text-txt-primary hover:border-blue-500/40"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied Link' : 'Copy Identity Link'}
              </button>
            </div>
          </div>

          {/* @Handle Search & Workspace Auto-Discovery */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-txt-primary">
              Instant @Handle Search &amp; Workspace Domain Discovery
            </label>
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-txt-muted absolute left-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search @tariq, @hannah, or workspace teammate..."
                className="w-full rounded-xl bg-surface-tertiary border border-divider pl-9 pr-3 py-2 text-xs text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {discovered.length === 0 ? (
                <p className="py-4 text-center text-xs text-txt-muted">
                  All matching workspace teammates are already in your contacts.
                </p>
              ) : (
                discovered.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-xl border border-divider bg-surface-secondary px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar user={u} size={36} showPresence />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-txt-primary truncate">
                          {u.displayName}
                        </p>
                        <p className="text-[11px] text-txt-muted truncate">
                          {u.handle} • {u.roleTitle}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addContact.mutate(u.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

