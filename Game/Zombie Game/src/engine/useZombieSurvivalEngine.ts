import { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZombieSurvivalGameState,
  WeaponEntity,
  ZombieEntity,
  ProjectileEntity,
  ParticleEntity,
  BloodDecalEntity,
  DamageNumberEntity,
  ScrapDropEntity,
  BarricadeEntity,
  FloodlightEntity,
  TripwireEntity,
  TelemetryEvent,
  WaveConfig,
  ZombieArchetype,
  ElementalType,
} from '../types/game';
import { INITIAL_WEAPONS, applyUpgradeToWeapon, WeaponUpgrade } from './weapons';
import { createZombie, ZOMBIE_SPECS } from './zombies';
import { createInitialBarricades, createInitialFloodlights } from './fortifications';
import { SpatialHashGrid } from './spatialGrid';
import { projectilePool, particlePool, damageNumberPool } from './pool';
import { renderLightingMask, isPointIlluminated } from './lighting';
import { sound } from './audio';
import { generateWaveConfig, getDailySeedString } from '../../server/seedDirector';

export interface EngineSettings {
  masterVolume: number;
  sfxVolume: number;
  screenShake: number; // 0 to 1
  autoAim: boolean;
  crosshairColor: string;
}

export function useZombieSurvivalEngine(customSeed?: string) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Settings Ref & State
  const [settings, setSettings] = useState<EngineSettings>({
    masterVolume: 0.8,
    sfxVolume: 0.8,
    screenShake: 0.7,
    autoAim: false,
    crosshairColor: '#F59E0B',
  });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Run seed
  const runSeed = customSeed || getDailySeedString();

  // Arena Dimensions
  const ARENA_WIDTH = 2000;
  const ARENA_HEIGHT = 1500;

  // React State for HUD (throttled updates)
  const [hudState, setHudState] = useState<ZombieSurvivalGameState>({
    status: 'IDLE',
    seed: runSeed,
    currentWave: 1,
    enemiesRemaining: 0,
    totalEnemiesInWave: 0,
    isBlackout: false,
    blackoutTimerMs: 0,
    player: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      armor: 50,
      maxArmor: 100,
      scrap: 200, // Starter scrap for test & upgrades
      weapons: JSON.parse(JSON.stringify(INITIAL_WEAPONS)),
      activeWeaponIndex: 0,
      isFiring: false,
      activeReload: {
        isReloading: false,
        progress: 0,
        durationMs: 0,
        startTime: 0,
        sweetSpotStart: 0.4,
        sweetSpotEnd: 0.65,
        success: null,
      },
    },
    barricades: createInitialBarricades(ARENA_WIDTH, ARENA_HEIGHT),
    floodlights: createInitialFloodlights(ARENA_WIDTH, ARENA_HEIGHT),
    tripwires: [],
    stats: {
      totalKills: 0,
      killsByType: {
        walker: 0,
        sprinter: 0,
        spitter: 0,
        brute: 0,
        screamer: 0,
      },
      shotsFired: 0,
      shotsHit: 0,
      timeSurvivedMs: 0,
      causeOfDeath: 'Active Operation',
    },
  });

  // Mutable Game Simulation Reference (never causes 60 FPS React re-renders)
  const sim = useRef<{
    status: ZombieSurvivalGameState['status'];
    seed: string;
    currentWave: number;
    waveConfig: WaveConfig;
    enemiesToSpawn: ZombieArchetype[];
    spawnTimerMs: number;
    isBlackout: boolean;
    blackoutTimerMs: number;
    blackoutFlicker: number;
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      speed: number;
      angle: number;
      hp: number;
      maxHp: number;
      armor: number;
      maxArmor: number;
      scrap: number;
      weapons: WeaponEntity[];
      activeWeaponIndex: number;
      isFiring: boolean;
      lastShotTime: number;
      kickbackX: number;
      kickbackY: number;
      invulnerableTimer: number;
      activeReload: {
        isReloading: boolean;
        progress: number;
        durationMs: number;
        startTime: number;
        sweetSpotStart: number;
        sweetSpotEnd: number;
        success: boolean | null;
      };
    };
    camera: {
      x: number;
      y: number;
      shakeX: number;
      shakeY: number;
      shakeMagnitude: number;
    };
    mouse: {
      screenX: number;
      screenY: number;
      worldX: number;
      worldY: number;
      isDown: boolean;
    };
    keys: Record<string, boolean>;
    zombies: ZombieEntity[];
    projectiles: ProjectileEntity[];
    particles: ParticleEntity[];
    bloodDecals: BloodDecalEntity[];
    damageNumbers: DamageNumberEntity[];
    scrapDrops: ScrapDropEntity[];
    barricades: BarricadeEntity[];
    floodlights: FloodlightEntity[];
    tripwires: TripwireEntity[];
    spatialGrid: SpatialHashGrid<any>;
    telemetry: TelemetryEvent[];
    stats: ZombieSurvivalGameState['stats'];
    crosshairBloom: number;
    muzzleFlashTimer: number;
    waveStartTime: number;
    totalSurvivalTimeMs: number;
  }>({
    status: 'IDLE',
    seed: runSeed,
    currentWave: 1,
    waveConfig: generateWaveConfig(runSeed, 1),
    enemiesToSpawn: [],
    spawnTimerMs: 0,
    isBlackout: false,
    blackoutTimerMs: 0,
    blackoutFlicker: 0,
    player: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      vx: 0,
      vy: 0,
      speed: 260,
      angle: 0,
      hp: 100,
      maxHp: 100,
      armor: 50,
      maxArmor: 100,
      scrap: 200,
      weapons: JSON.parse(JSON.stringify(INITIAL_WEAPONS)),
      activeWeaponIndex: 0,
      isFiring: false,
      lastShotTime: 0,
      kickbackX: 0,
      kickbackY: 0,
      invulnerableTimer: 0,
      activeReload: {
        isReloading: false,
        progress: 0,
        durationMs: 0,
        startTime: 0,
        sweetSpotStart: 0.4,
        sweetSpotEnd: 0.65,
        success: null,
      },
    },
    camera: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      shakeX: 0,
      shakeY: 0,
      shakeMagnitude: 0,
    },
    mouse: {
      screenX: 0,
      screenY: 0,
      worldX: ARENA_WIDTH / 2,
      worldY: ARENA_HEIGHT / 2,
      isDown: false,
    },
    keys: {},
    zombies: [],
    projectiles: [],
    particles: [],
    bloodDecals: [],
    damageNumbers: [],
    scrapDrops: [],
    barricades: createInitialBarricades(ARENA_WIDTH, ARENA_HEIGHT),
    floodlights: createInitialFloodlights(ARENA_WIDTH, ARENA_HEIGHT),
    tripwires: [],
    spatialGrid: new SpatialHashGrid(110),
    telemetry: [],
    stats: {
      totalKills: 0,
      killsByType: {
        walker: 0,
        sprinter: 0,
        spitter: 0,
        brute: 0,
        screamer: 0,
      },
      shotsFired: 0,
      shotsHit: 0,
      timeSurvivedMs: 0,
      causeOfDeath: 'Active Operation',
    },
    crosshairBloom: 0,
    muzzleFlashTimer: 0,
    waveStartTime: Date.now(),
    totalSurvivalTimeMs: 0,
  });

  // Sync settings audio
  useEffect(() => {
    sound.setMasterVolume(settings.masterVolume);
    sound.setSfxVolume(settings.sfxVolume);
  }, [settings.masterVolume, settings.sfxVolume]);

  // Add Screen Shake
  const addCameraShake = useCallback((magnitude: number) => {
    const finalMag = magnitude * settingsRef.current.screenShake;
    sim.current.camera.shakeMagnitude = Math.min(sim.current.camera.shakeMagnitude + finalMag, 25);
  }, []);

  // Trigger Active Reload
  const triggerReload = useCallback(() => {
    const s = sim.current;
    if (s.status !== 'WAVE_ACTIVE' && s.status !== 'WAVE_INTERMISSION') return;
    const currentWeapon = s.player.weapons[s.player.activeWeaponIndex];
    if (!currentWeapon) return;

    // Already at full clip?
    if (currentWeapon.currentAmmo === currentWeapon.clipSize && !s.player.activeReload.isReloading) {
      return;
    }

    // If currently reloading -> Attempt Active Reload Sweet-Spot Check!
    if (s.player.activeReload.isReloading) {
      const { progress, sweetSpotStart, sweetSpotEnd } = s.player.activeReload;
      if (progress >= sweetSpotStart && progress <= sweetSpotEnd) {
        // SUCCESS!
        s.player.activeReload.success = true;
        s.player.activeReload.isReloading = false;
        currentWeapon.currentAmmo = currentWeapon.clipSize;
        sound.playActiveReloadSweetSpot();

        // Spawn tactical reload floater
        const dn = damageNumberPool.obtain();
        dn.text = 'PERFECT RELOAD! +40% SPEED';
        dn.x = s.player.x;
        dn.y = s.player.y - 35;
        dn.color = '#10B981';
        s.damageNumbers.push(dn);
      } else {
        // MISSED / JAMMED
        s.player.activeReload.success = false;
        s.player.activeReload.durationMs += 350; // penalty
        sound.playActiveReloadFail();

        const dn = damageNumberPool.obtain();
        dn.text = 'JAMMED!';
        dn.x = s.player.x;
        dn.y = s.player.y - 35;
        dn.color = '#EF4444';
        s.damageNumbers.push(dn);
      }
      return;
    }

    // Start New Reload Cycle
    s.player.activeReload = {
      isReloading: true,
      progress: 0,
      durationMs: currentWeapon.reloadTimeMs,
      startTime: Date.now(),
      sweetSpotStart: 0.38,
      sweetSpotEnd: 0.65,
      success: null,
    };
    sound.playReloadStart();
  }, []);

  // Start Wave
  const startNextWave = useCallback(() => {
    const s = sim.current;
    const nextWaveNum = s.status === 'IDLE' ? 1 : s.currentWave + 1;
    s.currentWave = nextWaveNum;
    s.waveConfig = generateWaveConfig(s.seed, nextWaveNum);

    // Prepare enemy spawn queue
    const queue: ZombieArchetype[] = [];
    const comp = s.waveConfig.composition;
    for (const [type, count] of Object.entries(comp)) {
      for (let i = 0; i < count; i++) {
        queue.push(type as ZombieArchetype);
      }
    }
    // Shuffle spawn queue
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    s.enemiesToSpawn = queue;
    s.status = 'WAVE_ACTIVE';
    s.isBlackout = s.waveConfig.hasBlackout;
    s.blackoutTimerMs = s.isBlackout ? 25000 : 0;

    if (s.isBlackout) {
      sound.playBlackoutAlarm();
    } else {
      sound.playWaveSiren();
    }
  }, []);

  // Upgrade Weapon in Scrap Forge
  const upgradeWeapon = useCallback((weaponIndex: number, upgrade: WeaponUpgrade): boolean => {
    const s = sim.current;
    if (s.player.scrap < upgrade.cost) return false;
    const targetWeapon = s.player.weapons[weaponIndex];
    if (!targetWeapon) return false;

    s.player.scrap -= upgrade.cost;
    s.player.weapons[weaponIndex] = applyUpgradeToWeapon(targetWeapon, upgrade);
    sound.playFortify();
    return true;
  }, []);

  // Repair Barricade
  const repairBarricade = useCallback((barricadeId: string): boolean => {
    const s = sim.current;
    const cost = 40;
    if (s.player.scrap < cost) return false;
    const barricade = s.barricades.find((b) => b.id === barricadeId);
    if (!barricade || barricade.health >= barricade.maxHealth) return false;

    s.player.scrap -= cost;
    barricade.health = Math.min(barricade.maxHealth, barricade.health + 80);
    sound.playFortify();
    return true;
  }, []);

  // Deploy Floodlight
  const deployFloodlight = useCallback((): boolean => {
    const s = sim.current;
    const cost = 120;
    if (s.player.scrap < cost) return false;

    s.player.scrap -= cost;
    s.floodlights.push({
      id: `floodlight_${Date.now()}`,
      x: s.player.x,
      y: s.player.y,
      radius: 200,
      angle: s.player.angle,
      fov: Math.PI * 2,
      active: true,
    });
    sound.playFortify();
    return true;
  }, []);

  // Deploy Tripwire
  const deployTripwire = useCallback((): boolean => {
    const s = sim.current;
    const cost = 60;
    if (s.player.scrap < cost) return false;

    s.player.scrap -= cost;
    s.tripwires.push({
      id: `tripwire_${Date.now()}`,
      x: s.player.x,
      y: s.player.y,
      radius: 40,
      damage: 180,
      elemental: 'incendiary',
      armed: true,
    });
    sound.playFortify();
    return true;
  }, []);

  // Switch Active Weapon
  const switchWeapon = useCallback((index: number) => {
    const s = sim.current;
    if (index >= 0 && index < s.player.weapons.length) {
      s.player.activeWeaponIndex = index;
      s.player.activeReload.isReloading = false; // cancel ongoing reload
      sound.playReloadStart();
    }
  }, []);

  // --------------------------------------------------------------------------
  // CORE PHYSICS LOOP & SIMULATION UPDATE (Fixed 60Hz delta)
  // --------------------------------------------------------------------------
  const updateSimulation = useCallback((dt: number) => {
    const s = sim.current;
    if (s.status !== 'WAVE_ACTIVE' && s.status !== 'WAVE_INTERMISSION') return;

    s.totalSurvivalTimeMs += dt * 1000;
    s.stats.timeSurvivedMs = s.totalSurvivalTimeMs;

    // 1. Blackout timer
    if (s.isBlackout && s.blackoutTimerMs > 0) {
      s.blackoutTimerMs -= dt * 1000;
      if (s.blackoutTimerMs <= 0) {
        s.isBlackout = false;
      }
    }

    // 2. Player Input & Kinematic Movement
    let moveX = 0;
    let moveY = 0;
    if (s.keys['KeyW'] || s.keys['ArrowUp']) moveY -= 1;
    if (s.keys['KeyS'] || s.keys['ArrowDown']) moveY += 1;
    if (s.keys['KeyA'] || s.keys['ArrowLeft']) moveX -= 1;
    if (s.keys['KeyD'] || s.keys['ArrowRight']) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    const accel = 1400;
    const friction = 0.82;
    s.player.vx += moveX * accel * dt;
    s.player.vy += moveY * accel * dt;
    s.player.vx *= friction;
    s.player.vy *= friction;

    // Apply kickback damping
    s.player.kickbackX *= 0.75;
    s.player.kickbackY *= 0.75;

    // Proposed new position
    let newPx = s.player.x + (s.player.vx + s.player.kickbackX) * dt;
    let newPy = s.player.y + (s.player.vy + s.player.kickbackY) * dt;

    // Arena boundary clamp
    const playerRadius = 16;
    newPx = Math.max(playerRadius + 20, Math.min(ARENA_WIDTH - playerRadius - 20, newPx));
    newPy = Math.max(playerRadius + 20, Math.min(ARENA_HEIGHT - playerRadius - 20, newPy));

    // Barricade collision for player
    for (const b of s.barricades) {
      if (b.health > 0) {
        if (
          newPx + playerRadius > b.x &&
          newPx - playerRadius < b.x + b.width &&
          newPy + playerRadius > b.y &&
          newPy - playerRadius < b.y + b.height
        ) {
          // Slide response
          newPx = s.player.x;
          newPy = s.player.y;
          break;
        }
      }
    }

    s.player.x = newPx;
    s.player.y = newPy;

    // Player Aim Angle
    let targetAngle = Math.atan2(s.mouse.worldY - s.player.y, s.mouse.worldX - s.player.x);
    // Optional Auto-aim assist (snaps toward nearest visible zombie)
    if (settingsRef.current.autoAim && s.zombies.length > 0) {
      let nearestDist = 380;
      let nearestZombie: ZombieEntity | null = null;
      for (const z of s.zombies) {
        const d = Math.hypot(z.x - s.player.x, z.y - s.player.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestZombie = z;
        }
      }
      if (nearestZombie) {
        targetAngle = Math.atan2(nearestZombie.y - s.player.y, nearestZombie.x - s.player.x);
      }
    }
    s.player.angle = targetAngle;

    // Crosshair spread bloom
    const isMoving = Math.hypot(s.player.vx, s.player.vy) > 30;
    if (isMoving) {
      s.crosshairBloom = Math.min(s.crosshairBloom + dt * 4, 1.2);
    } else {
      s.crosshairBloom = Math.max(0, s.crosshairBloom - dt * 5);
    }

    // 3. Active Reload Progress
    if (s.player.activeReload.isReloading) {
      const elapsed = Date.now() - s.player.activeReload.startTime;
      const progress = Math.min(1, elapsed / s.player.activeReload.durationMs);
      s.player.activeReload.progress = progress;

      if (progress >= 1) {
        // Natural reload finished
        const activeWep = s.player.weapons[s.player.activeWeaponIndex];
        if (activeWep) {
          activeWep.currentAmmo = activeWep.clipSize;
        }
        s.player.activeReload.isReloading = false;
        s.player.activeReload.progress = 0;
      }
    }

    // 4. Weapon Firing Logic
    const activeWeapon = s.player.weapons[s.player.activeWeaponIndex];
    const wantsToFire = s.mouse.isDown || s.player.isFiring;

    if (wantsToFire && activeWeapon && !s.player.activeReload.isReloading) {
      const now = Date.now();
      const fireIntervalMs = 1000 / activeWeapon.fireRateRps;

      if (now - s.player.lastShotTime >= fireIntervalMs) {
        if (activeWeapon.currentAmmo > 0) {
          // Fire shot!
          activeWeapon.currentAmmo -= 1;
          s.player.lastShotTime = now;
          s.muzzleFlashTimer = 0.04;
          s.crosshairBloom = Math.min(s.crosshairBloom + 0.35, 1.5);
          s.stats.shotsFired += 1;

          // Recoil kickback
          const kickDirX = -Math.cos(s.player.angle);
          const kickDirY = -Math.sin(s.player.angle);
          s.player.kickbackX += kickDirX * activeWeapon.kickback * 20;
          s.player.kickbackY += kickDirY * activeWeapon.kickback * 20;
          addCameraShake(activeWeapon.kickback * 0.7);

          // Audio
          if (activeWeapon.id === 'weapon_shotgun') sound.playShotgun();
          else if (activeWeapon.id === 'weapon_rifle') sound.playRifle();
          else if (activeWeapon.elemental === 'shock') sound.playTesla();
          else sound.playPistol();

          // Spawn Pellets
          for (let p = 0; p < activeWeapon.pelletCount; p++) {
            const spread = (Math.random() - 0.5) * (activeWeapon.spreadAngle + s.crosshairBloom * 0.08);
            const shotAngle = s.player.angle + spread;
            const proj = projectilePool.obtain();
            proj.x = s.player.x + Math.cos(s.player.angle) * 18;
            proj.y = s.player.y + Math.sin(s.player.angle) * 18;
            proj.vx = Math.cos(shotAngle) * activeWeapon.bulletSpeed;
            proj.vy = Math.sin(shotAngle) * activeWeapon.bulletSpeed;
            proj.damage = activeWeapon.baseDamage;
            proj.penetrationRemaining = activeWeapon.piercingCount;
            proj.elemental = activeWeapon.elemental;
            proj.rangeRemaining = activeWeapon.range;
            proj.radius = 3.5;
            proj.color =
              activeWeapon.elemental === 'shock'
                ? '#06B6D4'
                : activeWeapon.elemental === 'incendiary'
                ? '#EF4444'
                : activeWeapon.elemental === 'cryo'
                ? '#38BDF8'
                : '#F59E0B';

            s.projectiles.push(proj);
          }

          // Telemetry
          s.telemetry.push({
            timeMs: s.totalSurvivalTimeMs,
            action: 'shot',
            x: Math.round(s.player.x),
            y: Math.round(s.player.y),
            weaponId: activeWeapon.id,
            hitCount: 0,
          });

          // Auto-trigger reload if empty
          if (activeWeapon.currentAmmo === 0) {
            triggerReload();
          }
        } else {
          // Dry fire
          triggerReload();
        }
      }
    }

    // Muzzle flash decay
    if (s.muzzleFlashTimer > 0) {
      s.muzzleFlashTimer -= dt;
    }

    // 5. Zombie Spawning from wave queue
    if (s.status === 'WAVE_ACTIVE' && s.enemiesToSpawn.length > 0) {
      s.spawnTimerMs += dt * 1000;
      if (s.spawnTimerMs >= s.waveConfig.spawnIntervalMs) {
        s.spawnTimerMs = 0;
        const nextType = s.enemiesToSpawn.pop()!;

        // Pick perimeter spawn point around arena edge
        let sx = 0;
        let sy = 0;
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) {
          sx = Math.random() * ARENA_WIDTH;
          sy = 10;
        } else if (edge === 1) {
          sx = ARENA_WIDTH - 10;
          sy = Math.random() * ARENA_HEIGHT;
        } else if (edge === 2) {
          sx = Math.random() * ARENA_WIDTH;
          sy = ARENA_HEIGHT - 10;
        } else {
          sx = 10;
          sy = Math.random() * ARENA_HEIGHT;
        }

        s.zombies.push(createZombie(nextType, sx, sy, s.currentWave));
      }
    }

    // 6. Spatial Hash Grid Refresh
    s.spatialGrid.clear();
    for (let i = 0; i < s.zombies.length; i++) {
      s.spatialGrid.insert(s.zombies[i]);
    }

    // 7. Projectiles Simulation & Collision
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const p = s.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const stepDist = Math.hypot(p.vx * dt, p.vy * dt);
      p.rangeRemaining -= stepDist;

      // Projectile particles
      if (Math.random() < 0.25) {
        const part = particlePool.obtain();
        part.x = p.x;
        part.y = p.y;
        part.vx = (Math.random() - 0.5) * 20;
        part.vy = (Math.random() - 0.5) * 20;
        part.color = p.color;
        part.radius = 2;
        part.maxLife = 0.2;
        s.particles.push(part);
      }

      // Check collision with Barricades
      let hitBarricade = false;
      for (const b of s.barricades) {
        if (b.health > 0) {
          if (p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height) {
            // Friendly bullets pass over low barricades, enemy bullets damage barricades
            if (p.isEnemy) {
              b.health -= p.damage;
              hitBarricade = true;
              break;
            }
          }
        }
      }

      if (hitBarricade) {
        projectilePool.release(p);
        s.projectiles.splice(i, 1);
        continue;
      }

      // Collision with Zombies
      const hitZombies = s.spatialGrid.queryNearby(p.x, p.y, p.radius + 15);
      let hitEntity = false;

      for (const z of hitZombies) {
        const dx = z.x - p.x;
        const dy = z.y - p.y;
        const distSq = dx * dx + dy * dy;
        const rSum = z.radius + p.radius;

        if (distSq <= rSum * rSum) {
          // HIT CONFIRMED!
          hitEntity = true;
          s.stats.shotsHit += 1;
          z.hp -= p.damage;
          z.hitFlashTimerMs = 80;

          // Elemental Infusions
          if (p.elemental === 'incendiary') {
            z.burnDurationMs = 3000;
          } else if (p.elemental === 'cryo') {
            z.isFrozen = true;
            z.frozenTimerMs = 2500;
          } else if (p.elemental === 'shock') {
            // Shock Chain Lightning
            const nearby = s.spatialGrid.queryNearby(z.x, z.y, 140);
            for (const n of nearby) {
              if (n.id !== z.id) {
                n.hp -= Math.round(p.damage * 0.6);
                n.hitFlashTimerMs = 80;
                // Shock particle
                const sp = particlePool.obtain();
                sp.x = n.x;
                sp.y = n.y;
                sp.color = '#06B6D4';
                sp.radius = 3;
                s.particles.push(sp);
              }
            }
          }

          // Floating damage number
          const isCrit = Math.random() < 0.2;
          const critMultiplier = isCrit ? 1.5 : 1;
          const totalDmg = Math.round(p.damage * critMultiplier);
          const dn = damageNumberPool.obtain();
          dn.text = isCrit ? `CRIT! ${totalDmg}` : `${totalDmg}`;
          dn.x = z.x + (Math.random() - 0.5) * 16;
          dn.y = z.y - 12;
          dn.color = isCrit ? '#EF4444' : '#F8FAFC';
          dn.scale = isCrit ? 1.3 : 1.0;
          s.damageNumbers.push(dn);

          sound.playHit();

          // Blood burst particles
          for (let bp = 0; bp < 5; bp++) {
            const part = particlePool.obtain();
            part.x = z.x;
            part.y = z.y;
            part.vx = Math.cos(s.player.angle) * 80 + (Math.random() - 0.5) * 60;
            part.vy = Math.sin(s.player.angle) * 80 + (Math.random() - 0.5) * 60;
            part.color = '#B91C1C';
            part.radius = 2.5 + Math.random() * 2;
            part.maxLife = 0.4;
            s.particles.push(part);
          }

          // Telemetry
          s.telemetry.push({
            timeMs: s.totalSurvivalTimeMs,
            action: 'hit',
            x: Math.round(z.x),
            y: Math.round(z.y),
            weaponId: s.player.weapons[s.player.activeWeaponIndex]?.id || 'weapon',
            hitCount: 1,
            damageDealt: totalDmg,
          });

          p.penetrationRemaining -= 1;
          if (p.penetrationRemaining <= 0) {
            break;
          }
        }
      }

      if (hitEntity && p.penetrationRemaining <= 0) {
        projectilePool.release(p);
        s.projectiles.splice(i, 1);
        continue;
      }

      // Out of range or out of arena
      if (
        p.rangeRemaining <= 0 ||
        p.x < 0 ||
        p.x > ARENA_WIDTH ||
        p.y < 0 ||
        p.y > ARENA_HEIGHT
      ) {
        projectilePool.release(p);
        s.projectiles.splice(i, 1);
      }
    }

    // 8. Tripwire Traps Check
    for (let t = s.tripwires.length - 1; t >= 0; t--) {
      const trip = s.tripwires[t];
      if (!trip.armed) continue;

      const trapped = s.spatialGrid.queryNearby(trip.x, trip.y, trip.radius);
      if (trapped.length > 0) {
        // DETONATE!
        trip.armed = false;
        sound.playShotgun();
        addCameraShake(12);

        for (const z of trapped) {
          z.hp -= trip.damage;
          z.burnDurationMs = 4000;
        }

        // Radial explosion particles
        for (let ep = 0; ep < 25; ep++) {
          const part = particlePool.obtain();
          const ang = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 150;
          part.x = trip.x;
          part.y = trip.y;
          part.vx = Math.cos(ang) * spd;
          part.vy = Math.sin(ang) * spd;
          part.color = ep % 2 === 0 ? '#EF4444' : '#F59E0B';
          part.radius = 4;
          part.maxLife = 0.6;
          s.particles.push(part);
        }

        s.tripwires.splice(t, 1);
      }
    }

    // 9. Zombies AI & Movement
    for (let i = s.zombies.length - 1; i >= 0; i--) {
      const z = s.zombies[i];

      // Hit flash decay
      if (z.hitFlashTimerMs && z.hitFlashTimerMs > 0) {
        z.hitFlashTimerMs -= dt * 1000;
      }

      // Burning damage
      if (z.burnDurationMs && z.burnDurationMs > 0) {
        z.burnDurationMs -= dt * 1000;
        z.burnTickTimerMs = (z.burnTickTimerMs || 0) + dt * 1000;
        if (z.burnTickTimerMs >= 300) {
          z.burnTickTimerMs = 0;
          z.hp -= 12;
          const part = particlePool.obtain();
          part.x = z.x;
          part.y = z.y;
          part.vx = (Math.random() - 0.5) * 30;
          part.vy = -30 - Math.random() * 30;
          part.color = '#EF4444';
          part.radius = 2.5;
          s.particles.push(part);
        }
      }

      // Freezing effect
      if (z.isFrozen) {
        z.frozenTimerMs = (z.frozenTimerMs || 0) - dt * 1000;
        if (z.frozenTimerMs <= 0) {
          z.isFrozen = false;
        }
      }

      // Death check
      if (z.hp <= 0) {
        sound.playZombieDeath();
        s.stats.totalKills += 1;
        s.stats.killsByType[z.type] = (s.stats.killsByType[z.type] || 0) + 1;

        // Permanent blood decal on floor
        if (s.bloodDecals.length > 200) s.bloodDecals.shift();
        s.bloodDecals.push({
          x: z.x,
          y: z.y,
          radius: 14 + Math.random() * 12,
          alpha: 0.65,
          color: '#5B1111',
        });

        // Chance to spawn Scrap / Biomass drop
        const spec = ZOMBIE_SPECS[z.type];
        if (Math.random() < spec.scrapDropChance) {
          s.scrapDrops.push({
            id: `scrap_${Date.now()}_${Math.random()}`,
            x: z.x,
            y: z.y,
            value: Math.round(15 + Math.random() * 25),
            type: z.type === 'brute' ? 'biomass' : 'scrap',
            radius: 8,
            lifeMs: 25000,
          });
        }

        s.zombies.splice(i, 1);
        continue;
      }

      // Active AI behavior
      if (z.isFrozen) continue; // frozen in place

      // Calculate vector toward player
      const dx = s.player.x - z.x;
      const dy = s.player.y - z.y;
      const distToPlayer = Math.hypot(dx, dy);
      z.angle = Math.atan2(dy, dx);

      // Check if blocked by Barricades
      let blockedByBarricade: BarricadeEntity | null = null;
      for (const b of s.barricades) {
        if (b.health > 0) {
          if (
            z.x + z.radius > b.x &&
            z.x - z.radius < b.x + b.width &&
            z.y + z.radius > b.y &&
            z.y - z.radius < b.y + b.height
          ) {
            blockedByBarricade = b;
            break;
          }
        }
      }

      if (blockedByBarricade) {
        // Claw down barricade
        z.attackCooldownMs = (z.attackCooldownMs || 0) + dt * 1000;
        if (z.attackCooldownMs >= 800) {
          z.attackCooldownMs = 0;
          blockedByBarricade.health -= z.damage;
          sound.playHit();
          if (blockedByBarricade.health <= 0) {
            sound.playFortify(); // wood shatter
          }
        }
        continue;
      }

      // Archetype-specific behavior
      if (z.type === 'spitter' && distToPlayer < 320 && distToPlayer > 180) {
        // Keep distance and spit acid
        z.attackCooldownMs = (z.attackCooldownMs || 0) + dt * 1000;
        if (z.attackCooldownMs >= 2400) {
          z.attackCooldownMs = 0;
          // Spawn enemy toxic projectile
          const acid = projectilePool.obtain();
          acid.x = z.x;
          acid.y = z.y;
          acid.vx = Math.cos(z.angle) * 320;
          acid.vy = Math.sin(z.angle) * 320;
          acid.damage = 18;
          acid.isEnemy = true;
          acid.color = '#10B981';
          acid.radius = 5;
          acid.rangeRemaining = 450;
          s.projectiles.push(acid);
        }
      } else {
        // Move toward player
        const moveSpeed = z.speed;
        z.vx = Math.cos(z.angle) * moveSpeed;
        z.vy = Math.sin(z.angle) * moveSpeed;
        z.x += z.vx * dt;
        z.y += z.vy * dt;

        // Attack Player melee
        if (distToPlayer <= z.radius + playerRadius) {
          z.attackCooldownMs = (z.attackCooldownMs || 0) + dt * 1000;
          if (z.attackCooldownMs >= 800) {
            z.attackCooldownMs = 0;

            // Damage player (Armor absorbs 60% first)
            let damage = z.damage;
            if (s.player.armor > 0) {
              const absorbed = Math.min(s.player.armor, Math.round(damage * 0.6));
              s.player.armor -= absorbed;
              damage -= absorbed;
            }
            s.player.hp -= damage;
            sound.playHit();
            addCameraShake(8);

            // Red screen edge vignette flash
            if (s.player.hp <= 25) {
              sound.playHeartbeat();
            }

            // Game Over Check
            if (s.player.hp <= 0) {
              s.player.hp = 0;
              s.status = 'GAME_OVER';
              s.stats.causeOfDeath = `Overrun by ${ZOMBIE_SPECS[z.type].name}`;
            }
          }
        }
      }
    }

    // 10. Scrap Drops magnet & pickup
    for (let i = s.scrapDrops.length - 1; i >= 0; i--) {
      const drop = s.scrapDrops[i];
      const dx = s.player.x - drop.x;
      const dy = s.player.y - drop.y;
      const dist = Math.hypot(dx, dy);

      // Vacuum magnet range (110px)
      if (dist < 110) {
        drop.x += (dx / dist) * 320 * dt;
        drop.y += (dy / dist) * 320 * dt;
      }

      // Collect
      if (dist < playerRadius + drop.radius) {
        s.player.scrap += drop.value;
        sound.playScrapPickup();

        const dn = damageNumberPool.obtain();
        dn.text = `+${drop.value} SCRAP`;
        dn.x = drop.x;
        dn.y = drop.y - 10;
        dn.color = '#F59E0B';
        s.damageNumbers.push(dn);

        s.scrapDrops.splice(i, 1);
      }
    }

    // 11. Particles & Damage Numbers update
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const part = s.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life += dt;
      part.alpha = Math.max(0, 1 - part.life / part.maxLife);
      if (part.life >= part.maxLife) {
        particlePool.release(part);
        s.particles.splice(i, 1);
      }
    }

    for (let i = s.damageNumbers.length - 1; i >= 0; i--) {
      const dn = s.damageNumbers[i];
      dn.y -= 25 * dt;
      dn.life += dt;
      dn.alpha = Math.max(0, 1 - dn.life / 0.8);
      if (dn.life >= 0.8) {
        damageNumberPool.release(dn);
        s.damageNumbers.splice(i, 1);
      }
    }

    // 12. Camera Smooth Follow + Shake
    const targetCamX = s.player.x;
    const targetCamY = s.player.y;
    s.camera.x += (targetCamX - s.camera.x) * 0.15;
    s.camera.y += (targetCamY - s.camera.y) * 0.15;

    if (s.camera.shakeMagnitude > 0) {
      s.camera.shakeX = (Math.random() - 0.5) * s.camera.shakeMagnitude;
      s.camera.shakeY = (Math.random() - 0.5) * s.camera.shakeMagnitude;
      s.camera.shakeMagnitude = Math.max(0, s.camera.shakeMagnitude - dt * 35);
    } else {
      s.camera.shakeX = 0;
      s.camera.shakeY = 0;
    }

    // 13. Wave Clear Check
    if (
      s.status === 'WAVE_ACTIVE' &&
      s.enemiesToSpawn.length === 0 &&
      s.zombies.length === 0
    ) {
      s.status = 'WAVE_INTERMISSION';
      sound.playWaveSiren();

      // Telemetry
      s.telemetry.push({
        timeMs: s.totalSurvivalTimeMs,
        action: 'wave_cleared',
        x: Math.round(s.player.x),
        y: Math.round(s.player.y),
        weaponId: s.player.weapons[s.player.activeWeaponIndex]?.id || '',
        hitCount: 0,
      });
    }
  }, [addCameraShake, triggerReload]);

  // --------------------------------------------------------------------------
  // CANVAS RENDERING PIPELINE
  // --------------------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = sim.current;
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Transform
    const camOffsetX = width / 2 - s.camera.x + s.camera.shakeX;
    const camOffsetY = height / 2 - s.camera.y + s.camera.shakeY;
    ctx.translate(camOffsetX, camOffsetY);

    // 1. Arena Floor Background (Bunker tiles with hazard crosshatching)
    ctx.fillStyle = '#070A0B';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Grid lines
    ctx.strokeStyle = '#12171A';
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let x = 0; x < ARENA_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < ARENA_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
      ctx.stroke();
    }

    // Outer Arena Perimeter Hazard Line
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, ARENA_WIDTH - 20, ARENA_HEIGHT - 20);

    // Safehouse Center Bay
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ARENA_WIDTH / 2 - 250, ARENA_HEIGHT / 2 - 200, 500, 400);

    // 2. Blood Decals
    for (const d of s.bloodDecals) {
      ctx.fillStyle = d.color;
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Barricades
    for (const b of s.barricades) {
      if (b.health > 0) {
        ctx.fillStyle = '#2A201A';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Barricade Health Bar
        const hpPct = b.health / b.maxHealth;
        ctx.fillStyle = '#10B981';
        ctx.fillRect(b.x, b.y - 6, b.width * hpPct, 3);
      }
    }

    // 4. Halogen Floodlights Base
    for (const fl of s.floodlights) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 5. Tripwire Traps
    for (const t of s.tripwires) {
      if (t.armed) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 6. Scrap & Biomass Drops
    for (const drop of s.scrapDrops) {
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.fillStyle = drop.type === 'biomass' ? '#10B981' : '#F59E0B';
      ctx.shadowColor = drop.type === 'biomass' ? '#10B981' : '#F59E0B';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, drop.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Zombies Rendering (With Illuminated check vs Shadowy Silhouettes)
    for (const z of s.zombies) {
      const illuminated = isPointIlluminated(
        z.x,
        z.y,
        s.player,
        s.floodlights,
        s.isBlackout
      );

      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.rotate(z.angle);

      if (illuminated) {
        // FULL COLOR & TEXTURE
        const spec = ZOMBIE_SPECS[z.type];
        ctx.fillStyle = z.hitFlashTimerMs && z.hitFlashTimerMs > 0 ? '#FFFFFF' : spec.color;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
        ctx.fill();

        // Arms/claws forward
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(z.radius - 2, -6, 8, 4);
        ctx.fillRect(z.radius - 2, 2, 8, 4);

        // Glowing red eyes
        ctx.fillStyle = spec.eyeColor;
        ctx.shadowColor = spec.eyeColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(4, 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Elemental effects
        if (z.isFrozen) {
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, z.radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // UNILLUMINATED: PURE SHADOWY SILHOUETTE WITH RED GLOWING EYES
        ctx.fillStyle = '#050708';
        ctx.beginPath();
        ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
        ctx.fill();

        // Piercing red eyes in darkness
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(4, 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Zombie Health Bar
      if (z.hp < z.maxHp) {
        const hpPct = Math.max(0, z.hp / z.maxHp);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(z.x - 14, z.y - z.radius - 10, 28, 4);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(z.x - 14, z.y - z.radius - 10, 28 * hpPct, 4);
      }
    }

    // 8. Player Rendering
    const playerRadius = 16;
    ctx.save();
    ctx.translate(s.player.x, s.player.y);
    ctx.rotate(s.player.angle);

    // Tactical Operator Body
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, playerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Weapon Barrel
    ctx.fillStyle = '#475569';
    ctx.fillRect(playerRadius - 2, -3, 14, 6);

    // Muzzle Flash Flare
    if (s.muzzleFlashTimer > 0) {
      ctx.fillStyle = '#FDE68A';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(playerRadius + 15, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 9. Projectiles
    for (const p of s.projectiles) {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 10. Particles
    for (const part of s.particles) {
      ctx.fillStyle = part.color;
      ctx.globalAlpha = part.alpha;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 11. Fog-of-War & Raycasted Flashlight Lighting Mask
    renderLightingMask(
      ctx,
      ARENA_WIDTH,
      ARENA_HEIGHT,
      {
        x: s.player.x,
        y: s.player.y,
        angle: s.player.angle,
        isFiring: s.player.isFiring || s.muzzleFlashTimer > 0,
      },
      s.floodlights,
      s.isBlackout,
      s.muzzleFlashTimer
    );

    // 12. Floating Damage Numbers
    for (const dn of s.damageNumbers) {
      ctx.save();
      ctx.font = `bold ${Math.round(14 * dn.scale)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = dn.color;
      ctx.globalAlpha = dn.alpha;
      ctx.shadowColor = dn.color;
      ctx.shadowBlur = 6;
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }

    // 13. Crosshair Bloom (Rendered at mouse world coords)
    ctx.save();
    ctx.strokeStyle = settingsRef.current.crosshairColor;
    ctx.lineWidth = 1.5;
    const chRadius = 9 + s.crosshairBloom * 8;
    ctx.beginPath();
    ctx.arc(s.mouse.worldX, s.mouse.worldY, chRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Cross notches
    const armLen = 5;
    ctx.beginPath();
    ctx.moveTo(s.mouse.worldX - chRadius - armLen, s.mouse.worldY);
    ctx.lineTo(s.mouse.worldX - chRadius, s.mouse.worldY);
    ctx.moveTo(s.mouse.worldX + chRadius, s.mouse.worldY);
    ctx.lineTo(s.mouse.worldX + chRadius + armLen, s.mouse.worldY);
    ctx.moveTo(s.mouse.worldX, s.mouse.worldY - chRadius - armLen);
    ctx.lineTo(s.mouse.worldX, s.mouse.worldY - chRadius);
    ctx.moveTo(s.mouse.worldX, s.mouse.worldY + chRadius);
    ctx.lineTo(s.mouse.worldX, s.mouse.worldY + chRadius + armLen);
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // Restore camera transform
  }, []);

  // --------------------------------------------------------------------------
  // INPUT HANDLERS & MOUSE TRACKING
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sim.current.keys[e.code] = true;

      // Hotkeys
      if (e.code === 'KeyR') {
        triggerReload();
      } else if (e.code === 'Digit1') {
        switchWeapon(0);
      } else if (e.code === 'Digit2') {
        switchWeapon(1);
      } else if (e.code === 'Digit3') {
        switchWeapon(2);
      } else if (e.code === 'KeyE') {
        deployTripwire();
      } else if (e.code === 'KeyF') {
        // Try repair nearest barricade
        const s = sim.current;
        for (const b of s.barricades) {
          const d = Math.hypot(b.x + b.width / 2 - s.player.x, b.y + b.height / 2 - s.player.y);
          if (d < 120) {
            repairBarricade(b.id);
            break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      sim.current.keys[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      sim.current.mouse.screenX = screenX;
      sim.current.mouse.screenY = screenY;

      // Unproject screen coordinates to world coordinates
      const camOffsetX = canvas.width / 2 - sim.current.camera.x;
      const camOffsetY = canvas.height / 2 - sim.current.camera.y;
      sim.current.mouse.worldX = screenX - camOffsetX;
      sim.current.mouse.worldY = screenY - camOffsetY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        sim.current.mouse.isDown = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        sim.current.mouse.isDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [triggerReload, switchWeapon, deployTripwire, repairBarricade]);

  // --------------------------------------------------------------------------
  // GAME LOOP (requestAnimationFrame + 60Hz Fixed Physics Step)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_STEP = 1000 / 60; // 16.67ms
    let hudThrottleTimer = 0;

    const loop = (currentTime: number) => {
      const frameDelta = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;
      accumulator += frameDelta;

      while (accumulator >= FIXED_STEP) {
        updateSimulation(FIXED_STEP / 1000);
        accumulator -= FIXED_STEP;
      }

      renderCanvas();

      // Throttled HUD State Update (~20Hz)
      hudThrottleTimer += frameDelta;
      if (hudThrottleTimer >= 50) {
        hudThrottleTimer = 0;
        const s = sim.current;
        setHudState({
          status: s.status,
          seed: s.seed,
          currentWave: s.currentWave,
          enemiesRemaining: s.zombies.length + s.enemiesToSpawn.length,
          totalEnemiesInWave: s.waveConfig.zombieCount,
          isBlackout: s.isBlackout,
          blackoutTimerMs: s.blackoutTimerMs,
          player: {
            x: s.player.x,
            y: s.player.y,
            vx: s.player.vx,
            vy: s.player.vy,
            angle: s.player.angle,
            hp: s.player.hp,
            maxHp: s.player.maxHp,
            armor: s.player.armor,
            maxArmor: s.player.maxArmor,
            scrap: s.player.scrap,
            weapons: [...s.player.weapons],
            activeWeaponIndex: s.player.activeWeaponIndex,
            isFiring: s.player.isFiring,
            activeReload: { ...s.player.activeReload },
          },
          barricades: [...s.barricades],
          floodlights: [...s.floodlights],
          tripwires: [...s.tripwires],
          stats: { ...s.stats },
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [updateSimulation, renderCanvas]);

  // Restart / Reset Game Run
  const restartGame = useCallback((newSeed?: string) => {
    const s = sim.current;
    const seedToUse = newSeed || runSeed;
    s.seed = seedToUse;
    s.status = 'WAVE_ACTIVE';
    s.currentWave = 1;
    s.waveConfig = generateWaveConfig(seedToUse, 1);
    s.enemiesToSpawn = [];
    s.zombies = [];
    s.projectiles = [];
    s.particles = [];
    s.damageNumbers = [];
    s.scrapDrops = [];
    s.telemetry = [];
    s.isBlackout = false;
    s.blackoutTimerMs = 0;
    s.totalSurvivalTimeMs = 0;
    s.player.x = ARENA_WIDTH / 2;
    s.player.y = ARENA_HEIGHT / 2;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.hp = 100;
    s.player.armor = 50;
    s.player.scrap = 100;
    s.player.weapons = JSON.parse(JSON.stringify(INITIAL_WEAPONS));
    s.player.activeWeaponIndex = 0;
    s.barricades = createInitialBarricades(ARENA_WIDTH, ARENA_HEIGHT);
    s.floodlights = createInitialFloodlights(ARENA_WIDTH, ARENA_HEIGHT);
    s.tripwires = [];
    s.stats = {
      totalKills: 0,
      killsByType: { walker: 0, sprinter: 0, spitter: 0, brute: 0, screamer: 0 },
      shotsFired: 0,
      shotsHit: 0,
      timeSurvivedMs: 0,
      causeOfDeath: 'Active Operation',
    };

    startNextWave();
  }, [runSeed, startNextWave]);

  // Mobile / Touch input controllers
  const setTouchMove = useCallback((dx: number, dy: number) => {
    const s = sim.current;
    s.player.vx = dx * s.player.speed;
    s.player.vy = dy * s.player.speed;
  }, []);

  const setTouchAim = useCallback((angle: number, isFiring: boolean) => {
    const s = sim.current;
    s.player.angle = angle;
    s.player.isFiring = isFiring;
  }, []);

  return {
    canvasRef,
    gameState: hudState,
    settings,
    setSettings,
    startNextWave,
    triggerReload,
    upgradeWeapon,
    repairBarricade,
    deployFloodlight,
    deployTripwire,
    switchWeapon,
    restartGame,
    setTouchMove,
    setTouchAim,
    getTelemetry: () => [...sim.current.telemetry],
  };
}
