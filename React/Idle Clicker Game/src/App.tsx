import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  TrendingUp,
  Flame,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useIdleSimulation } from './hooks/useIdleSimulation';
import { useGameWebSocket } from './hooks/useGameWebSocket';
import { HeaderBar } from './components/HeaderBar';
import { LeftCommandPane } from './components/LeftCommandPane';
import { RightAutomationDepot } from './components/RightAutomationDepot';
import { ReactorCanvas } from './components/ReactorCanvas';
import { UpgradesDrawer } from './components/UpgradesDrawer';
import { ConstellationModal } from './components/ConstellationModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { OfflineModal } from './components/OfflineModal';
import { formatBigNumber, toDecimal } from './lib/bigNumber';
import { Progress } from './components/ui/Progress';
import { Badge } from './components/ui/Badge';

export function App() {
  const {
    state,
    activeAnomalies,
    serverStatus,
    offlineGainModal,
    setOfflineGainModal,
    manualClick,
    buyGenerator,
    buyUpgrade,
    upgradePrestigePerk,
    collapseSingularity,
    catchAnomaly,
    updateSettings,
    updatePlayerHandle,
  } = useIdleSimulation();

  const {
    leaderboard,
    latestAnnouncement,
    refreshLeaderboard,
  } = useGameWebSocket();

  // Modals state
  const [upgradesOpen, setUpgradesOpen] = useState(false);
  const [constellationOpen, setConstellationOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'COMMAND' | 'CORE' | 'AUTOMATION'>('CORE');

  // Prestige collapse action with celebratory particle blast
  const handlePrestigeCollapse = async () => {
    const result = await collapseSingularity();
    if (result && result.success) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#06B6D4', '#F59E0B'],
      });
      setConstellationOpen(true);
    }
  };

  const purchasedUpgradesCount = Object.values(state.upgrades).filter((u) => u.isPurchased).length;
  const totalUpgradesCount = Object.values(state.upgrades).length;

  const isFrenzyActive = Boolean(state.activeFrenzy && state.activeFrenzy.expiresAt > Date.now());
  const frenzyRemainingSeconds = isFrenzyActive
    ? Math.max(0, Math.ceil((state.activeFrenzy!.expiresAt - Date.now()) / 1000))
    : 0;
  const frenzyPercent = isFrenzyActive
    ? Math.min(100, (frenzyRemainingSeconds / (state.activeFrenzy!.durationTotal / 1000)) * 100)
    : 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-canvas text-text-display overflow-hidden select-none cosmic-grid">
      {/* 1. Header Bar */}
      <HeaderBar
        playerHandle={state.playerHandle}
        onUpdateHandle={updatePlayerHandle}
        serverStatus={serverStatus}
        soundEnabled={state.settings.soundEnabled}
        onToggleSound={() => updateSettings({ soundEnabled: !state.settings.soundEnabled })}
        notation={state.settings.notation}
        onChangeNotation={(notation) => updateSettings({ notation })}
        onOpenLeaderboard={() => {
          refreshLeaderboard();
          setLeaderboardOpen(true);
        }}
        onOpenUpgrades={() => setUpgradesOpen(true)}
        onOpenConstellation={() => setConstellationOpen(true)}
        activeAnnouncement={latestAnnouncement}
        purchasedUpgradesCount={purchasedUpgradesCount}
        totalUpgradesCount={totalUpgradesCount}
        prestigeShards={state.prestigeCurrency}
      />

      {/* 2. Main Responsive 3-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Column (Command & Legacy Stats) */}
        <div
          className={`h-full ${
            mobileTab === 'COMMAND' ? 'flex' : 'hidden lg:flex'
          } shrink-0 z-20`}
        >
          <LeftCommandPane
            state={state}
            notation={state.settings.notation}
            onCollapseReactor={handlePrestigeCollapse}
            onOpenConstellation={() => setConstellationOpen(true)}
            onOpenLeaderboard={() => {
              refreshLeaderboard();
              setLeaderboardOpen(true);
            }}
            onToggleFloatingNumbers={() =>
              updateSettings({ floatingNumbers: !state.settings.floatingNumbers })
            }
          />
        </div>

        {/* Center Column (The Kinetic Reactor Core) */}
        <div
          className={`flex-1 flex flex-col justify-between items-center p-4 relative z-10 overflow-hidden ${
            mobileTab === 'CORE' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Top Big Currency & Rate Readout */}
          <div className="w-full max-w-xl text-center pt-2 flex flex-col items-center">
            {/* Live Per-Second Rate Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-sm mb-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-production-mint animate-pulse" />
              <span className="text-slate-400">Flux Rate:</span>
              <span className="text-emerald-400 font-extrabold text-sm">
                +{formatBigNumber(state.currencyPerSec, state.settings.notation)} / sec
              </span>
            </div>

            {/* Massive formatted currency tally */}
            <div className="relative group">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-mono font-extrabold tracking-tight bg-gradient-to-b from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-md">
                {formatBigNumber(state.currency, state.settings.notation)}
              </h2>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mt-1">
                Cosmic Energy Flux
              </span>
            </div>

            {/* Active Frenzy Countdown Bar */}
            {isFrenzyActive && (
              <div className="w-full max-w-md mt-3 p-2.5 rounded-xl bg-red-950/40 border border-red-500/50 shadow-glow-frenzy animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs font-mono text-red-300 mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Flame className="w-4 h-4 text-red-400 animate-bounce" />
                    {state.activeFrenzy?.label || 'OVERDRIVE ACTIVE'}
                  </span>
                  <span className="font-extrabold text-amber-300">
                    {frenzyRemainingSeconds}s REMAINING
                  </span>
                </div>
                <Progress
                  value={frenzyPercent}
                  indicatorColor="crimson"
                  className="h-2"
                />
              </div>
            )}
          </div>

          {/* Center Canvas: Interactive Spring Core & Anomaly Drifters */}
          <div className="flex-1 w-full flex items-center justify-center my-auto relative">
            <ReactorCanvas
              onCoreTap={manualClick}
              activeAnomalies={activeAnomalies}
              onCatchAnomaly={catchAnomaly}
              notation={state.settings.notation}
              floatingNumbersEnabled={state.settings.floatingNumbers}
              isFrenzyActive={isFrenzyActive}
              cpsString={state.currencyPerSec}
            />
          </div>

          {/* Bottom Telemetry HUD bar */}
          <div className="w-full max-w-lg pb-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Manual Power:</span>
              <span className="text-amber-300 font-bold">
                +{formatBigNumber(toDecimal(state.currencyPerSec).times(0.01).plus(1), state.settings.notation)} / tap
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Critical Tap Chance:</span>
              <span className="text-cyan-300 font-bold">
                {((0.03 + (state.prestigePerks['perk_critical_core']?.level || 0) * 0.05) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (Automation Depot & Generators) */}
        <div
          className={`h-full ${
            mobileTab === 'AUTOMATION' ? 'flex' : 'hidden lg:flex'
          } shrink-0 z-20`}
        >
          <RightAutomationDepot
            generators={state.generators}
            currency={state.currency}
            totalCps={state.currencyPerSec}
            notation={state.settings.notation}
            onBuyGenerator={buyGenerator}
            onOpenUpgrades={() => setUpgradesOpen(true)}
            purchasedUpgradesCount={purchasedUpgradesCount}
            totalUpgradesCount={totalUpgradesCount}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on small viewports) */}
      <div className="lg:hidden flex items-center justify-around p-2 glass-panel border-t border-slate-800 z-30">
        <button
          onClick={() => setMobileTab('COMMAND')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-mono ${
            mobileTab === 'COMMAND'
              ? 'text-purple-400 font-bold bg-purple-950/40'
              : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Ascension</span>
        </button>
        <button
          onClick={() => setMobileTab('CORE')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-lg text-xs font-mono ${
            mobileTab === 'CORE'
              ? 'text-amber-400 font-bold bg-amber-950/40'
              : 'text-slate-400'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Core</span>
        </button>
        <button
          onClick={() => setMobileTab('AUTOMATION')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-mono ${
            mobileTab === 'AUTOMATION'
              ? 'text-emerald-400 font-bold bg-emerald-950/40'
              : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Depot</span>
        </button>
      </div>

      {/* Modals & Dialogs */}
      <OfflineModal
        data={offlineGainModal}
        onClose={() => setOfflineGainModal(null)}
        notation={state.settings.notation}
      />

      <UpgradesDrawer
        open={upgradesOpen}
        onOpenChange={setUpgradesOpen}
        upgrades={state.upgrades}
        currency={state.currency}
        notation={state.settings.notation}
        onBuyUpgrade={buyUpgrade}
      />

      <ConstellationModal
        open={constellationOpen}
        onOpenChange={setConstellationOpen}
        perks={state.prestigePerks}
        prestigeShards={state.prestigeCurrency}
        onUpgradePerk={upgradePrestigePerk}
      />

      <LeaderboardModal
        open={leaderboardOpen}
        onOpenChange={setLeaderboardOpen}
        leaderboard={leaderboard}
        currentPlayerId={state.playerId}
        notation={state.settings.notation}
        onRefresh={refreshLeaderboard}
      />
    </div>
  );
}

export default App;
