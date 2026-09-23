import React, { useEffect } from 'react';
import { useContactStore } from '../store/useContactStore';
import { Terminal, Bell, Cpu, HardDrive, Wifi } from 'lucide-react';
import { formatMs } from '../lib/utils';

interface TopTelemetryHeaderProps {
  onOpenCommand: () => void;
  onToggleActivity: () => void;
  isActivityOpen: boolean;
}

export const TopTelemetryHeader: React.FC<TopTelemetryHeaderProps> = ({
  onOpenCommand,
  onToggleActivity,
  isActivityOpen,
}) => {
  const queryLatencyMs = useContactStore((state) => state.queryLatencyMs);
  const fps = useContactStore((state) => state.fps);
  const setFps = useContactStore((state) => state.setFps);
  const memoryMb = useContactStore((state) => state.memoryMb);
  const previousState = useContactStore((state) => state.previousState);

  // Simple RAF-based real FPS tracker
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.min(60, Math.round((frameCount * 1000) / (now - lastTime))));
        frameCount = 0;
        lastTime = now;
      }
      animationFrameId = requestAnimationFrame(measureFps);
    };

    animationFrameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationFrameId);
  }, [setFps]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_1px_12px_rgba(0,0,0,0.6)] flex items-center justify-between px-4 select-none">
      {/* Left Engine Branding & Telemetry */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            KINETIC // DIRECTORY ENGINE
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono rounded bg-primary-container/20 text-primary border border-primary-container/30">
            v2.4
          </span>
        </div>

        <div className="h-4 w-[1px] bg-surface-variant hidden md:block" />

        {/* Trie Latency */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-low rounded border border-outline-variant/20">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
          <span className="font-mono text-[11px] text-tertiary">
            TRIE: {formatMs(queryLatencyMs)}
          </span>
        </div>

        {/* GPU 60 FPS */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-low rounded border border-outline-variant/20">
          <Cpu className="w-3 h-3 text-outline" />
          <span className="font-mono text-[11px] text-on-surface-variant">GPU</span>
          <span className="font-mono text-[11px] font-semibold text-primary-container">
            {fps} FPS
          </span>
        </div>

        {/* Memory Footprint */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-low rounded border border-outline-variant/20">
          <HardDrive className="w-3 h-3 text-outline" />
          <span className="font-mono text-[11px] text-on-surface-variant">MEM</span>
          <span className="font-mono text-[11px] text-on-surface">
            {memoryMb} MB
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Shortcut Button */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high transition-all active:scale-95"
          title="Open Command Dialog (Cmd+K)"
        >
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-xs text-on-surface-variant hidden sm:inline">
            Command
          </span>
          <kbd className="font-mono text-[10px] text-primary px-1.5 py-0.5 bg-surface-container-lowest rounded shadow-inner">
            ⌘K
          </kbd>
        </button>

        {/* Netcode Sync Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-low rounded-lg border border-outline-variant/20">
          <Wifi className={`w-3.5 h-3.5 ${previousState ? 'text-amber-400 animate-spin' : 'text-tertiary'}`} />
          <span className="font-mono text-[11px] text-on-surface-variant hidden md:inline">
            NET:
          </span>
          <span className={`font-mono text-[11px] font-medium ${previousState ? 'text-amber-400' : 'text-tertiary'}`}>
            {previousState ? 'SYNCING...' : 'SYNCED'}
          </span>
        </div>

        {/* Activity Stream Drawer Button */}
        <button
          onClick={onToggleActivity}
          className={`p-1.5 rounded-lg border transition-all ${
            isActivityOpen
              ? 'bg-primary-container text-on-primary-container border-primary-container shadow-[0_0_10px_rgba(34,211,238,0.4)]'
              : 'border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Toggle Mutation Activity Log"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Node Badge */}
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono text-xs font-bold">
          Ω
        </div>
      </div>
    </header>
  );
};
