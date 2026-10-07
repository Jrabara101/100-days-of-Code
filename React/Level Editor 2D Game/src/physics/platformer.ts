import { LevelEntity, LevelMap, MapLayer, TileData } from '../types/index.js';
import { sound } from '../utils/audio.js';

export interface PlayerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  coyoteTimer: number;
  jumpBufferTimer: number;
  isClimbing: boolean;
  isDead: boolean;
  deathTimer: number;
  respawnX: number;
  respawnY: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

export interface PlaytestRunState {
  player: PlayerPhysicsState;
  particles: Particle[];
  collectedEntityIds: Set<string>;
  activeTriggerIds: Set<string>;
  openedDoorIds: Set<string>;
  score: number;
  deathCount: number;
  deathCoordinates: { x: number; y: number }[];
  elapsedMs: number;
  completed: boolean;
}

export class PlatformerSimulation {
  public state: PlaytestRunState;
  private map: LevelMap;
  private keyState: Record<string, boolean> = {};

  constructor(map: LevelMap) {
    this.map = map;
    this.state = this.createInitialState();
  }

  public setMap(map: LevelMap) {
    this.map = map;
  }

  private createInitialState(): PlaytestRunState {
    const spawnEntity = this.map.entities.find((e) => e.type === 'player_spawn');
    const sx = spawnEntity ? spawnEntity.position.x : 4 * this.map.dimensions.tileSize;
    const sy = spawnEntity ? spawnEntity.position.y : 12 * this.map.dimensions.tileSize;

    return {
      player: {
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        width: 20,
        height: 28,
        isGrounded: false,
        facing: 'right',
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        isClimbing: false,
        isDead: false,
        deathTimer: 0,
        respawnX: sx,
        respawnY: sy,
      },
      particles: [],
      collectedEntityIds: new Set<string>(),
      activeTriggerIds: new Set<string>(),
      openedDoorIds: new Set<string>(),
      score: 0,
      deathCount: 0,
      deathCoordinates: [],
      elapsedMs: 0,
      completed: false,
    };
  }

  public reset() {
    this.state = this.createInitialState();
  }

