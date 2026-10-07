import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CollisionShape,
  EditorState,
  HeatmapPoint,
  LevelEntity,
  LevelMap,
  MapLayer,
  TileData,
} from '../types/index.js';
import { autotileCell } from '../utils/autotile.js';
import { getBiomeAtlas } from '../utils/tilesets.js';
import { PlatformerSimulation } from '../physics/platformer.js';
import { sound } from '../utils/audio.js';

interface UseTilemapCanvasProps {
  map: LevelMap;
  activeLayerId: string;
  activeTool: string;
  selectedTileDef: TileData | null;
  selectedEntityId: string | null;
  gridSettings: { showGrid: boolean; snapToGrid: boolean; size: number };
  isPlaytesting: boolean;
  isAutoTileEnabled: boolean;
  activeBiomeId: string;
  heatmapPoints: HeatmapPoint[];
  showHeatmap: boolean;
  onTileChange: (
    layerId: string,
    changes: { key: string; before: TileData | null; after: TileData | null }[]
  ) => void;
  onEntityChange: (entities: LevelEntity[]) => void;
  onSelectEntity: (id: string | null) => void;
  onRecordTelemetry?: (event: {
    eventType: 'clear' | 'death';
    clearTimeMs?: number;
    score?: number;
    deathX?: number;
    deathY?: number;
  }) => void;
}

