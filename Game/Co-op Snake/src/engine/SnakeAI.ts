import {
  CellType,
  DIRECTION_VECTORS,
} from './types';
import type {
  AiDifficulty,
  Direction,
  FoodItem,
  OpponentMode,
  SnakeState,
  Vector2D,
} from './types';
import { SpatialCollisionMatrix } from './SpatialCollisionMatrix';
import { getDirectionDotProduct } from './InputQueue';

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
  dir: Direction | null;
}

export class SnakeAI {
  /**
   * Main AI Decision Entrypoint
   */
  public static computeNextDirection(
    aiSnake: SnakeState,
    playerSnake: SnakeState,
    matrix: SpatialCollisionMatrix,
    foods: FoodItem[],
    reviveBeacon: FoodItem | null,
    difficulty: AiDifficulty,
    mode: OpponentMode,
    isGhost: boolean
  ): Direction {
    const head = aiSnake.segments[0];
    if (!head) return aiSnake.direction;

    switch (difficulty) {
      case 'EASY':
        return this.computeEasyMove(aiSnake, matrix, foods, isGhost);
      case 'NORMAL':
        return this.computeNormalMove(aiSnake, matrix, foods, isGhost);
      case 'HARD':
        return this.computeHardMove(aiSnake, playerSnake, matrix, foods, reviveBeacon, mode, isGhost);
      case 'EXPERT':
      default:
        return this.computeExpertMove(aiSnake, playerSnake, matrix, foods, reviveBeacon, mode, isGhost);
    }
  }

  // ==========================================
  // 1. EASY AI: Manhattan Greedy + Random Jitter
  // ==========================================
  private static computeEasyMove(
    snake: SnakeState,
    matrix: SpatialCollisionMatrix,
    foods: FoodItem[],
    isGhost: boolean
  ): Direction {
    const head = snake.segments[0];
    const validMoves = this.getValidMoves(snake, matrix, isGhost);
    if (validMoves.length === 0) return snake.direction;

    // 35% random wandering chance
    if (Math.random() < 0.35) {
      return validMoves[Math.floor(Math.random() * validMoves.length)].dir;
    }

    // Target nearest food by Manhattan distance
    const target = this.getNearestFood(head, foods);
    if (!target) {
      return validMoves[0].dir;
    }

    // Sort valid moves by closest Manhattan distance to target
    validMoves.sort((a, b) => {
      const distA = Math.abs(a.pos.x - target.x) + Math.abs(a.pos.y - target.y);
      const distB = Math.abs(b.pos.x - target.x) + Math.abs(b.pos.y - target.y);
      return distA - distB;
    });

    return validMoves[0].dir;
  }

  // ==========================================
  // 2. NORMAL AI: BFS Shortest Path + 1-Step Flood Fill
  // ==========================================
  private static computeNormalMove(
    snake: SnakeState,
    matrix: SpatialCollisionMatrix,
    foods: FoodItem[],
    isGhost: boolean
  ): Direction {
    const head = snake.segments[0];
    const target = this.getNearestFood(head, foods);

    if (target) {
      const path = this.findShortestPathBFS(head, target, snake, matrix, isGhost);
      if (path && path.length > 0) {
        return path[0];
      }
    }

    // Fallback: Pick move with maximum local open space
    return this.getBestOpenSpaceMove(snake, matrix, isGhost);
  }

  // ==========================================
  // 3. HARD AI: Utility A* + Voronoi Space Awareness
  // ==========================================
  private static computeHardMove(
    snake: SnakeState,
    playerSnake: SnakeState,
    matrix: SpatialCollisionMatrix,
    foods: FoodItem[],
    reviveBeacon: FoodItem | null,
    mode: OpponentMode,
    isGhost: boolean
  ): Direction {
    const head = snake.segments[0];

    // In Co-op mode, rush to revive beacon if player is downed
    if (mode === 'AI_COOP' && playerSnake.status === 'DOWNED' && reviveBeacon) {
      const path = this.findShortestPathAStar(head, reviveBeacon, snake, matrix, isGhost);
      if (path && path.length > 0) return path[0];
    }

    // Select highest utility food
    const bestFood = this.getBestUtilityFood(head, foods, snake.segments.length);
    if (bestFood) {
      const path = this.findShortestPathAStar(head, bestFood, snake, matrix, isGhost);
      if (path && path.length > 0) {
        const nextDir = path[0];
        const nextPos = {
          x: head.x + DIRECTION_VECTORS[nextDir].x,
          y: head.y + DIRECTION_VECTORS[nextDir].y,
        };

        // Voronoi check: Ensure next step has at least body length reachable space
        const space = this.calculateFloodFillSpace(nextPos, matrix, snake, isGhost);
        if (space >= snake.segments.length) {
          return nextDir;
        }
      }
    }

    // Fallback: Stalk tail or maximize space
    const tailMove = this.findSafeTailMove(snake, matrix, isGhost);
    if (tailMove) return tailMove;

    return this.getBestOpenSpaceMove(snake, matrix, isGhost);
  }

