import {
  LaneIndex,
  PlayerPhysicsState,
  TrackChunk,
  EndlessRunnerGameState,
  TelemetryAction,
  ObstacleEntity,
  CollectibleEntity,
  PowerUpType,
} from '../types/game';
import { LANE_DISTANCE } from './procedural';

// Constants
export const FIXED_DT = 1 / 60; // 60Hz physics timestep
export const BASE_SPEED = 24; // Initial speed in m/s (~86 km/h)
export const MAX_SPEED = 54; // Cap speed in m/s
export const ACCELERATION = 0.45; // Speed increase per 100 meters
export const OVERDRIVE_SPEED_BOOST = 1.35; // 35% speed boost during overdrive

export const JUMP_VELOCITY = 13.5;
export const GRAVITY = 32.0;
export const SLIDE_DURATION_MS = 620;
export const JUMP_BUFFER_WINDOW_MS = 100;
export const COYOTE_TIME_WINDOW_MS = 80;

export const HITBOX = {
  playerWidth: 1.4,
  playerHeightNormal: 2.1,
  playerHeightSliding: 0.84, // 60% reduction
  playerDepth: 1.0,
  nearMissBuffer: 0.7, // Concentric buffer for near-miss
};

export function getLaneX(lane: LaneIndex): number {
  return (lane - 1) * LANE_DISTANCE;
}

export interface PhysicsTickResult {
  nearMissOccurred: boolean;
  nearMissPos?: { x: number; y: number; z: number };
  crashed: boolean;
  causeOfDeath?: string;
  coinsPicked: number;
  powerupPicked?: PowerUpType;
}

/**
 * Handles kinematic player motion, collision detection, and telemetry tracking
 */
export class RunnerPhysicsEngine {
  public player: PlayerPhysicsState;
  public state: EndlessRunnerGameState;
  public inputTelemetry: TelemetryAction[];
  private runStartTimeMs: number;
  private currentRunTimeMs: number;

  constructor(seed: string) {
    this.runStartTimeMs = performance.now();
    this.currentRunTimeMs = 0;
    this.inputTelemetry = [];

    this.player = {
      lane: 1, // Start in center lane
      targetX: 0,
      currentX: 0,
      yPos: 0,
      yVelocity: 0,
      isGrounded: true,
      isJumping: false,
      isSliding: false,
      slideTimerMs: 0,
      invincibleTimerMs: 0,
      coyoteTimerMs: 0,
      jumpBufferMs: 0,
    };

    this.state = {
      status: 'RUNNING',
      seed,
      distanceMeters: 0,
      currentSpeed: BASE_SPEED,
      score: 0,
      coinsCollected: 0,
      nearMissCount: 0,
      overdriveGauge: 0,
      isOverdriveActive: false,
      activePowerUps: [],
      ghostDistanceMeters: 0,
    };
  }

  public recordAction(action: TelemetryAction['action']) {
    this.inputTelemetry.push({
      timeMs: Math.round(this.currentRunTimeMs),
      action,
      lane: this.player.lane,
      y: parseFloat(this.player.yPos.toFixed(2)),
    });
  }

  public moveLeft(): boolean {
    if (this.player.lane > 0) {
      this.player.lane = (this.player.lane - 1) as LaneIndex;
      this.player.targetX = getLaneX(this.player.lane);
      this.recordAction('MOVE_LEFT');
      return true;
    }
    return false;
  }

  public moveRight(): boolean {
    if (this.player.lane < 2) {
      this.player.lane = (this.player.lane + 1) as LaneIndex;
      this.player.targetX = getLaneX(this.player.lane);
      this.recordAction('MOVE_RIGHT');
      return true;
    }
    return false;
  }

  public triggerJump(): boolean {
    this.player.jumpBufferMs = JUMP_BUFFER_WINDOW_MS;
    // Check if grounded or within coyote time
    if (this.player.isGrounded || this.player.coyoteTimerMs > 0) {
      this.executeJump();
      return true;
    }
    return false;
  }

  private executeJump() {
    this.player.isJumping = true;
    this.player.isGrounded = false;
    this.player.isSliding = false;
    this.player.slideTimerMs = 0;
    this.player.yVelocity = JUMP_VELOCITY;
    this.player.coyoteTimerMs = 0;
    this.player.jumpBufferMs = 0;
    this.recordAction('JUMP');
  }

