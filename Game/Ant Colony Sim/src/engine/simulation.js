import { PheromoneGrid } from './pheromoneGrid.js';
import { Ant, CASTES, LIFE_STAGES } from './antEntity.js';
import { FoodNode, Obstacle, Predator, generateInitialWorld } from './worldGenerator.js';
import { AudioEngine } from './audioEngine.js';

export class Simulation {
  constructor(worldWidth = 2000, worldHeight = 1400) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.pheromones = new PheromoneGrid(worldWidth, worldHeight, 10);
    this.audioEngine = new AudioEngine();

    // World & Nest Setup
    const initialWorld = generateInitialWorld(worldWidth, worldHeight);
    this.nest = initialWorld.nest;
    this.foodNodes = initialWorld.foodNodes;
    this.obstacles = initialWorld.obstacles;
    this.predators = initialWorld.predators;

    // Ants & Colony Population
    this.ants = [];
    this.nextAntId = 1;
    this.nextFoodId = 100;
    this.nextObstacleId = 100;
    this.nextPredatorId = 100;

    // Colony Resources
    this.resources = {
      sugar: 50,
      protein: 35,
      leaf: 20,
      honey: 10,
    };

    // Total stats tracked
    this.stats = {
      totalHatched: 0,
      totalDeaths: 0,
      foodGathered: 0,
      enemiesDefeated: 0,
      timeElapsed: 0,
    };

    // Caste Breeding Policy (Percentage Ratios)
    this.casteRatios = {
      WORKER: 0.45,
      SOLDIER: 0.20,
      SCOUT: 0.15,
      HARVESTER: 0.10,
      NURSE: 0.10,
    };

    // Colony Genetics & Evolution Tree
    this.upgrades = {
      speedMult: 1.0,
      pheromonePotency: 1.0,
      mandiblePower: 0,
      growthRate: 1.0,
      queenFertility: 1.0,
      armorDefense: 0,
      unlockedTechs: new Set(['basic_foraging']),
    };

    // Environment & Weather
    this.gameHour = 9.0; // 0.0 to 24.0
    this.weather = 'SUNNY'; // 'SUNNY' | 'RAIN' | 'WIND'
    this.weatherTimer = 45; // seconds until weather change
    this.rainIntensity = 0;

    // Time & Speed Controls
    this.speedFactor = 1.0;
    this.isPaused = false;

    // Interaction & Selection
    this.selectedEntity = null; // Ant, Food, Predator, Nest
    this.rallyPoint = null; // {x, y, type: 'ATTACK' | 'FORAGE'}

    // Notifications Feed
    this.notifications = [
      { id: 1, text: 'Colony established. Queen is ready to lay eggs.', type: 'info', time: 0 },
    ];

    // History Snapshots for Analytics
    this.historySnapshots = [];
    this.historyTimer = 0;

