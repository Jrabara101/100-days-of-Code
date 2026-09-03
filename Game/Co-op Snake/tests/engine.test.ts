import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialCollisionMatrix } from '../src/engine/SpatialCollisionMatrix';
import { InputQueue, getDirectionDotProduct } from '../src/engine/InputQueue';
import { SnakeEngine } from '../src/engine/SnakeEngine';
import { CellType, DEFAULT_SETTINGS } from '../src/engine/types';

describe('SpatialCollisionMatrix (O(1) Spatial Lookups)', () => {
  let matrix: SpatialCollisionMatrix;

  beforeEach(() => {
    matrix = new SpatialCollisionMatrix(30, 20);
  });

  it('correctly maps 2D grid coordinates to flattened 1D buffer index', () => {
    expect(matrix.getIndex(0, 0)).toBe(0);
    expect(matrix.getIndex(5, 2)).toBe(2 * 30 + 5); // 65
    expect(matrix.getIndex(29, 19)).toBe(19 * 30 + 29); // 599
  });

  it('correctly checks boundary bounds and returns WALL for OOB', () => {
    expect(matrix.isValid(0, 0)).toBe(true);
    expect(matrix.isValid(29, 19)).toBe(true);
    expect(matrix.isValid(-1, 5)).toBe(false);
    expect(matrix.isValid(30, 5)).toBe(false);
    expect(matrix.isValid(5, 20)).toBe(false);

    expect(matrix.get(-1, 0)).toBe(CellType.WALL);
    expect(matrix.get(30, 10)).toBe(CellType.WALL);
  });

  it('sets and retrieves cell values in O(1) time', () => {
    expect(matrix.get(10, 10)).toBe(CellType.EMPTY);
    matrix.set(10, 10, CellType.FOOD_NORMAL);
    expect(matrix.get(10, 10)).toBe(CellType.FOOD_NORMAL);
    matrix.set(10, 10, CellType.P1_BODY);
    expect(matrix.get(10, 10)).toBe(CellType.P1_BODY);
  });

  it('stamps snake bodies and calculates occupancy percentage', () => {
    const p1Mock = {
      id: 1 as const,
      name: 'P1',
      color: '#0055ff',
      glowColor: '#00f0ff',
      segments: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
      ],
      prevSegments: [],
      direction: 'RIGHT' as const,
      pendingDirection: 'RIGHT' as const,
      status: 'ALIVE' as const,
      growthPending: 0,
      invulnerableTicks: 0,
      scoreContribution: 0,
      foodEatenCount: 0,
      downedDurationMs: 0,
      isAi: false,
    };

    matrix.stampSnake(p1Mock, false); // Exclude head
    expect(matrix.get(5, 5)).toBe(CellType.EMPTY); // Head not stamped
    expect(matrix.get(4, 5)).toBe(CellType.P1_BODY);
    expect(matrix.get(3, 5)).toBe(CellType.P1_BODY);
    expect(matrix.getOccupancyPercentage()).toBeGreaterThan(0);
  });
});

describe('InputQueue (Directional Dot-Product Gate & FIFO Buffering)', () => {
  let queue: InputQueue;

  beforeEach(() => {
    queue = new InputQueue();
  });

  it('evaluates vector dot product for direct 180° reversals', () => {
    expect(getDirectionDotProduct('UP', 'DOWN')).toBe(-1);
    expect(getDirectionDotProduct('LEFT', 'RIGHT')).toBe(-1);
    expect(getDirectionDotProduct('UP', 'LEFT')).toBe(0);
    expect(getDirectionDotProduct('UP', 'RIGHT')).toBe(0);
    expect(getDirectionDotProduct('UP', 'UP')).toBe(1);
  });

  it('rejects direct 180° reversals immediately', () => {
    // Player 1 moving RIGHT cannot press LEFT
    const accepted = queue.enqueue(1, 'LEFT', 'RIGHT');
    expect(accepted).toBe(false);
    expect(queue.peek(1)).toBeNull();
  });

  it('buffers rapid double-tap inputs without 180° suicide', () => {
    // Facing RIGHT: player presses UP, then LEFT
    const step1 = queue.enqueue(1, 'UP', 'RIGHT');
    expect(step1).toBe(true);

    const step2 = queue.enqueue(1, 'LEFT', 'RIGHT');
    expect(step2).toBe(true);

    // Verify FIFO dequeue order
    const next1 = queue.dequeue(1, 'RIGHT');
    expect(next1).toBe('UP');

    const next2 = queue.dequeue(1, 'UP');
    expect(next2).toBe('LEFT');
  });

  it('respects maximum FIFO capacity of 2', () => {
    queue.enqueue(1, 'UP', 'RIGHT');
    queue.enqueue(1, 'LEFT', 'RIGHT');
    queue.enqueue(1, 'DOWN', 'RIGHT'); // Overwrites 2nd slot ('LEFT') with 'DOWN'

    const first = queue.dequeue(1, 'RIGHT');
    expect(first).toBe('UP');

    // Facing UP, attempting to move DOWN is a 180° reversal, so dequeue safely returns current direction 'UP'
    const second = queue.dequeue(1, 'UP');
    expect(second).toBe('UP');
  });
});