  public triggerSlide(): boolean {
    this.player.isSliding = true;
    this.player.slideTimerMs = SLIDE_DURATION_MS;

    // Fast-drop if airborne
    if (!this.player.isGrounded) {
      this.player.yVelocity = -GRAVITY * 0.85;
    }

    this.recordAction('SLIDE');
    return true;
  }

  public triggerOverdrive(): boolean {
    if (this.state.overdriveGauge >= 100 && !this.state.isOverdriveActive) {
      this.state.isOverdriveActive = true;
      this.recordAction('OVERDRIVE');
      return true;
    }
    return false;
  }

  /**
   * Fixed 60Hz physics step
   */
  public update(dt: number, activeChunks: TrackChunk[]): PhysicsTickResult {
    const result: PhysicsTickResult = {
      nearMissOccurred: false,
      crashed: false,
      coinsPicked: 0,
    };

    if (this.state.status !== 'RUNNING') {
      return result;
    }

    this.currentRunTimeMs += dt * 1000;

    // Update Timers
    if (this.player.jumpBufferMs > 0) {
      this.player.jumpBufferMs -= dt * 1000;
      if (this.player.isGrounded && this.player.jumpBufferMs > 0) {
        this.executeJump();
      }
    }

    if (this.player.coyoteTimerMs > 0) {
      this.player.coyoteTimerMs -= dt * 1000;
    }

    if (this.player.slideTimerMs > 0) {
      this.player.slideTimerMs -= dt * 1000;
      if (this.player.slideTimerMs <= 0) {
        this.player.isSliding = false;
      }
    }

    if (this.player.invincibleTimerMs > 0) {
      this.player.invincibleTimerMs -= dt * 1000;
    }

    // Overdrive Gauge & Speed calculation
    let effectiveSpeed = Math.min(MAX_SPEED, BASE_SPEED + (this.state.distanceMeters / 100) * ACCELERATION);

    const hasShield = this.state.activePowerUps.some((p) => p.type === 'shield');
    const hasMagnet = this.state.activePowerUps.some((p) => p.type === 'coin_magnet') || this.state.isOverdriveActive;
    const hasMultiplier = this.state.activePowerUps.some((p) => p.type === 'multiplier_2x');

    if (this.state.isOverdriveActive) {
      effectiveSpeed *= OVERDRIVE_SPEED_BOOST;
      this.state.overdriveGauge -= dt * 14; // Overdrive lasts ~7 seconds
      if (this.state.overdriveGauge <= 0) {
        this.state.overdriveGauge = 0;
        this.state.isOverdriveActive = false;
      }
    }

    this.state.currentSpeed = effectiveSpeed;

    // Advance longitudinal track distance
    const deltaDistance = effectiveSpeed * dt;
    this.state.distanceMeters += deltaDistance;

    // Score accumulation
    const multiplier = (hasMultiplier ? 2 : 1) * (this.state.isOverdriveActive ? 3 : 1);
    this.state.score += Math.round(deltaDistance * 10 * multiplier);

    // Lateral player easing (lerp to target lane)
    const lateralSpeed = 16.0;
    this.player.currentX += (this.player.targetX - this.player.currentX) * Math.min(1, dt * lateralSpeed);

    // Vertical Jump & Gravity
    if (!this.player.isGrounded) {
      this.player.yVelocity -= GRAVITY * dt;
      this.player.yPos += this.player.yVelocity * dt;

      if (this.player.yPos <= 0) {
        this.player.yPos = 0;
        this.player.yVelocity = 0;
        this.player.isGrounded = true;
        this.player.isJumping = false;
      }
    }

    // Update active powerups
    const nowMs = this.currentRunTimeMs;
    this.state.activePowerUps = this.state.activePowerUps.filter((p) => p.expiresAtMs > nowMs);

    // Collision Detection & Near-Miss against obstacles
    const playerZ = this.state.distanceMeters;
    const playerHeight = this.player.isSliding ? HITBOX.playerHeightSliding : HITBOX.playerHeightNormal;
    const playerY = this.player.yPos;
    const playerX = this.player.currentX;

    for (const chunk of activeChunks) {
      // Process moving train updates
      for (const obs of chunk.obstacles) {
        if (obs.type === 'moving_train') {
          // Train hurtles backwards at 14 m/s relative to track
          obs.zPos -= 14 * dt;
        }

        if (obs.cleared) continue;

        const obsX = getLaneX(obs.lane);
        const zDist = Math.abs(obs.zPos - playerZ);

        // Near-Miss & Fatal Hitbox checks
        if (zDist < 2.5) {
          const xOverlap = Math.abs(playerX - obsX) < (HITBOX.playerWidth / 2 + obs.width / 2);
          const laneMatches = this.player.lane === obs.lane;

          let yFatalCollision = false;
          let yNearMiss = false;

          if (obs.type === 'barrier_low') {
            // Must jump over
            if (playerY < obs.height) {
              yFatalCollision = true;
            } else if (playerY < obs.height + HITBOX.nearMissBuffer) {
              yNearMiss = true;
            }
          } else if (obs.type === 'barrier_high') {
            // Must slide under: clearance gap is beneath 1.2m
            if (!this.player.isSliding || playerY > 0.4) {
              yFatalCollision = true;
            } else {
              yNearMiss = true;
            }
          } else if (obs.type === 'pitfall') {
            // Pitfall on ground: fatal if grounded on this lane
            if (playerY <= 0.1 && laneMatches) {
              yFatalCollision = true;
            } else if (playerY > 0.1 && playerY < 1.2) {
              yNearMiss = true;
            }
          } else if (obs.type === 'moving_train') {
            // Massive obstacle: cannot jump over or slide under; must dodge lane
            if (xOverlap) {
              yFatalCollision = true;
            } else if (Math.abs(playerX - obsX) < (HITBOX.playerWidth / 2 + obs.width / 2 + HITBOX.nearMissBuffer)) {
              yNearMiss = true;
            }
          }

          // Check Fatal Collision
          if (xOverlap && yFatalCollision) {
            if (this.state.isOverdriveActive || this.player.invincibleTimerMs > 0) {
              // Destroy obstacle in overdrive/invincibility
              obs.cleared = true;
              this.state.score += 500;
            } else if (hasShield) {
              // Pop shield
              this.state.activePowerUps = this.state.activePowerUps.filter((p) => p.type !== 'shield');
              this.player.invincibleTimerMs = 1200; // 1.2s grace
              obs.cleared = true;
            } else {
              // Fatal crash!
              result.crashed = true;
              result.causeOfDeath = obs.type;
              this.state.status = 'CRASHED';
              return result;
            }
          }

          // Check Near-Miss (Outer Concentric Zone)
          if (!obs.nearMissChecked && !yFatalCollision && (yNearMiss || (!xOverlap && Math.abs(playerX - obsX) < (HITBOX.playerWidth / 2 + obs.width / 2 + HITBOX.nearMissBuffer)))) {
            obs.nearMissChecked = true;
            result.nearMissOccurred = true;
            result.nearMissPos = { x: obsX, y: obs.height / 2, z: obs.zPos };
            this.state.nearMissCount++;
            this.state.score += 350;

            // Feed Overdrive meter
            if (!this.state.isOverdriveActive) {
              this.state.overdriveGauge = Math.min(100, this.state.overdriveGauge + 18);
              if (this.state.overdriveGauge >= 100) {
                // Auto-trigger overdrive or ready
                this.triggerOverdrive();
              }
            }
          }
        }

        // Mark cleared once player passes obstacle
        if (playerZ > obs.zPos + 2.0) {
          obs.cleared = true;
        }
      }

      // Process Collectibles (Coins and Powerups)
      for (const col of chunk.collectibles) {
        if (col.collected) continue;

        const colX = getLaneX(col.lane);
        const zDist = Math.abs(col.zPos - playerZ);

        // Coin Magnet Pull
        if (hasMagnet && col.type === 'coin' && zDist < 18) {
          // Magnetize coin toward player
          col.zPos += (playerZ - col.zPos) * dt * 10;
        }

        // Collection distance check
        if (zDist < 1.6) {
          const xDist = Math.abs(playerX - colX);
          const yDist = Math.abs(playerY - col.yOffset);

          if (xDist < (hasMagnet ? 3.5 : 1.4) && yDist < 2.0) {
            col.collected = true;

            if (col.type === 'coin') {
              result.coinsPicked++;
              this.state.coinsCollected++;
              this.state.score += 100 * multiplier;
              if (!this.state.isOverdriveActive) {
                this.state.overdriveGauge = Math.min(100, this.state.overdriveGauge + 1.2);
              }
            } else {
              // Powerup collected
              result.powerupPicked = col.type as PowerUpType;
              if (col.type === 'overdrive_boost') {
                this.state.overdriveGauge = 100;
                this.triggerOverdrive();
              } else {
                this.state.activePowerUps.push({
                  type: col.type as PowerUpType,
                  expiresAtMs: nowMs + 10000, // 10s duration
                });
              }
            }
          }
        }
      }
    }

    return result;
  }
}
