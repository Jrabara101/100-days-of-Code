import {
  CellType,
  DIRECTION_VECTORS,
} from './types';
import type {
  CollisionCause,
  Direction,
  FoodItem,
  GameState,
  GameSettings,
  PlayerId,
  SnakeSegment,
  SnakeState,
  TelemetryData,
  Vector2D,
  FloatingText,
} from './types';
import { SpatialCollisionMatrix } from './SpatialCollisionMatrix';
import { InputQueue, getDirectionDotProduct } from './InputQueue';
import { SnakeAI } from './SnakeAI';
import { globalAudio } from './AudioEngine';
import { ParticleSystem } from '../rendering/ParticleSystem';

export class SnakeEngine {
  public settings: GameSettings;
  public gameState: GameState = 'IDLE';
  public collisionMatrix: SpatialCollisionMatrix;
  public inputQueue: InputQueue;
  public particles: ParticleSystem;

  public p1: SnakeState;
  public p2: SnakeState;
  public foods: FoodItem[] = [];
  public floatingTexts: FloatingText[] = [];

  // Fixed Timestep Accumulator Loop variables
  public accumulatorMs: number = 0;
  public tickIntervalMs: number = 100;
  public alpha: number = 0;
  private lastFrameTimestamp: number = 0;
  private maxFrameDeltaMs: number = 250;

  // Game & Score State
  public score: number = 0;
  public p1Score: number = 0;
  public p2Score: number = 0;
  public highScore: number = 0;
  public lives: number = 3;
  public maxLives: number = 3;
  public combo: number = 1.0;
  public comboTimerMs: number = 0;
  public readonly comboMaxDurationMs: number = 4500;
  public lastEater: PlayerId | null = null;
  public foodEatenTotal: number = 0;

  // Power-up Buff Timers
  public ghostTimerMs: number = 0;
  public freezeTimerMs: number = 0;

  // Revive Mechanic
  public reviveBeacon: FoodItem | null = null;
  public reviveCountdownMs: number = 0;
  public readonly reviveMaxDurationMs: number = 10000;

  // Countdown
  public countdownNumber: number = 3;
  public countdownTimerMs: number = 0;

  // Telemetry & Diagnostics
  public fps: number = 60;
  public frameCount: number = 0;
  private fpsTimerMs: number = 0;
  public collisionCause: CollisionCause = null;
  public lastErrorCode: string = '0x00000';
  public lastAiComputeMs: number = 0;

  // Event Listeners for UI state sync
  public onStateChange?: (state: GameState) => void;
  public onScoreChange?: (score: number) => void;

  constructor(settings: GameSettings) {
    this.settings = settings;
    this.collisionMatrix = new SpatialCollisionMatrix(settings.gridWidth, settings.gridHeight);
    this.inputQueue = new InputQueue();
    this.particles = new ParticleSystem();

    const isP2Ai = settings.opponentMode !== 'HUMAN_P2';
    this.p1 = this.createInitialSnake(1, 'Player 1', '#0055ff', '#00f0ff', false);
    this.p2 = this.createInitialSnake(2, isP2Ai ? `BOT [${settings.aiDifficulty}]` : 'Player 2', '#ff0033', '#ffea00', isP2Ai);

    this.tickIntervalMs = 1000 / this.settings.initialSpeedHz;
    this.loadHighScore();
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('NEON_SNAKE_HIGH_SCORE');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {}
  }

  private saveHighScore(): void {
    try {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('NEON_SNAKE_HIGH_SCORE', this.highScore.toString());
      }
    } catch {}
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.collisionMatrix.resize(this.settings.gridWidth, this.settings.gridHeight);

    const isP2Ai = this.settings.opponentMode !== 'HUMAN_P2';
    this.p2.isAi = isP2Ai;
    this.p2.name = isP2Ai ? `BOT [${this.settings.aiDifficulty}]` : 'Player 2';

