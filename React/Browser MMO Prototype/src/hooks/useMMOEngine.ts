import { useEffect, useRef, useCallback } from 'react';
import { WorldRenderer } from '../engine/renderer.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../engine/tilemapRenderer.js';
import { sound } from '../engine/sound.js';
import type { UseMMONetworkReturn } from './useMMONetwork.js';
import type { Direction, MoveInputPacket, WorldPlayerEntity } from '../types/mmo.js';

export const CLIENT_MOVE_SPEED = 160; // 160px/s base speed
export const INTERPOLATION_DELAY_MS = 100; // 100ms remote entity buffer

export interface UseMMOEngineProps {
  network: UseMMONetworkReturn;
  onOpenInventory?: () => void;
  onOpenCharacter?: () => void;
  onFocusChat?: () => void;
}

export function useMMOEngine({
  network,
  onOpenInventory,
  onOpenCharacter,
  onFocusChat,
}: UseMMOEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const rendererRef = useRef<WorldRenderer | null>(null);

  // Local predicted player state
  const localPlayerPosRef = useRef<{
    x: number;
    y: number;
    facing: Direction;
    isMoving: boolean;
    seq: number;
    unacknowledgedInputs: MoveInputPacket[];
  }>({
    x: 25 * TILE_SIZE,
    y: 28 * TILE_SIZE,
    facing: 'down',
    isMoving: false,
    seq: 0,
    unacknowledgedInputs: [],
  });

  // Target destination for point-and-click movement
  const targetDestRef = useRef<{ x: number; y: number } | null>(null);

  // Virtual Joystick input
  const joystickVectorRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Camera coordinates
  const cameraRef = useRef<{ x: number; y: number }>({
    x: 25 * TILE_SIZE - 400,
    y: 28 * TILE_SIZE - 300,
  });

  // Active keyboard keys
  const keysRef = useRef<Record<string, boolean>>({});

  // Initialize renderer
  if (!rendererRef.current) {
    rendererRef.current = new WorldRenderer();
  }

  // Set virtual joystick vector from mobile touch controls
  const setVirtualJoystickVector = useCallback((dx: number, dy: number) => {
    joystickVectorRef.current = { dx, dy };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in chat input or an input field
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      keysRef.current[e.code] = true;

      // Quick hotkeys
      if (e.code === 'KeyI' || e.code === 'KeyB') {
        e.preventDefault();
        onOpenInventory?.();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        onOpenCharacter?.();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        onFocusChat?.();
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        // Quick pickup nearest ground loot
        const pX = localPlayerPosRef.current.x;
        const pY = localPlayerPosRef.current.y;
        let nearestLootId: string | null = null;
        let minDistSq = 100 * 100;

        for (const [id, loot] of Object.entries(network.stateRef.current.groundLoot)) {
          const distSq = (loot.x - pX) ** 2 + (loot.y - pY) ** 2;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestLootId = id;
          }
        }
        if (nearestLootId) {
          network.sendItemPickup(nearestLootId);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [network, onOpenInventory, onOpenCharacter, onFocusChat]);

  // Main 60Hz Decoupled Physics & Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let footstepCounter = 0;

    const renderLoop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const canvas = canvasRef.current;
      const tilemap = rendererRef.current?.tilemap;
      if (!tilemap) return;

      const myId = network.stateRef.current.myPlayerId;
      const serverPlayer = myId ? network.stateRef.current.players[myId] : null;

      // 1. Client-Side Input Gathering
      let inputDx = 0;
      let inputDy = 0;

      const keys = keysRef.current;
      if (keys['KeyW'] || keys['ArrowUp']) inputDy -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) inputDy += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) inputDx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) inputDx += 1;

      // Merge virtual joystick
      if (joystickVectorRef.current.dx !== 0 || joystickVectorRef.current.dy !== 0) {
        inputDx += joystickVectorRef.current.dx;
        inputDy += joystickVectorRef.current.dy;
      }

      // Point-and-click pathfinding toward target destination
      if (inputDx === 0 && inputDy === 0 && targetDestRef.current) {
        const dest = targetDestRef.current;
        const curX = localPlayerPosRef.current.x;
        const curY = localPlayerPosRef.current.y;
        const dist = Math.sqrt((dest.x - curX) ** 2 + (dest.y - curY) ** 2);

        if (dist > 12) {
          inputDx = (dest.x - curX) / dist;
          inputDy = (dest.y - curY) / dist;
        } else {
          targetDestRef.current = null;
        }
      } else if (inputDx !== 0 || inputDy !== 0) {
        // Cancel point-and-click if keyboard/joystick used
        targetDestRef.current = null;
      }

      // 2. Server Reconciliation: Check if server updated player position
      const lastAckSeq = network.stateRef.current.lastProcessedSeq;
      const local = localPlayerPosRef.current;

      if (serverPlayer && lastAckSeq > 0) {
        // Discard acknowledged inputs
        local.unacknowledgedInputs = local.unacknowledgedInputs.filter(inp => inp.seq > lastAckSeq);

        // Reconcile: start from canonical server position and replay remaining inputs
        let reconX = serverPlayer.x;
        let reconY = serverPlayer.y;

        for (const input of local.unacknowledgedInputs) {
          const stepDt = input.dt;
          const len = Math.sqrt(input.inputVector.dx ** 2 + input.inputVector.dy ** 2);
          if (len > 0) {
            const nx = reconX + (input.inputVector.dx / len) * CLIENT_MOVE_SPEED * stepDt;
            const ny = reconY + (input.inputVector.dy / len) * CLIENT_MOVE_SPEED * stepDt;
            if (!tilemap.checkCircleCollision(nx, ny, 15)) {
              reconX = nx;
              reconY = ny;
            }
          }
        }

        // Smoothly blend to reconciled position if deviation is small, or snap if large
        const diffX = reconX - local.x;
        const diffY = reconY - local.y;
        const diffDist = Math.sqrt(diffX * diffX + diffY * diffY);

        if (diffDist > 80) {
          // Hard snap on large desync
          local.x = reconX;
          local.y = reconY;
        } else if (diffDist > 2) {
          // Smooth blend
          local.x += diffX * 0.25;
          local.y += diffY * 0.25;
        }
      }

      // 3. Client-Side Prediction: Apply current frame input immediately
      const isInputActive = inputDx !== 0 || inputDy !== 0;
      let facing: Direction = local.facing;

      if (Math.abs(inputDx) > Math.abs(inputDy)) {
        facing = inputDx > 0 ? 'right' : 'left';
      } else if (inputDy !== 0) {
        facing = inputDy > 0 ? 'down' : 'up';
      }
      local.facing = facing;
      local.isMoving = isInputActive;

      if (isInputActive) {
        const len = Math.sqrt(inputDx * inputDx + inputDy * inputDy);
        const normX = len > 0 ? inputDx / len : 0;
        const normY = len > 0 ? inputDy / len : 0;

        const nextX = local.x + normX * CLIENT_MOVE_SPEED * dt;
        const nextY = local.y + normY * CLIENT_MOVE_SPEED * dt;

        // Client-side collision check
        if (!tilemap.checkCircleCollision(nextX, nextY, 15)) {
          local.x = nextX;
          local.y = nextY;
        } else if (!tilemap.checkCircleCollision(nextX, local.y, 15)) {
          local.x = nextX;
        } else if (!tilemap.checkCircleCollision(local.x, nextY, 15)) {
          local.y = nextY;
        }

        // Increment sequence and send packet
        local.seq++;
        const packet: MoveInputPacket = {
          seq: local.seq,
          dt,
          inputVector: { dx: normX, dy: normY },
          facing,
        };
        local.unacknowledgedInputs.push(packet);
        network.sendMoveInput(packet.seq, packet.dt, normX, normY, facing);

        // Footstep sound
        footstepCounter += dt;
        if (footstepCounter > 0.32) {
          sound.playFootstep();
          footstepCounter = 0;
        }
      }

      // 4. Remote Entity Interpolation (100ms delay buffer)
      const renderTimestamp = Date.now() - INTERPOLATION_DELAY_MS;
      const history = network.stateRef.current.snapshotHistory;
      const interpolatedPlayers: Record<string, WorldPlayerEntity> = {};

      if (history.length >= 2) {
        // Find surrounding snapshots
        let snapA = history[0];
        let snapB = history[1];

        for (let i = 0; i < history.length - 1; i++) {
          if (history[i].timestamp <= renderTimestamp && history[i + 1].timestamp >= renderTimestamp) {
            snapA = history[i];
            snapB = history[i + 1];
            break;
          }
        }

        const span = Math.max(1, snapB.timestamp - snapA.timestamp);
        const factor = Math.max(0, Math.min(1, (renderTimestamp - snapA.timestamp) / span));

        for (const [id, entityB] of Object.entries(snapB.players)) {
          if (id === myId) continue;
          const entityA = snapA.players[id];
          if (entityA) {
            // Lerp position
            interpolatedPlayers[id] = {
              ...entityB,
              x: entityA.x + (entityB.x - entityA.x) * factor,
              y: entityA.y + (entityB.y - entityA.y) * factor,
            };
          } else {
            interpolatedPlayers[id] = entityB;
          }
        }
      } else {
        // Fallback to latest server players
        for (const [id, entity] of Object.entries(network.stateRef.current.players)) {
          if (id !== myId) {
            interpolatedPlayers[id] = entity;
          }
        }
      }

      // Build synthesized local player entity
      const localRenderEntity: WorldPlayerEntity = {
        id: myId || 'local',
        username: serverPlayer?.username || 'Adventurer',
        title: serverPlayer?.title || 'Wanderer',
        x: local.x,
        y: local.y,
        facing: local.facing,
        isMoving: local.isMoving,
        hp: serverPlayer?.hp || 100,
        maxHp: serverPlayer?.maxHp || 100,
        stamina: serverPlayer?.stamina || 100,
        maxStamina: serverPlayer?.maxStamina || 100,
        level: serverPlayer?.level || 1,
        equippedVisuals: serverPlayer?.equippedVisuals || {},
        avatarColor: serverPlayer?.avatarColor,
        activeChatBubble: serverPlayer?.activeChatBubble,
        activeEmote: serverPlayer?.activeEmote,
      };

      if (myId) {
        interpolatedPlayers[myId] = localRenderEntity;
      }

      // 5. Camera Tracking: Smooth lerp to local player
      if (canvas && ctx && rendererRef.current) {
        const viewW = canvas.width;
        const viewH = canvas.height;

        const targetCamX = local.x - viewW / 2;
        const targetCamY = local.y - viewH / 2;

        const worldMaxW = MAP_WIDTH * TILE_SIZE;
        const worldMaxH = MAP_HEIGHT * TILE_SIZE;

        const clampedTargetX = Math.max(0, Math.min(worldMaxW - viewW, targetCamX));
        const clampedTargetY = Math.max(0, Math.min(worldMaxH - viewH, targetCamY));

        cameraRef.current.x += (clampedTargetX - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (clampedTargetY - cameraRef.current.y) * 0.12;

        const camX = Math.round(cameraRef.current.x);
        const camY = Math.round(cameraRef.current.y);

        // 6. Draw Layered World Viewport
        rendererRef.current.render(
          ctx,
          viewW,
          viewH,
          camX,
          camY,
          localRenderEntity,
          interpolatedPlayers,
          network.stateRef.current.groundLoot,
          network.state.selectedTargetId,
          time
        );

        // 7. Render Minimap Radar
        if (minimapCanvasRef.current) {
          const miniCtx = minimapCanvasRef.current.getContext('2d');
          if (miniCtx) {
            rendererRef.current.renderMinimap(
              miniCtx,
              minimapCanvasRef.current.width,
              localRenderEntity,
              interpolatedPlayers,
              network.stateRef.current.groundLoot
            );
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [network]);

  // Click & Pointer Interaction on Canvas
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickScreenX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const clickScreenY = (e.clientY - rect.top) * (canvas.height / rect.height);

      const worldX = clickScreenX + cameraRef.current.x;
      const worldY = clickScreenY + cameraRef.current.y;

      // 1. Raycast check for ground loot pickup (< 32px)
      let clickedLootId: string | null = null;
      for (const [id, loot] of Object.entries(network.stateRef.current.groundLoot)) {
        const distSq = (loot.x - worldX) ** 2 + (loot.y - worldY) ** 2;
        if (distSq < 32 * 32) {
          clickedLootId = id;
          break;
        }
      }

      if (clickedLootId) {
        network.sendItemPickup(clickedLootId);
        return;
      }

      // 2. Raycast check for remote player selection (< 32px)
      let clickedPlayerId: string | null = null;
      const myId = network.stateRef.current.myPlayerId;

      for (const [id, p] of Object.entries(network.stateRef.current.players)) {
        if (id !== myId) {
          const distSq = (p.x - worldX) ** 2 + (p.y - worldY) ** 2;
          if (distSq < 32 * 32) {
            clickedPlayerId = id;
            break;
          }
        }
      }

      if (clickedPlayerId) {
        network.selectTarget(clickedPlayerId);
        sound.playChatPop();
        return;
      }

      // 3. Otherwise: Point-and-click pathfinding move to target
      targetDestRef.current = { x: worldX, y: worldY };
    },
    [network]
  );

  return {
    canvasRef,
    minimapCanvasRef,
    handleCanvasPointerDown,
    setVirtualJoystickVector,
    localPlayerPosRef,
    cameraRef,
  };
}