  public handleKeyDown(code: string) {
    this.keyState[code] = true;
    if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
      this.state.player.jumpBufferTimer = 0.12; // 120ms jump buffer
    }
  }

  public handleKeyUp(code: string) {
    this.keyState[code] = false;
    // Variable jump height cutoff
    if ((code === 'Space' || code === 'KeyW' || code === 'ArrowUp') && this.state.player.vy < -150) {
      this.state.player.vy *= 0.45;
    }
  }

  public update(dt: number) {
    if (dt > 0.05) dt = 0.05; // clamp delta time for stability

    this.state.elapsedMs += dt * 1000;
    this.updateParticles(dt);

    const p = this.state.player;

    if (p.isDead) {
      p.deathTimer -= dt;
      if (p.deathTimer <= 0) {
        // Respawn
        p.isDead = false;
        p.x = p.respawnX;
        p.y = p.respawnY;
        p.vx = 0;
        p.vy = 0;
        this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#10B981', 12);
      }
      return;
    }

    const tileSize = this.map.dimensions.tileSize;

    // Timers
    if (p.isGrounded) {
      p.coyoteTimer = 0.12;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }
    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);

    // Inputs
    const left = this.keyState['KeyA'] || this.keyState['ArrowLeft'];
    const right = this.keyState['KeyD'] || this.keyState['ArrowRight'];
    const up = this.keyState['KeyW'] || this.keyState['ArrowUp'] || this.keyState['Space'];
    const down = this.keyState['KeyS'] || this.keyState['ArrowDown'];

    // Horizontal Movement
    const maxSpeed = 220;
    const accel = 1800;
    const friction = 1400;

    if (left && !right) {
      p.vx = Math.max(-maxSpeed, p.vx - accel * dt);
      p.facing = 'left';
    } else if (right && !left) {
      p.vx = Math.min(maxSpeed, p.vx + accel * dt);
      p.facing = 'right';
    } else {
      // Decelerate
      if (p.vx > 0) {
        p.vx = Math.max(0, p.vx - friction * dt);
      } else if (p.vx < 0) {
        p.vx = Math.min(0, p.vx + friction * dt);
      }
    }

    // Jump execution
    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
      p.vy = -450;
      p.isGrounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      sound.playJump();
      this.spawnBurst(p.x + p.width / 2, p.y + p.height, '#94A3B8', 6);
    }

    // Gravity
    const gravity = 1150;
    const maxFall = 650;
    p.vy = Math.min(maxFall, p.vy + gravity * dt);

    // AABB Collision Resolution against Map Geometry
    this.resolveMovement(dt, tileSize, down);

    // Hazard, Collectible & Trigger Checks
    this.checkEntitiesAndHazards(tileSize);
  }

  private resolveMovement(dt: number, tileSize: number, isDroppingDown: boolean) {
    const p = this.state.player;
    const prevY = p.y;

    // 1. Horizontal Step
    p.x += p.vx * dt;
    this.resolveHorizontalCollisions(tileSize);

    // 2. Vertical Step
    p.y += p.vy * dt;
    p.isGrounded = false;
    this.resolveVerticalCollisions(tileSize, prevY, isDroppingDown);
  }

  private resolveHorizontalCollisions(tileSize: number) {
    const p = this.state.player;
    const leftTile = Math.floor(p.x / tileSize);
    const rightTile = Math.floor((p.x + p.width - 0.01) / tileSize);
    const topTile = Math.floor(p.y / tileSize);
    const bottomTile = Math.floor((p.y + p.height - 0.01) / tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        const col = this.getTileCollision(tx, ty);
        if (col === 'solid' || (this.isDoorSolid(tx, ty, tileSize))) {
          if (p.vx > 0) {
            p.x = tx * tileSize - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = (tx + 1) * tileSize;
            p.vx = 0;
          }
        }
      }
    }
  }

  private resolveVerticalCollisions(tileSize: number, prevY: number, isDroppingDown: boolean) {
    const p = this.state.player;
    const leftTile = Math.floor(p.x / tileSize);
    const rightTile = Math.floor((p.x + p.width - 0.01) / tileSize);
    const topTile = Math.floor(p.y / tileSize);
    const bottomTile = Math.floor((p.y + p.height - 0.01) / tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        const col = this.getTileCollision(tx, ty);

        if (col === 'solid' || this.isDoorSolid(tx, ty, tileSize)) {
          if (p.vy > 0) {
            // Land on ground
            p.y = ty * tileSize - p.height;
            p.vy = 0;
            p.isGrounded = true;
          } else if (p.vy < 0) {
            // Bump ceiling
            p.y = (ty + 1) * tileSize;
            p.vy = 0;
          }
        } else if (col === 'platform_one_way' && !isDroppingDown) {
          // One-way platform: only land if falling from above
          const platformTop = ty * tileSize;
          const prevBottom = prevY + p.height;
          if (p.vy >= 0 && prevBottom <= platformTop + 6 && p.y + p.height >= platformTop) {
            p.y = platformTop - p.height;
            p.vy = 0;
            p.isGrounded = true;
          }
        }
      }
    }
  }

  private getTileCollision(tx: number, ty: number): string {
    const key = `${tx},${ty}`;
    for (const layer of this.map.layers) {
      if (!layer.visible) continue;
      const tile = layer.grid[key];
      if (tile && tile.collision && tile.collision !== 'none') {
        return tile.collision;
      }
    }
    return 'none';
  }

  private isDoorSolid(tx: number, ty: number, tileSize: number): boolean {
    const tileBox = { x: tx * tileSize, y: ty * tileSize, w: tileSize, h: tileSize };
    for (const e of this.map.entities) {
      if (e.type === 'door' && !this.state.openedDoorIds.has(e.id)) {
        const doorBox = { x: e.position.x, y: e.position.y, w: 24, h: 48 };
        if (
          tileBox.x < doorBox.x + doorBox.w &&
          tileBox.x + tileBox.w > doorBox.x &&
          tileBox.y < doorBox.y + doorBox.h &&
          tileBox.y + tileBox.h > doorBox.y
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private checkEntitiesAndHazards(tileSize: number) {
    const p = this.state.player;
    const playerBox = { x: p.x, y: p.y, w: p.width, h: p.height };

    // 1. Hazard Tiles Collision Check
    const leftTile = Math.floor(p.x / tileSize);
    const rightTile = Math.floor((p.x + p.width - 0.01) / tileSize);
    const topTile = Math.floor(p.y / tileSize);
    const bottomTile = Math.floor((p.y + p.height - 0.01) / tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (this.getTileCollision(tx, ty) === 'hazard') {
          this.killPlayer();
          return;
        }
      }
    }

    // 2. Map Entities Check
    for (const entity of this.map.entities) {
      // Collectibles (Coins/Gems)
      if (entity.type === 'collectible' && !this.state.collectedEntityIds.has(entity.id)) {
        const entBox = { x: entity.position.x, y: entity.position.y, w: 20, h: 20 };
        if (this.boxesIntersect(playerBox, entBox)) {
          this.state.collectedEntityIds.add(entity.id);
          const pts = Number(entity.properties.points) || 100;
          this.state.score += pts;
          sound.playCollect();
          this.spawnBurst(entity.position.x + 10, entity.position.y + 10, '#F59E0B', 14);
        }
      }

      // Triggers (Pressure plates / switches)
      if (entity.type === 'trigger') {
        const entBox = { x: entity.position.x, y: entity.position.y + 16, w: 32, h: 16 };
        if (this.boxesIntersect(playerBox, entBox)) {
          if (!this.state.activeTriggerIds.has(entity.id)) {
            this.state.activeTriggerIds.add(entity.id);
            sound.playSwitch();
            this.spawnBurst(entity.position.x + 16, entity.position.y + 24, '#06B6D4', 8);

            // Activate connected entities (doors)
            for (const targetId of entity.connectedEntityIds || []) {
              this.state.openedDoorIds.add(targetId);
              sound.playWireConnect();
            }
          }
        }
      }

      // Enemies
      if (entity.type === 'enemy') {
        const entBox = { x: entity.position.x, y: entity.position.y, w: 24, h: 24 };
        if (this.boxesIntersect(playerBox, entBox)) {
          // If player landed on top of enemy, bounce!
          if (p.vy > 100 && p.y + p.height <= entity.position.y + 12) {
            p.vy = -380;
            sound.playJump();
            this.spawnBurst(entity.position.x + 12, entity.position.y + 12, '#EF4444', 16);
          } else {
            this.killPlayer();
            return;
          }
        }
      }
    }

    // Bottom map boundary death check
    if (p.y > (this.map.dimensions.heightInTiles + 4) * tileSize) {
      this.killPlayer();
    }
  }

  private killPlayer() {
    const p = this.state.player;
    if (p.isDead) return;

    p.isDead = true;
    p.deathTimer = 0.75; // 750ms before respawn
    this.state.deathCount += 1;
    this.state.deathCoordinates.push({ x: p.x + p.width / 2, y: p.y + p.height / 2 });

    sound.playDeath();
    this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#EF4444', 24);
  }

  private boxesIntersect(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  public spawnBurst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 140 + 60;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1,
        maxLife: 0.5 + Math.random() * 0.3,
        life: 0.5 + Math.random() * 0.3,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const part = this.state.particles[i];
      part.life -= dt;
      if (part.life <= 0) {
        this.state.particles.splice(i, 1);
        continue;
      }
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += 300 * dt; // gravity on particles
      part.alpha = Math.max(0, part.life / part.maxLife);
    }
  }
}
