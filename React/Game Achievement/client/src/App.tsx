import React, { useMemo } from 'react';
import { useAchievementTracker } from './hooks/useAchievementTracker';
import { TopNavHUD } from './components/TopNavHUD';
import { FlexPlinth } from './components/FlexPlinth';
import { AchievementGrid } from './components/AchievementGrid';
import { AchievementDrawer } from './components/AchievementDrawer';
import { LootVaultModal } from './components/LootVaultModal';
import { TrophyPassportModal } from './components/TrophyPassportModal';
import { TelemetryDock } from './components/TelemetryDock';
import { ToastNotification } from './components/ToastNotification';
import { Sparkles, Trophy, ShieldCheck, Flame, Compass, Cpu, Lock } from 'lucide-react';

export function App() {
  const {
    state,
    isLoading,
    isConnected,
    toasts,
    claimingId,
    rewardModalAch,
    isPassportOpen,
    setRewardModalAch,
    setIsPassportOpen,
    setCategory,
    setSearch,
    selectAchievement,
    togglePin,
    claimReward,
    sendTelemetry,
    resetSystem,
    dismissToast
  } = useAchievementTracker();

  // Find currently selected achievement for the drawer
  const selectedAchievement = useMemo(() => {
    if (!state.selectedAchievementId) return null;
    return state.achievements[state.selectedAchievementId] || null;
  }, [state.selectedAchievementId, state.achievements]);

  // Extract pinned achievements for the Flex Plinth
  const pinnedAchievements = useMemo(() => {
    return state.pinnedIds
      .map(id => state.achievements[id])
      .filter(Boolean);
  }, [state.pinnedIds, state.achievements]);

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F8FAFC] flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200 relative pb-28">
      
      {/* Neo-Vault Ambient Backdrop Glow Conduits */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-20 left-10 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Ribbon & Telemetry HUD */}
      <TopNavHUD
        state={state}
        isConnected={isConnected}
        onSelectCategory={setCategory}
        onOpenPassport={() => setIsPassportOpen(true)}
      />

      {/* Main Command Center Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full relative z-10">
        
        {/* Hero Banner / Codex Overview */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0E1424] via-[#141C30]/90 to-[#0E1424] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold tracking-wider uppercase">
                PROGRESSION VAULT CODEX
              </span>
              <span className="text-xs text-slate-500 font-mono">v2.4 Production Engine</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-100 tracking-tight">
              Trophy Command Center & Achievement Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Living trophies with dynamic step tracking, holographic tier evolutions, and server-authoritative event verification. Claim milestones to crack the reward vault.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPassportOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all active:scale-95 flex items-center gap-2"
            >
              <Trophy size={14} />
              <span>EXPORT PASSPORT</span>
            </button>
          </div>
        </div>

        {/* Personalized Flex Plinth Showcase Strip */}
        <FlexPlinth
          pinnedAchievements={pinnedAchievements}
          onSelectAchievement={selectAchievement}
          onUnpin={togglePin}
        />

        {/* Main Achievement Grid & Search Controls */}
        <AchievementGrid
          achievements={state.achievements}
          activeCategory={state.activeCategory}
          onSelectAchievement={selectAchievement}
          onTogglePin={togglePin}
          onClaimReward={claimReward}
          claimingId={claimingId}
        />

      </main>

      {/* Slide-out Badge Details & Reward Drawer (shadcn Sheet) */}
      <AchievementDrawer
        item={selectedAchievement}
        isOpen={Boolean(state.selectedAchievementId)}
        onClose={() => selectAchievement(null)}
        onTogglePin={togglePin}
        onClaimReward={claimReward}
        isClaiming={claimingId === selectedAchievement?.id}
      />

      {/* Celebratory Loot Vault Sequence Modal */}
      <LootVaultModal
        achievement={rewardModalAch}
        onClose={() => setRewardModalAch(null)}
      />

      {/* Shareable Trophy Passport Modal */}
      <TrophyPassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
      />

      {/* Floating Milestone & Anti-Tamper Toast Banners */}
      <ToastNotification
        toasts={toasts}
        onDismiss={dismissToast}
      />

      {/* Collapsible Interactive Telemetry Action Simulator Dock */}
      <TelemetryDock
        onSendTelemetry={sendTelemetry}
        onResetSystem={resetSystem}
      />

    </div>
  );
}

export default App;
