import { create } from 'zustand';
import { 
  PixelStudioState, 
  ToolType, 
  AppTab, 
  BlendModeType, 
  SelectionRect, 
  HistoryEntry,
  LoopMode
} from '../types/pixel';
import { PALETTE_PRESETS, createEmptyGrid, createInitialDemoFrames } from '../lib/palettes';
import { floodFill } from '../lib/algorithms';
import { calculateLuminance, calculateHue, calculateSaturation } from '../lib/utils';

interface PixelStudioStore extends PixelStudioState {
  // History
  past: HistoryEntry[];
  future: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushHistory: (description?: string) => void;

  // Navigation & View
  setActiveTab: (tab: AppTab) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  resetView: () => void;
  setShowGrid: (show: boolean | ((prev: boolean) => boolean)) => void;
  setCursorPos: (pos: { x: number; y: number } | null) => void;

  // Tool & Color
  setActiveTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setPixelPerfect: (enabled: boolean) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  swapColors: () => void;

  // Canvas Drawing Actions
  setPixel: (x: number, y: number, color: string) => void;
  applyStroke: (points: { x: number; y: number }[], color: string) => void;
  applyFloodFill: (x: number, y: number, color: string) => void;
  clearCanvas: () => void;

  // Selection
  setSelection: (sel: SelectionRect | null) => void;
  setIsSelecting: (isSel: boolean) => void;

  // Frames & Animation
  setActiveFrameIndex: (idx: number) => void;
  addFrame: () => void;
  duplicateFrame: (frameIdx?: number) => void;
  deleteFrame: (frameIdx?: number) => void;
  setFps: (fps: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setLoopMode: (mode: LoopMode) => void;
  toggleOnionSkin: () => void;
  setOnionSkinFrames: (before: number, after: number) => void;

  // Layers
  setActiveLayerId: (id: string) => void;
  addLayer: () => void;
  duplicateLayer: (id: string) => void;
  deleteLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerBlendMode: (id: string, blendMode: BlendModeType) => void;
  mergeDown: (id: string) => void;
  reorderLayers: (fromIdx: number, toIdx: number) => void;

  // Palette Actions
  loadPalettePreset: (name: string) => void;
  addColorToPalette: (color: string) => void;
  removeColorFromPalette: (color: string) => void;
  sortPalette: (criteria: 'luminance' | 'hue' | 'saturation') => void;
  purgeUnusedColors: () => void;

  // Project Info
  setProjectTitle: (title: string) => void;
  setProjectTags: (tags: string) => void;
  setProjectDescription: (desc: string) => void;

  // Peer Jam
  togglePeerJam: () => void;
  broadcastCursor: (x: number, y: number) => void;
}

const STORAGE_KEY = 'spriteforge_pro_v1';

// Initial layers setup
const initialLayers = [
  {
    id: 'layer-base',
    name: 'Character Base',
    visible: true,
    opacity: 1,
    locked: false,
    blendMode: 'source-over' as BlendModeType,
  },
  {
    id: 'layer-fx',
    name: 'Cyber Blades FX',
    visible: true,
    opacity: 1,
    locked: false,
    blendMode: 'source-over' as BlendModeType,
  }
];

const initialDimensions = { width: 32, height: 32 };
const initialPresetName = 'Cyberpunk Neon 32';
const initialPalette = PALETTE_PRESETS[initialPresetName].colors;

// Load persisted state if available
function loadSavedProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.frames) && Array.isArray(parsed.layers)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load saved project, fallback to demo', e);
  }
  return null;
}

const savedData = loadSavedProject();

// Broadcast channel for multi-tab collaboration
let peerChannel: BroadcastChannel | null = null;
try {
  peerChannel = new BroadcastChannel('spriteforge_peer_jam');
} catch (e) {
  // BroadcastChannel not available in some environments
}

