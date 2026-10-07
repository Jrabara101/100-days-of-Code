import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, Zap, ShieldAlert, RotateCcw, Swords, Compass, Hammer, Eye } from 'lucide-react';
import { playUiTick } from '../audio/soundEffects';

interface TelemetryDockProps {
  onSendTelemetry: (event: string, metadata?: Record<string, any>) => Promise<any>;
  onResetSystem: () => Promise<any>;
}

export const TelemetryDock: React.FC<TelemetryDockProps> = ({
  onSendTelemetry,
  onResetSystem
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const handleAction = async (label: string, event: string, metadata: Record<string, any> = {}) => {
    playUiTick();
    const res = await onSendTelemetry(event, metadata);
    if (res) {
      if (res.tamperAlert) {
        setLastResponse(`⚠️ [ANTI-TAMPER]: ${res.tamperAlert}`);
      } else if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
        setLastResponse(`🏆 [UNLOCKED]: ${res.newlyUnlocked.join(', ')} (+${res.receipts?.length || 0} Receipts Issued)`);
      } else {
        setLastResponse(`⚡ [TELEMETRY ACK]: Ingested '${event}'. State evaluated.`);
      }
    }
  };

  const handleSimulateAttack = async () => {
    playUiTick();
    setIsSimulatingBurst(true);
    setLastResponse('🚨 Launching spoofed out-of-order packet burst attack to test anti-tamper engine...');

    // Intentionally send sequence number regression to trigger anti-tamper rules
    try {
      const res = await fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'BOSS_DEFEATED',
          metadata: { bossId: 'dragon_01', noDamage: true },
          sequenceNumber: 5, // Regression behind last sequence!
          clientTimestamp: Date.now() - 500000,
          sessionId: 'spoofed-attacker-session'
        })
      });
      const data = await res.json();
      if (data.tamperAlert) {
        setLastResponse(`🛡️ [DEFENSE ACTIVE]: ${data.tamperAlert}`);
      }
    } catch (err: any) {
      setLastResponse(`Server rejection caught: ${err.message}`);
    } finally {
      setIsSimulatingBurst(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-auto">
      {/* Drawer Toggle Header Bar */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#0E1424]/95 border-t border-x border-slate-800 rounded-t-2xl p-2.5 backdrop-blur-xl shadow-[0_-5px_25px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                playUiTick();
                setIsOpen(!isOpen);
              }}
              className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 hover:text-purple-300 transition-colors"
            >
              <Terminal size={15} className="text-purple-400" />
              <span>GAMEPLAY EVENT TELEMETRY DOCK (LIVE SIMULATOR)</span>
              {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {lastResponse && (
              <span className="hidden sm:inline-block text-[11px] font-mono text-purple-300 truncate max-w-md bg-slate-950/80 px-2.5 py-0.5 rounded border border-purple-900/40">
                {lastResponse}
              </span>
            )}

            <button
              onClick={() => {
                playUiTick();
                onResetSystem();
                setLastResponse('System reinitialized to benchmark baseline.');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] font-mono transition-all"
              title="Reset state to initial benchmark"
            >
              <RotateCcw size={11} />
              <span>Reset State</span>
            </button>
          </div>

          {/* Expanded Simulation Action Console */}
          {isOpen && (
            <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                
                {/* Combat Events */}
                <button
                  onClick={() => handleAction('Defeat Dragon', 'BOSS_DEFEATED', { bossId: 'dragon_01', noDamage: true, comboFinish: true })}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-600/50 text-slate-200 text-xs font-mono transition-all text-left"
                >
                  <Swords size={13} className="text-amber-400" />
                  <span className="truncate">Slay Dragon (Flawless)</span>
                </button>

                <button
                  onClick={() => handleAction('Increase Combo', 'COMBO_INCREASED', { count: 500 })}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-200 text-xs font-mono transition-all text-left"
                >
                  <Zap size={13} className="text-yellow-400" />
                  <span className="truncate">Hit 500x Hyper Combo</span>
                </button>

                {/* Exploration Events */}
                <button
                  onClick={() => handleAction('Discover Apex Beacon', 'BEACON_DISCOVERED', { sector: 'apex' })}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-200 text-xs font-mono transition-all text-left"
                >
                  <Compass size={13} className="text-emerald-400" />
                  <span className="truncate">Discover Apex Beacon</span>
                </button>

                <button
                  onClick={() => handleAction('Complete Orbital Drop', 'ORBITAL_DROP_COMPLETED', { altitude: 80000, landedCleanly: true })}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-600/50 text-slate-200 text-xs font-mono transition-all text-left"
                >
                  <Compass size={13} className="text-amber-400" />
                  <span className="truncate">Stick Orbital Drop</span>
                </button>

                {/* Mastery & Secrets Events */}
                <button
                  onClick={() => handleAction('Synthesize Purity 99%', 'ARTIFACT_SYNTHESIZED', { purity: 99 })}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-200 text-xs font-mono transition-all text-left"
                >
                  <Hammer size={13} className="text-purple-400" />
                  <span className="truncate">Synthesize Exotic Alloy</span>
                </button>

                <button
                  onClick={() => handleAction('Solve Terminal Cipher', 'TERMINAL_CIPHER_SOLVED', { frequency: 108.4, code: '0xFF_CIPHER' })}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-200 text-xs font-mono transition-all text-left"
                >
                  <Eye size={13} className="text-fuchsia-400" />
                  <span className="truncate">Decrypt Terminal Secret</span>
                </button>

                <button
                  onClick={() => handleAction('Sacrifice Infinity Core', 'CORE_SACRIFICED', { coreType: 'infinity' })}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/50 text-slate-200 text-xs font-mono transition-all text-left"
                >
                  <Zap size={13} className="text-purple-400" />
                  <span className="truncate">Feed Singularity Core</span>
                </button>

                {/* Anti-Tamper Attack Test */}
                <button
                  onClick={handleSimulateAttack}
                  disabled={isSimulatingBurst}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 text-xs font-mono transition-all text-left"
                >
                  <ShieldAlert size={13} className="text-rose-400" />
                  <span className="truncate">Simulate Spoof Attack</span>
                </button>

              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Evaluator: Fastify Authoritative Rule Engine + Monotonic Sequence Verification</span>
                <span className="text-purple-400">All actions emit signed tamper-resistant receipts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
