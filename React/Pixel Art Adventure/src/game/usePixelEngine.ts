import { useEffect, useRef, useState, useCallback } from 'react';
import { WorldPosition, AdventureGameState } from '../types/game';
import { MapDefinition } from '../../server/maps';
import { pixelSprites } from './sprites';
import { audioEngine } from '../services/audio';

export interface InteractivePrompt {
  id: string;
  text: string;
  keyText: string;
  worldX: number;
  worldY: number;
  type: 'talk' | 'inspect' | 'memory_echo' | 'chest' | 'portal' | 'puzzle';
}

interface PixelEngineOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mapData: MapDefinition | null;
  gameState: AdventureGameState;
  onUpdatePosition: (pos: WorldPosition) => void;
  onStartDialogue: (nodeId: string) => void;
  onTriggerMemoryEcho: (echoPayload: any) => void;
  onOpenChest: (chestPayload: any) => void;
  onTransitionMap: (targetMapId: string, x: number, y: number, facing: 'up' | 'down' | 'left' | 'right') => void;
  onAwakenGolem: () => void;
  onToggleTool: (toolId: string) => void;
}

export function usePixelEngine({
  canvasRef,
  mapData,
  gameState,
  onUpdatePosition,
  onStartDialogue,
  onTriggerMemoryEcho,
  onOpenChest,
  onTransitionMap,
  onAwakenGolem,
  onToggleTool,
}: PixelEngineOptions) {
  // Expose active prompt to React only when it changes to prevent React re-renders during 60fps loop
  const [activePrompt, setActivePrompt] = useState<InteractivePrompt | null>(null);

  // Mutable game loop state decoupled from React render cycle
  const engineRef = useRef({
    player: {
      x: gameState.player.position.x * 32,
      y: gameState.player.position.y * 32,
      vx: 0,
      vy: 0,
      speed: 130, // px per second
      facing: gameState.player.position.facing,
      frame: 0,
      animTimer: 0,
      stepTimer: 0,
      isMoving: false,
    },
    camera: {
      x: gameState.player.position.x * 32,
      y: gameState.player.position.y * 32,
      zoom: 3, // 3x retro scale
    },
    lanternLightRadius: gameState.player.activeToolId === 'lantern' ? 115 : 45,
    lanternTargetRadius: gameState.player.activeToolId === 'lantern' ? 115 : 45,
    timeOfDay: gameState.timeOfDay,
    keys: new Set<string>(),
    virtualDpad: { up: false, down: false, left: false, right: false },
    activePromptInternal: null as InteractivePrompt | null,
    fireflies: Array.from({ length: 24 }, () => ({
      x: Math.random() * 32 * 32,
      y: Math.random() * 22 * 32,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      alpha: Math.random(),
    })),
    lastTime: performance.now(),
    isRunning: true,
  });

  // Keep references to latest callbacks and flags
  const stateRef = useRef({
    gameState,
    mapData,
    onUpdatePosition,
    onStartDialogue,
    onTriggerMemoryEcho,
    onOpenChest,
    onTransitionMap,
    onAwakenGolem,
  });

  useEffect(() => {
    stateRef.current = {
      gameState,
      mapData,
      onUpdatePosition,
      onStartDialogue,
      onTriggerMemoryEcho,
      onOpenChest,
      onTransitionMap,
      onAwakenGolem,
    };
  }, [gameState, mapData, onUpdatePosition, onStartDialogue, onTriggerMemoryEcho, onOpenChest, onTransitionMap, onAwakenGolem]);

  // Handle lantern toggle changes smoothly
  useEffect(() => {
    const isLantern = gameState.player.activeToolId === 'lantern';
    engineRef.current.lanternTargetRadius = isLantern ? 115 : 40;
  }, [gameState.player.activeToolId]);

  // Reset engine coordinates when map changes
  useEffect(() => {
    if (mapData) {
      engineRef.current.player.x = gameState.player.position.x * 32;
      engineRef.current.player.y = gameState.player.position.y * 32;
      engineRef.current.player.facing = gameState.player.position.facing;
      engineRef.current.camera.x = engineRef.current.player.x;
      engineRef.current.camera.y = engineRef.current.player.y;
    }
  }, [mapData?.id]);

  // Input Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      engineRef.current.keys.add(e.code);

      // Tool quick selection: 1 = Lantern, 2 = Flute
      if (e.key === '1') {
        onToggleTool('lantern');
      } else if (e.key === '2') {
        onToggleTool('harmonic_flute');
      }

      // Interaction trigger key
      if ((e.code === 'KeyE' || e.code === 'Space') && stateRef.current.gameState.status === 'EXPLORING') {
        const prompt = engineRef.current.activePromptInternal;
        if (prompt) {
          handlePromptTrigger(prompt);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onToggleTool]);

  // Prompt trigger handler
  const handlePromptTrigger = useCallback((prompt: InteractivePrompt) => {
    const { gameState: currState, mapData: currMap, onStartDialogue: startDiag, onTriggerMemoryEcho: trigEcho, onOpenChest: openCh, onTransitionMap: transMap } = stateRef.current;
    if (!currMap) return;

    audioEngine.playChoiceSelect();

    if (prompt.type === 'talk') {
      const npc = currMap.npcs.find((n) => n.id === prompt.id);
      if (npc) {
        startDiag(npc.dialogueNodeId);
      }
    } else if (prompt.type === 'memory_echo') {
      const trigger = currMap.triggers.find((t) => t.id === prompt.id);
      if (trigger) {
        trigEcho(trigger.actionPayload);
      }
    } else if (prompt.type === 'chest') {
      const trigger = currMap.triggers.find((t) => t.id === prompt.id);
      if (trigger) {
        openCh(trigger.actionPayload);
      }
    } else if (prompt.type === 'portal') {
      const trigger = currMap.triggers.find((t) => t.id === prompt.id);
      if (trigger) {
        if (trigger.actionPayload.requiresFlag && !currState.narrativeFlags[trigger.actionPayload.requiresFlag]) {
          startDiag('golem_hint');
          return;
        }
        transMap(
          trigger.actionPayload.targetMapId,
          trigger.actionPayload.targetX,
          trigger.actionPayload.targetY,
          trigger.actionPayload.targetFacing || 'down'
        );
      }
    } else if (prompt.type === 'puzzle') {
      const trigger = currMap.triggers.find((t) => t.id === prompt.id);
      if (trigger && trigger.actionPayload.dialogueNodeId) {
        startDiag(trigger.actionPayload.dialogueNodeId);
      }
    }
  }, []);

  // Public Virtual D-pad handler for mobile touch controls
  const setVirtualInput = useCallback((dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    engineRef.current.virtualDpad[dir] = pressed;
  }, []);

  // Public Action Button trigger for mobile touch controls
  const triggerAction = useCallback(() => {
    const prompt = engineRef.current.activePromptInternal;
    if (prompt && stateRef.current.gameState.status === 'EXPLORING') {
      handlePromptTrigger(prompt);
    }
  }, [handlePromptTrigger]);

  // Core Fixed-Timestep 60Hz RequestAnimationFrame Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable crisp pixelated scaling
    ctx.imageSmoothingEnabled = false;

    // Offscreen lighting canvas for dark composite multiply operations
    const lightCanvas = document.createElement('canvas');
    const lightCtx = lightCanvas.getContext('2d')!;

    let animationFrameId: number;
    let accumulatedTime = 0;
    const fixedDt = 1 / 60; // 60Hz physics step

    const gameLoop = (currentTime: number) => {
      const engine = engineRef.current;
      const { gameState: currState, mapData: currMap } = stateRef.current;

      const delta = Math.min((currentTime - engine.lastTime) / 1000, 0.1);
      engine.lastTime = currentTime;
      accumulatedTime += delta;

      // Handle Resize dynamically
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        lightCanvas.width = canvas.width;
        lightCanvas.height = canvas.height;
      }

      // --- FIXED TIMESTEP UPDATE (60Hz) ---
      while (accumulatedTime >= fixedDt) {
        if (currMap && currState.status === 'EXPLORING') {
          // 1. Calculate Player Movement Intent
          let dx = 0;
          let dy = 0;

          const isUp = engine.keys.has('KeyW') || engine.keys.has('ArrowUp') || engine.virtualDpad.up;
          const isDown = engine.keys.has('KeyS') || engine.keys.has('ArrowDown') || engine.virtualDpad.down;
          const isLeft = engine.keys.has('KeyA') || engine.keys.has('ArrowLeft') || engine.virtualDpad.left;
          const isRight = engine.keys.has('KeyD') || engine.keys.has('ArrowRight') || engine.virtualDpad.right;

          if (isUp) dy -= 1;
          if (isDown) dy += 1;
          if (isLeft) dx -= 1;
          if (isRight) dx += 1;

          // Normalize diagonal speed
          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }

          engine.player.isMoving = dx !== 0 || dy !== 0;

          if (engine.player.isMoving) {
            // Update facing direction
            if (Math.abs(dx) > Math.abs(dy)) {
              engine.player.facing = dx > 0 ? 'right' : 'left';
            } else {
              engine.player.facing = dy > 0 ? 'down' : 'up';
            }

            // Animate walk cycle
            engine.player.animTimer += fixedDt;
            if (engine.player.animTimer >= 0.15) {
              engine.player.frame = (engine.player.frame + 1) % 4;
              engine.player.animTimer = 0;
            }

            // Footstep audio
            engine.player.stepTimer += fixedDt;
            if (engine.player.stepTimer >= 0.3) {
              audioEngine.playFootstep();
              engine.player.stepTimer = 0;
            }

            // --- AABB COLLISION RESOLUTION ---
            const nextX = engine.player.x + dx * engine.player.speed * fixedDt;
            const nextY = engine.player.y + dy * engine.player.speed * fixedDt;

            const playerBoxSize = 20; // 20x20 bounding box
            const canMoveX = !checkTileCollision(nextX, engine.player.y, playerBoxSize, currMap, currState);
            const canMoveY = !checkTileCollision(engine.player.x, nextY, playerBoxSize, currMap, currState);

            if (canMoveX) engine.player.x = nextX;
            if (canMoveY) engine.player.y = nextY;
          } else {
            engine.player.frame = 0;
          }

          // Spring ease lantern radius
          engine.lanternLightRadius += (engine.lanternTargetRadius - engine.lanternLightRadius) * 0.1;

          // Ambient Time of Day slow advance
          engine.timeOfDay = (engine.timeOfDay + fixedDt * 0.05) % 24;

          // Check Proximity Triggers & NPCs
          let nearestPrompt: InteractivePrompt | null = null;
          let minDistance = Infinity;

          // Check NPCs
          currMap.npcs.forEach((npc) => {
            const nx = npc.x * 32 + 16;
            const ny = npc.y * 32 + 16;
            const dist = Math.hypot(engine.player.x + 16 - nx, engine.player.y + 16 - ny);
            if (dist < 48 && dist < minDistance) {
              minDistance = dist;
              nearestPrompt = {
                id: npc.id,
                text: `Talk to ${npc.name}`,
                keyText: 'E',
                worldX: nx,
                worldY: ny - 24,
                type: 'talk',
              };
            }
          });

          // Check Triggers
          currMap.triggers.forEach((trig) => {
            const tx = trig.x * 32 + 16;
            const ty = trig.y * 32 + 16;
            const dist = Math.hypot(engine.player.x + 16 - tx, engine.player.y + 16 - ty);
            const rad = (trig.radius || 1.5) * 32;
            if (dist < rad && dist < minDistance) {
              minDistance = dist;
              nearestPrompt = {
                id: trig.id,
                text: trig.promptText,
                keyText: trig.promptKey,
                worldX: tx,
                worldY: ty - 22,
                type: trig.type,
              };
            }
          });

          // Update active prompt state
          if (nearestPrompt !== engine.activePromptInternal) {
            engine.activePromptInternal = nearestPrompt;
            setActivePrompt(nearestPrompt);
          }
        }

        // --- CAMERA SMOOTH LERP & CLAMPING ---
        if (currMap) {
          const mapPixelWidth = currMap.width * 32;
          const mapPixelHeight = currMap.height * 32;

          const targetCamX = engine.player.x + 16;
          const targetCamY = engine.player.y + 16;

          // Smooth lerp (0.1 factor)
          engine.camera.x += (targetCamX - engine.camera.x) * 0.12;
          engine.camera.y += (targetCamY - engine.camera.y) * 0.12;

          // Clamping based on viewport bounds
          const halfViewW = canvas.width / (2 * engine.camera.zoom);
          const halfViewH = canvas.height / (2 * engine.camera.zoom);

          if (mapPixelWidth > halfViewW * 2) {
            engine.camera.x = Math.max(halfViewW, Math.min(mapPixelWidth - halfViewW, engine.camera.x));
          } else {
            engine.camera.x = mapPixelWidth / 2;
          }

          if (mapPixelHeight > halfViewH * 2) {
            engine.camera.y = Math.max(halfViewH, Math.min(mapPixelHeight - halfViewH, engine.camera.y));
          } else {
            engine.camera.y = mapPixelHeight / 2;
          }
        }

        accumulatedTime -= fixedDt;
      }

      // --- RENDERING PASS ---
      if (currMap) {
        renderScene(ctx, lightCtx, canvas, lightCanvas, engine, currMap, currState, currentTime / 1000);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasRef, handlePromptTrigger]);

  return {
    activePrompt,
    setVirtualInput,
    triggerAction,
    engineRef,
  };
}

