import {
  SpaceShooterState,
  WeaponType,
  Projectile,
  PowerUpItem,
  ShipSpec,
  TelemetryEvent,
} from '../types/game';
import { SHIP_SPECS } from './ShipConfigs';
import { Quadtree, SpatialItem } from './Quadtree';
import { ParticlePool } from './ParticlePool';
import { soundEngine } from './AudioEngine';
import { createPlayerProjectiles, getSynergyName } from './WeaponSystem';
import { SectorConfig, WaveEnemy, WaveAsteroid } from '../../server/waveDirector';

interface EnemyEntity {
  id: string;
  type: 'enemy_scout' | 'enemy_interceptor' | 'enemy_cruiser' | 'boss';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  radius: number;
  flightPath: string;
  fireCooldown: number;
  fireInterval: number;
  age: number;
  bossPhase?: number;
  grazedProjectiles: Set<string>;
}

interface AsteroidEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  rotation: number;
  vRot: number;
  shapeOffsets: number[];
}

export class SpaceShooterEngine {
  // Canvas & Context
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 1280;
  private height: number = 720;

  // Configuration & Ship
  public currentShip: ShipSpec;
  public sectorConfig: SectorConfig | null = null;
  public onStateUpdate: (state: SpaceShooterState) => void;
  public onGameOver: (finalStats: any) => void;

  // Decoupled Game Loop
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedDt: number = 1000 / 60; // 60Hz physics (16.666ms)

  // Subsystems
  private quadtree: Quadtree;
  public particlePool: ParticlePool;

  // Player State
  private player = {
    x: 640,
    y: 540,
    vx: 0,
    vy: 0,
    targetX: 640,
    targetY: 540,
    bankingAngle: 0,
    hull: 100,
    maxHull: 100,
    shield: 100,
    maxShield: 100,
    grazeMeter: 0,
    grazeStreak: 0,
    multiplier: 1.0,
    score: 0,
    isFiring: false,
    lastFireTime: 0,
    fireCooldown: 120, // ms
    activeSynergies: ['plasma_repeater'] as WeaponType[],
    invulnerableTimer: 0,
    dashTimer: 0,
    dashCooldownTimer: 0,
    empReady: false,
  };

  // Entities
  private playerProjectiles: Projectile[] = [];
  private enemyProjectiles: Projectile[] = [];
  private enemies: EnemyEntity[] = [];
  private asteroids: AsteroidEntity[] = [];
  private powerups: PowerUpItem[] = [];

  // Wave & Threat Progression
  private currentWaveIndex: number = 1;
  private waveStartTime: number = 0;
  private waveDurationMs: number = 30000;
  private waveSpawnQueue: { timeMs: number; item: any; kind: 'enemy' | 'asteroid' }[] = [];
  private threatLevel: SpaceShooterState['threatLevel'] = 'NOMINAL';

  // Screen Shake & Camera
  private screenShakeIntensity: number = 0;

  // Input State
  private keysDown: Set<string> = new Set();
  private mousePos = { x: 640, y: 540 };
  private isPointerDown: boolean = false;

  // Flight Recorder & Telemetry
  public telemetry: TelemetryEvent[] = [];
  private runStartTime: number = 0;
  private totalShotsFired: number = 0;
  private totalHitsLanded: number = 0;
  private totalGrazes: number = 0;
  private enemiesDestroyed: number = 0;
  private asteroidsShattered: number = 0;

  // Settings
  public settings = {
    screenShake: true,
    autoFire: false,
    soundFxVolume: 0.8,
    masterVolume: 0.8,
    sensitivity: 1.0,
  };

  // Parallax Stars
  private stars: { x: number; y: number; speed: number; size: number; color: string }[] = [];

  // Throttled HUD update
  private lastHudSyncTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    shipId: 'interceptor' | 'dreadnought' | 'scout',
    onStateUpdate: (state: SpaceShooterState) => void,
    onGameOver: (finalStats: any) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.currentShip = SHIP_SPECS[shipId];
    this.onStateUpdate = onStateUpdate;
    this.onGameOver = onGameOver;

    this.width = canvas.width || 1280;
    this.height = canvas.height || 720;

    this.quadtree = new Quadtree({ x: 0, y: 0, width: this.width, height: this.height });
    this.particlePool = new ParticlePool(1200);