  // ==========================================
  // 4. EXPERT AI: Dual-Phase Safe A* + Tail Cycle Escape + Interception
  // ==========================================
  private static computeExpertMove(
    snake: SnakeState,
    playerSnake: SnakeState,
    matrix: SpatialCollisionMatrix,
    foods: FoodItem[],
    reviveBeacon: FoodItem | null,
    mode: OpponentMode,
    isGhost: boolean
  ): Direction {
    const head = snake.segments[0];

    // Priority 1: Co-op Revive Beacon
    if (mode === 'AI_COOP' && playerSnake.status === 'DOWNED' && reviveBeacon) {
      const path = this.findShortestPathAStar(head, reviveBeacon, snake, matrix, isGhost);
      if (path && path.length > 0) return path[0];
    }

    // Priority 2: In Versus Enemy mode, check if we can cut off player's movement
    if (mode === 'AI_ENEMY' && playerSnake.status === 'ALIVE' && snake.segments.length >= playerSnake.segments.length) {
      const cutoffMove = this.predictPlayerCutoff(snake, playerSnake, matrix, isGhost);
      if (cutoffMove) {
        return cutoffMove;
      }
    }

    // Priority 3: Dual-Phase Safe Food Path
    const sortedFoods = [...foods].sort((a, b) => {
      const distA = Math.abs(a.x - head.x) + Math.abs(a.y - head.y);
      const distB = Math.abs(b.x - head.x) + Math.abs(b.y - head.y);
      return distA - distB;
    });

    for (const food of sortedFoods) {
      const path = this.findShortestPathAStar(head, food, snake, matrix, isGhost);
      if (path && path.length > 0) {
        // Safe-Tail Verification: If we follow this path to food, is there an exit path to our tail?
        const isSafe = this.verifyPathSafetyWithTail(snake, path, food, matrix, isGhost);
        if (isSafe) {
          return path[0];
        }
      }
    }

    // Priority 4: Safe Tail-Chasing / Longest Path Survival
    const tailMove = this.findSafeTailMove(snake, matrix, isGhost);
    if (tailMove) {
      return tailMove;
    }

    // Priority 5: Maximum Flood Fill Reachability
    return this.getBestOpenSpaceMove(snake, matrix, isGhost);
  }

  // ==========================================
  // Helper Algorithms & Spatial Math
  // ==========================================

  public static getValidMoves(
    snake: SnakeState,
    matrix: SpatialCollisionMatrix,
    isGhost: boolean
  ): Array<{ dir: Direction; pos: Vector2D }> {
    const head = snake.segments[0];
    const valid: Array<{ dir: Direction; pos: Vector2D }> = [];
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    for (const dir of directions) {
      // Reject 180° reversal
      if (getDirectionDotProduct(dir, snake.direction) === -1) {
        continue;
      }

      const vec = DIRECTION_VECTORS[dir];
      const nextPos: Vector2D = { x: head.x + vec.x, y: head.y + vec.y };

      if (!matrix.isValid(nextPos.x, nextPos.y)) {
        continue;
      }

      const cell = matrix.get(nextPos.x, nextPos.y);

      // Self body collision
      const ownBodyCell = snake.id === 1 ? CellType.P1_BODY : CellType.P2_BODY;
      const otherBodyCell = snake.id === 1 ? CellType.P2_BODY : CellType.P1_BODY;

      if (cell === ownBodyCell) {
        continue;
      }

      if (cell === otherBodyCell && !isGhost) {
        continue;
      }

      valid.push({ dir, pos: nextPos });
    }

    return valid;
  }

  private static getNearestFood(head: Vector2D, foods: FoodItem[]): FoodItem | null {
    if (foods.length === 0) return null;
    let nearest = foods[0];
    let minDist = Infinity;

    for (const f of foods) {
      const dist = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = f;
      }
    }

