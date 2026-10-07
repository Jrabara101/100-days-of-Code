/**
 * High-Performance Viewport Canvas Renderer
 * Multi-layer rendering: Biomes, Contour lines, Flow chevrons, Wavefront expansion, and Particle paths
 * Cartographic Pathfinding Laboratory
 */

import { BIOMES } from '../engine/grid.js';

export class ViewportRenderer {
  constructor(canvas, grid, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.grid = grid;
    this.options = {
      showGridLines: true,
      showContourLines: true,
      showFlowVectors: true,
      showPotentialField: false,
      potentialFieldData: null,
      ...options
    };

    // Camera transform
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;

    // Simulation display state
    this.visitedNodes = new Map(); // key -> { x, y, timestamp, g, h }
    this.frontierNodes = new Map(); // key -> { x, y, g, h }
    this.finalPath = [];
    this.agent = null;
    this.chaosSimulator = null;

    // Animation ticker for water flow and pulse glows
    this.animTime = 0;

    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(300, Math.floor(rect.height * dpr));
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;

    // Center grid in canvas if initial
    if (this.zoom === 1.0 && this.panX === 0 && this.panY === 0) {
      this.resetCamera();
    }
  }

  resetCamera() {
    const cellSize = Math.min(
      (this.displayWidth * 0.9) / this.grid.width,
      (this.displayHeight * 0.9) / this.grid.height
    );
    this.zoom = cellSize / 20.0;
    this.panX = (this.displayWidth - this.grid.width * 20 * this.zoom) / 2;
    this.panY = (this.displayHeight - this.grid.height * 20 * this.zoom) / 2;
  }

  worldToScreen(gx, gy) {
    const baseCell = 20 * this.zoom;
    return {
      x: this.panX + gx * baseCell,
      y: this.panY + gy * baseCell,
      size: baseCell
    };
  }

  screenToWorld(sx, sy) {
    const baseCell = 20 * this.zoom;
    const gx = Math.floor((sx - this.panX) / baseCell);
    const gy = Math.floor((sy - this.panY) / baseCell);
    return { x: gx, y: gy };
  }