    this.initStars();
    this.setupInputs();
    this.resetShipStats();
  }

  private initStars() {
    this.stars = [];
    const starColors = ['#4cd7f6', '#ffffff', '#ddb7ff', '#acedff'];
    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 0.4 + Math.random() * 2.8,
        size: Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 1.8 : 2.5,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
  }

  public setShip(shipId: 'interceptor' | 'dreadnought' | 'scout') {
    this.currentShip = SHIP_SPECS[shipId];
    this.resetShipStats();
  }

  private resetShipStats() {
    this.player.hull = this.currentShip.hull;
    this.player.maxHull = this.currentShip.hull;
    this.player.shield = this.currentShip.shield;
    this.player.maxShield = this.currentShip.shield;
    this.player.activeSynergies = [this.currentShip.primaryWeapon];
    this.player.grazeMeter = 0;
    this.player.grazeStreak = 0;
    this.player.multiplier = 1.0;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.quadtree = new Quadtree({ x: 0, y: 0, width, height });
    this.initStars();
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { passive: true });
    this.canvas.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    this.canvas.addEventListener('pointerup', this.handlePointerUp, { passive: true });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public cleanup() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysDown.add(e.code);

    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.togglePause();
      e.preventDefault();
      return;
    }

    if (e.code === 'Space') {
      // Space triggers EMP if charged, or fire
      if (this.player.empReady) {
        this.triggerEMP();
      } else {
        this.player.isFiring = true;
      }
      e.preventDefault();
      return;
    }

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.triggerDash();
      e.preventDefault();
      return;
    }

    if (e.code === 'KeyF') {
      this.triggerEMP();
      e.preventDefault();
      return;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.code);
    if (e.code === 'Space' && !this.settings.autoFire) {
      this.player.isFiring = false;
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    this.mousePos.x = (e.clientX - rect.left) * scaleX;
    this.mousePos.y = (e.clientY - rect.top) * scaleY;
  };

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button === 0) { // Left click
      this.isPointerDown = true;
      this.player.isFiring = true;
      soundEngine.resume();
    } else if (e.button === 2) { // Right click -> Phase Dash
      this.triggerDash();
      e.preventDefault();
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (e.button === 0) {
      this.isPointerDown = false;
      if (!this.settings.autoFire) {
        this.player.isFiring = false;
      }
    }
  };

  // Controls triggers
  public triggerDash() {
    if (this.player.dashCooldownTimer <= 0) {
      this.player.dashTimer = 220; // 220ms invulnerability + burst
      this.player.dashCooldownTimer = 1800; // 1.8s cooldown
      soundEngine.playDash();

      this.addScreenShake(8);
      this.particlePool.spawnEMPBlast(this.player.x, this.player.y, 60);

      this.recordTelemetry('dash', this.player.x, this.player.y);
    }
  }

  public triggerEMP() {
    if (this.player.grazeMeter >= 100 || this.player.empReady) {
      this.player.grazeMeter = 0;
      this.player.empReady = false;
      soundEngine.playEMP();
      this.addScreenShake(22);

      // EMP blast clears enemy bullets and inflicts heavy pulse damage
      this.particlePool.spawnEMPBlast(this.player.x, this.player.y, 450);
      this.particlePool.spawnFloatingText(this.player.x, this.player.y - 40, '💥 OVERDRIVE EMP DISCHARGE!', '#ddb7ff');

      // Clear all incoming enemy projectiles into scrap
      for (const proj of this.enemyProjectiles) {
        this.particlePool.spawnExplosion(proj.pos.x, proj.pos.y, 6, '#ddb7ff');
      }
      this.enemyProjectiles = [];

      // Damage all visible enemies
      for (const enemy of this.enemies) {
        enemy.hp -= 220;
        enemy.shield = Math.max(0, enemy.shield - 300);
        this.particlePool.spawnExplosion(enemy.x, enemy.y, 16, '#06b6d4');
      }

      this.recordTelemetry('emp', this.player.x, this.player.y);
    }
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    this.dispatchState(this.isPaused ? 'PAUSED' : 'PLAYING');
    return this.isPaused;
  }

  public start(sectorConfig: SectorConfig) {
    this.sectorConfig = sectorConfig;
    this.resetRun();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loadWave(1);
    this.loop(this.lastTime);
    this.dispatchState('PLAYING');
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private resetRun() {
    this.resetShipStats();
    this.player.x = this.width / 2;
    this.player.y = this.height * 0.78;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
    this.player.score = 0;
    this.player.multiplier = 1.0;
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.enemies = [];
    this.asteroids = [];
    this.powerups = [];
    this.telemetry = [];
    this.runStartTime = performance.now();
    this.totalShotsFired = 0;
    this.totalHitsLanded = 0;
    this.totalGrazes = 0;
    this.enemiesDestroyed = 0;
    this.asteroidsShattered = 0;
    this.currentWaveIndex = 1;
    this.particlePool.clear();
  }

  private loadWave(waveIndex: number) {
    if (!this.sectorConfig) return;
    this.currentWaveIndex = waveIndex;
    const wave = this.sectorConfig.waves.find((w) => w.waveIndex === waveIndex) || this.sectorConfig.waves[0];
    this.waveStartTime = performance.now();
    this.waveDurationMs = wave.durationMs;
    this.waveSpawnQueue = [];

    // Schedule wave enemies
    for (const enemy of wave.enemies) {
      this.waveSpawnQueue.push({
        timeMs: enemy.spawnDelayMs,
        item: enemy,
        kind: 'enemy',
      });
    }

    // Schedule asteroids
    for (const ast of wave.asteroids) {
      this.waveSpawnQueue.push({
        timeMs: ast.spawnDelayMs,
        item: ast,
        kind: 'asteroid',
      });
    }

    // Schedule Boss if present
    if (wave.boss) {
      this.threatLevel = 'TITAN DETECTED';
      soundEngine.playAlarm();
      this.particlePool.spawnFloatingText(
        this.width / 2,
        this.height / 3,
        `⚠️ WARNING: ${wave.boss.name} ENTERING SECTOR!`,
        '#ffb4ab'
      );

      const bossEntity: EnemyEntity = {
        id: `boss_${waveIndex}_${Date.now()}`,
        type: 'boss',
        x: this.width / 2,
        y: -120,
        vx: 0,
        vy: 1.2,
        hp: wave.boss.phases[0].maxHp,
        maxHp: wave.boss.phases[0].maxHp,
        shield: wave.boss.phases[0].maxShield,
        maxShield: wave.boss.phases[0].maxShield,
        radius: 72,
        flightPath: 'boss',
        fireCooldown: 800,
        fireInterval: 1400,
        age: 0,
        bossPhase: 0,
        grazedProjectiles: new Set(),
      };
      this.enemies.push(bossEntity);
    } else {
      this.threatLevel = waveIndex >= 7 ? 'CRITICAL' : waveIndex >= 4 ? 'ELEVATED' : 'NOMINAL';
    }
  }

  // Master loop with fixed timestep accumulator
  private loop = (time: number) => {
    if (!this.isRunning) return;

    const delta = Math.min(time - this.lastTime, 100); // Guard against giant delta jumps on tab blur
    this.lastTime = time;

    if (!this.isPaused) {
      this.accumulator += delta;
      while (this.accumulator >= this.fixedDt) {
        this.fixedUpdate(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
    }

    this.render();

    // Throttled HUD update to React
    if (time - this.lastHudSyncTime > 65) {
      this.lastHudSyncTime = time;
      this.dispatchState(this.player.hull <= 0 ? 'HULL_DESTROYED' : this.isPaused ? 'PAUSED' : 'PLAYING');
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  // Fixed 60Hz physics tick
  private fixedUpdate(dt: number) {
    const dtSeconds = dt / 1000;
    const now = performance.now();

    // 1. Adaptive Threat Director (Dynamic Difficulty Tuning)
    // If player dominates (high multiplier + full health), throttle enemy aggression up
    // If player is struggling (hull < 35%), deploy emergency shield capsule
    if (this.player.hull < 35 && Math.random() < 0.002 && this.powerups.length < 2) {
      this.spawnPowerup(this.width * (0.2 + Math.random() * 0.6), -20, 'health_restore', 'plasma_repeater');
    }

    // 2. Wave Director Queue Processing
    const waveElapsed = now - this.waveStartTime;
    for (let i = this.waveSpawnQueue.length - 1; i >= 0; i--) {
      const item = this.waveSpawnQueue[i];
      if (waveElapsed >= item.timeMs) {
        if (item.kind === 'enemy') {
          this.spawnEnemy(item.item);
        } else if (item.kind === 'asteroid') {
          this.spawnAsteroid(item.item);
        }
        this.waveSpawnQueue.splice(i, 1);
      }
    }

    // Check wave completion
    if (this.waveSpawnQueue.length === 0 && this.enemies.length === 0 && waveElapsed > 6000) {
      if (this.currentWaveIndex < (this.sectorConfig?.totalWaves || 10)) {
        this.loadWave(this.currentWaveIndex + 1);
        this.particlePool.spawnFloatingText(
          this.width / 2,
          this.height / 2,
          `WAVE ${this.currentWaveIndex} CLEARED!`,
          '#4edea3'
        );
        soundEngine.playPowerup();
      } else {
        // Sector Clear Victory!
        this.dispatchState('SECTOR_CLEAR');
        this.stop();
        if (this.onGameOver) {
          this.onGameOver(this.buildFinalStats(true));
        }
        return;
      }
    }

    // 3. Player Movement & Inertia
    this.updatePlayerMovement(dtSeconds);

    // 4. Player Weapon Firing
    if (this.player.isFiring || this.settings.autoFire) {
      const fireInterval = Math.max(70, this.player.fireCooldown - (this.player.grazeMeter / 100) * 45);
      if (now - this.player.lastFireTime >= fireInterval) {
        this.player.lastFireTime = now;
        this.firePlayerWeapon();
      }
    }

    // 5. Update Projectiles
    this.updateProjectiles();

    // 6. Update Enemies & AI
    this.updateEnemies(now);

    // 7. Update Asteroids
    this.updateAsteroids();

    // 8. Update Powerups
    this.updatePowerups();

    // 9. Spatial Partitioning Quadtree Rebuild & Collisions
    this.performCollisions();

    // 10. Update Particles & Camera Shake
    this.particlePool.update();
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - 0.7);
    }

    // 11. Graze Decay & Timers
    if (this.player.dashTimer > 0) {
      this.player.dashTimer -= dt;
    }
    if (this.player.dashCooldownTimer > 0) {
      this.player.dashCooldownTimer -= dt;
    }
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    // Overcharge status
    if (this.player.grazeMeter >= 100) {
      this.player.empReady = true;
    }

    // Shield passive regeneration (slow trickle if out of combat hit for 3 seconds)
    if (this.player.shield < this.player.maxShield && this.player.invulnerableTimer <= 0) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 0.04);
    }

    // Check player death
    if (this.player.hull <= 0) {
      this.handlePlayerDeath();
    }
  }

  private updatePlayerMovement(dtSeconds: number) {
    const speed = this.currentShip.speed * this.settings.sensitivity;
    let moveX = 0;
    let moveY = 0;

    // Keyboard inputs (WASD / Arrows)
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) moveX -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) moveX += 1;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) moveY -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) moveY += 1;

    // Normalizing diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    // If mouse control is active and moving towards pointer
    if (moveX === 0 && moveY === 0 && (this.isPointerDown || this.settings.autoFire)) {
      const dx = this.mousePos.x - this.player.x;
      const dy = this.mousePos.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        moveX = (dx / dist) * Math.min(1.0, dist / 80);
        moveY = (dy / dist) * Math.min(1.0, dist / 80);
      }
    }

    // Acceleration with damping
    const targetVx = moveX * speed * 42;
    const targetVy = moveY * speed * 42;
    this.player.vx += (targetVx - this.player.vx) * 0.22;
    this.player.vy += (targetVy - this.player.vy) * 0.22;

    this.player.x += this.player.vx * dtSeconds;
    this.player.y += this.player.vy * dtSeconds;

    // Boundary constraints
    const pad = 36;
    this.player.x = Math.max(pad, Math.min(this.width - pad, this.player.x));
    this.player.y = Math.max(pad + 60, Math.min(this.height - pad - 60, this.player.y));

    // Dynamic Banking Roll Angle
    const targetBank = (this.player.vx / (speed * 42)) * 0.35;
    this.player.bankingAngle += (targetBank - this.player.bankingAngle) * 0.15;

    // Spawn thruster trails
    if (Math.random() < 0.85) {
      const thrusterColor = this.player.grazeMeter >= 100 ? '#ddb7ff' : '#4cd7f6';
      this.particlePool.spawnThrusterFlame(this.player.x - 10, this.player.y + 24, this.player.vx * 0.1, 4, thrusterColor);
      this.particlePool.spawnThrusterFlame(this.player.x + 10, this.player.y + 24, this.player.vx * 0.1, 4, thrusterColor);
    }
  }

  private firePlayerWeapon() {
    const overchargeRatio = this.player.grazeMeter / 100;
    const newProjectiles = createPlayerProjectiles(
      this.player.x,
      this.player.y - 12,
      this.player.activeSynergies,
      overchargeRatio
    );

    this.playerProjectiles.push(...newProjectiles);
    this.totalShotsFired += newProjectiles.length;

    // Play appropriate synthesized laser audio
    const primary = this.player.activeSynergies[0] || 'plasma_repeater';
    if (primary === 'scatter_shot') soundEngine.playLaser('scatter');
    else if (primary === 'homing_missile') soundEngine.playLaser('missile');
    else if (primary === 'emp_beam') soundEngine.playLaser('emp');
    else soundEngine.playLaser('plasma');

    this.recordTelemetry('fire', this.player.x, this.player.y);
  }

  private updateProjectiles() {
    // 1. Player Projectiles
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];

      // Homing logic towards nearest enemy
      if (p.isHoming && this.enemies.length > 0) {
        let nearest: EnemyEntity | null = null;
        let minDistSq = Infinity;
        for (const e of this.enemies) {
          const dSq = (e.x - p.pos.x) ** 2 + (e.y - p.pos.y) ** 2;
          if (dSq < minDistSq) {
            minDistSq = dSq;
            nearest = e;
          }
        }
        if (nearest) {
          const targetAngle = Math.atan2(nearest.y - p.pos.y, nearest.x - p.pos.x);
          const currentAngle = Math.atan2(p.velocity.y, p.velocity.x);
          let diff = targetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), 0.14);
          const currentSpeed = 12;
          p.velocity.x = Math.cos(newAngle) * currentSpeed;
          p.velocity.y = Math.sin(newAngle) * currentSpeed;
        }

        // Particle smoke trail for missile
        if (Math.random() < 0.6) {
          this.particlePool.spawnParticle(p.pos.x, p.pos.y, -p.velocity.x * 0.2, -p.velocity.y * 0.2, '#4edea3', 2, 0.08);
        }
      }

      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;

      // Despawn off-screen
      if (p.pos.y < -30 || p.pos.x < -40 || p.pos.x > this.width + 40 || p.pos.y > this.height + 40) {
        this.playerProjectiles.splice(i, 1);
      }
    }

    // 2. Enemy Projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.pos.x += ep.velocity.x;
      ep.pos.y += ep.velocity.y;

      if (ep.pos.y > this.height + 50 || ep.pos.y < -50 || ep.pos.x < -50 || ep.pos.x > this.width + 50) {
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private updateEnemies(now: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.age += 1;

      // Flight patterns
      if (enemy.flightPath === 'sine') {
        enemy.y += enemy.vy;
        enemy.x += Math.sin(enemy.age * 0.06) * 3.8;
      } else if (enemy.flightPath === 'dive') {
        enemy.y += enemy.vy * (1 + (enemy.y / this.height) * 0.8);
      } else if (enemy.flightPath === 'pincer_left') {
        enemy.y += enemy.vy;
        enemy.x += 1.8;
      } else if (enemy.flightPath === 'pincer_right') {
        enemy.y += enemy.vy;
        enemy.x -= 1.8;
      } else if (enemy.flightPath === 'boss') {
        // Boss hovers in top third of screen
        if (enemy.y < 160) {
          enemy.y += 1.2;
        } else {
          enemy.x += Math.sin(enemy.age * 0.02) * 2.2;
        }
      } else {
        // Linear
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
      }

      // Enemy firing logic
      enemy.fireCooldown -= this.fixedDt;
      if (enemy.fireCooldown <= 0 && enemy.y > 20 && enemy.y < this.height * 0.7) {
        enemy.fireCooldown = enemy.fireInterval + Math.random() * 300;
        this.fireEnemyWeapon(enemy);
      }

      // Remove enemies that flew off bottom
      if (enemy.y > this.height + 60) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private fireEnemyWeapon(enemy: EnemyEntity) {
    if (enemy.type === 'boss') {
      // Boss fires 5-way spread or homing salvo
      const angles = [-0.4, -0.2, 0, 0.2, 0.4];
      for (const a of angles) {
        this.enemyProjectiles.push({
          id: `ep_boss_${Date.now()}_${Math.random()}`,
          source: 'enemy',
          pos: { x: enemy.x + a * 40, y: enemy.y + 40 },
          velocity: { x: Math.sin(a) * 4.5, y: Math.cos(a) * 4.5 },
          damage: 18,
          radius: 5,
          color: '#ffb4ab',
        });
      }
    } else if (enemy.type === 'enemy_cruiser') {
      // 3-way aimed spread
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const baseAngle = Math.atan2(dy, dx);
      for (const offset of [-0.25, 0, 0.25]) {
        this.enemyProjectiles.push({
          id: `ep_cruis_${Date.now()}_${Math.random()}`,
          source: 'enemy',
          pos: { x: enemy.x, y: enemy.y + 10 },
          velocity: { x: Math.cos(baseAngle + offset) * 5.2, y: Math.sin(baseAngle + offset) * 5.2 },
          damage: 14,
          radius: 4.5,
          color: '#ff8a80',
        });
      }
    } else {
      // Scout / Interceptor direct aimed laser
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const angle = Math.atan2(dy, dx);
      const speed = enemy.type === 'enemy_interceptor' ? 6.5 : 4.8;
      this.enemyProjectiles.push({
        id: `ep_shot_${Date.now()}_${Math.random()}`,
        source: 'enemy',
        pos: { x: enemy.x, y: enemy.y + 12 },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        damage: 12,
        radius: 3.5,
        color: '#ffb4ab',
      });
    }
  }

  private updateAsteroids() {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.rotation += ast.vRot;

      if (ast.y > this.height + ast.radius + 20) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  private updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pup = this.powerups[i];
      pup.pos.x += pup.velocity.x;
      pup.pos.y += pup.velocity.y;

      // Magnetism towards player when nearby
      const dx = this.player.x - pup.pos.x;
      const dy = this.player.y - pup.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        pup.velocity.x += (dx / dist) * 0.8;
        pup.velocity.y += (dy / dist) * 0.8;
      }

      if (pup.pos.y > this.height + 40) {
        this.powerups.splice(i, 1);
      }
    }
  }

  // Spatial Partitioning and Dual-Hitbox Collisions
  private performCollisions() {
    this.quadtree.clear();

    // 1. Insert Enemies & Asteroids into Quadtree
    for (const enemy of this.enemies) {
      this.quadtree.insert({
        id: enemy.id,
        x: enemy.x,
        y: enemy.y,
        radius: enemy.radius,
        type: 'enemy',
        data: enemy,
      });
    }

    for (const ast of this.asteroids) {
      this.quadtree.insert({
        id: ast.id,
        x: ast.x,
        y: ast.y,
        radius: ast.radius,
        type: 'asteroid',
        data: ast,
      });
    }

    // 2. Check Player Projectiles vs Enemies & Asteroids
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const proj = this.playerProjectiles[i];
      const hits = this.quadtree.queryCircle(proj.pos.x, proj.pos.y, proj.radius);

      let projectileConsumed = false;
      for (const target of hits) {
        if (target.type === 'enemy') {
          const enemy = target.data as EnemyEntity;
          this.totalHitsLanded++;

          // Shield absorption first
          if (enemy.shield > 0) {
            enemy.shield -= proj.damage;
            this.particlePool.spawnExplosion(proj.pos.x, proj.pos.y, 4, '#06b6d4');
          } else {
            enemy.hp -= proj.damage;
            this.particlePool.spawnExplosion(proj.pos.x, proj.pos.y, 6, '#ff8a80');
          }

          // Synergy perk: Cluster swarm splits into micro homing rockets on hit!
          if (proj.weaponType === 'plasma_repeater' && this.player.activeSynergies.includes('homing_missile')) {
            this.playerProjectiles.push({
              id: `p_swarm_${Date.now()}_${Math.random()}`,
              source: 'player',
              pos: { x: proj.pos.x, y: proj.pos.y },
              velocity: { x: (Math.random() - 0.5) * 6, y: -8 },
              damage: 12,
              radius: 3.5,
              color: '#4edea3',
              isHoming: true,
              spawnTime: performance.now(),
              lifeMs: 2500,
            });
          }

          this.recordTelemetry('hit', proj.pos.x, proj.pos.y, enemy.id);

          // Enemy destruction
          if (enemy.hp <= 0) {
            this.handleEnemyDestroyed(enemy);
          }

          projectileConsumed = true;
          break;
        } else if (target.type === 'asteroid') {
          const ast = target.data as AsteroidEntity;
          ast.hp -= proj.damage;
          this.totalHitsLanded++;
          this.particlePool.spawnExplosion(proj.pos.x, proj.pos.y, 5, '#869397');

          if (ast.hp <= 0) {
            this.handleAsteroidDestroyed(ast);
          }
          projectileConsumed = true;
          break;
        }
      }

      if (projectileConsumed) {
        this.playerProjectiles.splice(i, 1);
      }
    }

    // 3. Dual-Hitbox Player Geometry: Micro Core Hitbox (4px) vs Concentric Graze Ring (24px)
    const playerCore = this.currentShip.coreRadius;
    const playerGraze = this.currentShip.grazeRadius;
    const isDashing = this.player.dashTimer > 0;

    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      const dx = ep.pos.x - this.player.x;
      const dy = ep.pos.y - this.player.y;
      const distSq = dx * dx + dy * dy;

      // Lethal Core Hitbox Check
      const lethalRadius = playerCore + ep.radius;
      if (distSq <= lethalRadius * lethalRadius) {
        if (!isDashing && this.player.invulnerableTimer <= 0) {
          this.damagePlayer(ep.damage);
        }
        this.particlePool.spawnExplosion(ep.pos.x, ep.pos.y, 8, '#ffb4ab');
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // Graze Ring Check
      const grazeRadius = playerGraze + ep.radius;
      if (distSq <= grazeRadius * grazeRadius) {
        // Graze spark
        this.registerGraze(ep.pos.x, ep.pos.y);
      }
    }

    // 4. Asteroid vs Player Hull & Graze Check
    for (const ast of this.asteroids) {
      const dx = ast.x - this.player.x;
      const dy = ast.y - this.player.y;
      const distSq = dx * dx + dy * dy;

      // Core collision
      const lethalRadius = playerCore + ast.radius;
      if (distSq <= lethalRadius * lethalRadius) {
        if (!isDashing && this.player.invulnerableTimer <= 0) {
          this.damagePlayer(35);
        }
        ast.hp = 0;
        this.handleAsteroidDestroyed(ast);
        continue;
      }

      // Graze
      const grazeRadius = playerGraze + ast.radius;
      if (distSq <= grazeRadius * grazeRadius && Math.random() < 0.25) {
        this.registerGraze(this.player.x + (dx / Math.sqrt(distSq)) * playerGraze, this.player.y + (dy / Math.sqrt(distSq)) * playerGraze);
      }
    }

    // 5. PowerUp Collection Check
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pup = this.powerups[i];
      const dx = pup.pos.x - this.player.x;
      const dy = pup.pos.y - this.player.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= (playerGraze + pup.radius) ** 2) {
        this.collectPowerup(pup);
        this.powerups.splice(i, 1);
      }
    }
  }

  private registerGraze(sparkX: number, sparkY: number) {
    this.totalGrazes++;
    this.player.grazeStreak++;
    this.player.grazeMeter = Math.min(100, this.player.grazeMeter + 3.2);

    // Multiplier builds up to x4.0 during consecutive grazing
    this.player.multiplier = Math.min(4.0, 1.0 + Math.floor(this.player.grazeStreak / 10) * 0.5);

    // Award score
    const grazePts = Math.round(150 * this.player.multiplier);
    this.player.score += grazePts;

    // Visuals & Sound
    this.particlePool.spawnGrazeSparks(sparkX, sparkY);
    soundEngine.playGraze(this.player.grazeStreak);

    if (this.player.grazeMeter >= 100 && !this.player.empReady) {
      this.player.empReady = true;
      this.particlePool.spawnFloatingText(this.player.x, this.player.y - 35, '⚡ OVERCHARGE READY [SPACE / EMP]', '#ddb7ff');
    }

    this.recordTelemetry('graze', sparkX, sparkY);
  }

  private damagePlayer(amount: number) {
    soundEngine.playExplosion(false);
    this.addScreenShake(14);
    this.player.invulnerableTimer = 600; // 600ms grace period
    this.player.grazeStreak = 0;
    this.player.multiplier = 1.0;

    // Shield takes impact first
    if (this.player.shield > 0) {
      if (this.player.shield >= amount) {
        this.player.shield -= amount;
      } else {
        const leftover = amount - this.player.shield;
        this.player.shield = 0;
        this.player.hull = Math.max(0, this.player.hull - leftover);
        soundEngine.playAlarm();
        this.particlePool.spawnFloatingText(this.player.x, this.player.y - 30, '⚠️ SHIELD BREACH!', '#ffb4ab');
      }
    } else {
      this.player.hull = Math.max(0, this.player.hull - amount);
      soundEngine.playAlarm();
    }
  }

  private handleEnemyDestroyed(enemy: EnemyEntity) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
    this.enemiesDestroyed++;
    const isBoss = enemy.type === 'boss';
    soundEngine.playExplosion(isBoss);
    this.addScreenShake(isBoss ? 20 : 6);
    this.particlePool.spawnExplosion(enemy.x, enemy.y, isBoss ? 50 : 20, isBoss ? '#ffb4ab' : '#06b6d4');

    const basePts = isBoss ? 50000 : enemy.type === 'enemy_cruiser' ? 4500 : enemy.type === 'enemy_interceptor' ? 1800 : 800;
    const awarded = Math.round(basePts * this.player.multiplier);
    this.player.score += awarded;
    this.particlePool.spawnFloatingText(enemy.x, enemy.y, `+${awarded.toLocaleString()}`, '#4cd7f6');

    // Powerup drop chance
    const dropRoll = Math.random();
    if (isBoss || dropRoll < 0.28) {
      const weaponOptions: WeaponType[] = ['plasma_repeater', 'scatter_shot', 'homing_missile', 'emp_beam'];
      const chosenTag = weaponOptions[Math.floor(Math.random() * weaponOptions.length)];
      const type = dropRoll < 0.12 ? 'health_restore' : dropRoll < 0.2 ? 'shield_boost' : 'weapon_upgrade';
      this.spawnPowerup(enemy.x, enemy.y, type, chosenTag);
    }
  }

  private handleAsteroidDestroyed(ast: AsteroidEntity) {
    const idx = this.asteroids.indexOf(ast);
    if (idx !== -1) {
      this.asteroids.splice(idx, 1);
    }
    this.asteroidsShattered++;
    soundEngine.playExplosion(false);
    this.particlePool.spawnExplosion(ast.x, ast.y, 14, '#869397');
    this.player.score += Math.round(300 * this.player.multiplier);

    // Shatter into small mineral scrap collectible
    if (Math.random() < 0.4) {
      this.spawnPowerup(ast.x, ast.y, 'overcharge_cell', 'plasma_repeater');
    }
  }

  private spawnEnemy(config: WaveEnemy) {
    const enemy: EnemyEntity = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      type: config.type,
      x: config.xRatio * this.width,
      y: -40,
      vx: 0,
      vy: config.speed,
      hp: config.hp,
      maxHp: config.hp,
      shield: config.type === 'enemy_cruiser' ? 80 : 0,
      maxShield: config.type === 'enemy_cruiser' ? 80 : 0,
      radius: config.type === 'enemy_cruiser' ? 36 : config.type === 'enemy_interceptor' ? 22 : 18,
      flightPath: config.flightPath,
      fireCooldown: 400 + Math.random() * 600,
      fireInterval: config.fireRateMs,
      age: 0,
      grazedProjectiles: new Set(),
    };
    this.enemies.push(enemy);
  }

  private spawnAsteroid(config: WaveAsteroid) {
    const radius = config.size === 'small' ? 16 : config.size === 'medium' ? 28 : 46;
    const offsets = [];
    for (let i = 0; i < 8; i++) {
      offsets.push(0.8 + Math.random() * 0.4);
    }

    const ast: AsteroidEntity = {
      id: `ast_${Date.now()}_${Math.random()}`,
      x: config.xRatio * this.width,
      y: -50,
      vx: config.vx,
      vy: config.vy,
      radius,
      hp: config.hp,
      maxHp: config.hp,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.04,
      shapeOffsets: offsets,
    };
    this.asteroids.push(ast);
  }

  private spawnPowerup(x: number, y: number, type: PowerUpItem['type'], synergyTag: WeaponType) {
    this.powerups.push({
      id: `pup_${Date.now()}_${Math.random()}`,
      pos: { x, y },
      velocity: { x: (Math.random() - 0.5) * 1.5, y: 1.8 },
      type,
      synergyTag,
      radius: 14,
    });
  }

  private collectPowerup(pup: PowerUpItem) {
    soundEngine.playPowerup();

    if (pup.type === 'health_restore') {
      this.player.hull = Math.min(this.player.maxHull, this.player.hull + 30);
      this.particlePool.spawnFloatingText(this.player.x, this.player.y - 25, '+30 HULL RESTORED', '#4edea3');
    } else if (pup.type === 'shield_boost') {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 40);
      this.particlePool.spawnFloatingText(this.player.x, this.player.y - 25, '+40 SHIELD BOOST', '#06b6d4');
    } else if (pup.type === 'overcharge_cell') {
      this.player.grazeMeter = Math.min(100, this.player.grazeMeter + 25);
      this.particlePool.spawnFloatingText(this.player.x, this.player.y - 25, '+25% OVERCHARGE', '#ddb7ff');
    } else {
      // Weapon upgrade / fusion
      if (!this.player.activeSynergies.includes(pup.synergyTag)) {
        this.player.activeSynergies.push(pup.synergyTag);
      }
      const synergy = getSynergyName(this.player.activeSynergies);
      this.particlePool.spawnFloatingText(this.player.x, this.player.y - 35, `⚡ FUSION: ${synergy.name}`, synergy.color);
    }

    this.recordTelemetry('powerup_collect', pup.pos.x, pup.pos.y);
  }

  private addScreenShake(amount: number) {
    if (this.settings.screenShake) {
      this.screenShakeIntensity = Math.min(28, this.screenShakeIntensity + amount);
    }
  }

  private recordTelemetry(action: TelemetryEvent['action'], x: number, y: number, hitTargetId?: string) {
    this.telemetry.push({
      timeMs: Math.round(performance.now() - this.runStartTime),
      action,
      x: Math.round(x),
      y: Math.round(y),
      hitTargetId,
    });
    // Keep telemetry buffer bounded if game runs very long
    if (this.telemetry.length > 5000) {
      this.telemetry.splice(0, 500);
    }
  }

  private handlePlayerDeath() {
    this.stop();
    soundEngine.playExplosion(true);
    this.particlePool.spawnExplosion(this.player.x, this.player.y, 60, '#ff5252');
    this.dispatchState('HULL_DESTROYED');

    if (this.onGameOver) {
      this.onGameOver(this.buildFinalStats(false));
    }
  }

  private buildFinalStats(isClear: boolean) {
    const durationMs = Math.round(performance.now() - this.runStartTime);
    const accuracy = this.totalShotsFired > 0 ? Math.min(100, Math.round((this.totalHitsLanded / this.totalShotsFired) * 100)) : 100;
    return {
      sectorSeed: this.sectorConfig?.seed || 12345,
      sectorName: this.sectorConfig?.sectorName || 'Zenith Sector',
      shipId: this.currentShip.id,
      score: this.player.score,
      durationMs,
      waveReached: this.currentWaveIndex,
      totalWaves: this.sectorConfig?.totalWaves || 10,
      grazes: this.totalGrazes,
      accuracy,
      totalShots: this.totalShotsFired,
      totalHits: this.totalHitsLanded,
      activeSynergies: [...this.player.activeSynergies],
      isClear,
      telemetry: [...this.telemetry],
    };
  }

  private dispatchState(status: SpaceShooterState['status']) {
    const accuracy = this.totalShotsFired > 0 ? Math.min(100, Math.round((this.totalHitsLanded / this.totalShotsFired) * 100)) : 100;
    this.onStateUpdate({
      status,
      sectorId: this.sectorConfig?.sectorId || 'daily',
      sectorName: this.sectorConfig?.sectorName || 'Daily Sector',
      score: this.player.score,
      multiplier: this.player.multiplier,
      hull: Math.round(this.player.hull),
      maxHull: this.player.maxHull,
      shield: Math.round(this.player.shield),
      maxShield: this.player.maxShield,
      grazeMeter: Math.round(this.player.grazeMeter),
      grazeStreak: this.player.grazeStreak,
      activeSynergies: [...this.player.activeSynergies],
      currentWave: this.currentWaveIndex,
      totalWaves: this.sectorConfig?.totalWaves || 10,
      threatLevel: this.threatLevel,
      dashCooldown: Math.max(0, this.player.dashCooldownTimer / 1800),
      empReady: this.player.empReady,
      stats: {
        totalShots: this.totalShotsFired,
        hitsLanded: this.totalHitsLanded,
        totalGrazes: this.totalGrazes,
        enemiesDestroyed: this.enemiesDestroyed,
        asteroidsShattered: this.asteroidsShattered,
        durationMs: Math.round(performance.now() - this.runStartTime),
      },
      settings: { ...this.settings },
    });
  }

  // Canvas Render Loop
  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake Transform
    if (this.screenShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Background Clear & Deep Stellar Gradient
    ctx.fillStyle = '#080e1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle radial nebulae glow
    const grad = ctx.createRadialGradient(this.width * 0.5, this.height * 0.4, 40, this.width * 0.5, this.height * 0.4, this.width * 0.75);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
    grad.addColorStop(0.6, 'rgba(199, 141, 255, 0.04)');
    grad.addColorStop(1, 'rgba(8, 14, 26, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Parallax Starfield
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // 3. Render Asteroids
    for (const ast of this.asteroids) {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);
      ctx.strokeStyle = '#869397';
      ctx.fillStyle = '#161c28';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = ast.radius * ast.shapeOffsets[i];
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Interior crag lines
      ctx.strokeStyle = 'rgba(134, 147, 151, 0.3)';
      ctx.beginPath();
      ctx.moveTo(-ast.radius * 0.4, -ast.radius * 0.3);
      ctx.lineTo(ast.radius * 0.3, ast.radius * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render Powerups
    for (const pup of this.powerups) {
      ctx.save();
      ctx.translate(pup.pos.x, pup.pos.y);
      const isHp = pup.type === 'health_restore';
      const isShield = pup.type === 'shield_boost';
      const isOvercharge = pup.type === 'overcharge_cell';
      const color = isHp ? '#4edea3' : isShield ? '#06b6d4' : isOvercharge ? '#c78dff' : '#f59e0b';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(22, 28, 40, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, pup.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isHp ? '+HP' : isShield ? '+SH' : isOvercharge ? '⚡' : 'MOD', 0, 0);
      ctx.restore();
    }

    // 5. Render Enemies
    for (const enemy of this.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      if (enemy.type === 'boss') {
        // Boss Battlecruiser Silhouette
        ctx.fillStyle = '#161c28';
        ctx.strokeStyle = '#ffb4ab';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(60, 20);
        ctx.lineTo(80, 50);
        ctx.lineTo(30, 60);
        ctx.lineTo(0, 70);
        ctx.lineTo(-30, 60);
        ctx.lineTo(-80, 50);
        ctx.lineTo(-60, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing boss core
        ctx.fillStyle = '#93000a';
        ctx.beginPath();
        ctx.arc(0, 15, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffb4ab';
        ctx.beginPath();
        ctx.arc(0, 15, 7, 0, Math.PI * 2);
        ctx.fill();

        // Health bar above boss
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-60, -65, 120, 8);
        ctx.fillStyle = '#ff5252';
        ctx.fillRect(-60, -65, 120 * hpPercent, 8);
        ctx.strokeStyle = '#ffb4ab';
        ctx.strokeRect(-60, -65, 120, 8);
      } else {
        // Interceptor / Scout
        ctx.fillStyle = '#242a36';
        ctx.strokeStyle = enemy.type === 'enemy_cruiser' ? '#f59e0b' : '#ffb4ab';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, enemy.radius);
        ctx.lineTo(enemy.radius, -enemy.radius * 0.7);
        ctx.lineTo(0, -enemy.radius * 0.3);
        ctx.lineTo(-enemy.radius, -enemy.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Render Projectiles
    // Player lasers
    for (const p of this.playerProjectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Enemy lasers
    for (const ep of this.enemyProjectiles) {
      ctx.save();
      ctx.fillStyle = ep.color;
      ctx.shadowColor = ep.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ep.pos.x, ep.pos.y, ep.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Render Player Ship & Dual-Hitbox Geometry
    if (this.player.hull > 0) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.player.bankingAngle);

      // A. Concentric Graze Ring (Outer Proximity Zone)
      const grazeRadius = this.currentShip.grazeRadius;
      ctx.strokeStyle = this.player.grazeMeter >= 100 ? 'rgba(221, 183, 255, 0.7)' : 'rgba(76, 215, 246, 0.45)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, grazeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // B. Ship Hull Graphics
      ctx.fillStyle = '#161c28';
      ctx.strokeStyle = '#4cd7f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(16, 8);
      ctx.lineTo(26, 20);
      ctx.lineTo(12, 18);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 18);
      ctx.lineTo(-26, 20);
      ctx.lineTo(-16, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Glow
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(6, -4);
      ctx.lineTo(0, 2);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();

      // C. Micro-Hitbox (Lethal Core 4px indicator)
      ctx.fillStyle = '#ff5252';
      ctx.shadowColor = '#ff5252';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, this.currentShip.coreRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 8. Render Particles & Floating Combat Text
    this.particlePool.render(ctx);

    ctx.restore();
  }
}