// AABB Collision checking against collision grid
function checkTileCollision(
  px: number,
  py: number,
  boxSize: number,
  map: MapDefinition,
  gameState: AdventureGameState
): boolean {
  const left = px + (32 - boxSize) / 2;
  const right = left + boxSize;
  const top = py + 16; // Feet collider
  const bottom = py + 30;

  const minTileX = Math.floor(left / 32);
  const maxTileX = Math.floor(right / 32);
  const minTileY = Math.floor(top / 32);
  const maxTileY = Math.floor(bottom / 32);

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) {
        return true;
      }
      // Check impassable collision layer
      if (map.layers.collisions[ty][tx] === 1) {
        // Special condition: if golem is awakened, allow passage at x=24, y=7
        if (map.id === 'whispering_glade' && tx === 24 && ty === 7 && gameState.narrativeFlags.golem_awakened) {
          continue;
        }
        return true;
      }
    }
  }

  return false;
}

// Main Render Pipeline: Ground -> Detail -> Entities -> Canopy -> Lighting Composite -> HUD Beacons
function renderScene(
  ctx: CanvasRenderingContext2D,
  lightCtx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  lightCanvas: HTMLCanvasElement,
  engine: any,
  map: MapDefinition,
  gameState: AdventureGameState,
  timeSec: number
) {
  const zoom = engine.camera.zoom;
  const camX = engine.camera.x;
  const camY = engine.camera.y;

  // Clear canvas
  ctx.fillStyle = '#0B0D14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Center camera in viewport
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -camY);

  // 1. Ground & Water Layer
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const gId = map.layers.ground[y][x];
      pixelSprites.drawTile(ctx, x * 32, y * 32, gId, timeSec);
    }
  }

  // 2. Detail & Decor Layer (Pathways, mushrooms, flowers)
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const dId = map.layers.detail[y][x];
      if (dId > 0 && dId !== 10 && dId !== 15 && dId !== 18) { // Skip large entities drawn in depth pass
        pixelSprites.drawTile(ctx, x * 32, y * 32, dId, timeSec);
      }
    }
  }

  // 3. Y-Depth Sorted Entities (Player, NPCs, Monoliths, Trees)
  const entities: { y: number; draw: () => void }[] = [];

  // Add Player
  entities.push({
    y: engine.player.y + 24,
    draw: () => {
      pixelSprites.drawPlayer(
        ctx,
        engine.player.x,
        engine.player.y,
        engine.player.facing,
        engine.player.frame,
        gameState.player.activeToolId === 'lantern'
      );
    },
  });

  // Add NPCs
  map.npcs.forEach((npc) => {
    // If golem is awakened in whispering glade, shift it slightly to the right to open the pass
    const isAwake = gameState.narrativeFlags.golem_awakened === true;
    const nx = npc.id === 'stone_golem' && isAwake ? (npc.x + 1) * 32 : npc.x * 32;
    const ny = npc.y * 32;

    entities.push({
      y: ny + 24,
      draw: () => {
        pixelSprites.drawNPC(ctx, nx, ny, npc.spriteType, npc.facing, isAwake);
      },
    });
  });

  // Add Tall Object Props (Tree bases, monolith columns, altars)
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const dId = map.layers.detail[y][x];
      if (dId === 10 || dId === 15 || dId === 18) {
        entities.push({
          y: y * 32 + 28,
          draw: () => {
            pixelSprites.drawTile(ctx, x * 32, y * 32, dId, timeSec);
          },
        });
      }
    }
  }

  // Sort by Y position and render
  entities.sort((a, b) => a.y - b.y);
  entities.forEach((ent) => ent.draw());

  // 4. Elevated Canopy Overlay Layer (Over player head)
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const oId = map.layers.overlay[y][x];
      if (oId > 0) {
        pixelSprites.drawTile(ctx, x * 32, y * 32 - 12, oId, timeSec);
      }
    }
  }

  // 5. Fireflies drifting in evening/night
  if (engine.timeOfDay > 17.5 || engine.timeOfDay < 6.5) {
    ctx.fillStyle = '#FDE047';
    engine.fireflies.forEach((ff: any) => {
      ff.x += ff.vx * 0.016;
      ff.y += ff.vy * 0.016;
      if (ff.x < 0) ff.x = map.width * 32;
      if (ff.x > map.width * 32) ff.x = 0;
      if (ff.y < 0) ff.y = map.height * 32;
      if (ff.y > map.height * 32) ff.y = 0;

      const flicker = 0.4 + Math.sin(timeSec * 4 + ff.x) * 0.4;
      ctx.globalAlpha = flicker;
      ctx.fillRect(ff.x, ff.y, 2, 2);
    });
    ctx.globalAlpha = 1.0;
  }

  // 6. Interactive Proximity Beacons (Floating [E] / [Space] bubbles)
  if (engine.activePromptInternal) {
    const prompt = engine.activePromptInternal;
    const bob = Math.sin(timeSec * 5) * 3;

    ctx.save();
    ctx.translate(prompt.worldX, prompt.worldY + bob);

    // Pill background
    ctx.fillStyle = '#131826F2';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(-22, -14, 44, 18, 4);
    ctx.fill();
    ctx.stroke();

    // Hotkey text
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[${prompt.keyText}]`, 0, -5);

    ctx.restore();
  }

  ctx.restore();

  // --- 7. DYNAMIC 2D PIXEL LIGHTING & SHADER PASS ---
  renderDynamicLighting(ctx, lightCtx, canvas, lightCanvas, engine, map, gameState, timeSec);
}

// Composite dynamic lighting: Ambient Day/Night Darkness + Radial Light Cutouts
function renderDynamicLighting(
  ctx: CanvasRenderingContext2D,
  lightCtx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  lightCanvas: HTMLCanvasElement,
  engine: any,
  map: MapDefinition,
  gameState: AdventureGameState,
  timeSec: number
) {
  const zoom = engine.camera.zoom;
  const camX = engine.camera.x;
  const camY = engine.camera.y;

  // Determine ambient light based on 24hr cycle
  // 0 - 5: Deep night (0.92 dark)
  // 5 - 7: Dawn transition
  // 7 - 17: Day (0.05 light)
  // 17 - 20: Sunset / Dusk (0.5 dark)
  // 20 - 24: Deep night
  const hour = engine.timeOfDay;
  let darkness = 0.05;
  let ambientTint = 'rgba(11, 13, 20, ';

  if (hour >= 20 || hour < 5) {
    darkness = 0.92; // Deep indigo obsidian night
    ambientTint = 'rgba(8, 12, 26, ';
  } else if (hour >= 5 && hour < 7.5) {
    const t = (hour - 5) / 2.5;
    darkness = 0.92 - t * 0.85; // Dawn fading
    ambientTint = 'rgba(28, 16, 26, '; // Rose-amber dawn
  } else if (hour >= 7.5 && hour < 17) {
    darkness = 0.08; // Clear day
    ambientTint = 'rgba(15, 23, 42, ';
  } else {
    const t = (hour - 17) / 3;
    darkness = 0.08 + t * 0.84; // Twilight falling
    ambientTint = 'rgba(20, 14, 32, '; // Twilight indigo
  }

  // Clear offscreen light canvas
  lightCtx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);

  // Fill ambient darkness
  lightCtx.fillStyle = `${ambientTint}${darkness})`;
  lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);

  // Now cut out light sources using destination-out
  lightCtx.save();
  lightCtx.globalCompositeOperation = 'destination-out';

  // Screen space transformation
  const toScreenX = (wx: number) => canvas.width / 2 + (wx - camX) * zoom;
  const toScreenY = (wy: number) => canvas.height / 2 + (wy - camY) * zoom;

  // A. Player Lantern Radial Glow
  const pScreenX = toScreenX(engine.player.x + 16);
  const pScreenY = toScreenY(engine.player.y + 20);
  const flicker = Math.sin(timeSec * 7) * 2;
  const lanternR = (engine.lanternLightRadius + flicker) * (zoom * 0.8);

  const playerGrad = lightCtx.createRadialGradient(pScreenX, pScreenY, 10, pScreenX, pScreenY, lanternR);
  playerGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
  playerGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.7)');
  playerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  lightCtx.fillStyle = playerGrad;
  lightCtx.beginPath();
  lightCtx.arc(pScreenX, pScreenY, lanternR, 0, Math.PI * 2);
  lightCtx.fill();

  // B. World Map Light Sources (Torches, lanterns, shrines)
  map.lightSources.forEach((light) => {
    const lx = toScreenX(light.x * 32 + 16);
    const ly = toScreenY(light.y * 32 + 16);
    const r = (light.radius + Math.sin(timeSec * 6 + light.x) * 3) * (zoom * 0.65);

    const grad = lightCtx.createRadialGradient(lx, ly, 8, lx, ly, r);
    grad.addColorStop(0, `rgba(0, 0, 0, ${light.intensity || 0.9})`);
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    lightCtx.fillStyle = grad;
    lightCtx.beginPath();
    lightCtx.arc(lx, ly, r, 0, Math.PI * 2);
    lightCtx.fill();
  });

  lightCtx.restore();

  // Blend lighting mask over main canvas using source-over (cutout darkness)
  ctx.drawImage(lightCanvas, 0, 0);

  // Optional warm tint bloom on light sources
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (gameState.player.activeToolId === 'lantern') {
    const warmGrad = ctx.createRadialGradient(pScreenX, pScreenY, 4, pScreenX, pScreenY, lanternR * 0.7);
    warmGrad.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
    warmGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = warmGrad;
    ctx.beginPath();
    ctx.arc(pScreenX, pScreenY, lanternR * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
