import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from './services/telemetryStore';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/views/OverviewView';
import { ActivityView } from './components/views/ActivityView';
import { RecordsView } from './components/views/RecordsView';
import { GoalsView } from './components/views/GoalsView';
import { InsightsView } from './components/views/InsightsView';
import { RecapView } from './components/views/RecapView';
import { FriendsCompareView } from './components/views/FriendsCompareView';
import { SettingsView } from './components/views/SettingsView';
import { SessionDetailDrawer } from './components/common/SessionDetailDrawer';
import { StatExplanationModal } from './components/common/StatExplanationModal';
import { TableTwinModal } from './components/common/TableTwinModal';
import { InsightWhyModal } from './components/common/InsightWhyModal';
import { SeasonWrappedModal } from './components/views/SeasonWrappedModal';
import { CoreStatMetric } from './types/telemetry';

export function App() {
  const store = useTelemetryStore();

  // Active navigation tab (synced with URL)
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as NavTab;
    if (tabParam && ['overview', 'activity', 'records', 'goals', 'insights', 'recap', 'friends', 'settings'].includes(tabParam)) {
      return tabParam;
    }
    return 'overview';
  });

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Season Wrapped modal trigger
  const [seasonWrappedOpen, setSeasonWrappedOpen] = useState(false);

  // Tab Title helper
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'overview': return 'Executive Overview';
      case 'activity': return 'Session Telemetry & Heatmap';
      case 'records': return 'Personal Records & Milestones';
      case 'goals': return 'Goals & Forgiving Streaks';
      case 'insights': return 'Combat Cognition Insights';
      case 'recap': return 'Weekly Debrief & Social Card';
      case 'friends': return 'Duo Mutual Comparison';
      case 'settings': return 'Privacy & Data Sovereignty';
    }
  };

  // Find stat for explanation modal
  const explainingStat = store.coreStats.find(s => s.id === store.explainingStatId) || null;

  // 30-day baseline averages for session comparison
  const thirtyDayAvgKd = store.coreStats.find(s => s.id === 'kd')?.currentValue || 1.84;
  const thirtyDayAvgAccuracy = store.coreStats.find(s => s.id === 'accuracy')?.currentValue || 42.6;
  const thirtyDayAvgDamage = store.coreStats.find(s => s.id === 'damage')?.currentValue || 2410;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Skip to Content Link (Accessibility requirement) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-cyan-400 text-black font-bold font-['Space_Grotesk'] rounded"
      >
        Skip to main content
      </a>

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        player={store.player}
        scenario={store.scenario}
        onOpenSeasonWrapped={() => setSeasonWrappedOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-16 md:pb-8">
        {/* Top Header */}
        <Header
          period={store.period}
          setPeriod={store.setPeriod}
          scenario={store.scenario}
          setScenario={store.setScenario}
          onOpenTableTwin={() => store.setTableTwinOpen(true)}
          onOpenSeasonWrapped={() => setSeasonWrappedOpen(true)}
          activeTabTitle={getTabTitle(activeTab)}
        />

        {/* Content View Container (Centered, max-width 1280px per layout specification) */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              scenario={store.scenario}
              flightRecorderDays={store.flightRecorderDays}
              coreStats={store.coreStats}
              recentSessions={store.allSessions}
              records={store.records}
              milestones={store.milestones}
              streakDays={store.streak.currentStreakDays}
              wasStreakForgiven={store.streak.wasForgiven}
              weeklyPlaytimeHours={store.weeklyPlaytimeHours}
              showPlaytimeAwareness={store.showPlaytimeAwareness}
              setShowPlaytimeAwareness={store.setShowPlaytimeAwareness}
              selectedDate={store.selectedDateFilter}
              onSelectDate={(d) => store.setSelectedDateFilter(d)}
              onSelectSession={(id) => store.setSelectedSessionId(id)}
              onExplainStat={(id) => store.setExplainingStatId(id)}
              onOpenWhy={() => store.setInsightWhyDrawerOpen(true)}
              onOpenTableTwin={() => store.setTableTwinOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityView
              sessions={store.allSessions}
              heatmapDays={store.heatmapDays}
              selectedDate={store.selectedDateFilter}
              onSelectDate={(d) => store.setSelectedDateFilter(d)}
              onSelectSession={(id) => store.setSelectedSessionId(id)}
              onOpenTableTwin={() => store.setTableTwinOpen(true)}
            />
          )}

          {activeTab === 'records' && (
            <RecordsView
              records={store.records}
              milestones={store.milestones}
              onSelectSession={(id) => store.setSelectedSessionId(id)}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsView
              goals={store.goals}
              onAddGoal={store.addGoal}
              onDeleteGoal={store.deleteGoal}
              onToggleGoalStatus={store.toggleGoalStatus}
              streak={store.streak}
              onUseStreakFreeze={store.useStreakFreeze}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsView
              insights={store.insights}
              onDismissInsight={(id) => {
                store.setInsights(prev => prev.map(i => i.id === id ? { ...i, dismissed: true } : i));
              }}
              onOpenWhy={() => store.setInsightWhyDrawerOpen(true)}
            />
          )}

          {activeTab === 'recap' && (
            <RecapView
              recap={store.weeklyRecap}
              player={store.player}
              onSelectSession={(id) => store.setSelectedSessionId(id)}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsCompareView
              friend={store.friendComparison}
              player={store.player}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              player={store.player}
              setPlayer={store.setPlayer}
              annotations={store.annotations}
              onAddAnnotation={store.addAnnotation}
              onDeleteAnnotation={store.deleteAnnotation}
              onExportJSON={store.exportAsJSON}
              onExportCSV={store.exportAsCSV}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}

      {/* 1. Session Detail Drawer */}
      <SessionDetailDrawer
        session={store.selectedSession}
        onClose={() => store.setSelectedSessionId(null)}
        thirtyDayAvgKd={thirtyDayAvgKd}
        thirtyDayAvgAccuracy={thirtyDayAvgAccuracy}
        thirtyDayAvgDamage={thirtyDayAvgDamage}
      />

      {/* 2. Stat Explanation Audit Modal (Decision 3) */}
      <StatExplanationModal
        stat={explainingStat}
        onClose={() => store.setExplainingStatId(null)}
        onSelectSession={(id) => store.setSelectedSessionId(id)}
      />

      {/* 3. Accessible Table Twin Modal (Frontend Idea 3) */}
      <TableTwinModal
        isOpen={store.tableTwinOpen}
        onClose={() => store.setTableTwinOpen(false)}
        flightRecorderDays={store.flightRecorderDays}
        coreStats={store.coreStats}
      />

      {/* 4. Why Supporting Evidence Modal (Decision 2) */}
      <InsightWhyModal
        isOpen={store.insightWhyDrawerOpen}
        onClose={() => store.setInsightWhyDrawerOpen(false)}
        onViewActivity={() => setActiveTab('activity')}
      />

      {/* 5. Season Wrapped Modal (P2 Story View) */}
      <SeasonWrappedModal
        isOpen={seasonWrappedOpen}
        onClose={() => setSeasonWrappedOpen(false)}
        player={store.player}
        recap={store.weeklyRecap}
      />
    </div>
  );
}

export default App;