    globalAudio.setEnabled(this.settings.soundEnabled);
    globalAudio.setVolume(this.settings.soundVolume);
  }

  public createInitialSnake(
    id: PlayerId,
    name: string,
    color: string,
    glowColor: string,
    isAi = false
  ): SnakeState {
    const isP1 = id === 1;
    const startY = Math.floor(this.settings.gridHeight / 2) + (isP1 ? -2 : 2);
    const startX = isP1 ? 6 : this.settings.gridWidth - 7;
    const initialDir: Direction = isP1 ? 'RIGHT' : 'LEFT';

    const segments: SnakeSegment[] = [];
    const length = 4;
    for (let i = 0; i < length; i++) {
      segments.push({
        x: isP1 ? startX - i : startX + i,
        y: startY,
      });
    }

    return {
      id,
      name,
      color,
      glowColor,
      segments: [...segments],
      prevSegments: segments.map((s) => ({ ...s })),
      direction: initialDir,
      pendingDirection: initialDir,
      status: 'ALIVE',
      growthPending: 0,
      invulnerableTicks: 0,
      scoreContribution: 0,
      foodEatenCount: 0,
      downedDurationMs: 0,
      isAi,
    };
  }

  public startCountdown(): void {
    this.resetGame();
    this.gameState = 'COUNTDOWN';
    this.countdownNumber = 3;
    this.countdownTimerMs = 1000;
    globalAudio.playCountdown(false);
    this.onStateChange?.(this.gameState);
  }

  public resetGame(): void {
    this.inputQueue.clear();
    this.particles.clear();
    this.foods = [];
    this.floatingTexts = [];
    this.score = 0;
    this.p1Score = 0;
    this.p2Score = 0;
    this.lives = this.settings.sharedLives;
    this.maxLives = this.settings.sharedLives;
    this.combo = 1.0;
    this.comboTimerMs = 0;
    this.lastEater = null;
    this.foodEatenTotal = 0;
    this.ghostTimerMs = 0;
    this.freezeTimerMs = 0;
    this.reviveBeacon = null;
    this.reviveCountdownMs = 0;
    this.accumulatorMs = 0;
    this.collisionCause = null;
    this.lastErrorCode = '0x00000';
    this.tickIntervalMs = 1000 / this.settings.initialSpeedHz;

    const isP2Ai = this.settings.opponentMode !== 'HUMAN_P2';
    this.p1 = this.createInitialSnake(1, 'Player 1', '#0055ff', '#00f0ff', false);
    this.p2 = this.createInitialSnake(2, isP2Ai ? `BOT [${this.settings.aiDifficulty}]` : 'Player 2', '#ff0033', '#ffea00', isP2Ai);

    this.spawnFoodPool();
  }

  public togglePause(): void {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.onStateChange?.('PAUSED');
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.lastFrameTimestamp = performance.now();
      this.onStateChange?.('PLAYING');
    }
  }

  public handleInput(playerId: PlayerId, direction: Direction): void {
    if (this.gameState !== 'PLAYING') return;

    const snake = playerId === 1 ? this.p1 : this.p2;
    if (snake.status === 'DOWNED' || snake.isAi) return;

    this.inputQueue.enqueue(playerId, direction, snake.direction);
  }

  /**
   * Spawns standard foods and chance for special powerups
   */
  public spawnFoodPool(): void {
    const targetFoodCount = 3;
    while (this.foods.length < targetFoodCount) {
      this.spawnSingleFood();
    }
  }

  public spawnSingleFood(forcedType?: FoodItem['type']): void {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length === 0) return;

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const cell = emptyCells[randomIndex];

    let type: FoodItem['type'] = CellType.FOOD_NORMAL;
    let points = 100;

    if (forcedType) {
      type = forcedType;
      points = forcedType === CellType.REVIVE_BEACON ? 500 : 250;
    } else {
      const roll = Math.random();
      if (roll < 0.12) {
        type = CellType.FOOD_SUPER;
        points = 300;
      } else if (roll < 0.20) {
        type = CellType.FOOD_FREEZE;
        points = 150;
      } else if (roll < 0.28) {
        type = CellType.FOOD_GHOST;
        points = 150;
      }
    }

    const newFood: FoodItem = {
      id: `food_${Date.now()}_${Math.random()}`,
      x: cell.x,
      y: cell.y,
      type,
      points,
      spawnTime: performance.now(),
    };

    this.foods.push(newFood);
  }

  private getEmptyCells(): Vector2D[] {
    const occupied = new Set<number>();

    // Mark P1 segments
    if (this.p1.status !== 'DOWNED') {
      for (const seg of this.p1.segments) {
        occupied.add(seg.y * this.settings.gridWidth + seg.x);
      }
    }

    // Mark P2 segments
    if (this.p2.status !== 'DOWNED') {
      for (const seg of this.p2.segments) {
        occupied.add(seg.y * this.settings.gridWidth + seg.x);
      }
    }

    // Mark existing food
    for (const f of this.foods) {
      occupied.add(f.y * this.settings.gridWidth + f.x);
    }

    const empty: Vector2D[] = [];
    for (let y = 0; y < this.settings.gridHeight; y++) {
      for (let x = 0; x < this.settings.gridWidth; x++) {
        const idx = y * this.settings.gridWidth + x;
        if (!occupied.has(idx)) {
          empty.push({ x, y });
        }
      }
    }

    return empty;
  }

  public addFloatingText(x: number, y: number, text: string, color: string, size = 18): void {
    this.floatingTexts.push({
      id: `float_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      size,
      life: 0,
      maxLife: 1.0,
    });
  }

  /**
   * Main Engine Loop - Called every animation frame
   */
  public update(currentTimestamp: number): void {
    if (this.lastFrameTimestamp === 0) {
      this.lastFrameTimestamp = currentTimestamp;
    }

    let deltaMs = currentTimestamp - this.lastFrameTimestamp;
    this.lastFrameTimestamp = currentTimestamp;

    // Prevent spiral of death on tab focus return
    if (deltaMs > this.maxFrameDeltaMs) {
      deltaMs = this.maxFrameDeltaMs;
    }

    const dtSeconds = deltaMs / 1000;

    // Update FPS Telemetry
    this.frameCount++;
    this.fpsTimerMs += deltaMs;
    if (this.fpsTimerMs >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / this.fpsTimerMs);
      this.frameCount = 0;
      this.fpsTimerMs = 0;
    }

    // Particle & Visual Systems Update (Runs at display refresh rate 60-144 FPS)
    this.particles.update(dtSeconds);

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dtSeconds;
      ft.y -= 25 * dtSeconds;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Handle Countdown State
    if (this.gameState === 'COUNTDOWN') {
      this.countdownTimerMs -= deltaMs;
      if (this.countdownTimerMs <= 0) {
        this.countdownNumber--;
        if (this.countdownNumber > 0) {
          this.countdownTimerMs = 1000;
          globalAudio.playCountdown(false);
        } else {
          this.gameState = 'PLAYING';
          globalAudio.playCountdown(true);
          this.onStateChange?.('PLAYING');
        }
      }
      return;
    }

    if (this.gameState !== 'PLAYING') {
      return;
    }

    // Update Powerup and Combo Timers
    if (this.comboTimerMs > 0) {
      this.comboTimerMs -= deltaMs;
      if (this.comboTimerMs <= 0) {
        this.combo = 1.0;
        this.comboTimerMs = 0;
        this.lastEater = null;
      }
    }

    if (this.ghostTimerMs > 0) {
      this.ghostTimerMs -= deltaMs;
      if (this.ghostTimerMs <= 0) {
        this.ghostTimerMs = 0;
        if (this.p1.status === 'GHOST') this.p1.status = 'ALIVE';
        if (this.p2.status === 'GHOST') this.p2.status = 'ALIVE';
      }
    }

    if (this.freezeTimerMs > 0) {
      this.freezeTimerMs -= deltaMs;
      if (this.freezeTimerMs <= 0) {
        this.freezeTimerMs = 0;
      }
    }

    // Handle Downed Player / Revive Beacon Countdown (Co-op Mode)
    if (this.settings.opponentMode === 'AI_COOP' && (this.p1.status === 'DOWNED' || this.p2.status === 'DOWNED')) {
      this.reviveCountdownMs -= deltaMs;
      if (this.reviveCountdownMs <= 0) {
        this.triggerGameOver('OUT_OF_LIVES', '0xREVIVE_EXPIRED');
        return;
      }
    }

    // Calculate dynamic tick interval based on speed ramp and freeze powerup
    const baseSpeedHz = this.settings.initialSpeedHz + Math.min(8, this.foodEatenTotal * 0.15);
    const speedMultiplier = this.freezeTimerMs > 0 ? 0.65 : 1.0;
    const currentSpeedHz = baseSpeedHz * speedMultiplier;
    this.tickIntervalMs = 1000 / currentSpeedHz;

    // Fixed-Timestep Accumulator Loop
    this.accumulatorMs += deltaMs;
    let ticksRan = 0;

    while (this.accumulatorMs >= this.tickIntervalMs && ticksRan < 5) {
      this.tickSimulation();
      this.accumulatorMs -= this.tickIntervalMs;
      ticksRan++;
      if (this.gameState !== 'PLAYING') break;
    }

    // Compute continuous sub-pixel interpolation factor alpha in [0, 1]
    this.alpha = Math.max(0, Math.min(1, this.accumulatorMs / this.tickIntervalMs));
  }

  /**
   * Discrete Grid Step (TickSimulation)
   * Evaluates AI decisions, FIFO input dequeue, O(1) collision matrix, eating, and mutation.
   */
  public tickSimulation(): void {
    const isGhostMode = this.ghostTimerMs > 0 || this.settings.friendlyPassThrough;

    // 1. AI Decision Computation (if P2 is AI)
    if (this.p2.isAi && this.p2.status !== 'DOWNED') {
      const aiStart = performance.now();
      const aiDir = SnakeAI.computeNextDirection(
        this.p2,
        this.p1,
        this.collisionMatrix,
        this.foods,
        this.reviveBeacon,
        this.settings.aiDifficulty,
        this.settings.opponentMode,
        isGhostMode
      );
      this.lastAiComputeMs = Math.round((performance.now() - aiStart) * 100) / 100;
      this.inputQueue.enqueue(2, aiDir, this.p2.direction);
    }

    // Dequeue next direction from FIFO input queues with dot-product validation
    if (this.p1.status !== 'DOWNED') {
      const nextDir1 = this.inputQueue.dequeue(1, this.p1.direction);
      if (getDirectionDotProduct(nextDir1, this.p1.direction) !== -1) {
        this.p1.direction = nextDir1;
      }
    }

    if (this.p2.status !== 'DOWNED') {
      const nextDir2 = this.inputQueue.dequeue(2, this.p2.direction);
      if (getDirectionDotProduct(nextDir2, this.p2.direction) !== -1) {
        this.p2.direction = nextDir2;
      }
    }

    // Decrease invulnerability ticks
    if (this.p1.invulnerableTicks > 0) this.p1.invulnerableTicks--;
    if (this.p2.invulnerableTicks > 0) this.p2.invulnerableTicks--;

    // 2. Clear & rebuild O(1) Spatial Collision Matrix
    this.collisionMatrix.clear();
    this.collisionMatrix.stampFood(this.foods);
    if (this.reviveBeacon) {
      this.collisionMatrix.set(this.reviveBeacon.x, this.reviveBeacon.y, CellType.REVIVE_BEACON);
    }

    // Stamp snake bodies (excluding head) into matrix
    this.collisionMatrix.stampSnake(this.p1, false);
    this.collisionMatrix.stampSnake(this.p2, false);

    // 3. Calculate target head positions
    const head1 = this.p1.segments[0];
    const head2 = this.p2.segments[0];
    const vec1 = DIRECTION_VECTORS[this.p1.direction];
    const vec2 = DIRECTION_VECTORS[this.p2.direction];

    const nextHead1: Vector2D = {
      x: head1.x + vec1.x,
      y: head1.y + vec1.y,
    };

    const nextHead2: Vector2D = {
      x: head2.x + vec2.x,
      y: head2.y + vec2.y,
    };

    // 4. Check for Collisions
    let p1Collided = false;
    let p2Collided = false;
    let cause: CollisionCause = null;
    let errCode = '0x00000';

    // Check P1 & P2 Mutual Head-to-Head Collision
    if (
      this.p1.status !== 'DOWNED' &&
      this.p2.status !== 'DOWNED' &&
      nextHead1.x === nextHead2.x &&
      nextHead1.y === nextHead2.y &&
      !isGhostMode
    ) {
      p1Collided = true;
      p2Collided = true;
      cause = 'P1_P2_MUTUAL_HEAD';
      errCode = '0xHEAD_HEAD_LOCK';
    }

    // Check P1 Collision
    if (this.p1.status !== 'DOWNED' && !p1Collided) {
      if (!this.collisionMatrix.isValid(nextHead1.x, nextHead1.y)) {
        p1Collided = true;
        cause = 'P1_WALL';
        errCode = '0xWALL_OOB_P1';
      } else {
        const cell = this.collisionMatrix.get(nextHead1.x, nextHead1.y);
        if (cell === CellType.P1_BODY && this.p1.invulnerableTicks === 0) {
          p1Collided = true;
          cause = 'P1_SELF';
          errCode = '0xSELF_INTERSECT_P1';
        } else if (cell === CellType.P2_BODY && !isGhostMode && this.p1.invulnerableTicks === 0) {
          p1Collided = true;
          cause = 'P1_INTO_P2_BODY';
          errCode = '0xPARTNER_TAIL_HIT_P1';
        }
      }
    }

    // Check P2 Collision
    if (this.p2.status !== 'DOWNED' && !p2Collided) {
      if (!this.collisionMatrix.isValid(nextHead2.x, nextHead2.y)) {
        p2Collided = true;
        cause = 'P2_WALL';
        errCode = '0xWALL_OOB_P2';
      } else {
        const cell = this.collisionMatrix.get(nextHead2.x, nextHead2.y);
        if (cell === CellType.P2_BODY && this.p2.invulnerableTicks === 0) {
          p2Collided = true;
          cause = 'P2_SELF';
          errCode = '0xSELF_INTERSECT_P2';
        } else if (cell === CellType.P1_BODY && !isGhostMode && this.p2.invulnerableTicks === 0) {
          p2Collided = true;
          cause = 'P2_INTO_P1_BODY';
          errCode = '0xPARTNER_TAIL_HIT_P2';
        }
      }
    }

    // Handle Collision Penalties
    if (p1Collided || p2Collided) {
      this.handleCollisionResolution(p1Collided, p2Collided, cause, errCode, nextHead1, nextHead2);
      if (this.gameState !== 'PLAYING') return;
    }

    // 5. Ingestion & Mutation Check (Food Consumption)
    if (this.p1.status !== 'DOWNED' && !p1Collided) {
      this.evaluateFoodIngestion(1, nextHead1);
    }
    if (this.p2.status !== 'DOWNED' && !p2Collided) {
      this.evaluateFoodIngestion(2, nextHead2);
    }

    // 6. Advance Snake Bodies & Update Previous Coordinates for Sub-Pixel Lerp
    if (this.p1.status !== 'DOWNED' && !p1Collided) {
      this.advanceSnake(this.p1, nextHead1);
    }
    if (this.p2.status !== 'DOWNED' && !p2Collided) {
      this.advanceSnake(this.p2, nextHead2);
    }

    // Maintain food pool
    this.spawnFoodPool();
  }

  private advanceSnake(snake: SnakeState, nextHead: Vector2D): void {
    // Save current positions to prevSegments for subpixel interpolation
    snake.prevSegments = snake.segments.map((s) => ({ ...s }));

    // Prepend new head
    snake.segments.unshift({ x: nextHead.x, y: nextHead.y });

    // Grow or trim tail
    if (snake.growthPending > 0) {
      snake.growthPending--;
      // Extend prevSegments to match new length so interpolation doesn't jump
      const lastSeg = snake.prevSegments[snake.prevSegments.length - 1] || nextHead;
      snake.prevSegments.push({ ...lastSeg });
    } else {
      snake.segments.pop();
    }
  }

  private handleCollisionResolution(
    p1Collided: boolean,
    p2Collided: boolean,
    cause: CollisionCause,
    errCode: string,
    pos1: Vector2D,
    pos2: Vector2D
  ): void {
    globalAudio.playCollisionCrash();
    this.collisionCause = cause;
    this.lastErrorCode = errCode;

    // Emit crash particles at collision point
    const cellWidth = 30;
    if (p1Collided) {
      this.particles.emitCrashBurst(pos1.x * cellWidth, pos1.y * cellWidth, this.p1.color, '#ffffff');
    }
    if (p2Collided) {
      this.particles.emitCrashBurst(pos2.x * cellWidth, pos2.y * cellWidth, this.p2.color, '#ffffff');
    }

    // In Versus Enemy Mode, a crash immediately ends or awards victory!
    if (this.settings.opponentMode === 'AI_ENEMY') {
      if (p1Collided && p2Collided) {
        this.triggerGameOver(cause, '0xVERSUS_DRAW');
      } else if (p1Collided) {
        this.triggerGameOver(cause, '0xAI_VICTORY');
      } else {
        this.triggerGameOver(cause, '0xPLAYER_VICTORY');
      }
      return;
    }

    // Shared Lives Logic (Co-op & Human 2P)
    if (this.lives > 1) {
      this.lives--;
      this.addFloatingText(
        (p1Collided ? pos1.x : pos2.x) * 30,
        (p1Collided ? pos1.y : pos2.y) * 30,
        '-1 LIFE!',
        '#ff0033',
        22
      );

      // Safe Respawn for crashed player(s)
      if (p1Collided && p2Collided) {
        this.respawnSnake(1);
        this.respawnSnake(2);
      } else if (p1Collided) {
        this.respawnSnake(1);
      } else if (p2Collided) {
        this.respawnSnake(2);
      }
    } else if (this.lives === 1) {
      // Emergency Revive Mode: If one crashed, down that player and spawn Revive Beacon!
      if (p1Collided && p2Collided) {
        this.triggerGameOver(cause, errCode);
      } else if (p1Collided && this.p2.status === 'ALIVE') {
        this.p1.status = 'DOWNED';
        this.lives = 0;
        this.spawnReviveBeacon();
        this.addFloatingText(pos1.x * 30, pos1.y * 30, 'P1 DOWNED! COLLECT REVIVE BEACON!', '#ffea00', 20);
      } else if (p2Collided && this.p1.status === 'ALIVE') {
        this.p2.status = 'DOWNED';
        this.lives = 0;
        this.spawnReviveBeacon();
        this.addFloatingText(pos2.x * 30, pos2.y * 30, 'P2 DOWNED! COLLECT REVIVE BEACON!', '#ffea00', 20);
      } else {
        this.triggerGameOver(cause, errCode);
      }
    } else {
      this.triggerGameOver(cause, errCode);
    }
  }

  private respawnSnake(playerId: PlayerId): void {
    const snake = playerId === 1 ? this.p1 : this.p2;
    const isP1 = playerId === 1;
    const startY = Math.floor(this.settings.gridHeight / 2) + (isP1 ? -2 : 2);
    const startX = isP1 ? 4 : this.settings.gridWidth - 5;
    const dir: Direction = isP1 ? 'RIGHT' : 'LEFT';

    const segments: SnakeSegment[] = [];
    const len = Math.max(3, Math.floor(snake.segments.length * 0.7));
    for (let i = 0; i < len; i++) {
      segments.push({
        x: isP1 ? startX - i : startX + i,
        y: startY,
      });
    }

    snake.segments = [...segments];
    snake.prevSegments = segments.map((s) => ({ ...s }));
    snake.direction = dir;
    snake.status = 'ALIVE';
    snake.invulnerableTicks = 5; // 5 ticks of safety
    snake.growthPending = 0;
  }

  private spawnReviveBeacon(): void {
    this.reviveCountdownMs = this.reviveMaxDurationMs;
    const empty = this.getEmptyCells();
    if (empty.length > 0) {
      const cell = empty[Math.floor(Math.random() * empty.length)];
      this.reviveBeacon = {
        id: `revive_beacon_${Date.now()}`,
        x: cell.x,
        y: cell.y,
        type: CellType.REVIVE_BEACON,
        points: 500,
        spawnTime: performance.now(),
      };
      this.foods.push(this.reviveBeacon);
    }
  }

  private evaluateFoodIngestion(playerId: PlayerId, head: Vector2D): void {
    const snake = playerId === 1 ? this.p1 : this.p2;

    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];
      if (food.x === head.x && food.y === head.y) {
        this.foods.splice(i, 1);
        this.foodEatenTotal++;
        snake.foodEatenCount++;

        // Handle Cooperative Synergy Combo (or competitive multiplier)
        if (this.lastEater && this.lastEater !== playerId) {
          this.combo = Math.min(5.0, Math.round((this.combo + 0.5) * 10) / 10);
          globalAudio.playComboBonus(this.combo);
          this.addFloatingText(head.x * 30, head.y * 30, `SYNERGY x${this.combo.toFixed(1)}!`, '#00ff66', 22);
        } else {
          globalAudio.playEatNormal(this.combo > 1 ? 1.2 : 1.0);
        }

        this.lastEater = playerId;
        this.comboTimerMs = this.comboMaxDurationMs;

        // Calculate points
        const earnedPoints = Math.round(food.points * this.combo);
        if (playerId === 1) this.p1Score += earnedPoints;
        else this.p2Score += earnedPoints;

        this.score = this.settings.opponentMode === 'AI_ENEMY' ? this.p1Score : this.p1Score + this.p2Score;
        snake.scoreContribution += earnedPoints;
        this.onScoreChange?.(this.score);
        this.saveHighScore();

        // Particles
        const cellWidth = 30;
        this.particles.emitFoodBurst(head.x * cellWidth, head.y * cellWidth, snake.glowColor, 18);

        // Handle Item Types
        if (food.type === CellType.FOOD_NORMAL) {
          snake.growthPending += 1;
          this.addFloatingText(head.x * 30, head.y * 30, `+${earnedPoints}`, snake.glowColor, 16);
        } else if (food.type === CellType.FOOD_SUPER) {
          snake.growthPending += 2;
          globalAudio.playEatSuper();
          this.addFloatingText(head.x * 30, head.y * 30, `SUPER CORE +${earnedPoints}!`, '#ffea00', 20);
        } else if (food.type === CellType.FOOD_FREEZE) {
          this.freezeTimerMs = 6000;
          globalAudio.playFreeze();
          this.addFloatingText(head.x * 30, head.y * 30, 'TIME DILATION 6s!', '#00f0ff', 20);
        } else if (food.type === CellType.FOOD_GHOST) {
          this.ghostTimerMs = 6000;
          this.p1.status = 'GHOST';
          this.p2.status = 'GHOST';
          globalAudio.playGhost();
          this.addFloatingText(head.x * 30, head.y * 30, 'GHOST PHASE 6s!', '#bd00ff', 20);
        } else if (food.type === CellType.REVIVE_BEACON) {
          this.reviveBeacon = null;
          this.reviveCountdownMs = 0;
          this.lives = 1;
          const downedId = this.p1.status === 'DOWNED' ? 1 : 2;
          this.respawnSnake(downedId);
          globalAudio.playRevive();
          this.particles.emitReviveSparks(head.x * cellWidth, head.y * cellWidth);
          this.addFloatingText(head.x * 30, head.y * 30, 'TEAMMATE REVIVED!', '#00ff66', 24);
        }

        break;
      }
    }
  }

  public triggerGameOver(cause: CollisionCause, errCode: string): void {
    this.gameState = 'GAME_OVER';
    this.collisionCause = cause;
    this.lastErrorCode = errCode;
    this.saveHighScore();
    globalAudio.playGameOver();
    this.onStateChange?.('GAME_OVER');
  }

  public getTelemetry(): TelemetryData {
    return {
      fps: this.fps,
      tickHz: Math.round((1000 / this.tickIntervalMs) * 10) / 10,
      tickMs: Math.round(this.tickIntervalMs),
      alpha: Math.round(this.alpha * 100) / 100,
      accumulatorMs: Math.round(this.accumulatorMs),
      matrixOccupancy: this.collisionMatrix.getOccupancyPercentage(),
      gridWidth: this.settings.gridWidth,
      gridHeight: this.settings.gridHeight,
      particlesCount: this.particles.particles.length,
      p1Length: this.p1.segments.length,
      p2Length: this.p2.segments.length,
      score: this.score,
      p1Score: this.p1Score,
      p2Score: this.p2Score,
      highScore: this.highScore,
      combo: this.combo,
      comboTimer: this.comboMaxDurationMs > 0 ? this.comboTimerMs / this.comboMaxDurationMs : 0,
      lastEater: this.lastEater,
      lives: this.lives,
      maxLives: this.maxLives,
      p1Status: this.p1.status,
      p2Status: this.p2.status,
      ghostTimer: Math.ceil(this.ghostTimerMs / 1000),
      freezeTimer: Math.ceil(this.freezeTimerMs / 1000),
      activeFoodCount: this.foods.length,
      collisionCause: this.collisionCause,
      errorCode: this.lastErrorCode,
      opponentMode: this.settings.opponentMode,
      aiDifficulty: this.settings.aiDifficulty,
      aiDecisionTimeMs: this.lastAiComputeMs,
    };
  }
}
