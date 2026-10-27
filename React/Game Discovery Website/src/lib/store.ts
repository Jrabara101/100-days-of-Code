import { create } from 'zustand';
import { GameTitle, SquadRoom } from '../types/game';

export interface AlchemyTagWeight {
  name: string;
  weight: number; // 0 to 100
}

interface StoreState {
  // Hardware Profile
  hardwareProfileId: string;
  setHardwareProfileId: (id: string) => void;

  // Genre Alchemist
  alchemyTags: AlchemyTagWeight[];
  setAlchemyTags: (tags: AlchemyTagWeight[]) => void;
  updateAlchemyTag: (name: string, weight: number) => void;
  addAlchemyTag: (name: string, weight?: number) => void;
  removeAlchemyTag: (name: string) => void;
  excludeTags: string[];
  toggleExcludeTag: (name: string) => void;

  // Catalog Filters
  deckVerifiedOnly: boolean;
  setDeckVerifiedOnly: (val: boolean) => void;
  maxPriceCents: number | null;
  setMaxPriceCents: (val: number | null) => void;
  minScore: number;
  setMinScore: (val: number) => void;
  sortBy: 'alchemy' | 'popular' | 'topRated' | 'discount' | 'priceAsc';
  setSortBy: (val: 'alchemy' | 'popular' | 'topRated' | 'discount' | 'priceAsc') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Modals & Navigation
  selectedGame: GameTitle | null;
  setSelectedGame: (game: GameTitle | null) => void;
  quickLookGame: GameTitle | null;
  setQuickLookGame: (game: GameTitle | null) => void;
  hoveredGameId: string | null;
  setHoveredGameId: (id: string | null) => void;

  // Discovery Queue
  isDiscoveryQueueOpen: boolean;
  setIsDiscoveryQueueOpen: (open: boolean) => void;
  queueIndex: number;
  setQueueIndex: (idx: number) => void;

  // Wishlist & User Curation
  wishlist: string[]; // game IDs
  toggleWishlist: (gameId: string) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  ignoredGames: string[];
  ignoreGame: (gameId: string) => void;
  followedCreators: string[];
  followCreator: (creator: string) => void;

  // Squad Cart Co-Op
  squadRoom: SquadRoom | null;
  setSquadRoom: (room: SquadRoom | null) => void;
  isSquadModalOpen: boolean;
  setIsSquadModalOpen: (open: boolean) => void;

  // Command Palette (Cmd + K)
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  // Hardware Profile (default to Steam Deck OLED)
  hardwareProfileId: 'steam-deck-oled',
  setHardwareProfileId: (id) => set({ hardwareProfileId: id }),

  // Default Alchemy: 60% Tactical + 40% Roguelike
  alchemyTags: [
    { name: 'Tactical', weight: 60 },
    { name: 'Roguelike', weight: 40 },
  ],
  setAlchemyTags: (tags) => set({ alchemyTags: tags }),
  updateAlchemyTag: (name, weight) =>
    set((state) => ({
      alchemyTags: state.alchemyTags.map((t) =>
        t.name.toLowerCase() === name.toLowerCase() ? { ...t, weight } : t
      ),
    })),
  addAlchemyTag: (name, weight = 50) =>
    set((state) => {
      if (state.alchemyTags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
        return state;
      }
      // Maximum 3 tags per spec
      const updated = state.alchemyTags.length >= 3 
        ? [...state.alchemyTags.slice(1), { name, weight }]
        : [...state.alchemyTags, { name, weight }];
      return { alchemyTags: updated };
    }),
  removeAlchemyTag: (name) =>
    set((state) => ({
      alchemyTags: state.alchemyTags.filter((t) => t.name.toLowerCase() !== name.toLowerCase()),
    })),

  // Exclude tags (Strict Exclude: Microtransactions by default)
  excludeTags: ['Microtransactions'],
  toggleExcludeTag: (name) =>
    set((state) => {
      const exists = state.excludeTags.includes(name);
      return {
        excludeTags: exists
          ? state.excludeTags.filter((t) => t !== name)
          : [...state.excludeTags, name],
      };
    }),

  // Catalog Filters
  deckVerifiedOnly: false,
  setDeckVerifiedOnly: (val) => set({ deckVerifiedOnly: val }),
  maxPriceCents: null,
  setMaxPriceCents: (val) => set({ maxPriceCents: val }),
  minScore: 0,
  setMinScore: (val) => set({ minScore: val }),
  sortBy: 'alchemy',
  setSortBy: (sortBy) => set({ sortBy }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Modals & Navigation
  selectedGame: null,
  setSelectedGame: (game) => set({ selectedGame: game }),
  quickLookGame: null,
  setQuickLookGame: (game) => set({ quickLookGame: game }),
  hoveredGameId: null,
  setHoveredGameId: (id) => set({ hoveredGameId: id }),

  // Discovery Queue
  isDiscoveryQueueOpen: false,
  setIsDiscoveryQueueOpen: (open) => set({ isDiscoveryQueueOpen: open }),
  queueIndex: 0,
  setQueueIndex: (queueIndex) => set({ queueIndex }),

  // Wishlist & User Curation
  wishlist: ['game-1', 'game-7'],
  toggleWishlist: (gameId) =>
    set((state) => {
      const inWishlist = state.wishlist.includes(gameId);
      return {
        wishlist: inWishlist
          ? state.wishlist.filter((id) => id !== gameId)
          : [...state.wishlist, gameId],
      };
    }),
  isWishlistOpen: false,
  setIsWishlistOpen: (open) => set({ isWishlistOpen: open }),
  ignoredGames: [],
  ignoreGame: (gameId) =>
    set((state) => ({
      ignoredGames: state.ignoredGames.includes(gameId)
        ? state.ignoredGames
        : [...state.ignoredGames, gameId],
    })),
  followedCreators: ['Valkyrie Zero Studios'],
  followCreator: (creator) =>
    set((state) => ({
      followedCreators: state.followedCreators.includes(creator)
        ? state.followedCreators.filter((c) => c !== creator)
        : [...state.followedCreators, creator],
    })),

  // Squad Cart
  squadRoom: null,
  setSquadRoom: (room) => set({ squadRoom: room }),
  isSquadModalOpen: false,
  setIsSquadModalOpen: (open) => set({ isSquadModalOpen: open }),

  // Command Palette
  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
}));
