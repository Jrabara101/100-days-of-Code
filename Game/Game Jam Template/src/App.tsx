import { useState, useEffect } from 'react';
import { useJamSocket } from './hooks/useJamSocket';
import { useJamCountdown } from './hooks/useJamCountdown';
import { LiveEventTicker } from './components/LiveEventTicker';
import { ThemeRevealModule } from './components/ThemeRevealModule';
import { BroadcastFeed } from './components/BroadcastFeed';
import { AssetStudioDock } from './components/AssetStudioDock';
import { TeamMatchmakingDock } from './components/TeamMatchmakingDock';
import { SubmissionCountdownDrawer } from './components/SubmissionCountdownDrawer';
import { OrganizerCockpitModal } from './components/OrganizerCockpitModal';
import { soundFx } from './lib/soundFx';
import { 
  Sparkles, 
  Flame, 
  Terminal, 
  Zap, 
  ShieldAlert 
} from 'lucide-react';

export function App() {
  const {
    jamState,
    jammers,
    isConnected,
    criticalVignetteActive,
    lastSubmissionReceipt,
    setPhase,
    revealTheme,
    broadcastAnnouncement,
    addWildcard,
    createJammerBeacon,
    submitToAirlock,
    sendNtpPing,
    registerNtpHandler
  } = useJamSocket();

  const [isSubmissionOpen, setIsSubmissionOpen] = useState<boolean>(false);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState<boolean>(false);

  // Authoritative countdown hook
  const countdown = useJamCountdown({
    targetEndTime: jamState.targetEndTime,
    serverTimeHint: jamState.serverTime,
    sendNtpPing,
    onZeroHour: () => {
      // Trigger zero-hour theme unmask if still encrypted
      if (!jamState.themeRevealed) {
        revealTheme();
      }
    }
  });

  // Connect NTP pong handler
  useEffect(() => {
    registerNtpHandler(countdown.handleNtpPong);
  }, [registerNtpHandler, countdown.handleNtpPong]);

  return (
    <div className={`min-h-screen bg-[#08090D] text-slate-100 cyber-grid relative ${
      criticalVignetteActive ? 'screen-vignette-critical' : ''
    }`}>
      
      {/* Critical Emergency Banner if active */}
      {criticalVignetteActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white font-mono font-bold text-xs py-1.5 px-4 text-center tracking-widest uppercase animate-pulse shadow-xl flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 animate-spin-slow" />
          <span>EMERGENCY DISPATCH: CRITICAL TRANSMISSION RECEIVED // CHECK RADAR FEED</span>
        </div>
      )}

      {/* 1. Live Event Telemetry Ticker (Root Navigation Bar) */}
      <LiveEventTicker
        phase={jamState.currentPhase}
        countdown={countdown}
        participantCount={jamState.participantCount}
        isConnected={isConnected}
        onOpenSubmission={() => setIsSubmissionOpen(true)}
        onOpenOrganizer={() => setIsOrganizerOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {/* Hero Event Banner / Stage Header */}
        <div className="relative rounded-2xl border border-[#222B42] bg-gradient-to-br from-[#0F121C] via-[#171D2F] to-[#0B0D14] p-6 lg:p-10 shadow-2xl overflow-hidden glow-cyan">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 48-HOUR GLOBAL SPEEDRUN
                </span>
                <span className="text-slate-400">
                  SERVER STATUS: {isConnected ? 'SYNCED TO MASTER WS' : 'LOCAL MONOTONIC RUNTIME'}
                </span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-none">
                {jamState.jamName}
              </h1>

              <p className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed">
                The browser-native event staging cockpit for organizers and game creators. Synchronized zero-hour theme unmasking, client-side poster & banner forge, priority emergency dispatches, and cryptographic air-lock submissions.
              </p>

              {/* Quick Jump Action Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href="#theme-reveal"
                  onClick={() => soundFx.playUiClick(700)}
                  className="px-3.5 py-2 rounded-lg bg-[#171D2F] hover:bg-cyan-950/40 border border-[#222B42] hover:border-cyan-500/50 text-xs font-mono text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> UNVEILING BELL
                </a>

                <a
                  href="#poster-forge"
                  onClick={() => soundFx.playUiClick(700)}
                  className="px-3.5 py-2 rounded-lg bg-[#171D2F] hover:bg-rose-950/40 border border-[#222B42] hover:border-rose-500/50 text-xs font-mono text-rose-300 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" /> POSTER & BANNER FORGE
                </a>

                <a
                  href="#jammer-radar"
                  onClick={() => soundFx.playUiClick(700)}
                  className="px-3.5 py-2 rounded-lg bg-[#171D2F] hover:bg-emerald-950/40 border border-[#222B42] hover:border-emerald-500/50 text-xs font-mono text-emerald-300 transition-colors flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> JAMMER RADAR
                </a>
              </div>
            </div>

            {/* Right Telemetry Card */}
            <div className="bg-[#08090D]/90 border border-[#222B42] p-5 rounded-xl space-y-3 font-mono text-xs w-full lg:w-72 shrink-0 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#222B42] pb-2 text-slate-400">
                <span>EVENT TELEMETRY</span>
                <span className="text-emerald-400">● LIVE</span>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">JAM ID:</span>
                  <span className="text-cyan-400 font-bold">#NEO-2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ACTIVE PHASE:</span>
                  <span className="text-amber-400 font-bold">{jamState.currentPhase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NTP DRIFT OFFSET:</span>
                  <span className="text-slate-200">{countdown.clockDriftOffsetMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">JAMMERS REGISTERED:</span>
                  <span className="text-white font-bold">{jamState.participantCount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#222B42]">
                <button
                  onClick={() => setIsOrganizerOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" /> OPEN MISSION CONTROL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Staging Split: Left Stage (Theme Reveal & Broadcast Feed) & Right Stage (Asset Forge) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (60% ~ 7 cols): Theme Reveal Module & Priority Feed */}
          <div className="lg:col-span-7 space-y-8">
            {/* The Unveiling Bell */}
            <ThemeRevealModule
              themeRevealed={jamState.themeRevealed}
              themeKeyword={jamState.themeKeyword}
              themeTagline={jamState.themeTagline}
              wildcardRules={jamState.wildcardRules}
              countdown={countdown}
              onTriggerReveal={revealTheme}
            />

            {/* Live Transmission Feed */}
            <BroadcastFeed announcements={jamState.announcements} />
          </div>

          {/* Right Column (40% ~ 5 cols): Poster & Banner Forge */}
          <div className="lg:col-span-5">
            <AssetStudioDock
              currentThemeKeyword={jamState.themeKeyword}
              currentThemeTagline={jamState.themeTagline}
            />
          </div>

        </div>

        {/* 3. Team Matchmaking Matrix ("Jammer Radar") */}
        <TeamMatchmakingDock
          jammers={jammers}
          onCreateBeacon={createJammerBeacon}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-[#222B42] bg-[#0F121C] py-8 px-4 text-center font-mono text-xs text-slate-500 space-y-2 mt-16">
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <span>CYBER-JAM 2026 EVENT STAGING PLATFORM</span>
          <span>•</span>
          <span>VITE + REACT + TYPESCRIPT + FASTIFY/WS</span>
          <span>•</span>
          <span>HIGH-DPI CANVAS FORGE</span>
        </div>
        <p className="text-slate-600">
          Authoritative Monotonic Clock Synchronization. Zero external image rendering dependencies.
        </p>
      </footer>

      {/* Persistent Submission Air-Lock Modal Drawer */}
      <SubmissionCountdownDrawer
        isOpen={isSubmissionOpen}
        onClose={() => setIsSubmissionOpen(false)}
        countdown={countdown}
        lastReceipt={lastSubmissionReceipt}
        onSubmit={submitToAirlock}
      />

      {/* Organizer Mission Control Cockpit Modal */}
      <OrganizerCockpitModal
        isOpen={isOrganizerOpen}
        onClose={() => setIsOrganizerOpen(false)}
        currentPhase={jamState.currentPhase}
        themeRevealed={jamState.themeRevealed}
        onSetPhase={setPhase}
        onRevealTheme={revealTheme}
        onBroadcast={broadcastAnnouncement}
        onAddWildcard={addWildcard}
      />

    </div>
  );
}

export default App;
