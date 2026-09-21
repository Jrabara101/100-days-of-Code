import React, { useState } from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { Users, Copy, Check, X, Wifi } from 'lucide-react';

export const PeerJamOverlay: React.FC = () => {
  const { peerJam, togglePeerJam } = usePixelStore();
  const [copied, setCopied] = useState(false);

  if (!peerJam.enabled) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${peerJam.roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-surface-panel/95 backdrop-blur-xl border border-secondary/40 rounded-xl p-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
            <span>Peer Jam Active</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary/20 text-secondary">
              {peerJam.roomId}
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            You: <strong className="text-secondary">{peerJam.userName}</strong> ({peerJam.peers.length} peers connected)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-2 border-l border-border-subtle pl-2">
        <button
          onClick={handleCopyLink}
          className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-lg transition-colors flex items-center gap-1 text-[11px] font-mono"
          title="Copy Room Link (Open in another tab to test live collaboration!)"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Share Tab'}</span>
        </button>

        <button
          onClick={togglePeerJam}
          className="p-1.5 text-text-muted hover:text-on-surface transition-colors"
          title="Leave Peer Jam"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
