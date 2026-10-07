import { Projectile, WeaponType, Vector2D } from '../types/game';

export interface SynergyInfo {
  name: string;
  badge: string;
  description: string;
  color: string;
}

export function getSynergyName(synergies: WeaponType[]): SynergyInfo {
  const set = new Set(synergies);

  if (set.has('plasma_repeater') && set.has('homing_missile') && set.has('scatter_shot') && set.has('emp_beam')) {
    return {
      name: 'OMEGA VOID TEMPEST',
      badge: 'OMEGA T5',
      description: 'Unified kinetic, plasma, homing, and ionized EMP annihilation cascade.',
      color: '#ddb7ff',
    };
  }

  if (set.has('plasma_repeater') && set.has('homing_missile')) {
    return {
      name: 'CLUSTER SWARM MATRIX',
      badge: 'FUSION T4',
      description: 'Rapid plasma repeaters spawn seeking micro-warheads upon impact.',
      color: '#4cd7f6',
    };
  }

  if (set.has('scatter_shot') && set.has('emp_beam')) {
    return {
      name: 'IONIC PULSE CANNON',
      badge: 'FUSION T4',
      description: 'Wide conical energy blasts vaporizing enemy projectiles and shielding.',
      color: '#06b6d4',
    };
  }

  if (set.has('homing_missile') && set.has('emp_beam')) {
    return {
      name: 'VORTEX SEEKER PODS',
      badge: 'FUSION T3',
      description: 'High-speed acoustic missiles emitting localized EMP paralysis on impact.',
      color: '#4edea3',
    };
  }

  if (set.has('plasma_repeater') && set.has('scatter_shot')) {
    return {
      name: 'PLASMA FLAK BARRAGE',
      badge: 'FUSION T3',
      description: 'Accelerated 5-way plasma curtain covering entire forward flight sector.',
      color: '#f59e0b',
    };
  }

  if (synergies.length > 0) {
    const single = synergies[0];
    if (single === 'plasma_repeater') {
      return { name: 'DUAL PLASMA REPEATER', badge: 'T2 MOD', description: 'Focused high-velocity energy streams.', color: '#4cd7f6' };
    }
    if (single === 'scatter_shot') {
      return { name: 'CONICAL SCATTER SHOT', badge: 'T2 MOD', description: 'Wide-arc kinetic spread pellets.', color: '#f59e0b' };
    }
    if (single === 'homing_missile') {
      return { name: 'HOMING MICRO-ROCKETS', badge: 'T2 MOD', description: 'Heat-seeking avionics missiles.', color: '#4edea3' };
    }
    if (single === 'emp_beam') {
      return { name: 'IONIC DISCHARGE BEAM', badge: 'T2 MOD', description: 'High-voltage armor-piercing beam.', color: '#c78dff' };
    }
  }

  return {
    name: 'KINETIC AUTOCANNON',
    badge: 'STANDARD',
    description: 'Standard orbital defense plasma blasters.',
    color: '#869397',
  };
}

export function createPlayerProjectiles(
  originX: number,
  originY: number,
  activeSynergies: WeaponType[],
  overchargeRatio: number // 0 to 1 (scales fire rate and extra pellets)
): Projectile[] {
  const projectiles: Projectile[] = [];
  const synergySet = new Set(activeSynergies);
  const now = Date.now();

  const dmgMultiplier = 1 + overchargeRatio * 0.75;
  const isSuperCharged = overchargeRatio > 0.8;

  // 1. Primary Plasma Repeater (Twin or Quad Forward Streams)
  if (synergySet.has('plasma_repeater') || activeSynergies.length === 0) {
    const spreadOffset = isSuperCharged ? 18 : 12;
    projectiles.push({
      id: `p_plas_l_${now}_${Math.random()}`,
      source: 'player',
      pos: { x: originX - spreadOffset, y: originY - 10 },
      velocity: { x: 0, y: -16 },
      damage: Math.round(18 * dmgMultiplier),
      radius: 4,
      color: '#4cd7f6',
      weaponType: 'plasma_repeater',
    });
    projectiles.push({
      id: `p_plas_r_${now}_${Math.random()}`,
      source: 'player',
      pos: { x: originX + spreadOffset, y: originY - 10 },
      velocity: { x: 0, y: -16 },
      damage: Math.round(18 * dmgMultiplier),
      radius: 4,
      color: '#4cd7f6',
      weaponType: 'plasma_repeater',
    });
  }

  // 2. Scatter Shot (Wide Conical Pellets)
  if (synergySet.has('scatter_shot')) {
    const angles = isSuperCharged ? [-0.35, -0.2, -0.08, 0, 0.08, 0.2, 0.35] : [-0.25, -0.12, 0, 0.12, 0.25];
    const speed = 14;
    for (const angle of angles) {
      projectiles.push({
        id: `p_scat_${now}_${Math.random()}`,
        source: 'player',
        pos: { x: originX, y: originY - 8 },
        velocity: { x: Math.sin(angle) * speed, y: -Math.cos(angle) * speed },
        damage: Math.round(14 * dmgMultiplier),
        radius: 3.5,
        color: '#f59e0b',
        weaponType: 'scatter_shot',
      });
    }
  }

  // 3. Homing Micro-Missiles
  if (synergySet.has('homing_missile')) {
    const launchAngles = [-0.6, 0.6];
    for (const la of launchAngles) {
      projectiles.push({
        id: `p_msl_${now}_${Math.random()}`,
        source: 'player',
        pos: { x: originX + (la > 0 ? 20 : -20), y: originY },
        velocity: { x: Math.sin(la) * 8, y: -7 },
        damage: Math.round(28 * dmgMultiplier),
        radius: 5,
        color: '#4edea3',
        isHoming: true,
        spawnTime: now,
        lifeMs: 3500,
        weaponType: 'homing_missile',
      });
    }
  }

  // 4. EMP Beam / Piercing Pulse
  if (synergySet.has('emp_beam')) {
    projectiles.push({
      id: `p_emp_${now}_${Math.random()}`,
      source: 'player',
      pos: { x: originX, y: originY - 16 },
      velocity: { x: 0, y: -22 },
      damage: Math.round(36 * dmgMultiplier),
      radius: 7,
      color: '#ddb7ff',
      weaponType: 'emp_beam',
    });
  }

  return projectiles;
}
