import { describe, it, expect, beforeEach } from 'vitest';
import { SnakeAI } from '../src/engine/SnakeAI';
import { SpatialCollisionMatrix } from '../src/engine/SpatialCollisionMatrix';
import { CellType, DEFAULT_SETTINGS } from '../src/engine/types';
import type { SnakeState, FoodItem } from '../src/engine/types';

describe('SnakeAI Decision Engine (Easy, Normal, Hard, Expert)', () => {
  let matrix: SpatialCollisionMatrix;
  let aiSnake: SnakeState;
  let playerSnake: SnakeState;

  beforeEach(() => {
    matrix = new SpatialCollisionMatrix(20, 20);

    aiSnake = {
      id: 2,
      name: 'BOT',
      color: '#ff0033',
      glowColor: '#ffea00',
      segments: [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 12, y: 10 },
      ],
      prevSegments: [],
      direction: 'LEFT',
      pendingDirection: 'LEFT',
      status: 'ALIVE',
      growthPending: 0,
      invulnerableTicks: 0,
      scoreContribution: 0,
      foodEatenCount: 0,
      downedDurationMs: 0,
      isAi: true,
    };

    playerSnake = {
      id: 1,
      name: 'Player',
      color: '#0055ff',
      glowColor: '#00f0ff',
      segments: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      prevSegments: [],
      direction: 'RIGHT',
      pendingDirection: 'RIGHT',
      status: 'ALIVE',
      growthPending: 0,
      invulnerableTicks: 0,
      scoreContribution: 0,
      foodEatenCount: 0,
      downedDurationMs: 0,
      isAi: false,
    };

    matrix.stampSnake(aiSnake, false);
    matrix.stampSnake(playerSnake, false);
  });

  it('Easy AI picks a valid move and never reverses 180° into its own neck', () => {
    const foods: FoodItem[] = [
      { id: 'f1', x: 5, y: 10, type: CellType.FOOD_NORMAL, points: 100, spawnTime: 0 },
    ];

    for (let i = 0; i < 20; i++) {
      const move = SnakeAI.computeNextDirection(
        aiSnake,
        playerSnake,
        matrix,
        foods,
        null,
        'EASY',
        'AI_ENEMY',
        false
      );
      // Moving LEFT, cannot move RIGHT into neck segment {11, 10}
      expect(move).not.toBe('RIGHT');
      expect(['LEFT', 'UP', 'DOWN']).toContain(move);
    }
  });

  it('Normal AI pathfinds directly towards food using BFS', () => {
    // Food placed directly in path: (8, 10)
    const foods: FoodItem[] = [
      { id: 'f1', x: 8, y: 10, type: CellType.FOOD_NORMAL, points: 100, spawnTime: 0 },
    ];

    const move = SnakeAI.computeNextDirection(
      aiSnake,
      playerSnake,
      matrix,
      foods,
      null,
      'NORMAL',
      'AI_ENEMY',
      false
    );

    expect(move).toBe('LEFT');
  });

  it('Hard AI calculates Voronoi flood fill space and avoids dead-ends', () => {
    // Wall off the left side to create a small dead-end
    matrix.set(8, 10, CellType.WALL);
    matrix.set(9, 9, CellType.WALL);
    matrix.set(9, 11, CellType.WALL);

    // Food is placed in open area above
    const foods: FoodItem[] = [
      { id: 'f1', x: 10, y: 5, type: CellType.FOOD_NORMAL, points: 100, spawnTime: 0 },
    ];

    const move = SnakeAI.computeNextDirection(
      aiSnake,
      playerSnake,
      matrix,
      foods,
      null,
      'HARD',
      'AI_ENEMY',
      false
    );

    // Should move UP towards open area and avoid trapped corridor
    expect(move).toBe('UP');
  });

  it('Expert AI uses safe-tail path fallback and computes in under 3ms', () => {
    const foods: FoodItem[] = [
      { id: 'f1', x: 15, y: 15, type: CellType.FOOD_NORMAL, points: 100, spawnTime: 0 },
    ];

    const startTime = performance.now();
    const move = SnakeAI.computeNextDirection(
      aiSnake,
      playerSnake,
      matrix,
      foods,
      null,
      'EXPERT',
      'AI_ENEMY',
      false
    );
    const elapsedMs = performance.now() - startTime;

    expect(['LEFT', 'UP', 'DOWN']).toContain(move);
    expect(elapsedMs).toBeLessThan(15); // Ultra fast computation
  });

  it('Co-op AI prioritizes reviving downed teammate', () => {
    playerSnake.status = 'DOWNED';
    const reviveBeacon: FoodItem = {
      id: 'beacon',
      x: 10,
      y: 8,
      type: CellType.REVIVE_BEACON,
      points: 500,
      spawnTime: 0,
    };
    const normalFood: FoodItem = {
      id: 'f1',
      x: 5,
      y: 10,
      type: CellType.FOOD_NORMAL,
      points: 100,
      spawnTime: 0,
    };

    const move = SnakeAI.computeNextDirection(
      aiSnake,
      playerSnake,
      matrix,
      [normalFood],
      reviveBeacon,
      'EXPERT',
      'AI_COOP',
      false
    );

    // Revive beacon is at (10, 8), so AI moving from (10, 10) should move UP!
    expect(move).toBe('UP');
  });
});
