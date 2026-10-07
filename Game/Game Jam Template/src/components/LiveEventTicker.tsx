import { useState } from 'react';
import type { JamPhase } from '../types/jam';
import type { CountdownResult } from '../hooks/useJamCountdown';
import { soundFx } from '../lib/soundFx';
import { 
  Radio, 
  Clock, 
  Volume2, 
  VolumeX, 
  UploadCloud, 
  Users, 
  Wrench,
  Wifi,
  WifiOff 
} from 'lucide-react';

interface LiveEventTickerProps {
  phase: JamPhase;
  countdown: CountdownResult;
  participantCount: number;
  isConnected: boolean;
  onOpenSubmission: () => void;
  onOpenOrganizer: () => void;
}

export const LiveEventTicker = ({
  phase,
  countdown,
  participantCount,
  isConnected,
  onOpenSubmission,
  onOpenOrganizer,
}: LiveEventTickerProps) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFx.setMuted(nextMuted);
    if (!nextMuted) {
      soundFx.playUiClick(800);
    }
  };

  const getPhaseBadge = () => {
    switch (phase) {
      case 'COUNTDOWN_TO_REVEAL':
        return {
          label: 'COUNTDOWN TO REVEAL',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse'
        };
      case 'THEME_REVEAL':
        return {
          label: 'THEME UNVEILING BELL',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400 animate-ping'
        };
      case 'JAM_ACTIVE':
        return {
          label: 'LIVE HACKING SPRINT',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-pulse'
        };
      case 'SUBMISSION_BUFFER':
        return {
          label: 'SUBMISSION AIR-LOCK (GRACE)',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400 animate-ping'
        };
      case 'VOTING_PHASE':
        return {
          label: 'COMMUNITY VOTING',
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-400'
        };
      default:
        return {
          label: 'PRE-JAM REGISTRATION',
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400'
        };
    }
  };

  const badge = getPhaseBadge();

  return (
    <header className="sticky top-0 z-40 bg-[#08090D]/90 backdrop-blur-xl border-b border-[#222B42] px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand Emblem + Active Phase */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-display font-black text-sm tracking-wider text-white flex items-center gap-1.5">
                CYBER-JAM <span className="text-cyan-400">2026</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">STAGING COCKPIT</div>
            </div>
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold tracking-wide ${badge.color}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.label}
          </div>
        </div>

        {/* Center: Monospace Monotonic Countdown Display */}
        <div className="flex items-center gap-2 bg-[#0F121C] border border-[#222B42] px-4 py-1 rounded-xl shadow-inner">
          <Clock className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <div className="font-mono font-extrabold text-base md:text-xl tracking-wider text-white">
            {countdown.formattedClock}
          </div>
          <div className="text-[10px] font-mono text-slate-500 hidden md:block">
            .{Math.floor(countdown.milliseconds / 10).toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded ml-1 hidden lg:inline-block">
            NTP {countdown.roundTripLatencyMs}ms
          </span>
          <span 
            className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              isConnected 
                ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' 
                : 'text-amber-400 bg-amber-950/40 border-amber-800/40'
            }`}
            title={isConnected ? 'Connected to WebSocket Master Server' : 'Running in local fallback simulation'}
          >
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'WS' : 'LOCAL'}
          </span>
        </div>

        {/* Right: Actions, Audio, Telemetry, and CTAs */}
        <div className="flex items-center gap-2">
          {/* Jammers Count */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-[#171D2F] px-2.5 py-1.5 rounded-lg border border-[#222B42]">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{participantCount.toLocaleString()}</span>
            <span className="text-slate-500 text-[10px]">JAMMERS</span>
          </div>

          {/* Audio toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted 
                ? 'bg-[#171D2F] border-[#222B42] text-slate-500 hover:text-slate-300' 
                : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 shadow-sm'
            }`}
            title={isMuted ? 'Unmute Sound Synthesizer' : 'Mute Sound Synthesizer'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Organizer Mission Control Button */}
          <button
            onClick={() => {
              soundFx.playUiClick(850);
              onOpenOrganizer();
            }}
            className="px-3 py-1.5 bg-[#171D2F] hover:bg-[#222B42] text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            title="Open Organizer God-Mode Cockpit"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">CONTROL</span>
          </button>

          {/* Submission Air-Lock CTA */}
          <button
            onClick={() => {
              soundFx.playUiClick(900);
              onOpenSubmission();
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg text-xs font-mono font-bold tracking-wide shadow-lg shadow-rose-950/50 flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>AIR-LOCK</span>
          </button>
        </div>

      </div>
    </header>
  );
};