  render(currentTime = performance.now()) {
    this.animTime = currentTime;
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    // Deep space dark stage background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

    const baseCell = 20 * this.zoom;

    // 1. Render Potential Field Heatmap (if enabled)
    if (this.options.showPotentialField && this.options.potentialFieldData) {
      this.renderPotentialField(ctx, baseCell);
    }

    // 2. Render Base Cells & Biomes
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const node = this.grid.nodes[y][x];
        const screen = this.worldToScreen(x, y);

        // Frustum culling
        if (
          screen.x + screen.size < 0 ||
          screen.x > this.displayWidth ||
          screen.y + screen.size < 0 ||
          screen.y > this.displayHeight
        ) {
          continue;
        }

        this.renderCell(ctx, node, screen.x, screen.y, screen.size);
      }
    }

    // 3. Render Elevation Contour Lines (Topographic isolines)
    if (this.options.showContourLines) {
      this.renderContourLines(ctx, baseCell);
    }

    // 4. Render Directional Water Flow Chevrons
    if (this.options.showFlowVectors) {
      this.renderFlowVectors(ctx, baseCell);
    }

    // 5. Render Explored Search Wavefront (Visited & Frontier nodes)
    this.renderSearchWavefront(ctx, baseCell);

    // 6. Render Final Optimal Path Ribbon & Particles
    if (this.finalPath && this.finalPath.length > 0) {
      this.renderPathRibbon(ctx, baseCell);
    }

    // 7. Render Start, Target & Checkpoint Beacons
    this.renderBeacons(ctx, baseCell);

    // 8. Render Dynamic Chaos Hazards & Autonomous Agent
    if (this.chaosSimulator) {
      this.renderChaosEntities(ctx, baseCell);
    }

    ctx.restore();
  }

  renderCell(ctx, node, px, py, size) {
    const biome = BIOMES[node.biome] || BIOMES.plain;

    // Elevation tint modifier
    let baseColor = biome.color;
    if (node.elevation > 0 && node.biome !== 'wall') {
      const elevAlpha = (node.elevation / 100) * 0.35;
      ctx.fillStyle = baseColor;
      ctx.fillRect(px, py, size, size);
      ctx.fillStyle = `rgba(245, 158, 11, ${elevAlpha})`; // Warm contour tint
      ctx.fillRect(px, py, size, size);
    } else {
      ctx.fillStyle = baseColor;
      ctx.fillRect(px, py, size, size);
    }

    // Highway center stripe
    if (node.biome === 'highway') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.fillRect(px + size * 0.4, py, size * 0.2, size);
    }

    // Forest canopy dots
    if (node.biome === 'forest' && size > 10) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.beginPath();
      ctx.arc(px + size * 0.5, py + size * 0.5, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swamp marsh ripples
    if (node.biome === 'swamp' && size > 10) {
      ctx.fillStyle = 'rgba(132, 204, 22, 0.4)';
      ctx.fillRect(px + size * 0.2, py + size * 0.6, size * 0.6, size * 0.15);
    }

    // Bridge cross truss markings
    if (node.biome === 'bridge') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + size, py + size);
      ctx.moveTo(px + size, py);
      ctx.lineTo(px, py + size);
      ctx.stroke();
    }

    // Wall 3D beveled rock border
    if (node.biome === 'wall') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
    } else if (this.options.showGridLines && size > 7) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, size, size);
    }
  }

  renderContourLines(ctx, baseCell) {
    // Draw iso-elevation contour lines between cells with height differences
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1;

    for (let y = 0; y < this.grid.height - 1; y++) {
      for (let x = 0; x < this.grid.width - 1; x++) {
        const n = this.grid.nodes[y][x];
        const right = this.grid.nodes[y][x + 1];
        const down = this.grid.nodes[y + 1][x];

        const s = this.worldToScreen(x, y);

        // Check horizontal contour step (e.g. crossing a 15m elevation band)
        if (Math.floor(n.elevation / 15) !== Math.floor(right.elevation / 15)) {
          ctx.beginPath();
          ctx.moveTo(s.x + s.size, s.y);
          ctx.lineTo(s.x + s.size, s.y + s.size);
          ctx.stroke();
        }

        // Check vertical contour step
        if (Math.floor(n.elevation / 15) !== Math.floor(down.elevation / 15)) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y + s.size);
          ctx.lineTo(s.x + s.size, s.y + s.size);
          ctx.stroke();
        }
      }
    }
  }

  renderFlowVectors(ctx, baseCell) {
    if (baseCell < 10) return;
    const pulseOffset = (this.animTime * 0.003) % 1.0;

    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const node = this.grid.nodes[y][x];
        if (node.biome === 'water' && node.flowAngle !== null) {
          const s = this.worldToScreen(x, y);
          const cx = s.x + s.size * 0.5;
          const cy = s.y + s.size * 0.5;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(node.flowAngle);

          // Flow chevron arrow
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1.5;
          const arrowLen = s.size * 0.35;
          const animX = (pulseOffset - 0.5) * s.size * 0.4;

          ctx.beginPath();
          ctx.moveTo(animX - arrowLen * 0.5, -arrowLen * 0.3);
          ctx.lineTo(animX + arrowLen * 0.5, 0);
          ctx.lineTo(animX - arrowLen * 0.5, arrowLen * 0.3);
          ctx.stroke();

          ctx.restore();
        }
      }
    }
  }

  renderSearchWavefront(ctx, baseCell) {
    // 1. Visited Explored Nodes (Cyan / Violet wave)
    for (const [key, nodeData] of this.visitedNodes.entries()) {
      const s = this.worldToScreen(nodeData.x, nodeData.y);
      if (s.x + s.size < 0 || s.x > this.displayWidth || s.y + s.size < 0 || s.y > this.displayHeight) continue;

      ctx.fillStyle = nodeData.dir === 'backward' ? 'rgba(139, 92, 246, 0.35)' : 'rgba(0, 240, 255, 0.3)';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // 2. Frontier Perimeter Dots (Luminous Gold / Cyan)
    for (const [key, nodeData] of this.frontierNodes.entries()) {
      if (this.visitedNodes.has(key)) continue;
      const s = this.worldToScreen(nodeData.x, nodeData.y);
      if (s.x + s.size < 0 || s.x > this.displayWidth || s.y + s.size < 0 || s.y > this.displayHeight) continue;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.beginPath();
      ctx.arc(s.x + s.size * 0.5, s.y + s.size * 0.5, s.size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderPathRibbon(ctx, baseCell) {
    if (this.finalPath.length < 2) return;

    ctx.save();
    // Glowing under-glow
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = Math.max(3, baseCell * 0.4);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.finalPath.length; i++) {
      const pt = this.finalPath[i];
      const s = this.worldToScreen(pt.x, pt.y);
      const cx = s.x + s.size * 0.5;
      const cy = s.y + s.size * 0.5;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Sharp bright core line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, baseCell * 0.15);
    ctx.stroke();

    // Path Hop Nodes
    ctx.fillStyle = '#00f0ff';
    for (const pt of this.finalPath) {
      const s = this.worldToScreen(pt.x, pt.y);
      ctx.beginPath();
      ctx.arc(s.x + s.size * 0.5, s.y + s.size * 0.5, Math.max(2, baseCell * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderBeacons(ctx, baseCell) {
    const timeSec = this.animTime * 0.001;

    // Start Node (Pulsing Emerald Sonar)
    if (this.grid.start) {
      const s = this.worldToScreen(this.grid.start.x, this.grid.start.y);
      const cx = s.x + s.size * 0.5;
      const cy = s.y + s.size * 0.5;

      const pulseR = (s.size * 0.5) + Math.sin(timeSec * 4) * (s.size * 0.25);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cx, cy, s.size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Target Node (Cyan Hologram Reticle)
    if (this.grid.target) {
      const s = this.worldToScreen(this.grid.target.x, this.grid.target.y);
      const cx = s.x + s.size * 0.5;
      const cy = s.y + s.size * 0.5;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(timeSec * 1.5);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      const r = s.size * 0.45;
      ctx.strokeRect(-r, -r, r * 2, r * 2);

      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, s.size * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Resonance Checkpoints (Alpha, Beta, Gamma)
    if (this.grid.checkpoints) {
      for (const cp of this.grid.checkpoints) {
        const s = this.worldToScreen(cp.x, cp.y);
        const cx = s.x + s.size * 0.5;
        const cy = s.y + s.size * 0.5;

        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        // Diamond beacon
        ctx.moveTo(cx, cy - s.size * 0.45);
        ctx.lineTo(cx + s.size * 0.4, cy);
        ctx.lineTo(cx, cy + s.size * 0.45);
        ctx.lineTo(cx - s.size * 0.4, cy);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  renderChaosEntities(ctx, baseCell) {
    if (!this.chaosSimulator) return;

    // 1. Patrol Drones
    for (const drone of this.chaosSimulator.patrolDrones) {
      const s = this.worldToScreen(drone.x, drone.y);
      const cx = s.x + s.size * 0.5;
      const cy = s.y + s.size * 0.5;

      // Drone Sensor Range Halo
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.beginPath();
      ctx.arc(cx, cy, (drone.sensorRadius || 2) * s.size, 0, Math.PI * 2);
      ctx.fill();

      // Drone icon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, s.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. Collapsing Bridges (Warning Hazard)
    for (const bridge of this.chaosSimulator.collapsingBridges) {
      if (!bridge.collapsed) {
        const s = this.worldToScreen(bridge.x, bridge.y);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.fillRect(s.x, s.y, s.size, s.size);

        if (s.size > 14) {
          ctx.fillStyle = '#000000';
          ctx.font = '700 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${bridge.ticksRemaining}`, s.x + s.size * 0.5, s.y + s.size * 0.5);
        }
      }
    }

    // 3. Autonomous Rover Agent
    if (this.chaosSimulator.agent) {
      const agent = this.chaosSimulator.agent;
      const s = this.worldToScreen(agent.x, agent.y);
      const cx = s.x + s.size * 0.5;
      const cy = s.y + s.size * 0.5;

      // Forward Lidar Radar Cone
      ctx.fillStyle = agent.isRerouting ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 240, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, agent.sensorRange * s.size, 0, Math.PI * 2);
      ctx.fill();

      // Agent Vehicle Core
      ctx.fillStyle = agent.isRerouting ? '#ef4444' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(cx, cy, s.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  renderPotentialField(ctx, baseCell) {
    const { field, minVal, maxVal } = this.options.potentialFieldData;
    const range = Math.max(1, maxVal - minVal);

    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const s = this.worldToScreen(x, y);
        const val = field[y][x];
        const norm = (val - minVal) / range; // 0 to 1

        // Color ramp from cyan (close to goal) to purple to dark
        const alpha = Math.max(0.05, 0.35 * (1.0 - norm));
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    }
  }
}
