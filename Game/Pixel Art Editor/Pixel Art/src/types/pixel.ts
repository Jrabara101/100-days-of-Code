export type ToolType = 'pencil' | 'eraser' | 'bucket' | 'picker' | 'select' | 'move';

export type BlendModeType = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'lighter' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export type LoopMode = 'loop' | 'ping-pong' | 'once';

export type AppTab = 'editor' | 'timeline' | 'palettes' | 'layers' | 'export';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0 to 1
  locked: boolean;
  blendMode: BlendModeType;
}

export interface SelectionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PeerInfo {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  tool: ToolType;
  lastActive: number;
}

export interface HistoryEntry {
  description: string;
  frames: string[][][][]; // snapshot
  activeFrameIndex: number;
  layers: Layer[];
}

export interface PixelStudioState {
  // Canvas Geometry & Navigation
  dimensions: { width: number; height: number };
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  cursorPos: { x: number; y: number } | null;
  activeTab: AppTab;

  // Active Tool & Colors
  activeTool: ToolType;
  brushSize: number;
  pixelPerfect: boolean;
  primaryColor: string;
  secondaryColor: string;

  // Palettes
  palette: string[];
  activePaletteName: string;

  // Layers
  layers: Layer[];
  activeLayerId: string;

  // Multi-frame animation
  frames: string[][][][]; // [frameIndex][layerIndex][y][x] hex string (or empty "" for transparent)
  activeFrameIndex: number;
  fps: number;
  isPlaying: boolean;
  loopMode: LoopMode;
  onionSkin: {
    enabled: boolean;
    framesBefore: number;
    framesAfter: number;
  };

  // Selection
  selection: SelectionRect | null;
  isSelecting: boolean;

  // Peer Jam (Multi-tab/multiplayer collaboration)
  peerJam: {
    enabled: boolean;
    roomId: string;
    userName: string;
    userColor: string;
    peers: PeerInfo[];
  };

  // Project Info
  projectTitle: string;
  projectTags: string;
  projectDescription: string;
}