export const usePixelStore = create<PixelStudioStore>((set, get) => {
  // Handle broadcast channel incoming messages
  if (peerChannel) {
    peerChannel.onmessage = (event) => {
      const data = event.data;
      if (data?.type === 'peer_cursor') {
        const { id, name, color, x, y, tool } = data;
        set((state) => {
          if (!state.peerJam.enabled) return state;
          const existing = state.peerJam.peers.filter((p) => p.id !== id);
          return {
            peerJam: {
              ...state.peerJam,
              peers: [...existing, { id, name, color, x, y, tool, lastActive: Date.now() }],
            },
          };
        });
      } else if (data?.type === 'peer_draw') {
        const { frameIdx, layerIdx, x, y, color } = data;
        set((state) => {
          const newFrames = state.frames.map((f, fIdx) => {
            if (fIdx !== frameIdx) return f;
            return f.map((l, lIdx) => {
              if (lIdx !== layerIdx) return l;
              const newGrid = l.map((row) => [...row]);
              if (newGrid[y]) newGrid[y][x] = color;
              return newGrid;
            });
          });
          return { frames: newFrames };
        });
      }
    };
  }

  // Periodic cleanup of inactive peers
  setInterval(() => {
    const now = Date.now();
    set((state) => {
      const activePeers = state.peerJam.peers.filter((p) => now - p.lastActive < 10000);
      if (activePeers.length === state.peerJam.peers.length) return state;
      return { peerJam: { ...state.peerJam, peers: activePeers } };
    });
  }, 5000);

  // Debounced storage sync
  let saveTimeout: any = null;
  const triggerAutoSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const s = get();
        const dataToSave = {
          dimensions: s.dimensions,
          layers: s.layers,
          frames: s.frames,
          palette: s.palette,
          activePaletteName: s.activePaletteName,
          fps: s.fps,
          projectTitle: s.projectTitle,
          projectTags: s.projectTags,
          projectDescription: s.projectDescription,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Auto-save error', e);
      }
    }, 1000);
  };

  const initialFrames = savedData?.frames || createInitialDemoFrames(initialDimensions.width, initialDimensions.height, initialLayers.length);
  const startLayers = savedData?.layers || initialLayers;

  return {
    // Initial state
    dimensions: savedData?.dimensions || initialDimensions,
    zoom: 800,
    pan: { x: 0, y: 0 },
    showGrid: true,
    cursorPos: null,
    activeTab: 'editor',

    activeTool: 'pencil',
    brushSize: 1,
    pixelPerfect: false,
    primaryColor: '#D0BCFF',
    secondaryColor: '#4CD7F6',

    palette: savedData?.palette || initialPalette,
    activePaletteName: savedData?.activePaletteName || initialPresetName,

    layers: startLayers,
    activeLayerId: startLayers[0].id,

    frames: initialFrames,
    activeFrameIndex: 0,
    fps: savedData?.fps || 12,
    isPlaying: false,
    loopMode: 'loop',
    onionSkin: {
      enabled: true,
      framesBefore: 1,
      framesAfter: 1,
    },

    selection: null,
    isSelecting: false,

    peerJam: {
      enabled: false,
      roomId: 'forge-room-77',
      userName: `Artist_${Math.floor(Math.random() * 900 + 100)}`,
      userColor: '#4CD7F6',
      peers: [],
    },

    projectTitle: savedData?.projectTitle || 'Hero_Sprite_Anim_04.aseprite',
    projectTags: savedData?.projectTags || 'pixelart, cyberpunk, platformer, hero',
    projectDescription: savedData?.projectDescription || 'A smooth 4-frame run cycle for a futuristic cyberpunk protagonist with cyan glowing blades and violet armor accents.',

    // History
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    pushHistory: (description = 'Canvas edit') => {
      const state = get();
      // Deep clone frames snapshot
      const framesCopy = state.frames.map((f) => f.map((l) => l.map((r) => [...r])));
      const layersCopy = state.layers.map((l) => ({ ...l }));
      
      const newPast = [...state.past, {
        description,
        frames: framesCopy,
        activeFrameIndex: state.activeFrameIndex,
        layers: layersCopy,
      }].slice(-50); // Cap at 50

      set({
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
      });

      triggerAutoSave();
    },

    undo: () => {
      const state = get();
      if (state.past.length === 0) return;

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);

      // Current snapshot goes into future
      const currentSnapshot: HistoryEntry = {
        description: 'Current state',
        frames: state.frames.map((f) => f.map((l) => l.map((r) => [...r]))),
        activeFrameIndex: state.activeFrameIndex,
        layers: state.layers.map((l) => ({ ...l })),
      };

      set({
        frames: previous.frames,
        activeFrameIndex: previous.activeFrameIndex,
        layers: previous.layers,
        past: newPast,
        future: [currentSnapshot, ...state.future],
        canUndo: newPast.length > 0,
        canRedo: true,
      });

      triggerAutoSave();
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return;

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      const currentSnapshot: HistoryEntry = {
        description: 'Current state',
        frames: state.frames.map((f) => f.map((l) => l.map((r) => [...r]))),
        activeFrameIndex: state.activeFrameIndex,
        layers: state.layers.map((l) => ({ ...l })),
      };

      set({
        frames: next.frames,
        activeFrameIndex: next.activeFrameIndex,
        layers: next.layers,
        past: [...state.past, currentSnapshot],
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      });

      triggerAutoSave();
    },

    // Navigation & View
    setActiveTab: (tab) => set({ activeTab: tab }),
    setZoom: (zoom) => set((s) => ({ zoom: typeof zoom === 'function' ? zoom(s.zoom) : zoom })),
    setPan: (pan) => set((s) => ({ pan: typeof pan === 'function' ? pan(s.pan) : pan })),
    resetView: () => set({ zoom: 800, pan: { x: 0, y: 0 } }),
    setShowGrid: (show) => set((s) => ({ showGrid: typeof show === 'function' ? show(s.showGrid) : show })),
    setCursorPos: (pos) => set({ cursorPos: pos }),

    // Tool & Color
    setActiveTool: (tool) => set({ activeTool: tool }),
    setBrushSize: (size) => set({ brushSize: size }),
    setPixelPerfect: (enabled) => set({ pixelPerfect: enabled }),
    setPrimaryColor: (color) => set({ primaryColor: color }),
    setSecondaryColor: (color) => set({ secondaryColor: color }),
    swapColors: () => set((s) => ({ primaryColor: s.secondaryColor, secondaryColor: s.primaryColor })),

    // Canvas Actions
    setPixel: (x, y, color) => {
      const state = get();
      const { activeFrameIndex, layers, activeLayerId, dimensions } = state;
      const layerIdx = layers.findIndex((l) => l.id === activeLayerId);
      if (layerIdx === -1 || layers[layerIdx].locked) return;
      if (x < 0 || x >= dimensions.width || y < 0 || y >= dimensions.height) return;

      const currentPixel = state.frames[activeFrameIndex]?.[layerIdx]?.[y]?.[x];
      if (currentPixel === color) return;

      const newFrames = state.frames.map((f, fIdx) => {
        if (fIdx !== activeFrameIndex) return f;
        return f.map((l, lIdx) => {
          if (lIdx !== layerIdx) return l;
          const newGrid = l.map((r) => [...r]);
          newGrid[y][x] = color;
          return newGrid;
        });
      });

      set({ frames: newFrames });

      // Broadcast if peer jam is enabled
      if (state.peerJam.enabled && peerChannel) {
        peerChannel.postMessage({
          type: 'peer_draw',
          frameIdx: activeFrameIndex,
          layerIdx,
          x,
          y,
          color,
        });
      }
    },

    applyStroke: (points, color) => {
      const state = get();
      const { activeFrameIndex, layers, activeLayerId, dimensions } = state;
      const layerIdx = layers.findIndex((l) => l.id === activeLayerId);
      if (layerIdx === -1 || layers[layerIdx].locked || points.length === 0) return;

      const newFrames = state.frames.map((f, fIdx) => {
        if (fIdx !== activeFrameIndex) return f;
        return f.map((l, lIdx) => {
          if (lIdx !== layerIdx) return l;
          const newGrid = l.map((r) => [...r]);
          for (const p of points) {
            if (p.x >= 0 && p.x < dimensions.width && p.y >= 0 && p.y < dimensions.height) {
              newGrid[p.y][p.x] = color;
            }
          }
          return newGrid;
        });
      });

      set({ frames: newFrames });
      triggerAutoSave();
    },

    applyFloodFill: (startX, startY, color) => {
      const state = get();
      const { activeFrameIndex, layers, activeLayerId, dimensions } = state;
      const layerIdx = layers.findIndex((l) => l.id === activeLayerId);
      if (layerIdx === -1 || layers[layerIdx].locked) return;

      state.pushHistory('Flood fill');

      const newFrames = state.frames.map((f, fIdx) => {
        if (fIdx !== activeFrameIndex) return f;
        return f.map((l, lIdx) => {
          if (lIdx !== layerIdx) return l;
          const newGrid = l.map((r) => [...r]);
          floodFill(newGrid, startX, startY, color, dimensions.width, dimensions.height);
          return newGrid;
        });
      });

      set({ frames: newFrames });
    },

    clearCanvas: () => {
      const state = get();
      const { activeFrameIndex, layers, activeLayerId, dimensions } = state;
      const layerIdx = layers.findIndex((l) => l.id === activeLayerId);
      if (layerIdx === -1 || layers[layerIdx].locked) return;

      state.pushHistory('Clear layer');

      const newFrames = state.frames.map((f, fIdx) => {
        if (fIdx !== activeFrameIndex) return f;
        return f.map((l, lIdx) => {
          if (lIdx !== layerIdx) return l;
          return createEmptyGrid(dimensions.width, dimensions.height);
        });
      });

      set({ frames: newFrames });
    },

    // Selection
    setSelection: (sel) => set({ selection: sel }),
    setIsSelecting: (isSel) => set({ isSelecting: isSel }),

    // Animation & Frames
    setActiveFrameIndex: (idx) => set({ activeFrameIndex: idx }),

    addFrame: () => {
      const state = get();
      state.pushHistory('Add blank frame');
      const newFrameLayers = state.layers.map(() => createEmptyGrid(state.dimensions.width, state.dimensions.height));
      const newFrames = [...state.frames, newFrameLayers];
      set({
        frames: newFrames,
        activeFrameIndex: newFrames.length - 1,
      });
    },

    duplicateFrame: (frameIdx) => {
      const state = get();
      state.pushHistory('Duplicate frame');
      const targetIdx = frameIdx !== undefined ? frameIdx : state.activeFrameIndex;
      const sourceFrame = state.frames[targetIdx];
      if (!sourceFrame) return;

      const frameClone = sourceFrame.map((layerGrid) => layerGrid.map((row) => [...row]));
      const newFrames = [...state.frames];
      newFrames.splice(targetIdx + 1, 0, frameClone);

      set({
        frames: newFrames,
        activeFrameIndex: targetIdx + 1,
      });
    },

    deleteFrame: (frameIdx) => {
      const state = get();
      if (state.frames.length <= 1) return; // Keep at least 1 frame
      state.pushHistory('Delete frame');
      const targetIdx = frameIdx !== undefined ? frameIdx : state.activeFrameIndex;
      const newFrames = state.frames.filter((_, i) => i !== targetIdx);
      const newActive = Math.min(targetIdx, newFrames.length - 1);

      set({
        frames: newFrames,
        activeFrameIndex: newActive,
      });
    },

    setFps: (fps) => set({ fps }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
    setLoopMode: (mode) => set({ loopMode: mode }),
    toggleOnionSkin: () => set((s) => ({ onionSkin: { ...s.onionSkin, enabled: !s.onionSkin.enabled } })),
    setOnionSkinFrames: (before, after) => set((s) => ({ onionSkin: { ...s.onionSkin, framesBefore: before, framesAfter: after } })),

    // Layers
    setActiveLayerId: (id) => set({ activeLayerId: id }),

    addLayer: () => {
      const state = get();
      state.pushHistory('Add layer');
      const newLayerId = `layer-${Date.now()}`;
      const newLayer = {
        id: newLayerId,
        name: `Layer ${state.layers.length + 1}`,
        visible: true,
        opacity: 1,
        locked: false,
        blendMode: 'source-over' as BlendModeType,
      };

      const newFrames = state.frames.map((frame) => {
        return [...frame, createEmptyGrid(state.dimensions.width, state.dimensions.height)];
      });

      set({
        layers: [...state.layers, newLayer],
        activeLayerId: newLayerId,
        frames: newFrames,
      });
    },

    duplicateLayer: (id) => {
      const state = get();
      state.pushHistory('Duplicate layer');
      const idx = state.layers.findIndex((l) => l.id === id);
      if (idx === -1) return;

      const sourceLayer = state.layers[idx];
      const newLayerId = `layer-${Date.now()}`;
      const newLayer = {
        ...sourceLayer,
        id: newLayerId,
        name: `${sourceLayer.name} (Copy)`,
      };

      const newLayers = [...state.layers];
      newLayers.splice(idx + 1, 0, newLayer);

      const newFrames = state.frames.map((frame) => {
        const frameClone = [...frame];
        const sourceGrid = frame[idx].map((r) => [...r]);
        frameClone.splice(idx + 1, 0, sourceGrid);
        return frameClone;
      });

      set({
        layers: newLayers,
        activeLayerId: newLayerId,
        frames: newFrames,
      });
    },

    deleteLayer: (id) => {
      const state = get();
      if (state.layers.length <= 1) return; // Keep at least 1 layer
      state.pushHistory('Delete layer');
      const idx = state.layers.findIndex((l) => l.id === id);
      if (idx === -1) return;

      const newLayers = state.layers.filter((l) => l.id !== id);
      const newFrames = state.frames.map((frame) => frame.filter((_, i) => i !== idx));
      const nextActiveId = state.activeLayerId === id ? newLayers[Math.max(0, idx - 1)].id : state.activeLayerId;

      set({
        layers: newLayers,
        frames: newFrames,
        activeLayerId: nextActiveId,
      });
    },

    toggleLayerVisibility: (id) => {
      set((s) => ({
        layers: s.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
      }));
    },

    toggleLayerLock: (id) => {
      set((s) => ({
        layers: s.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
      }));
    },

    setLayerOpacity: (id, opacity) => {
      set((s) => ({
        layers: s.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
      }));
    },

    setLayerBlendMode: (id, blendMode) => {
      set((s) => ({
        layers: s.layers.map((l) => (l.id === id ? { ...l, blendMode } : l)),
      }));
    },

    mergeDown: (id) => {
      const state = get();
      const idx = state.layers.findIndex((l) => l.id === id);
      if (idx <= 0) return; // Cannot merge bottom layer down

      state.pushHistory('Merge down');
      const topLayer = state.layers[idx];
      const bottomLayer = state.layers[idx - 1];

      // Merge pixel grids across all frames
      const newFrames = state.frames.map((frame) => {
        const bottomGrid = frame[idx - 1].map((r) => [...r]);
        const topGrid = frame[idx];

        for (let y = 0; y < state.dimensions.height; y++) {
          for (let x = 0; x < state.dimensions.width; x++) {
            const topPixel = topGrid[y][x];
            if (topPixel) {
              bottomGrid[y][x] = topPixel;
            }
          }
        }

        const newFrame = [...frame];
        newFrame[idx - 1] = bottomGrid;
        newFrame.splice(idx, 1); // remove top layer grid
        return newFrame;
      });

      const newLayers = [...state.layers];
      newLayers.splice(idx, 1);

      set({
        layers: newLayers,
        frames: newFrames,
        activeLayerId: bottomLayer.id,
      });
    },

    reorderLayers: (fromIdx, toIdx) => {
      const state = get();
      if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= state.layers.length || toIdx >= state.layers.length) return;

      state.pushHistory('Reorder layers');
      const newLayers = [...state.layers];
      const [movedLayer] = newLayers.splice(fromIdx, 1);
      newLayers.splice(toIdx, 0, movedLayer);

      const newFrames = state.frames.map((frame) => {
        const frameClone = [...frame];
        const [movedGrid] = frameClone.splice(fromIdx, 1);
        frameClone.splice(toIdx, 0, movedGrid);
        return frameClone;
      });

      set({
        layers: newLayers,
        frames: newFrames,
      });
    },

    // Palettes
    loadPalettePreset: (name) => {
      const preset = PALETTE_PRESETS[name];
      if (!preset) return;
      set({
        palette: [...preset.colors],
        activePaletteName: name,
        primaryColor: preset.colors[0] || '#D0BCFF',
      });
    },

    addColorToPalette: (color) => {
      set((s) => {
        if (s.palette.includes(color.toUpperCase())) return s;
        return { palette: [...s.palette, color.toUpperCase()] };
      });
    },

    removeColorFromPalette: (color) => {
      set((s) => ({
        palette: s.palette.filter((c) => c.toUpperCase() !== color.toUpperCase()),
      }));
    },

    sortPalette: (criteria) => {
      set((s) => {
        const sorted = [...s.palette].sort((a, b) => {
          if (criteria === 'luminance') return calculateLuminance(a) - calculateLuminance(b);
          if (criteria === 'hue') return calculateHue(a) - calculateHue(b);
          if (criteria === 'saturation') return calculateSaturation(a) - calculateSaturation(b);
          return 0;
        });
        return { palette: sorted };
      });
    },

    purgeUnusedColors: () => {
      const state = get();
      const usedColors = new Set<string>();
      for (const frame of state.frames) {
        for (const layer of frame) {
          for (const row of layer) {
            for (const px of row) {
              if (px) usedColors.add(px.toUpperCase());
            }
          }
        }
      }

      set((s) => {
        const purged = s.palette.filter((c) => usedColors.has(c.toUpperCase()));
        return { palette: purged.length > 0 ? purged : s.palette };
      });
    },

    // Project Info
    setProjectTitle: (title) => set({ projectTitle: title }),
    setProjectTags: (tags) => set({ projectTags: tags }),
    setProjectDescription: (desc) => set({ projectDescription: desc }),

    // Peer Jam
    togglePeerJam: () => {
      set((s) => {
        const nextEnabled = !s.peerJam.enabled;
        return {
          peerJam: {
            ...s.peerJam,
            enabled: nextEnabled,
          },
        };
      });
    },

    broadcastCursor: (x, y) => {
      const state = get();
      if (!state.peerJam.enabled || !peerChannel) return;
      peerChannel.postMessage({
        type: 'peer_cursor',
        id: state.peerJam.userName,
        name: state.peerJam.userName,
        color: state.peerJam.userColor,
        x,
        y,
        tool: state.activeTool,
      });
    },
  };
});
