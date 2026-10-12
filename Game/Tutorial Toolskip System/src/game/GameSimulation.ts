import { EntityState, INPUT_MASK, KeyframeSnapshot, PlayerInputPacket, ReplayEventMarker } from '../types/replay';

export interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class GameSimulation {
  public width: number = 1200;
  public height: number = 700;

  public tick: number = 0;
  public score: number = 0;
  public combo: number = 0;
  public comboTimer: number = 0;
  public killsCount: number = 0;

  // Player state
  public player = {
    x: 600,
    y: 350,
    vx: 0,
    vy: 0,
    rotation: 0,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    dashCooldown: 0,
    isDashing: false,
    invincibleTimer: 0,
    shieldActive: false,
  };

  // World entities
  public enemies: {
    id: string;
    type: 'enemy' | 'boss';
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    health: number;
    maxHealth: number;
    radius: number;
    shootTimer: number;
  }[] = [];

  public projectiles: {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    isPlayer: boolean;
    color: string;
    life: number;
  }[] = [];

  public crystals: {
    id: string;
    x: number;
    y: number;
    radius: number;
    type: 'health' | 'energy';
    glowPhase: number;
  }[] = [];

  public particles: GameParticle[] = [];

  // Boss state
  public bossSpawned: boolean = false;
  public bossDefeated: boolean = false;

  // Listeners for climax events
  public onEventMarker?: (marker: Omit<ReplayEventMarker, 'id'>) => void;

  constructor() {
    this.reset();
  }

  public reset(seed: number = 42): void {
    this.tick = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.killsCount = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;

    this.player = {
      x: 600,
      y: 350,
      vx: 0,
      vy: 0,
      rotation: 0,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      dashCooldown: 0,
      isDashing: false,
      invincibleTimer: 0,
      shieldActive: false,
    };

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.crystals = [];

    // Initial drones
    for (let i = 0; i < 4; i++) {
      this.spawnEnemy('enemy', 150 + i * 250, 100);
    }

    // Initial power crystals
    this.crystals.push({ id: 'c1', x: 300, y: 500, radius: 10, type: 'energy', glowPhase: 0 });
    this.crystals.push({ id: 'c2', x: 900, y: 500, radius: 10, type: 'health', glowPhase: 1 });
  }

  public spawnEnemy(type: 'enemy' | 'boss', x: number, y: number) {
    const isBoss = type === 'boss';
    this.enemies.push({
      id: `e_${this.tick}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      rotation: 0,
      health: isBoss ? 350 : 30,
      maxHealth: isBoss ? 350 : 30,
      radius: isBoss ? 28 : 14,
      shootTimer: Math.floor(Math.random() * 60),
    });
  }

  public emitEvent(category: ReplayEventMarker['category'], label: string, metadata?: Record<string, unknown>) {
    if (this.onEventMarker) {
      this.onEventMarker({
        tick: this.tick,
        timestampMs: Math.round((this.tick / 60) * 1000),
        category,
        label,
        metadata,
      });
    }
  }

  public step(input: PlayerInputPacket): void {
    this.tick++;

    // 1. Process Player Input
    const keys = input.keys;
    const accel = 0.55;
    const friction = 0.88;

    let ax = 0;
    let ay = 0;
    if (keys & INPUT_MASK.UP) ay -= accel;
    if (keys & INPUT_MASK.DOWN) ay += accel;
    if (keys & INPUT_MASK.LEFT) ax -= accel;
    if (keys & INPUT_MASK.RIGHT) ax += accel;

    // Normalizing diagonal
    if (ax !== 0 && ay !== 0) {
      ax *= 0.7071;
      ay *= 0.7071;
    }

    this.player.vx += ax;
    this.player.vy += ay;
    this.player.vx *= friction;
    this.player.vy *= friction;

    // Dash handling
    if (this.player.dashCooldown > 0) this.player.dashCooldown--;
    if (this.player.invincibleTimer > 0) this.player.invincibleTimer--;

    if ((keys & INPUT_MASK.DASH) && this.player.dashCooldown <= 0 && this.player.energy >= 20) {
      this.player.energy -= 20;
      this.player.dashCooldown = 45; // 0.75s
      this.player.invincibleTimer = 18; // 0.3s
      const dashSpeed = 16;
      const angle = Math.atan2(input.cursor.y - this.player.y, input.cursor.x - this.player.x);
      this.player.vx = Math.cos(angle) * dashSpeed;
      this.player.vy = Math.sin(angle) * dashSpeed;

      this.emitEvent('ability', 'WARP DASH [Phase Shift]', { energyRemaining: this.player.energy });

      // Spawn dash particles
      for (let p = 0; p < 12; p++) {
        this.particles.push({
          x: this.player.x,
          y: this.player.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 20,
          maxLife: 20,
          color: '#38BDF8',
          size: 3,
        });
      }
    }

    // Shield / EMP handling
    if ((keys & INPUT_MASK.ABILITY) && this.player.energy >= 35) {
      this.player.energy -= 35;
      this.player.shieldActive = true;
      this.emitEvent('ability', 'TACHYON EMP PULSE', { energy: this.player.energy });

      // Destroy or deflect nearby enemy projectiles & damage enemies
      for (const proj of this.projectiles) {
        if (!proj.isPlayer) {
          const dx = proj.x - this.player.x;
          const dy = proj.y - this.player.y;
          if (dx * dx + dy * dy < 200 * 200) {
            proj.vx *= -1.5;
            proj.vy *= -1.5;
            proj.isPlayer = true;
            proj.color = '#8B5CF6';
          }
        }
      }

      for (let p = 0; p < 24; p++) {
        const rad = (p / 24) * Math.PI * 2;
        this.particles.push({
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(rad) * 8,
          vy: Math.sin(rad) * 8,
          life: 25,
          maxLife: 25,
          color: '#8B5CF6',
          size: 4,
        });
      }
    } else {
      this.player.shieldActive = false;
    }

    // Firing handling
    if (keys & INPUT_MASK.FIRE) {
      if (this.tick % 8 === 0) {
        const angle = Math.atan2(input.cursor.y - this.player.y, input.cursor.x - this.player.x);
        const pSpeed = 14;
        this.projectiles.push({
          id: `p_${this.tick}_${Math.random().toString(36).substring(2, 5)}`,
          x: this.player.x + Math.cos(angle) * 16,
          y: this.player.y + Math.sin(angle) * 16,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          radius: 4,
          isPlayer: true,
          color: '#38BDF8',
          life: 80,
        });

        // Recoil
        this.player.vx -= Math.cos(angle) * 0.4;
        this.player.vy -= Math.sin(angle) * 0.4;
      }
    }

    // Energy passive regen
    if (this.player.energy < this.player.maxEnergy) {
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 0.25);
    }

    // Player position update & boundary check
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(30, Math.min(this.width - 30, this.player.x));
    this.player.y = Math.max(30, Math.min(this.height - 30, this.player.y));
    this.player.rotation = Math.atan2(input.cursor.y - this.player.y, input.cursor.x - this.player.x);

    // 2. Spawn Boss Milestone when score or tick hits threshold
    if (!this.bossSpawned && (this.killsCount >= 6 || this.tick >= 600)) {
      this.bossSpawned = true;
      this.spawnEnemy('boss', this.width / 2, 120);
      this.emitEvent('milestone', 'ALERT: NEXUS-9 SENTINEL DETECTED', { bossId: 'boss_nexus_9' });
    }

    // 3. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy);

      e.rotation = Math.atan2(dy, dx);
      const speed = e.type === 'boss' ? 1.2 : 2.2;

      // Keep distance or pursue
      if (dist > (e.type === 'boss' ? 220 : 120)) {
        e.vx += (dx / dist) * speed * 0.08;
        e.vy += (dy / dist) * speed * 0.08;
      } else {
        // Circle around player
        e.vx += (-dy / dist) * speed * 0.06;
        e.vy += (dx / dist) * speed * 0.06;
      }
      e.vx *= 0.94;
      e.vy *= 0.94;
      e.x += e.vx;
      e.y += e.vy;

      // Enemy shooting
      e.shootTimer++;
      const shootInterval = e.type === 'boss' ? 35 : 75;
      if (e.shootTimer >= shootInterval) {
        e.shootTimer = 0;
        const eAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        const bulletSpeed = e.type === 'boss' ? 7 : 5;

        if (e.type === 'boss') {
          // Spread shot
          for (let s = -1; s <= 1; s++) {
            const spreadAngle = eAngle + s * 0.25;
            this.projectiles.push({
              id: `ep_${this.tick}_${s}`,
              x: e.x + Math.cos(spreadAngle) * 30,
              y: e.y + Math.sin(spreadAngle) * 30,
              vx: Math.cos(spreadAngle) * bulletSpeed,
              vy: Math.sin(spreadAngle) * bulletSpeed,
              radius: 5,
              isPlayer: false,
              color: '#F43F5E',
              life: 140,
            });
          }
        } else {
          this.projectiles.push({
            id: `ep_${this.tick}_${i}`,
            x: e.x + Math.cos(eAngle) * 16,
            y: e.y + Math.sin(eAngle) * 16,
            vx: Math.cos(eAngle) * bulletSpeed,
            vy: Math.sin(eAngle) * bulletSpeed,
            radius: 4,
            isPlayer: false,
            color: '#F43F5E',
            life: 100,
          });
        }
      }
    }

    // 4. Update Projectiles
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = this.projectiles[pIdx];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life--;

      // Boundary or lifetime check
      if (proj.life <= 0 || proj.x < 0 || proj.x > this.width || proj.y < 0 || proj.y > this.height) {
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      // Check collision with player
      if (!proj.isPlayer) {
        const pDist = Math.hypot(proj.x - this.player.x, proj.y - this.player.y);
        if (pDist < 18 && this.player.invincibleTimer <= 0) {
          this.player.health -= 12;
          this.player.invincibleTimer = 15;
          this.projectiles.splice(pIdx, 1);

          // Near death or death detection
          if (this.player.health <= 0) {
            this.player.health = 0;
            this.emitEvent('death', 'CHASSIS CRITICAL: DESTROYED IN COMBAT', { tick: this.tick });
          } else if (this.player.health <= 25) {
            this.emitEvent('milestone', 'CRITICAL HULL INTEGRITY (HP < 25%)', { health: Math.round(this.player.health) });
          }
          continue;
        }
      } else {
        // Player projectile hits enemies
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = this.enemies[eIdx];
          const eDist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          if (eDist < enemy.radius + proj.radius) {
            enemy.health -= 15;
            this.projectiles.splice(pIdx, 1);

            // Hit spark particles
            for (let sp = 0; sp < 4; sp++) {
              this.particles.push({
                x: proj.x,
                y: proj.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 12,
                maxLife: 12,
                color: '#F59E0B',
                size: 2,
              });
            }

            // Check enemy death
            if (enemy.health <= 0) {
              const wasBoss = enemy.type === 'boss';
              this.enemies.splice(eIdx, 1);
              this.killsCount++;
              this.score += wasBoss ? 1500 : 200;
              this.combo++;
              this.comboTimer = 120; // 2s

              if (wasBoss) {
                this.bossDefeated = true;
                this.emitEvent('kill', 'BOSS ELIMINATED: NEXUS-9 PURGED', { score: this.score });
              } else {
                let killTitle = `ENEMY DRONE ELIMINATED (#${this.killsCount})`;
                if (this.combo >= 3) {
                  killTitle = `TRIPLE KILL! COMBO x${this.combo}`;
                } else if (this.combo >= 2) {
                  killTitle = `DOUBLE KILL! COMBO x${this.combo}`;
                }
                this.emitEvent('kill', killTitle, { combo: this.combo, kills: this.killsCount });
              }

              // Explosion particles
              for (let exp = 0; exp < (wasBoss ? 40 : 16); exp++) {
                this.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 10,
                  vy: (Math.random() - 0.5) * 10,
                  life: 30,
                  maxLife: 30,
                  color: wasBoss ? '#F59E0B' : '#38BDF8',
                  size: wasBoss ? 5 : 3,
                });
              }

              // Replenish drones if count is low
              if (this.enemies.length < 3 && !this.bossDefeated) {
                this.spawnEnemy('enemy', Math.random() * (this.width - 200) + 100, Math.random() * 200 + 50);
              }
            }
            break;
          }
        }
      }
    }

    // 5. Update Crystals
    for (let cIdx = this.crystals.length - 1; cIdx >= 0; cIdx--) {
      const c = this.crystals[cIdx];
      c.glowPhase += 0.05;
      const cDist = Math.hypot(this.player.x - c.x, this.player.y - c.y);
      if (cDist < 26) {
        if (c.type === 'health') {
          const prevHp = this.player.health;
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
          if (prevHp <= 25 && this.player.health > 50) {
            this.emitEvent('milestone', 'CLUTCH RECOVERY: NANO-REPAIR MATRIX', { healed: Math.round(this.player.health - prevHp) });
          }
        } else {
          this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 50);
          this.emitEvent('checkpoint', 'ENERGY CELL HARVESTED [+50]', { energy: this.player.energy });
        }

        // Respawn crystal in new location after brief delay
        c.x = Math.random() * (this.width - 200) + 100;
        c.y = Math.random() * (this.height - 200) + 100;
      }
    }

    // 6. Checkpoint Sector Milestone
    if (this.tick === 900) {
      this.emitEvent('checkpoint', 'SECTOR GATE BRAVO OVERCLOCKED', { tick: 900 });
    }

    // 7. Update Particles
    for (let pIdx = this.particles.length - 1; pIdx >= 0; pIdx--) {
      const pt = this.particles[pIdx];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) {
        this.particles.splice(pIdx, 1);
      }
    }

    // Combo timer decrement
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }
  }

  // Create Keyframe Snapshot of all current entities
  public createSnapshot(): KeyframeSnapshot {
    const entities: EntityState[] = [
      {
        id: 'player',
        type: 'player',
        pos: { x: this.player.x, y: this.player.y },
        velocity: { x: this.player.vx, y: this.player.vy },
        stateFlags: (this.player.isDashing ? 1 : 0) | (this.player.shieldActive ? 2 : 0),
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        rotation: this.player.rotation,
        radius: 16,
        color: '#38BDF8',
      },
    ];

    for (const e of this.enemies) {
      entities.push({
        id: e.id,
        type: e.type,
        pos: { x: e.x, y: e.y },
        velocity: { x: e.vx, y: e.vy },
        stateFlags: 0,
        health: e.health,
        maxHealth: e.maxHealth,
        rotation: e.rotation,
        radius: e.radius,
        color: e.type === 'boss' ? '#F59E0B' : '#F43F5E',
      });
    }

    for (const c of this.crystals) {
      entities.push({
        id: c.id,
        type: 'crystal',
        pos: { x: c.x, y: c.y },
        velocity: { x: 0, y: 0 },
        stateFlags: c.type === 'health' ? 1 : 2,
        radius: c.radius,
        color: c.type === 'health' ? '#10B981' : '#38BDF8',
      });
    }

    return {
      tick: this.tick,
      timestampMs: Math.round((this.tick / 60) * 1000),
      entities,
    };
  }
}
