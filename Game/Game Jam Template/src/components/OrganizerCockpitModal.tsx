import { useState } from 'react';
import type { JamPhase, AnnouncementPriority } from '../types/jam';
import { soundFx } from '../lib/soundFx';
import { 
  Wrench, 
  Radio, 
  Flame, 
  Clock, 
  Dices, 
  AlertTriangle, 
  X,
  Zap 
} from 'lucide-react';

interface OrganizerCockpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhase: JamPhase;
  themeRevealed: boolean;
  onSetPhase: (phase: JamPhase, targetEndTime?: number) => void;
  onRevealTheme: () => void;
  onBroadcast: (ann: { title: string; content: string; priority: AnnouncementPriority }) => void;
  onAddWildcard: (rule: string) => void;
}

export const OrganizerCockpitModal = ({
  isOpen,
  onClose,
  currentPhase,
  themeRevealed,
  onSetPhase,
  onRevealTheme,
  onBroadcast,
  onAddWildcard
}: OrganizerCockpitModalProps) => {
  const [broadcastTitle, setBroadcastTitle] = useState<string>('SUBMISSION AIR-LOCK OPENS IN 15 MINUTES');
  const [broadcastContent, setBroadcastContent] = useState<string>('Prepare your build archives! Ensure WebGL builds run without CORS or WebAssembly crashes.');
  const [broadcastPriority, setBroadcastPriority] = useState<AnnouncementPriority>('critical');

  const [customWildcard, setCustomWildcard] = useState<string>('Gravity Inversion: Jump inverted on every 3rd combo hit.');

  if (!isOpen) return null;

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) return;

    soundFx.playUiClick(1000);
    onBroadcast({
      title: broadcastTitle.trim(),
      content: broadcastContent.trim(),
      priority: broadcastPriority
    });
  };

  const handleAddWildcardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWildcard.trim()) return;

    soundFx.playUiClick(850);
    onAddWildcard(`🎲 ${customWildcard.trim()}`);
    setCustomWildcard('');
  };

  const handleFastForwardToZero = () => {
    soundFx.playUiClick(900);
    // Set 8 seconds remaining so user can watch the countdown hit zero and trigger the unmasking bell!
    onSetPhase('COUNTDOWN_TO_REVEAL', Date.now() + 8000);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#0F121C] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 glow-gold">
        
        {/* Cockpit Header */}
        <div className="flex items-center justify-between border-b border-[#222B42] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-xl text-white tracking-wide">
                  ORGANIZER COCKPIT // MISSION CONTROL
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                  GOD-MODE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Authoritative event master controls. Jump phases, broadcast emergency sirens, unmask themes.
              </p>
            </div>
          </div>

          <button
            onClick={() => { soundFx.playUiClick(500); onClose(); }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#171D2F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Fast State Machine Phase Hopper */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> JAM LIFECYCLE FINITE STATE MACHINE (FSM)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { phase: 'PRE_JAM' as JamPhase, label: '1. PRE-JAM' },
              { phase: 'COUNTDOWN_TO_REVEAL' as JamPhase, label: '2. REVEAL COUNTDOWN' },
              { phase: 'THEME_REVEAL' as JamPhase, label: '3. THEME UNVEIL' },
              { phase: 'JAM_ACTIVE' as JamPhase, label: '4. LIVE HACKING' },
              { phase: 'SUBMISSION_BUFFER' as JamPhase, label: '5. SUBMISSION GRACE' },
              { phase: 'VOTING_PHASE' as JamPhase, label: '6. COMMUNITY VOTING' },
            ].map(({ phase, label }) => (
              <button
                key={phase}
                onClick={() => {
                  soundFx.playUiClick(800);
                  onSetPhase(phase);
                }}
                className={`p-2.5 rounded-lg border text-xs font-mono transition-all text-left ${
                  currentPhase === phase
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold ring-1 ring-cyan-500'
                    : 'border-[#222B42] bg-[#171D2F] text-slate-300 hover:border-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Zero-Hour Countdown Simulator */}
        <div className="p-4 rounded-xl bg-[#08090D] border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-xs text-amber-400 font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" /> SIMULATE ZERO-HOUR BELL CLIMAX
            </div>
            <p className="text-xs text-slate-400 max-w-md mt-0.5">
              Sets authoritative server clock to 8 seconds remaining so you can witness the zero-hour reveal, screen shake, fanfare, and confetti burst live!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFastForwardToZero}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 rounded-lg text-xs font-mono font-bold tracking-wider shadow-lg shadow-amber-950/40 flex items-center gap-1.5"
            >
              SET TO 8s TO ZERO
            </button>
            <button
              onClick={() => {
                soundFx.playUiClick(950);
                onRevealTheme();
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 border ${
                themeRevealed
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {themeRevealed ? 'THEME UNVEILED (RE-TRIGGER)' : 'FORCE INSTANT UNVEIL'}
            </button>
          </div>
        </div>

        {/* 3. Push Live Transmission Broadcast */}
        <form onSubmit={handleBroadcastSubmit} className="space-y-3 p-4 rounded-xl bg-[#171D2F] border border-[#222B42]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> PUSH LIVE TRANSMISSION BROADCAST
            </span>
            <div className="flex items-center gap-1.5">
              {(['info', 'important', 'critical', 'wildcard'] as AnnouncementPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setBroadcastPriority(p)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase border ${
                    broadcastPriority === p
                      ? 'bg-rose-500 text-white border-rose-400 font-bold'
                      : 'bg-[#08090D] text-slate-400 border-[#222B42]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            required
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="Broadcast headline..."
            className="w-full bg-[#08090D] border border-[#222B42] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-sans"
          />

          <textarea
            rows={2}
            value={broadcastContent}
            onChange={(e) => setBroadcastContent(e.target.value)}
            placeholder="Detailed broadcast content..."
            className="w-full bg-[#08090D] border border-[#222B42] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-sans"
          />

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] font-mono text-slate-400">
              * Critical priority triggers screen vignette and siren audio alert.
            </span>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> PUSH TRANSMISSION
            </button>
          </div>
        </form>

        {/* 4. Drop Custom Wildcard */}
        <form onSubmit={handleAddWildcardSubmit} className="space-y-2">
          <label className="block text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Dices className="w-3.5 h-3.5 text-purple-400" /> INJECT NEW WILDCARD MODIFIER
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customWildcard}
              onChange={(e) => setCustomWildcard(e.target.value)}
              placeholder="e.g. Inverted Controls / No Jumping..."
              className="flex-1 bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold"
            >
              ADD MODIFIER
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-2 border-t border-[#222B42] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#171D2F] hover:bg-[#222B42] text-slate-300 rounded-lg text-xs font-mono"
          >
            CLOSE MISSION CONTROL
          </button>
        </div>

      </div>
    </div>
  );
};