    return nearest;
  }

  private static getBestUtilityFood(head: Vector2D, foods: FoodItem[], length: number): FoodItem | null {
    if (foods.length === 0) return null;
    let bestFood = foods[0];
    let maxUtility = -Infinity;

    for (const f of foods) {
      const dist = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
      let weight = f.points;

      if (f.type === CellType.FOOD_SUPER) weight *= 2.0;
      else if (f.type === CellType.FOOD_FREEZE) weight *= 1.5;
      else if (f.type === CellType.FOOD_GHOST && length > 6) weight *= 1.8;

      const utility = weight / (dist + 1);
      if (utility > maxUtility) {
        maxUtility = utility;
        bestFood = f;
      }
    }

    return bestFood;
  }

  /**
   * BFS Shortest Path
   */
  public static findShortestPathBFS(
    start: Vector2D,
    target: Vector2D,
    snake: SnakeState,
    matrix: SpatialCollisionMatrix,
    isGhost: boolean
  ): Direction[] | null {
    const queue: Array<{ x: number; y: number; path: Direction[] }> = [
      { x: start.x, y: start.y, path: [] },
    ];
    const visited = new Set<number>();
    visited.add(start.y * matrix.width + start.x);

    const ownBodyCell = snake.id === 1 ? CellType.P1_BODY : CellType.P2_BODY;
    const otherBodyCell = snake.id === 1 ? CellType.P2_BODY : CellType.P1_BODY;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === target.x && current.y === target.y) {
        return current.path;
      }

      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      for (const dir of directions) {
        // Prevent instant reversal on first step
        if (current.path.length === 0 && getDirectionDotProduct(dir, snake.direction) === -1) {
          continue;
        }

        const vec = DIRECTION_VECTORS[dir];
        const nx = current.x + vec.x;
        const ny = current.y + vec.y;
        const idx = ny * matrix.width + nx;

        if (!matrix.isValid(nx, ny) || visited.has(idx)) {
          continue;
        }

        const cell = matrix.get(nx, ny);
        if (cell === ownBodyCell || (cell === otherBodyCell && !isGhost)) {
          continue;
        }

        visited.add(idx);
        queue.push({
          x: nx,
          y: ny,
          path: [...current.path, dir],
        });
      }
    }

    return null;
  }

  /**
   * A* Shortest Path
   */
  public static findShortestPathAStar(
    start: Vector2D,
    target: Vector2D,
    snake: SnakeState,
    matrix: SpatialCollisionMatrix,
    isGhost: boolean
  ): Direction[] | null {
    const openSet: Node[] = [];
    const closedSet = new Set<number>();

    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: Math.abs(target.x - start.x) + Math.abs(target.y - start.y),
      f: Math.abs(target.x - start.x) + Math.abs(target.y - start.y),
      parent: null,
      dir: null,
    };

    openSet.push(startNode);

    const ownBodyCell = snake.id === 1 ? CellType.P1_BODY : CellType.P2_BODY;
    const otherBodyCell = snake.id === 1 ? CellType.P2_BODY : CellType.P1_BODY;

    while (openSet.length > 0) {
      // Find lowest f
      let lowestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openSet.splice(lowestIdx, 1)[0];
      const currentIdx = current.y * matrix.width + current.x;

      if (current.x === target.x && current.y === target.y) {
        // Reconstruct path
        const path: Direction[] = [];
        let curr: Node | null = current;
        while (curr && curr.parent) {
          if (curr.dir) path.unshift(curr.dir);
          curr = curr.parent;
        }
        return path;
      }

      closedSet.add(currentIdx);

      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      for (const dir of directions) {
        if (current.parent === null && getDirectionDotProduct(dir, snake.direction) === -1) {
          continue;
        }

        const vec = DIRECTION_VECTORS[dir];
        const nx = current.x + vec.x;
        const ny = current.y + vec.y;
        const neighborIdx = ny * matrix.width + nx;

        if (!matrix.isValid(nx, ny) || closedSet.has(neighborIdx)) {
          continue;
        }

        const cell = matrix.get(nx, ny);
        if (cell === ownBodyCell || (cell === otherBodyCell && !isGhost)) {
          continue;
        }

        const gScore = current.g + 1;
        let neighbor = openSet.find((n) => n.x === nx && n.y === ny);

        if (!neighbor) {
          const hScore = Math.abs(target.x - nx) + Math.abs(target.y - ny);
          neighbor = {
            x: nx,
            y: ny,
            g: gScore,
            h: hScore,
            f: gScore + hScore,
            parent: current,
            dir,
          };
          openSet.push(neighbor);
        } else if (gScore < neighbor.g) {
          neighbor.g = gScore;
          neighbor.f = gScore + neighbor.h;
          neighbor.parent = current;
          neighbor.dir = dir;
        }
      }
    }

    return null;
  }

  /**
   * Flood-Fill Reachable Space calculation
   */
  public static calculateFloodFillSpace(
    start: Vector2D,
    matrix: SpatialCollisionMatrix,
    snake: SnakeState,
    isGhost: boolean,
    maxLimit = 150
  ): number {
    const queue: Vector2D[] = [start];
    const visited = new Set<number>();
    visited.add(start.y * matrix.width + start.x);

    const ownBodyCell = snake.id === 1 ? CellType.P1_BODY : CellType.P2_BODY;
    const otherBodyCell = snake.id === 1 ? CellType.P2_BODY : CellType.P1_BODY;
    let count = 0;

    while (queue.length > 0 && count < maxLimit) {
      const curr = queue.shift()!;
      count++;

      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      for (const dir of directions) {
        const vec = DIRECTION_VECTORS[dir];
        const nx = curr.x + vec.x;
        const ny = curr.y + vec.y;
        const idx = ny * matrix.width + nx;

        if (!matrix.isValid(nx, ny) || visited.has(idx)) continue;

        const cell = matrix.get(nx, ny);
        if (cell === ownBodyCell || (cell === otherBodyCell && !isGhost)) continue;

        visited.add(idx);
        queue.push({ x: nx, y: ny });
      }
    }

    return count;
  }

  /**
   * Selects neighboring move with maximum open space
   */
  private static getBestOpenSpaceMove(
    snake: SnakeState,
    matrix: SpatialCollisionMatrix,
    isGhost: boolean
  ): Direction {
    const validMoves = this.getValidMoves(snake, matrix, isGhost);
    if (validMoves.length === 0) return snake.direction;

    let bestMove = validMoves[0].dir;
    let maxSpace = -1;

    for (const move of validMoves) {
      const space = this.calculateFloodFillSpace(move.pos, matrix, snake, isGhost);
      if (space > maxSpace) {
        maxSpace = space;
        bestMove = move.dir;
      }
    }

    return bestMove;
  }

  /**
   * Stalk / Chase Own Tail (Longest Path Fallback)
   */
  private static findSafeTailMove(
    snake: SnakeState,
    matrix: SpatialCollisionMatrix,
    isGhost: boolean
  ): Direction | null {
    if (snake.segments.length < 3) return null;
    const head = snake.segments[0];
    const tail = snake.segments[snake.segments.length - 1];

    const path = this.findShortestPathAStar(head, tail, snake, matrix, isGhost);
    if (path && path.length > 0) {
      return path[0];
    }

    return null;
  }

  /**
   * Verifies that after reaching food, there is still a safe escape route to the snake's tail
   */
  private static verifyPathSafetyWithTail(
    snake: SnakeState,
    _path: Direction[],
    food: FoodItem,
    matrix: SpatialCollisionMatrix,
    isGhost: boolean
  ): boolean {
    const space = this.calculateFloodFillSpace({ x: food.x, y: food.y }, matrix, snake, isGhost);
    return space >= snake.segments.length + 2;
  }

  /**
   * Predicts and cuts off player in Versus Enemy mode
   */
  private static predictPlayerCutoff(
    aiSnake: SnakeState,
    playerSnake: SnakeState,
    matrix: SpatialCollisionMatrix,
    isGhost: boolean
  ): Direction | null {
    const pHead = playerSnake.segments[0];
    const pDir = DIRECTION_VECTORS[playerSnake.direction];

    // Predict 2 steps ahead of player
    const targetCell: Vector2D = {
      x: pHead.x + pDir.x * 2,
      y: pHead.y + pDir.y * 2,
    };

    if (matrix.isValid(targetCell.x, targetCell.y)) {
      const path = this.findShortestPathAStar(aiSnake.segments[0], targetCell, aiSnake, matrix, isGhost);
      if (path && path.length > 0) {
        const nextPos = {
          x: aiSnake.segments[0].x + DIRECTION_VECTORS[path[0]].x,
          y: aiSnake.segments[0].y + DIRECTION_VECTORS[path[0]].y,
        };
        const space = this.calculateFloodFillSpace(nextPos, matrix, aiSnake, isGhost);
        if (space >= aiSnake.segments.length) {
          return path[0];
        }
      }
    }

    return null;
  }
}