    // Initialize initial colony ants
    this.spawnInitialColony();
  }

  spawnInitialColony() {
    // Spawn Queen
    const queen = new Ant(this.nextAntId++, this.nest.x, this.nest.y, 'QUEEN', LIFE_STAGES.ADULT);
    this.ants.push(queen);
    this.stats.totalHatched++;

    // Initial workers
    for (let i = 0; i < 15; i++) {
      const x = this.nest.x + (Math.random() - 0.5) * 60;
      const y = this.nest.y + (Math.random() - 0.5) * 60;
      const worker = new Ant(this.nextAntId++, x, y, 'WORKER', LIFE_STAGES.ADULT);
      this.ants.push(worker);
      this.stats.totalHatched++;
    }

    // Initial soldiers
    for (let i = 0; i < 4; i++) {
      const x = this.nest.x + (Math.random() - 0.5) * 80;
      const y = this.nest.y + (Math.random() - 0.5) * 80;
      const soldier = new Ant(this.nextAntId++, x, y, 'SOLDIER', LIFE_STAGES.ADULT);
      this.ants.push(soldier);
      this.stats.totalHatched++;
    }

    // Initial scouts & nurses
    for (let i = 0; i < 3; i++) {
      const scout = new Ant(this.nextAntId++, this.nest.x, this.nest.y, 'SCOUT', LIFE_STAGES.ADULT);
      this.ants.push(scout);
      this.stats.totalHatched++;
    }
    for (let i = 0; i < 3; i++) {
      const nurse = new Ant(this.nextAntId++, this.nest.x - 40, this.nest.y + 30, 'NURSE', LIFE_STAGES.ADULT);
      this.ants.push(nurse);
      this.stats.totalHatched++;
    }

    // Initial eggs in nursery
    for (let i = 0; i < 6; i++) {
      this.spawnEgg(this.nest.x - 80 + (Math.random() - 0.5) * 30, this.nest.y + 50 + (Math.random() - 0.5) * 30);
    }
  }

  spawnEgg(x, y) {
    // Choose caste based on probability ratios
    const rand = Math.random();
    let accumulated = 0;
    let chosenCaste = 'WORKER';

    for (const [caste, ratio] of Object.entries(this.casteRatios)) {
      accumulated += ratio;
      if (rand <= accumulated) {
        chosenCaste = caste;
        break;
      }
    }

    const egg = new Ant(this.nextAntId++, x, y, chosenCaste, LIFE_STAGES.EGG);
    this.ants.push(egg);
    this.stats.totalHatched++;
  }

  addNotification(text, type = 'info') {
    this.notifications.unshift({
      id: Date.now() + Math.random(),
      text,
      type,
      time: this.stats.timeElapsed,
    });
    if (this.notifications.length > 20) {
      this.notifications.pop();
    }
  }

  depositCargo(cargo) {
    if (!cargo.type || cargo.amount <= 0) return;
    this.resources[cargo.type] = (this.resources[cargo.type] || 0) + cargo.amount;
    this.stats.foodGathered += cargo.amount;
  }

  update(dt) {
    if (this.isPaused) return;

    const scaledDt = dt * this.speedFactor;
    this.stats.timeElapsed += scaledDt;

    // Day/Night progression (24 minute full day-night cycle)
    this.gameHour = (this.gameHour + (scaledDt / 60)) % 24.0;

    // Weather simulation
    this.updateWeather(scaledDt);

    // Pheromone grid evaporation and diffusion
    this.pheromones.update(scaledDt, this.rainIntensity);

    // Update Ants
    for (let i = this.ants.length - 1; i >= 0; i--) {
      const ant = this.ants[i];
      ant.update(scaledDt, this);

      // Clean up dead ants
      if (ant.hp <= 0 && ant.stage === LIFE_STAGES.ADULT) {
        this.stats.totalDeaths++;
        if (ant.caste.id === 'QUEEN') {
          this.addNotification('CRITICAL: The Queen has fallen!', 'danger');
        }
        this.ants.splice(i, 1);
      }
    }

    // Update Predators
    for (let i = this.predators.length - 1; i >= 0; i--) {
      const pred = this.predators[i];
      pred.update(scaledDt, this);

      if (pred.hp <= 0) {
        // Drop protein carcass
        this.foodNodes.push(new FoodNode(this.nextFoodId++, pred.x, pred.y, 'protein', 60));
        this.stats.enemiesDefeated++;
        this.addNotification(`Defeated ${pred.name}! Harvestable protein carcass remains.`, 'success');
        this.audioEngine.playSFX('combat');
        this.predators.splice(i, 1);
      }
    }

    // Clean up empty food nodes
    this.foodNodes = this.foodNodes.filter(node => node.amount > 0);

    // Periodic dynamic spawning of new food and pests
    this.updateWorldEcology(scaledDt);

    // Analytics snapshot every 5 in-game seconds
    this.historyTimer += scaledDt;
    if (this.historyTimer >= 5.0) {
      this.historyTimer = 0;
      this.recordHistorySnapshot();
    }
  }

  updateWeather(dt) {
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 40 + Math.random() * 60;
      const weathers = ['SUNNY', 'SUNNY', 'SUNNY', 'RAIN', 'WIND'];
      const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
      if (nextWeather !== this.weather) {
        this.weather = nextWeather;
        this.addNotification(`Weather shifted to ${nextWeather}`, 'info');
      }
    }

    if (this.weather === 'RAIN') {
      this.rainIntensity = Math.min(1.0, this.rainIntensity + dt * 0.2);
    } else {
      this.rainIntensity = Math.max(0, this.rainIntensity - dt * 0.2);
    }
  }

  updateWorldEcology(dt) {
    // Random chance to spawn wild food
    if (this.foodNodes.length < 8 && Math.random() < 0.015 * dt) {
      const types = ['sugar', 'leaf', 'protein', 'honey'];
      const type = types[Math.floor(Math.random() * types.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 250 + Math.random() * 450;
      const x = Math.max(80, Math.min(this.worldWidth - 80, this.nest.x + Math.cos(angle) * dist));
      const y = Math.max(80, Math.min(this.worldHeight - 80, this.nest.y + Math.sin(angle) * dist));

      this.foodNodes.push(new FoodNode(this.nextFoodId++, x, y, type, 120 + Math.floor(Math.random() * 100)));
      this.addNotification(`Discovered new ${type} source in the wild!`, 'info');
    }

    // Random predator invasion
    if (this.predators.length < 4 && Math.random() < 0.005 * dt) {
      const type = Math.random() > 0.5 ? 'spider' : 'beetle';
      const edge = Math.floor(Math.random() * 4);
      let x = 50, y = 50;
      if (edge === 0) { x = Math.random() * this.worldWidth; y = 40; }
      else if (edge === 1) { x = this.worldWidth - 40; y = Math.random() * this.worldHeight; }
      else if (edge === 2) { x = Math.random() * this.worldWidth; y = this.worldHeight - 40; }
      else { x = 40; y = Math.random() * this.worldHeight; }

      this.predators.push(new Predator(this.nextPredatorId++, x, y, type));
      this.addNotification(`WARNING: A ${type === 'spider' ? 'Shadow Spider' : 'Horned Beetle'} approaches the nest!`, 'warning');
    }
  }

  recordHistorySnapshot() {
    const adults = this.ants.filter(a => a.stage === LIFE_STAGES.ADULT);
    const brood = this.ants.filter(a => a.stage !== LIFE_STAGES.ADULT);

    this.historySnapshots.push({
      time: Math.floor(this.stats.timeElapsed),
      population: adults.length,
      brood: brood.length,
      sugar: Math.floor(this.resources.sugar),
      protein: Math.floor(this.resources.protein),
      leaf: Math.floor(this.resources.leaf),
    });

    if (this.historySnapshots.length > 50) {
      this.historySnapshots.shift();
    }
  }

  // --- Entity Queries ---
  getNearestFood(x, y, maxDist = 200) {
    let bestNode = null;
    let minDist = maxDist;

    for (const node of this.foodNodes) {
      if (node.amount <= 0) continue;
      const d = Math.hypot(node.x - x, node.y - y);
      if (d < minDist) {
        minDist = d;
        bestNode = node;
      }
    }
    return bestNode;
  }

  getNearestEnemy(x, y, maxDist = 150) {
    let bestPred = null;
    let minDist = maxDist;

    for (const pred of this.predators) {
      if (pred.hp <= 0) continue;
      const d = Math.hypot(pred.x - x, pred.y - y);
      if (d < minDist) {
        minDist = d;
        bestPred = pred;
      }
    }
    return bestPred;
  }

  getNearestAnt(x, y, maxDist = 100) {
    let bestAnt = null;
    let minDist = maxDist;

    for (const ant of this.ants) {
      if (ant.stage !== LIFE_STAGES.ADULT || ant.hp <= 0) continue;
      const d = Math.hypot(ant.x - x, ant.y - y);
      if (d < minDist) {
        minDist = d;
        bestAnt = ant;
      }
    }
    return bestAnt;
  }

  getNearestBrood(x, y, maxDist = 100) {
    let bestBrood = null;
    let minDist = maxDist;

    for (const ant of this.ants) {
      if (ant.stage === LIFE_STAGES.ADULT) continue;
      const d = Math.hypot(ant.x - x, ant.y - y);
      if (d < minDist) {
        minDist = d;
        bestBrood = ant;
      }
    }
    return bestBrood;
  }

  getNurseBonusNear(x, y) {
    let bonus = 0;
    for (const ant of this.ants) {
      if (ant.caste.id === 'NURSE' && ant.stage === LIFE_STAGES.ADULT) {
        const d = Math.hypot(ant.x - x, ant.y - y);
        if (d < 80) bonus += 0.35;
      }
    }
    return Math.min(1.5, bonus);
  }

  isBlocked(x, y, radius = 5) {
    for (const obs of this.obstacles) {
      const dist = Math.hypot(obs.x - x, obs.y - y);
      if (dist < obs.radius + radius) {
        return true;
      }
    }
    return false;
  }

  // --- God Player Tools ---
  dropFood(x, y, type = 'sugar', amount = 100) {
    this.foodNodes.push(new FoodNode(this.nextFoodId++, x, y, type, amount));
    this.addNotification(`Created ${amount}x ${type} cluster`, 'success');
    this.audioEngine.playSFX('deposit');
  }

  placeObstacle(x, y, type = 'stone', radius = 30) {
    this.obstacles.push(new Obstacle(this.nextObstacleId++, x, y, radius, type));
    this.addNotification(`Placed ${type} barrier`, 'info');
  }

  spawnAntAt(x, y, caste = 'WORKER') {
    const ant = new Ant(this.nextAntId++, x, y, caste, LIFE_STAGES.ADULT);
    this.ants.push(ant);
    this.stats.totalHatched++;
    this.addNotification(`Spawned adult ${CASTES[caste]?.name || caste}`, 'success');
    this.audioEngine.playSFX('queenEgg');
  }

  squishEntityAt(x, y) {
    // Check predators
    for (const pred of this.predators) {
      if (Math.hypot(pred.x - x, pred.y - y) < pred.radius + 15) {
        pred.takeDamage(100);
        this.addNotification(`Squished ${pred.name}!`, 'danger');
        this.audioEngine.playSFX('combat');
        return;
      }
    }
  }

  setRallyBeacon(x, y) {
    this.rallyPoint = { x, y };
    this.pheromones.deposit(x, y, 'food', 15.0);
    this.addNotification('Beacon rally signal placed!', 'info');
  }

  clearRallyBeacon() {
    this.rallyPoint = null;
  }

  // --- Upgrade Purchase ---
  unlockUpgrade(techId, cost) {
    if (
      this.resources.sugar >= cost.sugar &&
      this.resources.protein >= cost.protein &&
      this.resources.leaf >= cost.leaf
    ) {
      this.resources.sugar -= cost.sugar;
      this.resources.protein -= cost.protein;
      this.resources.leaf -= cost.leaf;

      this.upgrades.unlockedTechs.add(techId);

      if (techId === 'pheromone_potency_1') this.upgrades.pheromonePotency += 0.4;
      if (techId === 'pheromone_potency_2') this.upgrades.pheromonePotency += 0.6;
      if (techId === 'ant_speed_1') this.upgrades.speedMult += 0.25;
      if (techId === 'mandible_crush') this.upgrades.mandiblePower += 10;
      if (techId === 'queen_fertility') this.upgrades.queenFertility += 0.5;
      if (techId === 'brood_growth') this.upgrades.growthRate += 0.4;

      this.addNotification(`Unlocked Genetic Tech: ${techId.replace(/_/g, ' ').toUpperCase()}`, 'success');
      this.audioEngine.playSFX('upgrade');
      return true;
    }
    return false;
  }
}
