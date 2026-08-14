/**
 * World Entities: Food Nodes, Obstacles, Predators, and Nest Architecture
 */

export class FoodNode {
  constructor(id, x, y, type = 'sugar', maxAmount = 100) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type; // 'sugar' | 'leaf' | 'protein' | 'honey'
    this.amount = maxAmount;
    this.maxAmount = maxAmount;
    this.radius = Math.max(8, Math.min(26, Math.sqrt(maxAmount) * 2.2));
  }

  take(requested = 1) {
    const taken = Math.min(this.amount, requested);
    this.amount -= taken;
    this.radius = Math.max(5, Math.min(26, Math.sqrt(this.amount) * 2.2));
    return taken;
  }

  render(ctx) {
    if (this.amount <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'sugar') {
      // Sparkling Cyan/Blue Sugar Crystal
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner crystal facets
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.5, 0);
      ctx.lineTo(this.radius * 0.5, 0);
      ctx.moveTo(0, -this.radius * 0.5);
      ctx.lineTo(0, this.radius * 0.5);
      ctx.stroke();
    } else if (this.type === 'leaf') {
      // Vibrant Green Foliage
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius, this.radius * 0.65, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'protein') {
      // Crimson/Amber Protein Beetle Shell
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'honey') {
      // Golden Glowing Honey Drop
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Amount Badge
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(this.amount)}`, 0, 0);

    ctx.restore();
  }
}

export class Obstacle {
  constructor(id, x, y, radius = 25, type = 'stone') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type; // 'stone' | 'water' | 'wood'
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'stone') {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stone texture cracks
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.4, -this.radius * 0.3);
      ctx.lineTo(this.radius * 0.3, this.radius * 0.2);
      ctx.stroke();
    } else if (this.type === 'water') {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class Predator {
  constructor(id, x, y, type = 'spider') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type; // 'spider' | 'beetle'
    this.name = type === 'spider' ? 'Shadow Spider' : 'Horned Beetle';
    this.maxHp = type === 'spider' ? 140 : 260;
    this.hp = this.maxHp;
    this.attack = type === 'spider' ? 15 : 12;
    this.speed = type === 'spider' ? 38 : 22;
    this.radius = type === 'spider' ? 12 : 15;
    this.angle = Math.random() * Math.PI * 2;
    this.target = null;
    this.attackCooldown = 0;
  }

  update(dt, sim) {
    this.attackCooldown -= dt;

    // Search for nearest ant to attack
    const targetAnt = sim.getNearestAnt(this.x, this.y, 140);

    if (targetAnt) {
      this.angle = Math.atan2(targetAnt.y - this.y, targetAnt.x - this.x);
      const dist = Math.hypot(targetAnt.x - this.x, targetAnt.y - this.y);

      if (dist > this.radius + 6) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
      } else if (this.attackCooldown <= 0) {
        // Deal damage to ant
        targetAnt.takeDamage(this.attack);
        this.attackCooldown = 1.0;
        sim.pheromones.deposit(this.x, this.y, 'danger', 3.0);
        sim.audioEngine?.playSFX('combat');
      }
    } else {
      // Gentle patrol wander
      this.angle += (Math.random() - 0.5) * 0.8 * dt;
      this.x += Math.cos(this.angle) * (this.speed * 0.4) * dt;
      this.y += Math.sin(this.angle) * (this.speed * 0.4) * dt;
    }

    // Boundary clamp
    this.x = Math.max(30, Math.min(sim.worldWidth - 30, this.x));
    this.y = Math.max(30, Math.min(sim.worldHeight - 30, this.y));
  }

  takeDamage(amount, attacker) {
    this.hp -= amount;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'spider') {
      // Spider Render
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Spider Eyes (Glowing Red)
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(6, -2.5, 1.5, 0, Math.PI * 2);
      ctx.arc(6, 2.5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 8 Legs
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i += 2) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(i * 3, -16);
        ctx.moveTo(0, 0);
        ctx.lineTo(i * 3, 16);
        ctx.stroke();
      }
    } else {
      // Armored Beetle Render
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shell Pincer / Horn
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -4); ctx.lineTo(18, 0);
      ctx.moveTo(10, 4); ctx.lineTo(18, 0);
      ctx.stroke();
    }

    // Health Bar
    ctx.rotate(-this.angle);
    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-14, -18, 28, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-14, -18, 28 * hpPct, 4);

    ctx.restore();
  }
}

export function generateInitialWorld(worldW = 2000, worldH = 1400) {
  const nest = {
    x: worldW / 2,
    y: worldH / 2,
    radius: 55,
    name: 'Primary Ant Mound',
    chambers: [
      { id: 'queen', name: "Queen's Chamber", x: worldW / 2, y: worldH / 2, radius: 45 },
      { id: 'nursery', name: 'Brood Nursery', x: worldW / 2 - 80, y: worldH / 2 + 50, radius: 40 },
      { id: 'granary', name: 'Food Granary', x: worldW / 2 + 80, y: worldH / 2 + 50, radius: 40 },
      { id: 'barracks', name: 'Soldier Barracks', x: worldW / 2, y: worldH / 2 - 80, radius: 40 },
    ]
  };

  const foodNodes = [
    new FoodNode(1, nest.x + 280, nest.y - 180, 'sugar', 180),
    new FoodNode(2, nest.x - 340, nest.y - 120, 'leaf', 220),
    new FoodNode(3, nest.x + 420, nest.y + 240, 'protein', 140),
    new FoodNode(4, nest.x - 260, nest.y + 320, 'sugar', 160),
    new FoodNode(5, nest.x + 120, nest.y - 380, 'honey', 250),
    new FoodNode(6, nest.x - 480, nest.y - 300, 'leaf', 190),
  ];

  const obstacles = [
    new Obstacle(1, nest.x + 140, nest.y - 90, 32, 'stone'),
    new Obstacle(2, nest.x - 160, nest.y - 80, 28, 'stone'),
    new Obstacle(3, nest.x + 200, nest.y + 120, 36, 'stone'),
    new Obstacle(4, nest.x - 210, nest.y + 150, 40, 'water'),
    new Obstacle(5, nest.x + 350, nest.y - 20, 24, 'stone'),
  ];

  const predators = [
    new Predator(1, nest.x + 450, nest.y - 250, 'spider'),
    new Predator(2, nest.x - 500, nest.y + 200, 'beetle'),
  ];

  return { nest, foodNodes, obstacles, predators };
}
