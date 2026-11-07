import React, { useState } from 'react';
import { PodcastProvider, usePodcast } from './context/PodcastContext';
import { Navbar } from './components/Navbar';
import { ResumeBanner } from './components/ResumeBanner';
import { CommuteFilterBar } from './components/CommuteFilterBar';
import { CuratedPlaylists } from './components/CuratedPlaylists';
import { EpisodeCard } from './components/EpisodeCard';
import { InteractiveEpisodeStage } from './components/InteractiveEpisodeStage';
import { AudioPlayerDock } from './components/AudioPlayerDock';
import { CreatorStudio } from './components/CreatorStudio';
import { AudiogramModal } from './components/AudiogramModal';
import { ListeningVaultDrawer } from './components/ListeningVaultDrawer';
import { VoicemailModal } from './components/VoicemailModal';
import { SpokenWordSearchModal } from './components/SpokenWordSearchModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { Sparkles, Radio, Layers, Headphones } from 'lucide-react';
import { Episode } from './types';

const MainAppContent: React.FC = () => {
  const { 
    isCreatorView, 
    episodes, 
    commuteFilter, 
    currentEpisode, 
    selectEpisode,
    playbackRate 
  } = usePodcast();

  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Filter episodes according to commute budget
  const filteredEpisodes = episodes.filter(ep => {
    if (commuteFilter === 'all') return true;
    return ep.commuteCategory === commuteFilter;
  });

  const handleSelectEpisode = (ep: Episode) => {
    selectEpisode(ep.id, true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-obsidian)] text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Top Studio Navbar */}
      <Navbar onOpenVault={() => setIsVaultOpen(true)} />

      {/* Resume Banner (Smart Sleep & Commute Bookmarks) */}
      <ResumeBanner />

      {/* Commute Window & Speed Filter Bar */}
      <CommuteFilterBar />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-8 py-8 pb-36 space-y-10">
        
        {isCreatorView ? (
          /* CREATOR HOSTING STUDIO */
          <CreatorStudio />
        ) : (
          /* LISTENER DISCOVERY & STAGE */
          <>
            {/* "Start Here" Curated Onboarding Tracks */}
            <CuratedPlaylists />

            {/* Flagship Centerpiece: Interactive Episode Stage */}
            <InteractiveEpisodeStage />

            {/* Archive / Commute-Aware Episode Catalog */}
            <section className="pt-6 border-t border-[var(--border-hairline)] space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-amber-500" />
                    <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)] tracking-tight">
                      Episode Catalog & Commute Slices
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Showing {filteredEpisodes.length} episodes • All runtimes dynamically recalculated for {playbackRate}x speed.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-tabular text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Interactive Read-Along Ready</span>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="space-y-4">
                {filteredEpisodes.map(ep => (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    onSelectEpisodeStage={handleSelectEpisode}
                  />
                ))}
              </div>
            </section>
          </>
        )}

      </main>

      {/* Persistent Studio Bottom Dock */}
      <AudioPlayerDock />

      {/* Modals & Slide-overs */}
      <AudiogramModal />
      <ListeningVaultDrawer isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      <VoicemailModal />
      <SpokenWordSearchModal />
      <SleepTimerModal />

    </div>
  );
};

export default function App() {
  return (
    <PodcastProvider>
      <MainAppContent />
    </PodcastProvider>
  );
}
