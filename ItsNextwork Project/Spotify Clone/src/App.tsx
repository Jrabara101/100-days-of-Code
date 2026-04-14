import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import {
  Header,
  Footer,
  SideBar,
  ScrollToTop,
  Loader,
  ErrorBoundary,
  DemoModeBadge,
} from "@/common";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { MiniPlayer } from "@/components/ui/MiniPlayer";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { cn } from "@/utils/helper";

import "react-loading-skeleton/dist/skeleton.css";
import "swiper/css";

const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    isShuffled,
    repeatMode,
    isMinimized,
    togglePlay,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    isTrackFavorite,
    toggleMinimize,
    closePlayer,
  } = useAudioPlayerContext();
  const currentTrackId = currentTrack ? (currentTrack.spotify_id || currentTrack.id) : "";

  // Global keyboard shortcuts
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;

      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Ignore media shortcuts while typing or when no track is loaded
      if (isTypingTarget(e.target) || !currentTrack) {
        return;
      }

      if (!isCommandPaletteOpen && e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }

      if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        skipPrevious();
        return;
      }

      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        skipNext();
        return;
      }

      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleMinimize();
        return;
      }

      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFavorite();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    currentTrack,
    isCommandPaletteOpen,
    skipNext,
    skipPrevious,
    toggleFavorite,
    toggleMinimize,
    togglePlay,
  ]);

  return (
    <>
      <SideBar />
      <Header onOpenSearch={() => setIsCommandPaletteOpen(true)} />
      <DemoModeBadge />
      <main
        className={cn(
          "transition-all duration-300 bg-white dark:bg-deep-dark min-h-screen",
          currentTrack ? "lg:pb-32 md:pb-28 sm:pb-24 pb-20" : "lg:pb-14 md:pb-4 sm:pb-2 xs:pb-1 pb-0"
        )}
      >
        <ScrollToTop>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ScrollToTop>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onItemSelect={() => {
          // Item selection handled by CommandPalette component
        }}
      />

      {currentTrack && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          volume={volume}
          isShuffled={isShuffled}
          repeatMode={repeatMode}
          isFavorite={currentTrackId ? isTrackFavorite(currentTrackId) : false}
          isMinimized={isMinimized}
          onTogglePlay={togglePlay}
          onSkipPrevious={skipPrevious}
          onSkipNext={skipNext}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleFavorite={toggleFavorite}
          onToggleMinimize={toggleMinimize}
          onClose={closePlayer}
        />
      )}

      <Footer />
    </>
  );
};

export default App;