describe('SnakeEngine (Fixed Timestep & Cooperative Systems)', () => {
  let engine: SnakeEngine;

  beforeEach(() => {
    engine = new SnakeEngine({
      ...DEFAULT_SETTINGS,
      initialSpeedHz: 10, // 100ms per tick
      opponentMode: 'AI_COOP',
    });
  });

  it('initializes snakes in correct starting positions', () => {
    expect(engine.p1.segments.length).toBe(4);
    expect(engine.p2.segments.length).toBe(4);
    expect(engine.p1.direction).toBe('RIGHT');
    expect(engine.p2.direction).toBe('LEFT');
    expect(engine.gameState).toBe('IDLE');
    expect(engine.score).toBe(0);
    expect(engine.lives).toBe(3);
  });

  it('steps accumulator and computes sub-pixel alpha', () => {
    engine.gameState = 'PLAYING';
    engine.accumulatorMs = 0;
    engine.tickIntervalMs = 100;

    // First call sets baseline timestamp
    engine.update(100);
    // Next call advances by 40ms -> alpha = 40 / 100 = 0.4
    engine.update(140);
    expect(engine.alpha).toBeCloseTo(0.4, 1);

    // Next call advances by 70ms -> total acc = 40 + 70 = 110ms -> 1 tick runs, leftover 10ms
    engine.update(210);
    expect(engine.accumulatorMs).toBeLessThan(100);
  });

  it('evaluates cooperative alternating combo multipliers', () => {
    engine.gameState = 'PLAYING';
    expect(engine.combo).toBe(1.0);

    // Place food in front of P1
    const p1Head = engine.p1.segments[0];
    const foodP1 = {
      id: 'test_food_1',
      x: p1Head.x + 1,
      y: p1Head.y,
      type: CellType.FOOD_NORMAL,
      points: 100,
      spawnTime: 0,
    };
    engine.foods = [foodP1];

    // Tick P1 into food
    engine.tickSimulation();
    expect(engine.p1Score).toBe(100);
    expect(engine.lastEater).toBe(1);
    expect(engine.combo).toBe(1.0);

    // Now place food in front of P2 (P2 is moving LEFT)
    const p2Head = engine.p2.segments[0];
    const foodP2 = {
      id: 'test_food_2',
      x: p2Head.x - 1,
      y: p2Head.y,
      type: CellType.FOOD_NORMAL,
      points: 100,
      spawnTime: 0,
    };
    engine.foods = [foodP2];

    // Tick P2 into food (alternating eat -> combo increase!)
    engine.tickSimulation();
    expect(engine.combo).toBe(1.5);
    expect(engine.lastEater).toBe(2);
    expect(engine.score).toBe(100 + Math.round(100 * 1.5));
  });

  it('handles shared lives on collision and initiates respawn in Co-op mode', () => {
    engine.gameState = 'PLAYING';
    engine.lives = 3;

    // Move P1 into wall by placing head at grid edge (x=29, moving RIGHT)
    engine.p1.segments[0] = { x: 29, y: 10 };
    engine.p1.direction = 'RIGHT';

    engine.tickSimulation();
    expect(engine.lives).toBe(2);
    expect(engine.gameState).toBe('PLAYING');
    expect(engine.p1.invulnerableTicks).toBeGreaterThan(0);
  });
});
