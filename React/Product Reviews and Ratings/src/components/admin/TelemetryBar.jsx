import React from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { HotkeyKeycap } from '../common/HotkeyKeycap';

export function TelemetryBar({ activeHotkey }) {
  const { telemetryStats, activeQueueTab } = useTrustStore();

  return (
    <div className="w-full h-11 bg-surface-container-lowest border-b border-outline-variant/30 px-6 flex items-center justify-between text-on-surface select-none z-30">
      {/* Live Telemetry Metrics */}
      <div className="flex items-center gap-4 text-label-code-sm font-mono text-on-surface-variant overflow-x-auto">
        <div className="flex items-center gap-1.5 font-medium text-on-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
          <span>
            Pending <strong className="text-on-surface font-semibold">{telemetryStats.pendingCount}</strong>
          </span>
        </div>
        <span className="text-outline-variant/60">·</span>
        <span>
          Auto-approved today <strong className="text-on-surface font-semibold">{telemetryStats.autoApprovedPercent}%</strong>
        </span>
        <span className="text-outline-variant/60">·</span>
        <span>
          Avg triage <strong className="text-on-surface font-semibold">{telemetryStats.avgTriageSeconds}s</strong>
        </span>
        <span className="text-outline-variant/60">·</span>
        <div className="flex items-center gap-1.5">
          <span>Brigade shield:</span>
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              telemetryStats.hasActiveLockdown ? 'bg-error animate-pulse' : 'bg-primary'
            }`}
          />
          <span
            className={`font-semibold ${
              telemetryStats.hasActiveLockdown ? 'text-error' : 'text-primary'
            }`}
          >
            {telemetryStats.brigadeShieldStatus}
          </span>
        </div>
      </div>

      {/* Keyboard Shortcuts Cheatsheet Bar */}
      <div className="hidden lg:flex items-center gap-3 text-label-code-sm font-mono text-outline shrink-0">
        <div className="flex items-center gap-1">
          <HotkeyKeycap char="J" variant={activeHotkey === 'J' ? 'active' : 'default'} />
          <span className="text-outline-variant/80">/</span>
          <HotkeyKeycap char="K" variant={activeHotkey === 'K' ? 'active' : 'default'} />
          <span className="ml-0.5 text-on-surface-variant">Nav</span>
        </div>
        <span className="text-outline-variant/50">·</span>
        <div className="flex items-center gap-1">
          <HotkeyKeycap char="A" variant={activeHotkey === 'A' ? 'active' : 'default'} />
          <span className="ml-0.5 text-on-surface-variant">Approve</span>
        </div>
        <span className="text-outline-variant/50">·</span>
        <div className="flex items-center gap-1">
          <HotkeyKeycap char="E" variant={activeHotkey === 'E' ? 'amber' : 'default'} />
          <span className="ml-0.5 text-on-surface-variant">Redact</span>
        </div>
        <span className="text-outline-variant/50">·</span>
        <div className="flex items-center gap-1">
          <HotkeyKeycap char="B" variant={activeHotkey === 'B' ? 'active' : 'default'} />
          <span className="ml-0.5 text-on-surface-variant">Blur</span>
        </div>
        <span className="text-outline-variant/50">·</span>
        <div className="flex items-center gap-1">
          <HotkeyKeycap char="R" variant={activeHotkey === 'R' ? 'error' : 'default'} />
          <span className="ml-0.5 text-on-surface-variant">Reject</span>
        </div>
        <span className="text-outline-variant/50">·</span>
        <div className="flex items-center gap-1">
          <HotkeyKeycap char="M" variant={activeHotkey === 'M' ? 'active' : 'default'} />
          <span className="ml-0.5 text-on-surface-variant">Reply</span>
        </div>
      </div>
    </div>
  );
}

