import { create } from 'zustand';
import { MediaItem, Album, BackgroundVariation, LayoutMode } from '../types/gallery';

interface GalleryState {
  media: Record<string, MediaItem>;
  albums: Record<string, Album>;
  allIds: string[];
  selectedIds: string[];
  activeAlbumId: string | null;
  activeLightboxId: string | null;
  previousState: { media: Record<string, MediaItem>; albums: Record<string, Album> } | null;

  // UI state & Telemetry
  searchQuery: string;
  activeFilterTag: string | null;
  activeRatingFilter: number | null;
  formatFilter: string | null;
  layoutMode: LayoutMode;
  columnCount: number;
  bgVariation: BackgroundVariation;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  lastMutationNotice: { message: string; type: 'success' | 'rollback' | 'info' } | null;

  // Actions
  initializeGallery: (mediaList: MediaItem[], albumsList: Album[]) => void;
  setActiveAlbum: (albumId: string | null) => void;
  openLightbox: (id: string | null) => void;
  toggleSelectMedia: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setActiveFilterTag: (tag: string | null) => void;
  setActiveRatingFilter: (rating: number | null) => void;
  setFormatFilter: (format: string | null) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setColumnCount: (count: number) => void;
  setBgVariation: (variation: BackgroundVariation) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  dismissNotice: () => void;
  
  // Optimistic Netcode Mutation
  assignToAlbumOptimistic: (mediaIds: string[], targetAlbumId: string) => void;
  rollbackMutation: () => void;
  confirmMutation: () => void;
  batchDeleteSelected: () => void;
  batchAddTag: (tag: string) => void;
  createNewAlbum: (name: string) => string;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  media: {},
  albums: {},
  allIds: [],
  selectedIds: [],
  activeAlbumId: null,
  activeLightboxId: null,
  previousState: null,

  searchQuery: '',
  activeFilterTag: null,
  activeRatingFilter: null,
  formatFilter: null,
  layoutMode: 'masonry',
  columnCount: 4,
  bgVariation: 'void',
  sidebarOpen: true,
  inspectorOpen: true,
  lastMutationNotice: null,

  initializeGallery: (mediaList, albumsList) => {
    const mediaMap: Record<string, MediaItem> = {};
    const allIds: string[] = [];
    mediaList.forEach((item) => {
      mediaMap[item.id] = item;
      allIds.push(item.id);
    });

    const albumMap: Record<string, Album> = {};
    albumsList.forEach((album) => {
      // Recount items in each album
      const count = mediaList.filter((m) => m.albumId === album.id).length;
      albumMap[album.id] = { ...album, itemCount: count };
    });

    set({
      media: mediaMap,
      albums: albumMap,
      allIds,
    });
  },

  setActiveAlbum: (albumId) => set({ activeAlbumId: albumId, selectedIds: [] }),
  openLightbox: (id) => set({ activeLightboxId: id }),

  toggleSelectMedia: (id) => {
    const { selectedIds } = get();
    const exists = selectedIds.includes(id);
    set({
      selectedIds: exists ? selectedIds.filter((item) => item !== id) : [...selectedIds, id],
    });
  },

  selectMultiple: (ids) => {
    const { selectedIds } = get();
    const combined = Array.from(new Set([...selectedIds, ...ids]));
    set({ selectedIds: combined });
  },

  selectAll: () => {
    const { allIds } = get();
    set({ selectedIds: [...allIds] });
  },

