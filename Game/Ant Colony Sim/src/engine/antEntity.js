/**
 * Ant Castes, Lifecycle, Sensory Navigation, and State Machine
 */

export const CASTES = {
  QUEEN: {
    id: 'QUEEN',
    name: 'Queen',
    color: '#ec4899',
    size: 9,
    speed: 18,
    maxHp: 250,
    attack: 4,
    carryCapacity: 0,
    sensorDist: 35,
    energyMax: 200,
  },
  WORKER: {
    id: 'WORKER',
    name: 'Worker',
    color: '#f59e0b',
    size: 4,
    speed: 52,
    maxHp: 40,
    attack: 6,
    carryCapacity: 2,
    sensorDist: 40,
    energyMax: 100,
  },
  SOLDIER: {
    id: 'SOLDIER',
    name: 'Soldier',
    color: '#ef4444',
    size: 5.5,
    speed: 46,
    maxHp: 90,
    attack: 18,
    carryCapacity: 1,
    sensorDist: 45,
    energyMax: 120,
  },
  SCOUT: {
    id: 'SCOUT',
    name: 'Scout',
    color: '#06b6d4',
    size: 3.8,
    speed: 72,
    maxHp: 30,
    attack: 3,
    carryCapacity: 1,
    sensorDist: 60,
    energyMax: 110,
  },
  HARVESTER: {
    id: 'HARVESTER',
    name: 'Harvester',
    color: '#10b981',
    size: 4.8,
    speed: 44,
    maxHp: 50,
    attack: 8,
    carryCapacity: 4,
    sensorDist: 38,
    energyMax: 100,
  },
  NURSE: {
    id: 'NURSE',
    name: 'Nurse',
    color: '#a855f7',
    size: 4,
    speed: 40,
    maxHp: 35,
    attack: 2,
    carryCapacity: 1,
    sensorDist: 30,
    energyMax: 90,
  }
};

export const LIFE_STAGES = {
  EGG: 'EGG',
  LARVA: 'LARVA',
  PUPA: 'PUPA',
  ADULT: 'ADULT',
};

export class Ant {
  constructor(id, x, y, casteType = 'WORKER', stage = LIFE_STAGES.ADULT) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle;
    this.turnSpeed = 4.5; // rad/s

    this.caste = CASTES[casteType] || CASTES.WORKER;
    this.stage = stage;
    this.age = 0; // seconds
    this.stageTimer = 0; // progress to next stage

    // Stats
    this.hp = this.caste.maxHp;
    this.maxHp = this.caste.maxHp;
    this.energy = this.caste.energyMax;
    this.maxEnergy = this.caste.energyMax;
    this.speed = this.caste.speed;

    // Carrying inventory
    this.cargo = {
      type: null, // 'sugar' | 'protein' | 'leaf' | 'egg'
      amount: 0,
    };

    // State machine
    this.state = casteType === 'QUEEN' ? 'REPRODUCING' : 'FORAGING';
    this.target = null; // Target entity or food item
    this.targetPos = null; // {x, y}
    this.targetEntityId = null;

    // Sensory & Pheromone tracking
    this.stepTimer = 0;
    this.depositTimer = 0;
    this.depositInterval = 0.25; // seconds between pheromone drops
    this.wanderTimer = 0;
    this.wanderAngleOffset = (Math.random() - 0.5) * 0.5;

    // Animation legs
    this.legPhase = Math.random() * Math.PI * 2;