export function useTilemapCanvas({
  map,
  activeLayerId,
  activeTool,
  selectedTileDef,
  selectedEntityId,
  gridSettings,
  isPlaytesting,
  isAutoTileEnabled,
  activeBiomeId,
  heatmapPoints,
  showHeatmap,
  onTileChange,
  onEntityChange,
  onSelectEntity,
  onRecordTelemetry,
}: UseTilemapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport transforms (world coordinates and scale)
  const [viewport, setViewport] = useState({ x: 80, y: 80, zoom: 1.25 });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Cursor grid coordinates for telemetry HUD
  const [hoverGridPos, setHoverGridPos] = useState({ x: 0, y: 0 });
  const [hoverWorldPos, setHoverWorldPos] = useState({ x: 0, y: 0 });

  // Wiring tool drag state
  const [wireDragSource, setWireDragSource] = useState<LevelEntity | null>(null);
  const [wireDragCurrent, setWireDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Dragging entity state
  const draggingEntityRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Marquee selection state
  const marqueeRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Simulation instance for instant playtesting
  const simulationRef = useRef<PlatformerSimulation | null>(null);
  if (!simulationRef.current) {
    simulationRef.current = new PlatformerSimulation(map);
  }

  // Pointer drag tracking
  const isPointerDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pendingStrokeChangesRef = useRef<Record<string, { before: TileData | null; after: TileData | null }>>({});

  // Animation frame loop ID
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const dashOffsetRef = useRef<number>(0);

  // Update simulation when map changes
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.setMap(map);
    }
  }, [map]);

  // Handle Playtesting mode shifts
  useEffect(() => {
    if (isPlaytesting && simulationRef.current) {
      simulationRef.current.reset();
      sound.playModeShift(true);
    } else {
      sound.playModeShift(false);
    }
  }, [isPlaytesting]);

  /* ------------------- COORDINATE TRANSFORMS ------------------- */
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const { x, y, zoom } = viewportRef.current;
    return {
      x: (screenX - x) / zoom,
      y: (screenY - y) / zoom,
    };
  }, []);

  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const { x, y, zoom } = viewportRef.current;
    return {
      x: worldX * zoom + x,
      y: worldY * zoom + y,
    };
  }, []);

  const screenToGrid = useCallback((screenX: number, screenY: number) => {
    const world = screenToWorld(screenX, screenY);
    const size = gridSettings.size;
    return {
      x: Math.floor(world.x / size),
      y: Math.floor(world.y / size),
    };
  }, [screenToWorld, gridSettings.size]);

  /* ------------------- MAIN 60FPS RENDERING ENGINE ------------------- */
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    dashOffsetRef.current = (dashOffsetRef.current - 1.2) % 20;

    const width = canvas.width;
    const height = canvas.height;
    const tileSize = gridSettings.size;

    // In Playtest mode: step platformer physics
    if (isPlaytesting && simulationRef.current) {
      simulationRef.current.update(dt);
      const player = simulationRef.current.state.player;

      // Smooth camera follow on player (lerp)
      const targetCamX = width / 2 - (player.x + player.width / 2) * viewportRef.current.zoom;
      const targetCamY = height / 2 - (player.y + player.height / 2) * viewportRef.current.zoom;
      setViewport((prev) => ({
        ...prev,
        x: prev.x + (targetCamX - prev.x) * 0.12,
        y: prev.y + (targetCamY - prev.y) * 0.12,
      }));

      // Report telemetry deaths
      if (simulationRef.current.state.deathCoordinates.length > 0 && onRecordTelemetry) {
        const lastDeath = simulationRef.current.state.deathCoordinates.pop();
        if (lastDeath) {
          onRecordTelemetry({
            eventType: 'death',
            deathX: lastDeath.x,
            deathY: lastDeath.y,
          });
        }
      }
    }

    const { x: camX, y: camY, zoom } = viewportRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    /* ---------------- LAYER 0: PARALLAX BACKGROUND & WORLD GRID ---------------- */
    ctx.fillStyle = '#0A0C10';
    ctx.fillRect(0, 0, width, height);

    // Dynamic Parallax mountain/sky silhouette gradients
    renderParallaxBackdrop(ctx, width, height, camX, camY, zoom);

    // World Map Boundary Guide
    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(zoom, zoom);

    const mapWidthPx = map.dimensions.widthInTiles * tileSize;
    const mapHeightPx = map.dimensions.heightInTiles * tileSize;

    ctx.fillStyle = 'rgba(18, 22, 32, 0.45)';
    ctx.fillRect(0, 0, mapWidthPx, mapHeightPx);

    // Bounding Box
    ctx.strokeStyle = isPlaytesting ? '#10B981' : '#06B6D4';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(0, 0, mapWidthPx, mapHeightPx);

    // Viewport Frustum Culling calculation
    const worldTopLeft = screenToWorld(0, 0);
    const worldBottomRight = screenToWorld(width, height);
    const minGridX = Math.max(0, Math.floor(worldTopLeft.x / tileSize));
    const maxGridX = Math.min(map.dimensions.widthInTiles - 1, Math.ceil(worldBottomRight.x / tileSize));
    const minGridY = Math.max(0, Math.floor(worldTopLeft.y / tileSize));
    const maxGridY = Math.min(map.dimensions.heightInTiles - 1, Math.ceil(worldBottomRight.y / tileSize));

    // World Grid Lines (fades gracefully when zoomed far out)
    if (gridSettings.showGrid && zoom > 0.45 && !isPlaytesting) {
      ctx.strokeStyle = 'rgba(34, 43, 61, 0.55)';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();

      for (let gx = minGridX; gx <= maxGridX + 1; gx++) {
        ctx.moveTo(gx * tileSize, minGridY * tileSize);
        ctx.lineTo(gx * tileSize, (maxGridY + 1) * tileSize);
      }
      for (let gy = minGridY; gy <= maxGridY + 1; gy++) {
        ctx.moveTo(minGridX * tileSize, gy * tileSize);
        ctx.lineTo((maxGridX + 1) * tileSize, gy * tileSize);
      }
      ctx.stroke();
    }

    ctx.restore();

    /* ---------------- LAYER 1: BASE TERRAIN & MIDGROUND TILEMAPS ---------------- */
    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(zoom, zoom);

    for (const layer of map.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;

      const pxFactor = layer.parallaxFactor || { x: 1, y: 1 };
      // Apply subtle parallax offset if not 1.0
      const layerOffsetX = (1 - pxFactor.x) * (camX / zoom) * 0.1;
      const layerOffsetY = (1 - pxFactor.y) * (camY / zoom) * 0.1;

      for (let gy = minGridY; gy <= maxGridY; gy++) {
        for (let gx = minGridX; gx <= maxGridX; gx++) {
          const key = `${gx},${gy}`;
          const tile = layer.grid[key];
          if (!tile) continue;

          const atlas = getBiomeAtlas(tile.tilesetId || 'grass');
          ctx.drawImage(
            atlas,
            tile.sourceX * tileSize,
            tile.sourceY * tileSize,
            tileSize,
            tileSize,
            gx * tileSize + layerOffsetX,
            gy * tileSize + layerOffsetY,
            tileSize,
            tileSize
          );

          // If collision layer or active collision inspection, draw collision overlays
          if (layer.type === 'collision' || (tile.collision && tile.collision !== 'solid')) {
            renderCollisionShapeBadge(ctx, gx * tileSize, gy * tileSize, tileSize, tile.collision);
          }
        }
      }
    }
    ctx.restore();

    /* ---------------- LAYER 2: ENTITIES & INTERACTIVE OBJECTS ---------------- */
    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(zoom, zoom);

    for (const ent of map.entities) {
      const isSelected = ent.id === selectedEntityId;
      const isCollected = isPlaytesting && simulationRef.current?.state.collectedEntityIds.has(ent.id);
      if (isCollected) continue;

      const isDoorOpen = Boolean(isPlaytesting && simulationRef.current?.state.openedDoorIds.has(ent.id));
      const isTriggerActive = Boolean(isPlaytesting && simulationRef.current?.state.activeTriggerIds.has(ent.id));

      renderEntitySprite(ctx, ent, isSelected, isDoorOpen, isTriggerActive, now);
    }

    // Playtesting Player Avatar & Particle Bursts
    if (isPlaytesting && simulationRef.current) {
      const sim = simulationRef.current;
      renderPlayerAvatar(ctx, sim.state.player);

      // Render active particles
      for (const p of sim.state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    /* ---------------- LAYER 3: INTERACTIVE GUIDES, WIRES & OVERLAYS ---------------- */
    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(zoom, zoom);

    // Glowing Bezier Conduits between entities
    for (const sourceEnt of map.entities) {
      if (!sourceEnt.connectedEntityIds || sourceEnt.connectedEntityIds.length === 0) continue;

      for (const targetId of sourceEnt.connectedEntityIds) {
        const targetEnt = map.entities.find((e) => e.id === targetId);
        if (!targetEnt) continue;

        renderBezierConduit(
          ctx,
          sourceEnt.position.x + 16,
          sourceEnt.position.y + 16,
          targetEnt.position.x + 16,
          targetEnt.position.y + 16,
          '#06B6D4',
          dashOffsetRef.current
        );
      }
    }

    // Live wire dragging preview
    if (wireDragSource && wireDragCurrent) {
      renderBezierConduit(
        ctx,
        wireDragSource.position.x + 16,
        wireDragSource.position.y + 16,
        wireDragCurrent.x,
        wireDragCurrent.y,
        '#22D3EE',
        dashOffsetRef.current,
        true
      );
    }

    // Ghost Stamp Preview (semi-transparent 50% opacity snapped to grid)
    if (!isPlaytesting && !isPointerDownRef.current) {
      const gx = hoverGridPos.x;
      const gy = hoverGridPos.y;

      if (
        gx >= 0 &&
        gx < map.dimensions.widthInTiles &&
        gy >= 0 &&
        gy < map.dimensions.heightInTiles
      ) {
        if (activeTool === 'brush' && selectedTileDef) {
          ctx.save();
          ctx.globalAlpha = 0.55;
          const atlas = getBiomeAtlas(selectedTileDef.tilesetId || activeBiomeId);
          ctx.drawImage(
            atlas,
            selectedTileDef.sourceX * tileSize,
            selectedTileDef.sourceY * tileSize,
            tileSize,
            tileSize,
            gx * tileSize,
            gy * tileSize,
            tileSize,
            tileSize
          );
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 1.5 / zoom;
          ctx.strokeRect(gx * tileSize, gy * tileSize, tileSize, tileSize);
          ctx.restore();
        } else if (activeTool === 'eraser') {
          ctx.save();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(gx * tileSize, gy * tileSize, tileSize, tileSize);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1.5 / zoom;
          ctx.strokeRect(gx * tileSize, gy * tileSize, tileSize, tileSize);
          ctx.restore();
        } else if (activeTool === 'select' && marqueeRef.current) {
          const m = marqueeRef.current;
          const rx = Math.min(m.startX, m.currentX);
          const ry = Math.min(m.startY, m.currentY);
          const rw = Math.abs(m.currentX - m.startX);
          const rh = Math.abs(m.currentY - m.startY);

          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.fillRect(rx, ry, rw, rh);
          ctx.strokeStyle = '#06B6D4';
          ctx.setLineDash([4 / zoom, 4 / zoom]);
          ctx.lineWidth = 1.5 / zoom;
          ctx.strokeRect(rx, ry, rw, rh);
          ctx.setLineDash([]);
        }
      }
    }

    // Community Death Heatmap Overlay
    if (showHeatmap && heatmapPoints.length > 0) {
      renderDeathHeatmapOverlay(ctx, heatmapPoints);
    }

    ctx.restore();

    rafIdRef.current = requestAnimationFrame(renderFrame);
  }, [
    map,
    isPlaytesting,
    gridSettings,
    activeTool,
    selectedTileDef,
    selectedEntityId,
    activeBiomeId,
    hoverGridPos,
    wireDragSource,
    wireDragCurrent,
    showHeatmap,
    heatmapPoints,
    onRecordTelemetry,
    screenToWorld,
  ]);

  // Start animation loop
  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [renderFrame]);

  /* ------------------- POINTER & INTERACTION CONTROLS ------------------- */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const grid = screenToGrid(sx, sy);

    isPointerDownRef.current = true;

    // Middle click or Spacebar drag -> Pan viewport
    if (e.button === 1 || e.buttons === 4 || e.altKey || isPanningRef.current) {
      isPanningRef.current = true;
      panStartRef.current = { x: sx - viewportRef.current.x, y: sy - viewportRef.current.y };
      return;
    }

    if (isPlaytesting) return;

    // Wiring tool
    if (activeTool === 'wire') {
      const clickedEntity = findEntityAtWorld(world.x, world.y, map.entities, gridSettings.size);
      if (clickedEntity) {
        setWireDragSource(clickedEntity);
        setWireDragCurrent(world);
        sound.playClick();
      }
      return;
    }

    // Entity tool: select or drag
    if (activeTool === 'entity') {
      const clickedEntity = findEntityAtWorld(world.x, world.y, map.entities, gridSettings.size);
      if (clickedEntity) {
        onSelectEntity(clickedEntity.id);
        draggingEntityRef.current = {
          id: clickedEntity.id,
          offsetX: world.x - clickedEntity.position.x,
          offsetY: world.y - clickedEntity.position.y,
        };
        sound.playClick();
      } else {
        // Place new entity at grid intersection
        const newEntity: LevelEntity = {
          id: `entity-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Collectible Coin',
          type: 'collectible',
          position: {
            x: gridSettings.snapToGrid ? grid.x * gridSettings.size : world.x - 10,
            y: gridSettings.snapToGrid ? grid.y * gridSettings.size : world.y - 10,
          },
          properties: { points: 100, variant: 'gold' },
          connectedEntityIds: [],
        };
        onEntityChange([...map.entities, newEntity]);
        onSelectEntity(newEntity.id);
        sound.playPlace();
      }
      return;
    }

    // Marquee Selection tool
    if (activeTool === 'select') {
      marqueeRef.current = {
        startX: world.x,
        startY: world.y,
        currentX: world.x,
        currentY: world.y,
      };
      return;
    }

    // Bucket Fill tool
    if (activeTool === 'fill') {
      executeBucketFill(grid.x, grid.y);
      return;
    }

    // Brush or Eraser single click/drag start
    pendingStrokeChangesRef.current = {};
    applyToolAtGrid(grid.x, grid.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const grid = screenToGrid(sx, sy);

    setHoverGridPos(grid);
    setHoverWorldPos({ x: Math.round(world.x), y: Math.round(world.y) });

    // Viewport Panning
    if (isPanningRef.current) {
      setViewport((prev) => ({
        ...prev,
        x: sx - panStartRef.current.x,
        y: sy - panStartRef.current.y,
      }));
      return;
    }

    // Wiring drag
    if (wireDragSource) {
      setWireDragCurrent(world);
      return;
    }

    // Dragging entity
    if (draggingEntityRef.current) {
      const { id, offsetX, offsetY } = draggingEntityRef.current;
      const targetX = gridSettings.snapToGrid
        ? Math.round((world.x - offsetX) / gridSettings.size) * gridSettings.size
        : world.x - offsetX;
      const targetY = gridSettings.snapToGrid
        ? Math.round((world.y - offsetY) / gridSettings.size) * gridSettings.size
        : world.y - offsetY;

      const updated = map.entities.map((ent) =>
        ent.id === id ? { ...ent, position: { x: targetX, y: targetY } } : ent
      );
      onEntityChange(updated);
      return;
    }

    // Marquee update
    if (marqueeRef.current) {
      marqueeRef.current.currentX = world.x;
      marqueeRef.current.currentY = world.y;
      return;
    }

    // Continuous Brush/Eraser Painting
    if (isPointerDownRef.current && (activeTool === 'brush' || activeTool === 'eraser')) {
      applyToolAtGrid(grid.x, grid.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    isPanningRef.current = false;
    draggingEntityRef.current = null;
    marqueeRef.current = null;

    // Finish wire connection
    if (wireDragSource) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const targetEntity = findEntityAtWorld(world.x, world.y, map.entities, gridSettings.size);

        if (targetEntity && targetEntity.id !== wireDragSource.id) {
          // Connect entities
          const currentLinks = wireDragSource.connectedEntityIds || [];
          if (!currentLinks.includes(targetEntity.id)) {
            const updated = map.entities.map((ent) =>
              ent.id === wireDragSource.id
                ? { ...ent, connectedEntityIds: [...currentLinks, targetEntity.id] }
                : ent
            );
            onEntityChange(updated);
            sound.playWireConnect();
          }
        }
      }
      setWireDragSource(null);
      setWireDragCurrent(null);
    }

    // Commit stroke changes to history delta stack
    const changesArray = Object.entries(pendingStrokeChangesRef.current).map(([key, val]) => ({
      key,
      before: val.before,
      after: val.after,
    }));

    if (changesArray.length > 0) {
      onTileChange(activeLayerId, changesArray);
      pendingStrokeChangesRef.current = {};
    }
  };

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(3.5, Math.max(0.25, viewportRef.current.zoom * zoomFactor));

    setViewport((prev) => ({
      zoom: newZoom,
      x: cursorX - (cursorX - prev.x) * (newZoom / prev.zoom),
      y: cursorY - (cursorY - prev.y) * (newZoom / prev.zoom),
    }));
  };

  /* ------------------- TILE TOOL ACTIONS ------------------- */
  const applyToolAtGrid = (gx: number, gy: number) => {
    if (
      gx < 0 ||
      gx >= map.dimensions.widthInTiles ||
      gy < 0 ||
      gy >= map.dimensions.heightInTiles
    ) {
      return;
    }

    const currentLayer = map.layers.find((l) => l.id === activeLayerId);
    if (!currentLayer) return;

    const key = `${gx},${gy}`;
    const beforeTile = currentLayer.grid[key] ?? null;

    if (activeTool === 'brush' && selectedTileDef) {
      if (isAutoTileEnabled) {
        // Auto-tiling 47-blob algorithm
        const updates = autotileCell(
          currentLayer.grid,
          gx,
          gy,
          selectedTileDef.tilesetId || activeBiomeId,
          selectedTileDef.collision
        );
        for (const u of updates) {
          if (!pendingStrokeChangesRef.current[u.key]) {
            pendingStrokeChangesRef.current[u.key] = {
              before: currentLayer.grid[u.key] ?? null,
              after: u.tile,
            };
          } else {
            pendingStrokeChangesRef.current[u.key].after = u.tile;
          }
        }
        sound.playPlace();
      } else {
        // Direct stamp
        const newTile: TileData = {
          ...selectedTileDef,
          tilesetId: selectedTileDef.tilesetId || activeBiomeId,
        };
        currentLayer.grid[key] = newTile;

        if (!pendingStrokeChangesRef.current[key]) {
          pendingStrokeChangesRef.current[key] = { before: beforeTile, after: newTile };
        } else {
          pendingStrokeChangesRef.current[key].after = newTile;
        }
        sound.playPlace();
      }
    } else if (activeTool === 'eraser') {
      if (currentLayer.grid[key]) {
        delete currentLayer.grid[key];
        if (!pendingStrokeChangesRef.current[key]) {
          pendingStrokeChangesRef.current[key] = { before: beforeTile, after: null };
        } else {
          pendingStrokeChangesRef.current[key].after = null;
        }
        sound.playErase();
      }
    }
  };

  const executeBucketFill = (startX: number, startY: number) => {
    const currentLayer = map.layers.find((l) => l.id === activeLayerId);
    if (!currentLayer || !selectedTileDef) return;

    const { widthInTiles, heightInTiles } = map.dimensions;
    const targetKey = `${startX},${startY}`;
    const targetTile = currentLayer.grid[targetKey];
    const targetSignature = targetTile ? `${targetTile.tilesetId}_${targetTile.sourceX}_${targetTile.sourceY}` : 'empty';
    const fillSignature = `${selectedTileDef.tilesetId}_${selectedTileDef.sourceX}_${selectedTileDef.sourceY}`;

    if (targetSignature === fillSignature) return;

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    const changes: { key: string; before: TileData | null; after: TileData | null }[] = [];

    while (queue.length > 0 && changes.length < 1500) {
      const [cx, cy] = queue.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (cx < 0 || cx >= widthInTiles || cy < 0 || cy >= heightInTiles) continue;

      const current = currentLayer.grid[key];
      const curSig = current ? `${current.tilesetId}_${current.sourceX}_${current.sourceY}` : 'empty';

      if (curSig === targetSignature) {
        const newTile: TileData = {
          ...selectedTileDef,
          tilesetId: selectedTileDef.tilesetId || activeBiomeId,
        };
        currentLayer.grid[key] = newTile;
        changes.push({ key, before: current ?? null, after: newTile });

        queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
    }

    if (changes.length > 0) {
      onTileChange(activeLayerId, changes);
      sound.playPlace();
    }
  };

  return {
    canvasRef,
    viewport,
    setViewport,
    hoverGridPos,
    hoverWorldPos,
    simulation: simulationRef.current,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  };
}

/* ------------------- DRAWING HELPERS ------------------- */

function renderParallaxBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camX: number,
  camY: number,
  zoom: number
) {
  // Deep gradient void
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#06080F');
  skyGrad.addColorStop(0.5, '#0B1220');
  skyGrad.addColorStop(1, '#0A0C10');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Parallax distant mountain ridges (Layer 1 parallax: 0.15)
  const ridge1Offset = (camX * 0.15) % width;
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 60; x += 60) {
    const rx = x + ridge1Offset - 60;
    const ry = height - 140 - Math.sin((rx + 200) * 0.008) * 45;
    ctx.lineTo(rx, ry);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Parallax closer hills (Layer 2 parallax: 0.35)
  const ridge2Offset = (camX * 0.35) % width;
  ctx.fillStyle = '#162032';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 40; x += 40) {
    const rx = x + ridge2Offset - 40;
    const ry = height - 80 - Math.sin((rx + 50) * 0.015) * 30;
    ctx.lineTo(rx, ry);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}

function renderCollisionShapeBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  col: CollisionShape
) {
  ctx.save();
  if (col === 'solid') {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  } else if (col === 'platform_one_way') {
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 4);
    ctx.lineTo(x + size - 2, y + 4);
    ctx.stroke();
    // Upward arrow
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + 7);
    ctx.lineTo(x + size / 2 - 4, y + 12);
    ctx.lineTo(x + size / 2 + 4, y + 12);
    ctx.fill();
  } else if (col === 'hazard') {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    // Spikes
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size * 0.25, y + size * 0.3);
    ctx.lineTo(x + size * 0.5, y + size);
    ctx.lineTo(x + size * 0.75, y + size * 0.3);
    ctx.lineTo(x + size, y + size);
    ctx.stroke();
  } else if (col === 'ladder') {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    // Ladder rails
    ctx.strokeRect(x + 6, y, 2, size);
    ctx.strokeRect(x + size - 8, y, 2, size);
    // Ladder rungs
    for (let r = 6; r < size; r += 8) {
      ctx.beginPath();
      ctx.moveTo(x + 8, y + r);
      ctx.lineTo(x + size - 8, y + r);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function renderEntitySprite(
  ctx: CanvasRenderingContext2D,
  ent: LevelEntity,
  isSelected: boolean,
  isDoorOpen: boolean,
  isTriggerActive: boolean,
  now: number
) {
  const { x, y } = ent.position;
  ctx.save();

  if (ent.type === 'player_spawn') {
    // Glowing Emerald Beacon
    ctx.fillStyle = '#10B981';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner icon
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Direction arrow
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 16);
    ctx.lineTo(x + 24, y + 16);
    ctx.stroke();
  } else if (ent.type === 'collectible') {
    // Floating animated golden star gem
    const bob = Math.sin(now * 0.005 + x) * 4;
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x + 10, y + 10 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(x + 8, y + 8 + bob, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (ent.type === 'door') {
    // Vault Blast Door
    ctx.fillStyle = isDoorOpen ? 'rgba(79, 70, 229, 0.3)' : '#4F46E5';
    ctx.fillRect(x, y, 20, 48);
    ctx.strokeStyle = isDoorOpen ? '#10B981' : '#EF4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 20, 48);

    // Indicator lamp
    ctx.fillStyle = isDoorOpen ? '#10B981' : '#EF4444';
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (ent.type === 'trigger') {
    // Pressure Plate Switch
    ctx.fillStyle = isTriggerActive ? '#10B981' : '#06B6D4';
    ctx.fillRect(x, y + 20, 32, 12);
    ctx.fillStyle = isTriggerActive ? '#34D399' : '#22D3EE';
    ctx.fillRect(x + 4, y + (isTriggerActive ? 22 : 18), 24, 6);
  } else if (ent.type === 'enemy') {
    // Red Cyber Sentinel
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y, 24, 24);
    ctx.shadowBlur = 0;
    // Glowing red eye
    ctx.fillStyle = '#FEF2F2';
    ctx.fillRect(x + 6, y + 8, 12, 4);
  }

  // Selection halo
  if (isSelected) {
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, 34, 34);
  }

  ctx.restore();
}

function renderPlayerAvatar(ctx: CanvasRenderingContext2D, player: any) {
  const { x, y, width, height, facing, isDead } = player;
  if (isDead) return;

  ctx.save();
  // Player body
  ctx.fillStyle = '#06B6D4';
  ctx.shadowColor = '#06B6D4';
  ctx.shadowBlur = 10;
  ctx.fillRect(x, y, width, height);
  ctx.shadowBlur = 0;

  // Visor
  ctx.fillStyle = '#F8FAFC';
  const visorX = facing === 'right' ? x + width - 8 : x + 2;
  ctx.fillRect(visorX, y + 6, 6, 4);

  // Boots
  ctx.fillStyle = '#0E7490';
  ctx.fillRect(x + 2, y + height - 6, 6, 6);
  ctx.fillRect(x + width - 8, y + height - 6, 6, 6);

  ctx.restore();
}

function renderBezierConduit(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashOffset: number,
  isDraft: boolean = false
) {
  ctx.save();
  const dx = (x2 - x1) * 0.5;
  const dy = (y2 - y1) * 0.5;
  const cp1x = x1 + dx;
  const cp1y = y1;
  const cp2x = x2 - dx;
  const cp2y = y2;

  // Glow line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = dashOffset;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
  ctx.stroke();

  // Nodes
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x1, y1, 4, 0, Math.PI * 2);
  ctx.arc(x2, y2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderDeathHeatmapOverlay(
  ctx: CanvasRenderingContext2D,
  points: HeatmapPoint[]
) {
  ctx.save();
  for (const pt of points) {
    const intensity = Math.min(1, pt.count / 8);
    const radius = 32 + intensity * 24;

    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
    grad.addColorStop(0, `rgba(239, 68, 68, ${0.85 * intensity + 0.15})`);
    grad.addColorStop(0.5, `rgba(249, 115, 22, ${0.45 * intensity})`);
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Small skull / death cross marker
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(pt.x - 3, pt.y - 1, 6, 2);
    ctx.fillRect(pt.x - 1, pt.y - 3, 2, 6);
  }
  ctx.restore();
}

function findEntityAtWorld(
  wx: number,
  wy: number,
  entities: LevelEntity[],
  size: number
): LevelEntity | null {
  for (let i = entities.length - 1; i >= 0; i--) {
    const ent = entities[i];
    const ew = 32;
    const eh = 32;
    if (wx >= ent.position.x && wx <= ent.position.x + ew && wy >= ent.position.y && wy <= ent.position.y + eh) {
      return ent;
    }
  }
  return null;
}
