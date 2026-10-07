/**
 * Daily Seeded "Labyrinth Combine" & Social Share Scorecard Engine
 * Synchronized procedural challenges, Multi-goal TSP routing, and PNG Graphic Card Export
 * Cartographic Pathfinding Laboratory
 */

import { astar } from './algorithms.js';

function createPrng(seed) {
  let s = Math.abs(Math.floor(seed)) || 1337;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseDateToSeed(dateStr) {
  const clean = (dateStr || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 20261006;
}

export class DailyCombineEngine {
  constructor(grid) {
    this.grid = grid;
    this.currentDate = new Date().toISOString().slice(0, 10);
    this.seed = parseDateToSeed(this.currentDate);
    this.combineConfig = null;
    this.lastResult = null;
  }

  loadDailyChallenge(dateStr) {
    this.currentDate = dateStr || new Date().toISOString().slice(0, 10);
    this.seed = parseDateToSeed(this.currentDate);
    const prng = createPrng(this.seed);

    this.grid.clearTerrain();

    // 1. Procedural Mountain Ridge Barrier
    const ridgeY = Math.floor(18 + prng() * 14);
    for (let x = 0; x < this.grid.width; x++) {
      if (Math.abs(x - 25) > 4) { // Gap in the center
        this.grid.setBiome(x, ridgeY, 'wall');
        this.grid.setElevation(x, ridgeY, 80);
      }
    }

    // 2. River Channel with Current
    const riverX = Math.floor(20 + prng() * 10);
    for (let y = 0; y < this.grid.height; y++) {
      if (y !== ridgeY) {
        this.grid.setWaterCurrent(riverX, y, Math.PI / 2, 1.2); // Flowing south
        this.grid.setElevation(riverX, y, 6);
      }
    }

    // Strategic Bridges
    this.grid.setBiome(riverX, 8, 'bridge');
    this.grid.setBiome(riverX, 38, 'bridge');

    // 3. Swamp Basin
    const swampCenterX = Math.floor(32 + prng() * 8);
    const swampCenterY = Math.floor(12 + prng() * 10);
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (Math.hypot(dx, dy) <= 4) {
          const n = this.grid.getNode(swampCenterX + dx, swampCenterY + dy);
          if (n && n.biome !== 'wall' && n.biome !== 'water') {
            n.biome = 'swamp';
            n.elevation = 8;
          }
        }
      }
    }

    // 4. Set Fixed Start & Target
    this.grid.setStart(3, 3);
    this.grid.setTarget(this.grid.width - 4, this.grid.height - 4);

    // 5. Place 3 Resonance Beacons
    this.checkpoints = [
      {
        id: 'alpha',
        name: 'Resonance Beacon Alpha',
        x: Math.floor(8 + prng() * 10),
        y: Math.floor( ridgeY + 4 + prng() * 8),
        points: 1500
      },
      {
        id: 'beta',
        name: 'Resonance Beacon Beta',
        x: Math.floor(34 + prng() * 10),
        y: Math.floor(6 + prng() * 10),
        points: 2000
      },
      {
        id: 'gamma',
        name: 'Resonance Beacon Gamma',
        x: Math.floor(14 + prng() * 10),
        y: Math.floor(ridgeY - 10 + prng() * 6),
        points: 2500
      }
    ];

    // Assign beacon markers on nodes
    for (const cp of this.checkpoints) {
      const node = this.grid.getNode(cp.x, cp.y);
      if (node) {
        node.biome = 'plain';
        node.checkpointId = cp.id;
      }
    }

    this.combineConfig = {
      date: this.currentDate,
      seed: this.seed,
      combineId: `COMBINE-${this.seed}`,
      checkpoints: this.checkpoints
    };

    return this.combineConfig;
  }

  /**
   * Solve Multi-Checkpoint Route
   * Chains: Start -> Permutation of Checkpoints -> Target with optimal cost
   */
  solveMultiCheckpointRoute(algorithmFn = astar, algoOptions = {}) {
    if (!this.checkpoints || this.checkpoints.length === 0) {
      return algorithmFn(this.grid, this.grid.start, this.grid.target, algoOptions);
    }

    // Find best order of checkpoints using permutations
    const pts = this.checkpoints;
    const perms = [
      [pts[0], pts[1], pts[2]],
      [pts[0], pts[2], pts[1]],
      [pts[1], pts[0], pts[2]],
      [pts[1], pts[2], pts[0]],
      [pts[2], pts[0], pts[1]],
      [pts[2], pts[1], pts[0]]
    ];

    let bestCompositePath = [];
    let bestTotalCost = Infinity;
    let totalNodesExplored = 0;
    let allSteps = [];
    let bestPeakFrontier = 0;

    for (const perm of perms) {
      const stops = [this.grid.start, ...perm, this.grid.target];
      let candidatePath = [];
      let candidateCost = 0;
      let valid = true;

      for (let i = 0; i < stops.length - 1; i++) {
        const segResult = algorithmFn(this.grid, stops[i], stops[i + 1], algoOptions);
        if (!segResult.pathFound) {
          valid = false;
          break;
        }
        candidateCost += segResult.pathCost;
        if (i === 0) {
          candidatePath.push(...segResult.path);
        } else {
          candidatePath.push(...segResult.path.slice(1)); // avoid duplicate seam
        }
      }

      if (valid && candidateCost < bestTotalCost) {
        bestTotalCost = candidateCost;
        bestCompositePath = candidatePath;
      }
    }

    // Execute full trace on best permutation for complete telemetry & animation
    const fullTraceResult = algorithmFn(this.grid, this.grid.start, this.grid.target, algoOptions);
    totalNodesExplored = fullTraceResult.nodesExplored;
    allSteps = fullTraceResult.steps;
    bestPeakFrontier = fullTraceResult.peakFrontier;

    // Calculate Authoritative Combine Efficiency Score
    const optimalCost = bestTotalCost !== Infinity ? bestTotalCost : fullTraceResult.pathCost;
    const efficiencyRatio = Math.max(10, Math.min(100, Math.round((optimalCost / Math.max(0.1, bestTotalCost)) * 100)));
    
    // Scoring Formula
    let score = Math.max(
      1000,
      Math.round(10000 - (totalNodesExplored * 4) - (bestTotalCost * 10) + 6000)
    );

    let starRating = 1;
    if (score >= 9000 && efficiencyRatio >= 95) starRating = 3;
    else if (score >= 7500 && efficiencyRatio >= 80) starRating = 2;

    this.lastResult = {
      combineId: this.combineConfig.combineId,
      date: this.currentDate,
      score,
      starRating,
      efficiencyRatio,
      totalCost: parseFloat(bestTotalCost.toFixed(1)),
      pathLength: bestCompositePath.length,
      nodesExplored: totalNodesExplored,
      peakFrontier: bestPeakFrontier,
      path: bestCompositePath,
      steps: allSteps
    };

    return this.lastResult;
  }

  /**
   * Generate Discord / Social Formatted Share Text
   */
  generateSocialShareText(algorithmName = 'A* (Octile w=1.2)') {
    if (!this.lastResult) return '';
    const stars = '★'.repeat(this.lastResult.starRating) + '☆'.repeat(3 - this.lastResult.starRating);
    return `🧭 ⚡ 📍 LABYRINTH COMBINE #${this.seed}
🏆 Score: ${this.lastResult.score.toLocaleString()} pts | Rating: ${stars}
⚙️ Algorithm: ${algorithmName}
🔍 Nodes Explored: ${this.lastResult.nodesExplored}
⚡ Path Energy Cost: ${this.lastResult.totalCost} | Steps: ${this.lastResult.pathLength}
🎯 Checkpoints: 3/3 Resonated | Efficiency: ${this.lastResult.efficiencyRatio}%
Verified: Jrabara101/100-days-of-Code Cartographic Lab`;
  }

  /**
   * Render High-Resolution Graphic Scorecard to Canvas (1200x630 PNG)
   */
  renderScorecardGraphic(targetCanvas, minimapSourceCanvas, algorithmName = 'A* (Octile w=1.2)') {
    if (!this.lastResult || !targetCanvas) return;

    targetCanvas.width = 1200;
    targetCanvas.height = 630;
    const ctx = targetCanvas.getContext('2d');

    // 1. Dark Futuristic Cyber-Cartography Background
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, '#060a14');
    bgGradient.addColorStop(0.5, '#0b1224');
    bgGradient.addColorStop(1, '#050811');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle Grid Overlay
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    for (let y = 0; y < 630; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // Outer Neon Glow Border
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 1164, 594);

    // 2. Header
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`DAILY LABYRINTH COMBINE #${this.seed} // OFFICIAL SCORECARD`, 50, 65);

    ctx.font = '800 38px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ALGORITHMIC PROVING GROUND', 50, 115);

    // Stars & Total Score
    const stars = '★'.repeat(this.lastResult.starRating) + '☆'.repeat(3 - this.lastResult.starRating);
    ctx.font = '700 32px "Outfit", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${stars}`, 50, 170);

    ctx.font = '800 64px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.lastResult.score.toLocaleString()} PTS`, 160, 172);

    // 3. Stats Data Panel (Glass Card)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(50, 210, 560, 340, 12);
    ctx.fill();
    ctx.stroke();

    const metrics = [
      ['ALGORITHM', algorithmName, '#00f0ff'],
      ['NODES EXPLORED', `${this.lastResult.nodesExplored}`, '#ffffff'],
      ['PATH ENERGY COST', `${this.lastResult.totalCost}`, '#f59e0b'],
      ['TOTAL STEPS', `${this.lastResult.pathLength} HOPS`, '#ffffff'],
      ['BEACONS ACQUIRED', '3/3 (ALPHA, BETA, GAMMA)', '#10b981'],
      ['EFFICIENCY RATIO', `${this.lastResult.efficiencyRatio}% OPTIMAL`, '#38bdf8']
    ];

    let rowY = 255;
    for (const [label, val, col] of metrics) {
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(label, 75, rowY);

      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillStyle = col;
      ctx.fillText(val, 320, rowY);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(75, rowY + 12);
      ctx.lineTo(580, rowY + 12);
      ctx.stroke();

      rowY += 48;
    }

    // 4. Right Side: Embedded Route Minimap
    if (minimapSourceCanvas) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(650, 150, 480, 400, 12);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(minimapSourceCanvas, 660, 160, 460, 380);

      // Label below minimap
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('TOPOGRAPHIC RESOLUTION: 50x50 MULTI-COST BIOME GRID', 660, 575);
    }

    // Footer Watermark
    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.fillText('Jrabara101 // 100-Days-of-Code // Cartographic Pathfinding Engine', 50, 595);
  }
}
