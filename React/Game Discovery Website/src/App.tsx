import React, { useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useStore } from './lib/store';
import { fetchDiscoverGames, fetchHardwareProfiles } from './lib/api';
import { HARDWARE_PROFILES } from '../server/data/hardwareProfiles';
import { StorefrontShell } from './components/StorefrontShell';
import { HeroSpotlightCarousel } from './components/HeroSpotlightCarousel';
import { GenreAlchemistBar } from './components/GenreAlchemistBar';
import { CatalogBentoGrid } from './components/CatalogBentoGrid';
import { QuickLookModal } from './components/QuickLookModal';
import { DiscoveryQueueModal } from './components/DiscoveryQueueModal';
import { SquadCartModal } from './components/SquadCartModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CommandPalette } from './components/CommandPalette';
import { GameDetailView } from './components/GameDetailView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function StorefrontContent() {
  const hardwareProfileId = useStore((s) => s.hardwareProfileId);
  const alchemyTags = useStore((s) => s.alchemyTags);
  const excludeTags = useStore((s) => s.excludeTags);
  const deckVerifiedOnly = useStore((s) => s.deckVerifiedOnly);
  const maxPriceCents = useStore((s) => s.maxPriceCents);
  const sortBy = useStore((s) => s.sortBy);
  const searchQuery = useStore((s) => s.searchQuery);

  // Modals & Drawers state
  const selectedGame = useStore((s) => s.selectedGame);
  const setSelectedGame = useStore((s) => s.setSelectedGame);
  const quickLookGame = useStore((s) => s.quickLookGame);
  const setQuickLookGame = useStore((s) => s.setQuickLookGame);
  const isDiscoveryQueueOpen = useStore((s) => s.isDiscoveryQueueOpen);
  const setIsDiscoveryQueueOpen = useStore((s) => s.setIsDiscoveryQueueOpen);
  const isSquadModalOpen = useStore((s) => s.isSquadModalOpen);
  const setIsSquadModalOpen = useStore((s) => s.setIsSquadModalOpen);
  const isWishlistOpen = useStore((s) => s.isWishlistOpen);
  const setIsWishlistOpen = useStore((s) => s.setIsWishlistOpen);
  const isCommandPaletteOpen = useStore((s) => s.isCommandPaletteOpen);
  const setIsCommandPaletteOpen = useStore((s) => s.setIsCommandPaletteOpen);

  // Hardware profiles query
  const { data: hardwareProfiles = HARDWARE_PROFILES } = useQuery({
    queryKey: ['hardware-profiles'],
    queryFn: fetchHardwareProfiles,
    initialData: HARDWARE_PROFILES,
  });

  // Discover games query (with cosine similarity and faceted filters)
  const { data: discoverData, isLoading } = useQuery({
    queryKey: [
      'discover-games',
      alchemyTags,
      excludeTags,
      deckVerifiedOnly,
      maxPriceCents,
      sortBy,
      searchQuery,
      hardwareProfileId,
    ],
    queryFn: () =>
      fetchDiscoverGames({
        search: searchQuery,
        alchemyTags,
        excludeTags,
        deckVerifiedOnly,
        maxPriceCents: maxPriceCents || undefined,
        sortBy,
        hardwareProfileId,
        limit: 50,
      }),
  });

  const allGames = discoverData?.games || [];

  // Co-Op titles for squad matcher
  const coOpGames = useMemo(() => {
    return allGames.filter((g) =>
      g.tags.some(
        (t) =>
          t.name.toLowerCase() === 'co-op' ||
          t.name.toLowerCase() === 'multiplayer' ||
          t.name.toLowerCase() === 'action'
      )
    );
  }, [allGames]);

  // Global Keydown shortcuts: Cmd+K / Ctrl+K and Q for discovery queue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  return (
    <StorefrontShell
      hardwareProfiles={hardwareProfiles}
      onOpenDiscoveryQueue={() => setIsDiscoveryQueueOpen(true)}
      onOpenSquadCart={() => setIsSquadModalOpen(true)}
      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
    >
      {/* 1. Hero Spotlight Carousel Showcase */}
      {allGames.length > 0 && (
        <section aria-label="Featured Spotlight">
          <HeroSpotlightCarousel games={allGames} onSelectGame={setSelectedGame} />
        </section>
      )}

      {/* 2. Multi-Axis Genre Alchemist DNA Tuner */}
      <section id="alchemist-section" aria-label="Genre Alchemist">
        <GenreAlchemistBar />
      </section>

      {/* 3. Virtualized Catalog Bento Grid */}
      <section aria-label="Catalog Bento Grid">
        <CatalogBentoGrid
          games={allGames}
          totalMatches={discoverData?.total || allGames.length}
          isLoading={isLoading}
        />
      </section>

      {/* Modals & Drawers */}

      {/* Quick-Look Playable Demo Modal [Space] */}
      {quickLookGame && (
        <QuickLookModal game={quickLookGame} onClose={() => setQuickLookGame(null)} />
      )}

      {/* Discovery Queue Modal */}
      {isDiscoveryQueueOpen && (
        <DiscoveryQueueModal
          games={allGames}
          isOpen={isDiscoveryQueueOpen}
          onClose={() => setIsDiscoveryQueueOpen(false)}
        />
      )}

      {/* Squad Cart Co-Op Matcher Modal */}
      {isSquadModalOpen && (
        <SquadCartModal
          coOpGames={coOpGames.length > 0 ? coOpGames : allGames}
          isOpen={isSquadModalOpen}
          onClose={() => setIsSquadModalOpen(false)}
        />
      )}

      {/* Wishlist Drawer Sheet */}
      <WishlistDrawer
        games={allGames}
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />

      {/* Global Command Palette Cmd+K */}
      <CommandPalette
        games={allGames}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Game Detail View (Store Page Drawer / Full View) */}
      {selectedGame && (
        <GameDetailView game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </StorefrontShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StorefrontContent />
    </QueryClientProvider>
  );
}
