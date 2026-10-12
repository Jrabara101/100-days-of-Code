import React from 'react';
import { WifiOff, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function NetworkBanner({ connectionState, onRetry }) {
  if (connectionState === 'connected') return null;

  const isReconnecting = connectionState === 'reconnecting';
  const isDisconnected = connectionState === 'disconnected';

  return (
    <div
      className={`px-4 py-2 border-b flex items-center justify-between transition-all duration-200 text-xs font-medium ${
        isReconnecting
          ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
          : 'bg-red-500/10 dark:bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
      }`}
    >
      <div className="flex items-center space-x-2">
        {isReconnecting ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-500" />
        )}
        <span>
          {isReconnecting
            ? '⚠️ Connection interrupted. Reconnecting to live WebSocket stream...'
            : 'Disconnected from Pusher. Check your network or broadcasting credentials.'}
        </span>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:opacity-80 active:opacity-60 transition ml-3"
        >
          Retry Now
        </button>
      )}
    </div>
  );
}