    // Log history for inspector
    this.activityLog = [`Hatched as a ${this.caste.name}`];
  }

  logActivity(text) {
    if (this.activityLog.length >= 6) {
      this.activityLog.shift();
    }
    this.activityLog.push(text);
  }

  update(dt, sim) {
    this.age += dt;

    // If immature, process growth
    if (this.stage !== LIFE_STAGES.ADULT) {
      this.updateBroodGrowth(dt, sim);
      return;
    }

    this.legPhase += dt * (this.speed / 10);
    this.energy = Math.max(0, this.energy - dt * 0.6);

    // If starving, lose health
    if (this.energy <= 0) {
      this.hp -= dt * 3.0;
    }

    // Caste-specific behavior
    switch (this.caste.id) {
      case 'QUEEN':
        this.updateQueen(dt, sim);
        break;
      case 'SOLDIER':
        this.updateSoldier(dt, sim);
        break;
      case 'NURSE':
        this.updateNurse(dt, sim);
        break;
      case 'SCOUT':
      case 'HARVESTER':
      case 'WORKER':
      default:
        this.updateForager(dt, sim);
        break;
    }

    // Steering & movement
    this.integrateMovement(dt, sim);

    // Drop pheromones
    this.updatePheromoneDeposit(dt, sim);
  }

  updateBroodGrowth(dt, sim) {
    // Nurses speed up brood growth
    const nurseBonus = sim.getNurseBonusNear(this.x, this.y);
    const growthRate = (1 + nurseBonus) * (sim.upgrades.growthRate || 1.0);

    this.stageTimer += dt * growthRate;

    if (this.stage === LIFE_STAGES.EGG && this.stageTimer >= 14) {
      this.stage = LIFE_STAGES.LARVA;
      this.stageTimer = 0;
      this.logActivity('Egg hatched into Larva');
    } else if (this.stage === LIFE_STAGES.LARVA && this.stageTimer >= 18) {
      this.stage = LIFE_STAGES.PUPA;
      this.stageTimer = 0;
      this.logActivity('Larva entered pupation');
    } else if (this.stage === LIFE_STAGES.PUPA && this.stageTimer >= 16) {
      this.stage = LIFE_STAGES.ADULT;
      this.stageTimer = 0;
      this.hp = this.caste.maxHp;
      this.energy = this.caste.energyMax;
      this.logActivity(`Emerged as adult ${this.caste.name}`);
      sim.audioEngine?.playSFX('hatch');
    }
  }

  updateQueen(dt, sim) {
    // Queen stays in or near nest center and lays eggs if food available
    const nest = sim.nest;
    const distToNest = Math.hypot(nest.x - this.x, nest.y - this.y);

    if (distToNest > 60) {
      this.targetPos = { x: nest.x, y: nest.y };
    } else {
      // Gentle wander inside Queen's chamber
      this.wander(dt, 0.4);
    }

    // Lay eggs periodically if colony has protein & sugar
    this.stageTimer += dt;
    const eggInterval = 8.0 / (sim.upgrades.queenFertility || 1.0);

    if (this.stageTimer >= eggInterval) {
      this.stageTimer = 0;
      if (sim.resources.protein >= 3 && sim.resources.sugar >= 2) {
        sim.resources.protein -= 3;
        sim.resources.sugar -= 2;
        sim.spawnEgg(this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20);
        this.logActivity('Laid a new egg in nursery');
        sim.audioEngine?.playSFX('queenEgg');
      }
    }
  }

  updateForager(dt, sim) {
    const nest = sim.nest;
    const distToNest = Math.hypot(nest.x - this.x, nest.y - this.y);

    // If at nest and carrying food, deposit cargo
    if (distToNest < nest.radius + 10 && this.cargo.amount > 0) {
      sim.depositCargo(this.cargo);
      this.logActivity(`Delivered ${this.cargo.amount} ${this.cargo.type}`);
      this.cargo.type = null;
      this.cargo.amount = 0;
      this.energy = Math.min(this.maxEnergy, this.energy + 40); // Snack at home
      this.state = 'FORAGING';
      this.angle += Math.PI + (Math.random() - 0.5); // Turn back to field
      sim.audioEngine?.playSFX('deposit');
    }

    // If full cargo or low health/energy, return home
    if (this.cargo.amount >= this.caste.carryCapacity || this.energy < 15) {
      this.state = 'RETURNING_HOME';
      this.returnHomeBehavior(dt, sim, nest);
      return;
    }

    // If in beacon or rally mode
    if (sim.rallyPoint && Math.random() < 0.6) {
      const angleToBeacon = Math.atan2(sim.rallyPoint.y - this.y, sim.rallyPoint.x - this.x);
      this.targetAngle = angleToBeacon;
    }

    // Forage: Look for nearby food items within sensory radius
    const nearbyFood = sim.getNearestFood(this.x, this.y, this.caste.sensorDist * 1.6);

    if (nearbyFood) {
      const dist = Math.hypot(nearbyFood.x - this.x, nearbyFood.y - this.y);
      if (dist < 12) {
        // Harvest food item
        const harvested = nearbyFood.take(1);
        if (harvested > 0) {
          this.cargo.type = nearbyFood.type;
          this.cargo.amount += harvested;
          this.logActivity(`Harvested ${nearbyFood.type}`);
          this.state = 'RETURNING_HOME';
          this.angle += Math.PI; // Spin back towards home
          sim.audioEngine?.playSFX('harvest');
        }
      } else {
        // Walk directly towards spotted food
        this.targetAngle = Math.atan2(nearbyFood.y - this.y, nearbyFood.x - this.x);
      }
    } else {
      // Follow Food Pheromone Trail if detected
      const sensor = sim.pheromones.sampleSensor(
        this.x,
        this.y,
        this.angle,
        this.caste.sensorDist,
        0.55,
        'food'
      );

      if (sensor.total > 0.08) {
        this.targetAngle = sensor.strongestAngle + (Math.random() - 0.5) * 0.15;
      } else {
        // Random exploration wander
        this.wander(dt, 1.2);
      }
    }
  }

  updateSoldier(dt, sim) {
    const nest = sim.nest;

    // Scan for nearby enemies (beetles, spiders, rival ants)
    const enemy = sim.getNearestEnemy(this.x, this.y, 90);

    if (enemy) {
      this.state = 'ATTACKING';
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      this.targetAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);

      if (dist < 16) {
        // Attack enemy
        const dmg = (this.caste.attack + (sim.upgrades.mandiblePower || 0)) * dt;
        enemy.takeDamage(dmg, this);
        this.logActivity(`Attacking ${enemy.name}`);
        sim.pheromones.deposit(this.x, this.y, 'danger', 1.2);
      }
    } else {
      // Soldier perimeter patrol around nest
      this.state = 'PATROLLING';
      const distToNest = Math.hypot(nest.x - this.x, nest.y - this.y);

      if (distToNest > 240) {
        // Return towards perimeter
        this.targetAngle = Math.atan2(nest.y - this.y, nest.x - this.x);
      } else if (distToNest < 80) {
        // Push outward towards defense line
        this.targetAngle = Math.atan2(this.y - nest.y, this.x - nest.x);
      } else {
        // Orbit perimeter
        this.wander(dt, 0.8);
      }
    }
  }

  updateNurse(dt, sim) {
    const nest = sim.nest;
    const distToNest = Math.hypot(nest.x - this.x, nest.y - this.y);

    // Stay close to nursery / eggs
    const nearestBrood = sim.getNearestBrood(this.x, this.y, 100);

    if (nearestBrood && nearestBrood !== this) {
      const dist = Math.hypot(nearestBrood.x - this.x, nearestBrood.y - this.y);
      if (dist > 15) {
        this.targetAngle = Math.atan2(nearestBrood.y - this.y, nearestBrood.x - this.x);
      } else {
        this.wander(dt, 0.5);
      }
    } else if (distToNest > 70) {
      this.targetAngle = Math.atan2(nest.y - this.y, nest.x - this.x);
    } else {
      this.wander(dt, 0.6);
    }
  }

  returnHomeBehavior(dt, sim, nest) {
    // Check if close enough to see the nest directly
    const distToNest = Math.hypot(nest.x - this.x, nest.y - this.y);

    if (distToNest < 160) {
      this.targetAngle = Math.atan2(nest.y - this.y, nest.x - this.x);
    } else {
      // Sample Home Pheromones
      const sensor = sim.pheromones.sampleSensor(
        this.x,
        this.y,
        this.angle,
        this.caste.sensorDist,
        0.5,
        'home'
      );

      if (sensor.total > 0.08) {
        this.targetAngle = sensor.strongestAngle + (Math.random() - 0.5) * 0.1;
      } else {
        // Fallback: Head in general direction of nest with slight noise
        const directAngle = Math.atan2(nest.y - this.y, nest.x - this.x);
        this.targetAngle = directAngle + (Math.random() - 0.5) * 0.3;
      }
    }
  }

  wander(dt, intensity = 1.0) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 0.2 + Math.random() * 0.5;
      this.wanderAngleOffset = (Math.random() - 0.5) * 1.8 * intensity;
    }
    this.targetAngle += this.wanderAngleOffset * dt * 3.0;
  }

  integrateMovement(dt, sim) {
    // Smooth angle interpolation
    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    this.angle += diff * Math.min(1.0, this.turnSpeed * dt);

    // Calculate effective speed (boosted by upgrades or burdened by cargo)
    let effSpeed = this.speed * (sim.upgrades.speedMult || 1.0);
    if (this.cargo.amount > 0) {
      effSpeed *= 0.88;
    }

    // Velocity
    const moveX = Math.cos(this.angle) * effSpeed * dt;
    const moveY = Math.sin(this.angle) * effSpeed * dt;

    // Obstacle collision avoidance / resolution
    const nextX = this.x + moveX;
    const nextY = this.y + moveY;

    if (!sim.isBlocked(nextX, nextY, this.caste.size)) {
      this.x = nextX;
      this.y = nextY;
    } else {
      // Deflect angle on collision
      this.angle += (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.6);
      this.targetAngle = this.angle;
    }

    // World boundary bounce
    const pad = 20;
    if (this.x < pad) { this.x = pad; this.angle = 0; }
    if (this.x > sim.worldWidth - pad) { this.x = sim.worldWidth - pad; this.angle = Math.PI; }
    if (this.y < pad) { this.y = pad; this.angle = Math.PI * 0.5; }
    if (this.y > sim.worldHeight - pad) { this.y = sim.worldHeight - pad; this.angle = -Math.PI * 0.5; }
  }

  updatePheromoneDeposit(dt, sim) {
    this.depositTimer += dt;
    if (this.depositTimer < this.depositInterval) return;
    this.depositTimer = 0;

    const potency = (sim.upgrades.pheromonePotency || 1.0);

    // Returning home with food -> Deposit Food Pheromone Trail
    if (this.cargo.amount > 0 && this.state === 'RETURNING_HOME') {
      const intensity = (this.cargo.amount / this.caste.carryCapacity) * 1.5 * potency;
      sim.pheromones.deposit(this.x, this.y, 'food', intensity);
    }
    // Foraging from nest -> Deposit Home Pheromone Trail
    else if (this.state === 'FORAGING' || this.state === 'PATROLLING') {
      const nestDist = Math.hypot(sim.nest.x - this.x, sim.nest.y - this.y);
      const homeStrength = Math.max(0.2, (1 - nestDist / 1200)) * 0.8 * potency;
      sim.pheromones.deposit(this.x, this.y, 'home', homeStrength);
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.logActivity('Killed in action');
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.stage === LIFE_STAGES.EGG) {
      // Egg rendering (pearl white oval)
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (this.stage === LIFE_STAGES.LARVA) {
      // Larva rendering (segmented translucent grub)
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(-2, 0, 2.5, 0, Math.PI * 2);
      ctx.arc(1, 0, 3, 0, Math.PI * 2);
      ctx.arc(3.5, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (this.stage === LIFE_STAGES.PUPA) {
      // Pupa rendering (amber cocoon)
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Adult Ant rendering
    ctx.rotate(this.angle);

    const s = this.caste.size / 4.0;
    const bodyColor = this.caste.color;

    // Animated 6 legs
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2 * s;
    const legOffset = Math.sin(this.legPhase) * 2.5;

    // Left legs
    ctx.beginPath();
    ctx.moveTo(-1 * s, 0); ctx.lineTo(-3 * s, -6 * s + legOffset);
    ctx.moveTo(0, 0); ctx.lineTo(1 * s, -7 * s - legOffset);
    ctx.moveTo(2 * s, 0); ctx.lineTo(4 * s, -6 * s + legOffset);
    // Right legs
    ctx.moveTo(-1 * s, 0); ctx.lineTo(-3 * s, 6 * s - legOffset);
    ctx.moveTo(0, 0); ctx.lineTo(1 * s, 7 * s + legOffset);
    ctx.moveTo(2 * s, 0); ctx.lineTo(4 * s, 6 * s - legOffset);
    ctx.stroke();

    // Abdomen (gaster)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(-4.5 * s, 0, 4.5 * s, 3.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thorax (mesosoma)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5 * s, 1.8 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(4.2 * s, 0, 2.8 * s, 2.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(5.5 * s, -1 * s);
    ctx.lineTo(8.5 * s, -3.5 * s);
    ctx.moveTo(5.5 * s, 1 * s);
    ctx.lineTo(8.5 * s, 3.5 * s);
    ctx.stroke();

    // Mandibles (for soldiers / harvesters)
    if (this.caste.id === 'SOLDIER' || this.caste.id === 'HARVESTER') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(6.5 * s, -1.5 * s); ctx.lineTo(9.5 * s, -0.5 * s);
      ctx.moveTo(6.5 * s, 1.5 * s); ctx.lineTo(9.5 * s, 0.5 * s);
      ctx.stroke();
    }

    // Cargo indicator
    if (this.cargo.amount > 0) {
      if (this.cargo.type === 'sugar') ctx.fillStyle = '#38bdf8';
      else if (this.cargo.type === 'leaf') ctx.fillStyle = '#22c55e';
      else if (this.cargo.type === 'protein') ctx.fillStyle = '#f43f5e';
      else ctx.fillStyle = '#fbbf24';

      ctx.beginPath();
      ctx.arc(6.5 * s, 0, 2.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health bar if damaged
    if (this.hp < this.maxHp) {
      ctx.rotate(-this.angle);
      const hpPct = this.hp / this.maxHp;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-8, -12, 16, 2.5);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-8, -12, 16 * hpPct, 2.5);
    }

    ctx.restore();
  }
}