  clearSelection: () => set({ selectedIds: [] }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilterTag: (tag) => set({ activeFilterTag: tag }),
  setActiveRatingFilter: (rating) => set({ activeRatingFilter: rating }),
  setFormatFilter: (format) => set({ formatFilter: format }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setColumnCount: (count) => set({ columnCount: Math.max(1, Math.min(5, count)) }),
  setBgVariation: (variation) => set({ bgVariation: variation }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),
  dismissNotice: () => set({ lastMutationNotice: null }),

  assignToAlbumOptimistic: (mediaIds, targetAlbumId) => {
    const state = get();
    if (mediaIds.length === 0) return;

    const targetAlbum = state.albums[targetAlbumId];
    const targetAlbumName = targetAlbum ? targetAlbum.name : 'Target Album';

    // Snapshot state for rollback (Netcode pattern)
    const mediaSnapshot: Record<string, MediaItem> = {};
    Object.keys(state.media).forEach((k) => {
      mediaSnapshot[k] = { ...state.media[k] };
    });
    const albumsSnapshot: Record<string, Album> = {};
    Object.keys(state.albums).forEach((k) => {
      albumsSnapshot[k] = { ...state.albums[k] };
    });

    set({
      previousState: { media: mediaSnapshot, albums: albumsSnapshot },
    });

    const updatedMedia = { ...state.media };
    const oldAlbumDecrements: Record<string, number> = {};

    mediaIds.forEach((id) => {
      if (updatedMedia[id]) {
        const oldAlbum = updatedMedia[id].albumId;
        if (oldAlbum && oldAlbum !== targetAlbumId) {
          oldAlbumDecrements[oldAlbum] = (oldAlbumDecrements[oldAlbum] || 0) + 1;
        }
        updatedMedia[id] = { ...updatedMedia[id], albumId: targetAlbumId };
      }
    });

    // Update album counters
    const updatedAlbums = { ...state.albums };
    Object.keys(oldAlbumDecrements).forEach((albId) => {
      if (updatedAlbums[albId]) {
        updatedAlbums[albId] = {
          ...updatedAlbums[albId],
          itemCount: Math.max(0, updatedAlbums[albId].itemCount - oldAlbumDecrements[albId]),
        };
      }
    });

    if (updatedAlbums[targetAlbumId]) {
      updatedAlbums[targetAlbumId] = {
        ...updatedAlbums[targetAlbumId],
        itemCount: updatedAlbums[targetAlbumId].itemCount + mediaIds.length,
      };
    }

    set({
      media: updatedMedia,
      albums: updatedAlbums,
      selectedIds: [],
      lastMutationNotice: {
        message: `Optimistically moved ${mediaIds.length} item${mediaIds.length > 1 ? 's' : ''} to "${targetAlbumName}"`,
        type: 'success',
      },
    });
  },

  rollbackMutation: () =>
    set((state) => {
      if (!state.previousState) return state;
      return {
        media: state.previousState.media,
        albums: state.previousState.albums,
        previousState: null,
        lastMutationNotice: {
          message: 'Rubber-band rollback triggered: Restored previous album state.',
          type: 'rollback',
        },
      };
    }),

  confirmMutation: () =>
    set({
      previousState: null,
      lastMutationNotice: {
        message: 'Sync acknowledged by storage node.',
        type: 'info',
      },
    }),

  batchDeleteSelected: () => {
    const { media, allIds, selectedIds, albums } = get();
    if (selectedIds.length === 0) return;

    const updatedMedia = { ...media };
    const updatedAllIds = allIds.filter((id) => !selectedIds.includes(id));
    const albumDeductions: Record<string, number> = {};

    selectedIds.forEach((id) => {
      const it = updatedMedia[id];
      if (it && it.albumId) {
        albumDeductions[it.albumId] = (albumDeductions[it.albumId] || 0) + 1;
      }
      delete updatedMedia[id];
    });

    const updatedAlbums = { ...albums };
    Object.keys(albumDeductions).forEach((albId) => {
      if (updatedAlbums[albId]) {
        updatedAlbums[albId] = {
          ...updatedAlbums[albId],
          itemCount: Math.max(0, updatedAlbums[albId].itemCount - albumDeductions[albId]),
        };
      }
    });

    set({
      media: updatedMedia,
      allIds: updatedAllIds,
      selectedIds: [],
      lastMutationNotice: {
        message: `Archived ${selectedIds.length} media tile${selectedIds.length > 1 ? 's' : ''}.`,
        type: 'info',
      },
    });
  },

  batchAddTag: (tag) => {
    const { media, selectedIds } = get();
    if (selectedIds.length === 0 || !tag.trim()) return;

    const updatedMedia = { ...media };
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;

    selectedIds.forEach((id) => {
      if (updatedMedia[id]) {
        const existingTags = updatedMedia[id].tags || [];
        if (!existingTags.includes(cleanTag)) {
          updatedMedia[id] = {
            ...updatedMedia[id],
            tags: [...existingTags, cleanTag],
          };
        }
      }
    });

    set({
      media: updatedMedia,
      lastMutationNotice: {
        message: `Added ${cleanTag} to ${selectedIds.length} items.`,
        type: 'success',
      },
    });
  },

  createNewAlbum: (name) => {
    const { albums } = get();
    const id = `album-${Date.now()}`;
    const newAlbum: Album = {
      id,
      name: name.trim() || 'Untitled Album',
      itemCount: 0,
      icon: 'folder',
    };
    set({
      albums: { ...albums, [id]: newAlbum },
      activeAlbumId: id,
      lastMutationNotice: {
        message: `Created new album "${newAlbum.name}".`,
        type: 'success',
      },
    });
    return id;
  },
}));
