import React from 'react';
import { DiscussionProvider, useDiscussion } from './context/DiscussionContext';
import ArticleStage from './components/ArticleStage/ArticleStage';
import LivePresenceBar from './components/SalonHeader/LivePresenceBar';
import TimeTravelBanner from './components/SalonHeader/TimeTravelBanner';
import DiscussionSnapshot from './components/SalonHeader/DiscussionSnapshot';
import TemperatureCheck from './components/SalonHeader/TemperatureCheck';
import PerspectiveLenses from './components/SalonHeader/PerspectiveLenses';
import TownSquareView from './components/ThreadStream/TownSquareView';
import SmartComposer from './components/Composer/SmartComposer';
import FocusThreadDrawer from './components/ThreadStream/FocusThreadDrawer';
import ActivityPill from './components/ThreadStream/ActivityPill';
import MarginAnnotationDrawer from './components/MarginRail/MarginAnnotationDrawer';
import SimulationControlDock from './components/Controls/SimulationControlDock';
import { Sparkles, MessageCircle, BookOpen } from 'lucide-react';

function DiscussionAppContent() {
  const { contextMode } = useDiscussion();

  return (
    <div className="min-h-screen bg-salon-base text-salon-ink-primary font-sans antialiased selection:bg-amber-200 selection:text-amber-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200 pb-28">
      {/* Editorial Salon Navigation Bar */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-salon-base/85 border-b border-salon-border transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-sm font-bold text-base">
              A
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-salon-ink-primary flex items-center gap-1.5">
                Agora Salon
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                  Live
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-salon-ink-secondary">
            <span className="hidden md:inline">
              Tactile Editorial Salon & Zero-Jank Discussion System
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Layout based on Dual Context Mode */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {contextMode === 'town-square' ? (
          /* Mode 1: Town Square Feed (Host article on top, centered discussion container below) */
          <div className="max-w-3xl mx-auto space-y-10">
            {/* The Host Article */}
            <ArticleStage />

            {/* Separator Banner */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-salon-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-salon-base px-4 text-xs font-bold uppercase tracking-wider text-salon-ink-muted flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                  Live Salon Conversation
                </span>
              </div>
            </div>

            {/* Discussion Stage */}
            <section id="discussion-stage" className="space-y-6">
              <LivePresenceBar />
              <TimeTravelBanner />
              <DiscussionSnapshot />
              <TemperatureCheck />
              <PerspectiveLenses />

              {/* Top Smart Composer */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-salon-ink-muted mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Join the Roundtable
                </h3>
                <SmartComposer />
              </div>

              {/* The Threaded Discussion Stream */}
              <TownSquareView />
            </section>
          </div>
        ) : (
          /* Mode 2: Split Editorial + Margin Pin Layout (Article left, Contextual Margin rail right) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left/Center Host Article (Cols 1-7) */}
            <div className="lg:col-span-7">
              <ArticleStage />
            </div>

            {/* Right Live Margin Rail (Cols 8-12) */}
            <aside className="lg:col-span-5 sticky top-20 space-y-6">
              <LivePresenceBar />
              <TimeTravelBanner />
              <TemperatureCheck />
              <PerspectiveLenses />
              <SmartComposer />
              <MarginAnnotationDrawer />
            </aside>
          </div>
        )}
      </main>

      {/* Slide-over Focus Thread Drawer (Depth >= 3 or focused branch) */}
      <FocusThreadDrawer />

      {/* Floating Viewport-Safe Activity Pill */}
      <ActivityPill />

      {/* Real-Time Simulation Testing Dock */}
      <SimulationControlDock />
    </div>
  );
}

export default function App() {
  return (
    <DiscussionProvider>
      <DiscussionAppContent />
    </DiscussionProvider>
  );
}

