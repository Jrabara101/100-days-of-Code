import React, { useState } from 'react';
import {
  X,
  Radio,
  Server,
  Key,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { echoService } from '../../services/echo';

export default function PusherSettingsModal({
  onClose,
  connectionState,
  onTriggerMockInbound,
  onTriggerTypingWhisper,
  onToggleDisconnect,
}) {
  const [key, setKey] = useState(echoService.config.key || '');
  const [cluster, setCluster] = useState(echoService.config.cluster || 'mt1');
  const [authEndpoint, setAuthEndpoint] = useState(
    echoService.config.authEndpoint || '/broadcasting/auth'
  );
  const [token, setToken] = useState(echoService.config.bearerToken || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    echoService.init({
      key: key.trim(),
      cluster: cluster.trim(),
      authEndpoint: authEndpoint.trim(),
      bearerToken: token.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#181A20] rounded-2xl border border-slate-200 dark:border-[#23262D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#23262D] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-blue-500 animate-pulse" />
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Laravel Echo & Pusher WebSockets
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-[#8F9CAE]">
                Real-Time Transport & Broadcasting Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Active Connection State Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#23262D] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  connectionState === 'connected'
                    ? 'bg-emerald-500'
                    : connectionState === 'reconnecting'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-red-500'
                }`}
              />
              <div>
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-900 dark:text-white">
                  Engine Status: {connectionState}
                </span>
                <p className="text-[10.5px] text-slate-400 dark:text-[#8F9CAE]">
                  {echoService.isRealConnected()
                    ? `Live Pusher WebSocket connected to cluster [${cluster}]`
                    : 'Active High-Fidelity Simulation Engine (Offline & Real-Time Ready)'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleDisconnect}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition"
            >
              Toggle Drop
            </button>
          </div>

          {/* Test Event Dispatch Deck */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Broadcast Event Simulator</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2.5">
              Dispatch real-time Pusher client events to verify optimistic reconciliation, sound cues, and ambient presence:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onTriggerMockInbound();
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition active:scale-95"
              >
                <Play className="w-3 h-3" />
                <span>Simulate Inbound Msg</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTriggerTypingWhisper();
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-white dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] text-slate-800 dark:text-slate-200 font-semibold hover:border-blue-400 transition active:scale-95"
              >
                <span>Trigger Typing Whisper</span>
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-[#8F9CAE]">
              <Key className="w-3.5 h-3.5" />
              <span>Credentials (Optional Live Pusher Setup)</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Pusher App Key (`VITE_PUSHER_APP_KEY`)
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. 8a92bc7190e38a4df12"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#23262D] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Pusher Cluster
                </label>
                <input
                  type="text"
                  value={cluster}
                  onChange={(e) => setCluster(e.target.value)}
                  placeholder="mt1, us2, eu, ap1"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#23262D] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Broadcasting Auth URL
                </label>
                <input
                  type="text"
                  value={authEndpoint}
                  onChange={(e) => setAuthEndpoint(e.target.value)}
                  placeholder="/broadcasting/auth"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#23262D] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Bearer Auth Token (Sanctum / Passport)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer eyJhbGciOi..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#23262D] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-emerald-500 font-medium">
                {savedSuccess && '✓ Settings saved and client re-initialized!'}
              </span>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
              >
                Save & Connect
              </button>
            </div>
          </form>

          {/* Architecture Reference */}
          <div className="p-3 rounded-xl bg-slate-900 dark:bg-[#0B0C0E] text-slate-300 font-mono text-[11px] space-y-1.5 border border-slate-800">
            <div className="text-amber-400 font-semibold">// Laravel Backend Implementation</div>
            <div>
              <span className="text-blue-400">Broadcast::channel</span>('chat.&#123;id&#125;', function ($user, $id) &#123;
            </div>
            <div className="pl-4 text-slate-400">
              return $user-&gt;conversations()-&gt;where('id', $id)-&gt;exists();
            </div>
            <div>&#125;);</div>
          </div>
        </div>
      </div>
    </div>
  );
}
