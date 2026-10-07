export type LayerType = 'tile' | 'collision' | 'entity' | 'parallax';
export type CollisionShape = 'none' | 'solid' | 'platform_one_way' | 'hazard' | 'ladder';

export interface TileData {
  tilesetId: string;
  sourceX: number;
  sourceY: number;
  collision: CollisionShape;
  autotileIndex?: number;
  variant?: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  parallaxFactor: { x: number; y: number };
  grid: Record<string, TileData>; // Key format: `${gridX},${gridY}` for sparse matrix efficiency
}

export interface LevelEntity {
  id: string;
  name: string;
  type: 'player_spawn' | 'enemy' | 'collectible' | 'door' | 'trigger';
  position: { x: number; y: number }; // Pixel coordinates or grid-snapped world coordinates
  properties: Record<string, string | number | boolean>;
  connectedEntityIds: string[]; // For visual logic wiring
}

export interface LevelMap {
  id: string;
  title: string;
  author: string;
  description?: string;
  dimensions: { widthInTiles: number; heightInTiles: number; tileSize: number };
  layers: MapLayer[];
  entities: LevelEntity[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  forkedFromId?: string | null;
}

export type EditorTool = 'brush' | 'fill' | 'eraser' | 'select' | 'entity' | 'wire' | 'picker';

export interface EditorState {
  currentMap: LevelMap;
  activeLayerId: string;
  activeTool: EditorTool;
  selectedTileDef: TileData | null;
  selectedEntityId: string | null;
  viewport: { x: number; y: number; zoom: number };
  gridSettings: { showGrid: boolean; snapToGrid: boolean; size: number };
  isPlaytesting: boolean;
  historyIndex: number;
}

export interface DeltaHistoryStep {
  description: string;
  timestamp: number;
  layerId: string;
  tileChanges: {
    key: string;
    before: TileData | null;
    after: TileData | null;
  }[];
  entityChanges?: {
    type: 'add' | 'modify' | 'delete';
    before?: LevelEntity;
    after?: LevelEntity;
  }[];
}

export interface BiomeDefinition {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  defaultCollision: CollisionShape;
  props: string[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  count: number;
}

export interface MapTelemetry {
  mapId: string;
  playCount: number;
  clearCount: number;
  bestTimeMs: number;
  averageTimeMs: number;
  deaths: { x: number; y: number; timestamp: number }[];
}
