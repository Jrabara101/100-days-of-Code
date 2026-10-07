/**
 * Master Application Controller
 * Cartographic Pathfinding Laboratory & Algorithmic Proving Ground
 */

import { TopologicalGrid, BIOMES } from './engine/grid.js';
import { astar, dijkstra, bidirectionalAstar, greedyBestFirst, bfs, dfs } from './engine/algorithms.js';
import { HEURISTIC_FORMULAS, generatePotentialField, computeRadarMetrics } from './engine/heuristics.js';
import { ViewportRenderer } from './ui/renderer.js';
import { RadarChart } from './ui/radarChart.js';
import { DailyCombineEngine } from './engine/combine.js';
import { ChaosSimulator } from './engine/chaos.js';
import { ingestLocation, CITY_PRESETS } from './engine/osm.js';
import { AudioSynthesizer } from './engine/audio.js';

class CartographicApp {
  constructor() {
    this.grid = new TopologicalGrid(50, 50);
    this.audio = new AudioSynthesizer();
    this.combineEngine = new DailyCombineEngine(this.grid);

    // Active Application Mode: 'solo' | 'duel' | 'combine' | 'chaos'
    this.currentMode = 'solo';

    // Tool state
    this.currentTool = 'brush'; // 'brush' | 'elev_up' | 'elev_down' | 'water_flow' | 'eraser' | 'start' | 'target'
    this.activeBiome = 'highway';
    this.brushRadius = 1;
    this.isMouseDown = false;
    this.lastPaintedCell = null;
    this.flowDragStart = null;

    // Algorithm Configs
    this.primaryAlgoKey = 'astar';
    this.secondaryAlgoKey = 'dijkstra';
    this.heuristicKey = 'octile';
    this.heuristicWeight = 1.2;
    this.allowDiagonal = true;

    // Execution & Replay Timeline
    this.isPlaying = false;
    this.isInstant = false;
    this.currentStepIdx = 0;
    this.recordedStepsA = [];
    this.recordedStepsB = [];
    this.maxSteps = 0;
    this.playSpeedMultiplier = 2.0;
    this.playTimer = null;
    this.resultA = null;
    this.resultB = null;

    // Renderers
    this.rendererA = null;
    this.rendererB = null;
    this.minimapCtx = null;
    this.radarChart = null;

    // Chaos Engine
    this.chaos = null;
  }

  init() {
    this.setupCanvases();
    this.setupChaos();
    this.setupUIBindings();
    this.setupMinimap();
    this.setupRadarChart();

    // Generate initial procedural topographic map
    this.grid.generateTopographicTerrain();

    // Start 60fps render loop
    const animate = (time) => {
      if (this.rendererA) this.rendererA.render(time);
      if (this.currentMode === 'duel' && this.rendererB) this.rendererB.render(time);
      this.updateMinimap();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // Initial run solve
    this.runSolve(true);
  }

  setupCanvases() {
    const canvasA = document.getElementById('canvas-primary');
    this.rendererA = new ViewportRenderer(canvasA, this.grid);

    const canvasB = document.getElementById('canvas-secondary');
    this.rendererB = new ViewportRenderer(canvasB, this.grid);

    window.addEventListener('resize', () => {
      this.rendererA.resize();
      this.rendererB.resize();
    });

    this.bindCanvasEvents(canvasA);
    this.bindCanvasEvents(canvasB);
  }

  setupChaos() {
    this.chaos = new ChaosSimulator(
      this.grid,
      (incident) => this.handleChaosIncident(incident),
      (agent, path) => this.handleAgentStep(agent, path)
    );
    this.rendererA.chaosSimulator = this.chaos;
    this.rendererB.chaosSimulator = this.chaos;
  }

  setupMinimap() {
    const minimapCanvas = document.getElementById('minimap-canvas');
    if (minimapCanvas) {
      this.minimapCtx = minimapCanvas.getContext('2d');
    }
  }

  setupRadarChart() {
    const radarContainer = document.getElementById('radar-container');
    if (radarContainer) {
      this.radarChart = new RadarChart(radarContainer);
    }
  }

  // =========================================================================
  // USER INTERACTION & CANVAS GESTURES
  // =========================================================================
  bindCanvasEvents(canvas) {
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;

    canvas.addEventListener('mousedown', (e) => {
      this.audio.ensureContext();
      if (e.button === 1 || e.shiftKey || e.spaceKey) {
        // Middle click or Shift/Space drag to pan camera
        isPanning = true;
        panStartX = e.clientX - this.rendererA.panX;
        panStartY = e.clientY - this.rendererA.panY;
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (e.button === 0) {
        this.isMouseDown = true;
        const rect = canvas.getBoundingClientRect();
        const coords = this.rendererA.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

        if (this.currentTool === 'water_flow') {
          this.flowDragStart = coords;
        } else {
          this.applyBrushAt(coords.x, coords.y);
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isPanning) {
        this.rendererA.panX = e.clientX - panStartX;
        this.rendererA.panY = e.clientY - panStartY;
        this.rendererB.panX = this.rendererA.panX;
        this.rendererB.panY = this.rendererA.panY;
        return;
      }

      if (this.isMouseDown) {
        const rect = canvas.getBoundingClientRect();
        const coords = this.rendererA.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

        if (this.currentTool !== 'water_flow') {
          this.applyBrushAt(coords.x, coords.y);
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isPanning) {
        isPanning = false;
        canvas.style.cursor = 'crosshair';
      }

      if (this.isMouseDown && this.currentTool === 'water_flow' && this.flowDragStart) {
        const rect = canvas.getBoundingClientRect();
        const coords = this.rendererA.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const angle = Math.atan2(coords.y - this.flowDragStart.y, coords.x - this.flowDragStart.x);
        this.grid.setWaterCurrent(this.flowDragStart.x, this.flowDragStart.y, angle, 1.2);
        this.flowDragStart = null;
        this.onMapModified();
      }

      this.isMouseDown = false;
      this.lastPaintedCell = null;
    });

    // Zoom on wheel
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const newZoom = Math.max(0.3, Math.min(4.0, this.rendererA.zoom * zoomFactor));

      // Zoom towards mouse focal point
      this.rendererA.panX = mouseX - (mouseX - this.rendererA.panX) * (newZoom / this.rendererA.zoom);
      this.rendererA.panY = mouseY - (mouseY - this.rendererA.panY) * (newZoom / this.rendererA.zoom);
      this.rendererA.zoom = newZoom;

      this.rendererB.panX = this.rendererA.panX;
      this.rendererB.panY = this.rendererA.panY;
      this.rendererB.zoom = newZoom;
    }, { passive: false });
  }

  applyBrushAt(gx, gy) {
    if (this.lastPaintedCell && this.lastPaintedCell.x === gx && this.lastPaintedCell.y === gy) {
      return;
    }
    this.lastPaintedCell = { x: gx, y: gy };

    const r = this.brushRadius - 1;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const cx = gx + dx;
        const cy = gy + dy;
        const node = this.grid.getNode(cx, cy);
        if (!node) continue;

        switch (this.currentTool) {
          case 'brush':
            this.grid.setBiome(cx, cy, this.activeBiome);
            break;
          case 'elev_up':
            this.grid.setElevation(cx, cy, node.elevation + 8);
            break;
          case 'elev_down':
            this.grid.setElevation(cx, cy, node.elevation - 8);
            break;
          case 'eraser':
            this.grid.setBiome(cx, cy, 'plain');
            this.grid.setElevation(cx, cy, 0);
            node.flowAngle = null;
            break;
          case 'start':
            this.grid.setStart(cx, cy);
            break;
          case 'target':
            this.grid.setTarget(cx, cy);
            break;
        }
      }
    }

    this.onMapModified();
  }

  onMapModified() {
    if (this.currentMode === 'chaos' && this.chaos.enabled) {
      return; // Do not auto-rerun full solve while chaos rover is driving
    }
    this.runSolve(true);
  }

  // =========================================================================
  // SOLVE & TIMELINE REPLAY CONTROLLER
  // =========================================================================
  getAlgorithmFn(key) {
    switch (key) {
      case 'astar': return astar;
      case 'dijkstra': return dijkstra;
      case 'bidirectional': return bidirectionalAstar;
      case 'greedy': return greedyBestFirst;
      case 'bfs': return bfs;
      case 'dfs': return dfs;
      default: return astar;
    }
  }

  runSolve(instant = false) {
    this.stopPlayback();

    const algoFnA = this.getAlgorithmFn(this.primaryAlgoKey);
    const optionsA = {
      heuristicKey: this.heuristicKey,
      heuristicWeight: this.heuristicWeight,
      allowDiagonal: this.allowDiagonal
    };

    this.resultA = algoFnA(this.grid, this.grid.start, this.grid.target, optionsA);
    this.recordedStepsA = this.resultA.steps || [];

    if (this.currentMode === 'duel') {
      const algoFnB = this.getAlgorithmFn(this.secondaryAlgoKey);
      const optionsB = {
        heuristicKey: this.heuristicKey,
        heuristicWeight: 1.0,
        allowDiagonal: this.allowDiagonal
      };
      this.resultB = algoFnB(this.grid, this.grid.start, this.grid.target, optionsB);
      this.recordedStepsB = this.resultB.steps || [];
      this.maxSteps = Math.max(this.recordedStepsA.length, this.recordedStepsB.length);
    } else {
      this.resultB = null;
      this.maxSteps = this.recordedStepsA.length;
    }

    this.updateTelemetryHUD();
    this.updateRadarView();

    const scrubber = document.getElementById('replay-scrubber');
    if (scrubber) {
      scrubber.max = Math.max(1, this.maxSteps);
      scrubber.value = instant ? this.maxSteps : 0;
    }

    if (instant) {
      this.scrubTo(this.maxSteps);
      if (this.resultA.pathFound) this.audio.playGoalFound();
    } else {
      this.scrubTo(0);
      this.startPlayback();
    }
  }

  scrubTo(stepIdx) {
    this.currentStepIdx = Math.max(0, Math.min(this.maxSteps, stepIdx));

    // Reset viewports
    this.rendererA.visitedNodes.clear();
    this.rendererA.frontierNodes.clear();
    this.rendererA.finalPath = [];

    if (this.rendererB) {
      this.rendererB.visitedNodes.clear();
      this.rendererB.frontierNodes.clear();
      this.rendererB.finalPath = [];
    }

    // Apply steps up to currentStepIdx for primary
    const stepsA = this.recordedStepsA.slice(0, this.currentStepIdx);
    for (const s of stepsA) {
      const key = `${s.x},${s.y}`;
      if (s.type === 'visit') {
        this.rendererA.visitedNodes.set(key, s);
      } else if (s.type === 'frontier') {
        this.rendererA.frontierNodes.set(key, s);
      } else if (s.type === 'path') {
        this.rendererA.finalPath = s.pathNodes;
      }
    }

    // Apply steps for secondary (if Duel)
    if (this.currentMode === 'duel' && this.rendererB) {
      const stepsB = this.recordedStepsB.slice(0, this.currentStepIdx);
      for (const s of stepsB) {
        const key = `${s.x},${s.y}`;
        if (s.type === 'visit') {
          this.rendererB.visitedNodes.set(key, s);
        } else if (s.type === 'frontier') {
          this.rendererB.frontierNodes.set(key, s);
        } else if (s.type === 'path') {
          this.rendererB.finalPath = s.pathNodes;
        }
      }
    }

    // If scrubbed to completion and path found, show path
    if (this.currentStepIdx >= this.recordedStepsA.length && this.resultA?.pathFound) {
      this.rendererA.finalPath = this.resultA.path;
    }
    if (this.currentMode === 'duel' && this.currentStepIdx >= this.recordedStepsB.length && this.resultB?.pathFound) {
      this.rendererB.finalPath = this.resultB.path;
    }

    // Update scrubber UI
    const scrubber = document.getElementById('replay-scrubber');
    const stepLabel = document.getElementById('scrubber-step-label');
    if (scrubber) scrubber.value = this.currentStepIdx;
    if (stepLabel) stepLabel.textContent = `STEP: ${this.currentStepIdx} / ${this.maxSteps}`;
  }

  startPlayback() {
    this.isPlaying = true;
    this.updatePlayPauseIcon();
    const interval = Math.max(10, Math.floor(60 / this.playSpeedMultiplier));

    if (this.playTimer) clearInterval(this.playTimer);
    this.playTimer = setInterval(() => {
      if (this.currentStepIdx < this.maxSteps) {
        this.currentStepIdx += Math.ceil(this.playSpeedMultiplier);
        this.scrubTo(this.currentStepIdx);

        // Sound effect tick based on step progress
        this.audio.playNodeTick(this.currentStepIdx / Math.max(1, this.maxSteps));
      } else {
        this.stopPlayback();
        this.audio.playGoalFound();
      }
    }, interval);
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    this.updatePlayPauseIcon();
  }

  togglePlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      if (this.currentStepIdx >= this.maxSteps) {
        this.scrubTo(0);
      }
      this.startPlayback();
    }
  }

  updatePlayPauseIcon() {
    const btn = document.getElementById('btn-play-pause');
    if (btn) {
      btn.innerHTML = this.isPlaying ? '⏸️' : '▶️';
    }
  }

  // =========================================================================
  // TELEMETRY & HUD METRICS
  // =========================================================================
  updateTelemetryHUD() {
    if (!this.resultA) return;

    const setMeter = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setMeter('meter-nodes-a', this.resultA.nodesExplored);
    setMeter('meter-cost-a', this.resultA.pathCost);
    setMeter('meter-length-a', `${this.resultA.pathLength} hops`);
    setMeter('meter-time-a', `${this.resultA.executionTimeMs} ms`);

    if (this.resultB) {
      setMeter('meter-nodes-b', this.resultB.nodesExplored);
      setMeter('meter-cost-b', this.resultB.pathCost);
      setMeter('meter-length-b', `${this.resultB.pathLength} hops`);
      setMeter('meter-time-b', `${this.resultB.executionTimeMs} ms`);
    }
  }

  updateRadarView() {
    if (!this.radarChart) return;
    const metricsA = computeRadarMetrics(this.resultA);
    const metricsB = this.resultB ? computeRadarMetrics(this.resultB, this.resultA.pathCost) : null;

    const nameA = document.getElementById('select-algo-a')?.selectedOptions[0]?.text || 'Algorithm A';
    const nameB = document.getElementById('select-algo-b')?.selectedOptions[0]?.text || 'Algorithm B';

    this.radarChart.update(metricsA, metricsB, nameA, nameB);
  }

  // =========================================================================
  // MINIMAP ENGINE
  // =========================================================================
  updateMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, w, h);

    const cellW = w / this.grid.width;
    const cellH = h / this.grid.height;

    // Draw biomes
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const node = this.grid.nodes[y][x];
        ctx.fillStyle = BIOMES[node.biome]?.color || '#0f172a';
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
      }
    }

    // Draw final path if available
    if (this.rendererA.finalPath && this.rendererA.finalPath.length > 0) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < this.rendererA.finalPath.length; i++) {
        const pt = this.rendererA.finalPath[i];
        if (i === 0) ctx.moveTo(pt.x * cellW, pt.y * cellH);
        else ctx.lineTo(pt.x * cellW, pt.y * cellH);
      }
      ctx.stroke();
    }

    // Draw start & target dots
    ctx.fillStyle = '#10b981';
    ctx.fillRect(this.grid.start.x * cellW - 1, this.grid.start.y * cellH - 1, 3, 3);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(this.grid.target.x * cellW - 1, this.grid.target.y * cellH - 1, 3, 3);
  }

  // =========================================================================
  // DYNAMIC CHAOS & AGENT SIMULATION
  // =========================================================================
  handleChaosIncident(incident) {
    this.audio.playChaosAlarm();
    this.showToast(incident.message, incident.type === 'agent_reroute' ? 'warn' : 'error');
  }

  handleAgentStep(agent, path) {
    // Optionally sound a soft navigation pulse
    this.audio.playNodeTick(agent.pathIndex / Math.max(1, path.length));
  }

  deployChaosAgent() {
    if (!this.resultA || !this.resultA.pathFound) {
      this.runSolve(true);
    }
    if (this.resultA && this.resultA.pathFound) {
      this.chaos.deployAgent(this.resultA.path);
      this.chaos.start();
      this.showToast('Autonomous agent deployed with D* Lite active sensor!', 'success');
    }
  }

  // =========================================================================
  // DAILY LABYRINTH COMBINE
  // =========================================================================
  loadDailyCombine(dateStr) {
    const cfg = this.combineEngine.loadDailyChallenge(dateStr);
    this.showToast(`Loaded Labyrinth Combine #${cfg.seed}`, 'success');
    this.rendererA.resetCamera();
    this.runSolve(true);
  }

  solveCombineChallenge() {
    const algoFn = this.getAlgorithmFn(this.primaryAlgoKey);
    const result = this.combineEngine.solveMultiCheckpointRoute(algoFn, {
      heuristicKey: this.heuristicKey,
      heuristicWeight: this.heuristicWeight,
      allowDiagonal: this.allowDiagonal
    });

    this.rendererA.finalPath = result.path;
    this.showScorecardModal();
  }

  showScorecardModal() {
    const modal = document.getElementById('modal-scorecard');
    const canvas = document.getElementById('scorecard-canvas');
    const shareTextEl = document.getElementById('scorecard-share-text');
    const minimapCanvas = document.getElementById('minimap-canvas');

    const algoName = document.getElementById('select-algo-a')?.selectedOptions[0]?.text || 'A*';

    this.combineEngine.renderScorecardGraphic(canvas, minimapCanvas, algoName);
    const shareText = this.combineEngine.generateSocialShareText(algoName);
    if (shareTextEl) shareTextEl.textContent = shareText;

    if (modal) modal.classList.add('open');
  }

  // =========================================================================
  // UI BINDINGS & MODE SWITCHING
  // =========================================================================
  setupUIBindings() {
    // Top Mode Tabs
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchMode(btn.dataset.mode);
      });
    });

    // Biome Selector Cards
    document.querySelectorAll('.biome-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.biome-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.activeBiome = card.dataset.biome;
        this.currentTool = 'brush';
      });
    });

    // Tool Selector Buttons
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });

    // Algorithm Selectors
    const selA = document.getElementById('select-algo-a');
    if (selA) selA.addEventListener('change', (e) => {
      this.primaryAlgoKey = e.target.value;
      this.runSolve(true);
    });

    const selB = document.getElementById('select-algo-b');
    if (selB) selB.addEventListener('change', (e) => {
      this.secondaryAlgoKey = e.target.value;
      if (this.currentMode === 'duel') this.runSolve(true);
    });

    // Heuristic Metric & Weight Dial
    const selH = document.getElementById('select-heuristic');
    if (selH) selH.addEventListener('change', (e) => {
      this.heuristicKey = e.target.value;
      this.runSolve(true);
    });

    const weightSlider = document.getElementById('slider-heuristic-weight');
    const weightLabel = document.getElementById('label-heuristic-weight');
    if (weightSlider) weightSlider.addEventListener('input', (e) => {
      this.heuristicWeight = parseFloat(e.target.value);
      if (weightLabel) weightLabel.textContent = `w = ${this.heuristicWeight.toFixed(1)}`;
      this.runSolve(true);
    });

    // Replay Controls
    document.getElementById('btn-play-pause')?.addEventListener('click', () => this.togglePlayback());
    document.getElementById('btn-step-prev')?.addEventListener('click', () => this.scrubTo(this.currentStepIdx - 1));
    document.getElementById('btn-step-next')?.addEventListener('click', () => this.scrubTo(this.currentStepIdx + 1));
    document.getElementById('btn-reset-solve')?.addEventListener('click', () => this.scrubTo(0));

    const scrubber = document.getElementById('replay-scrubber');
    if (scrubber) scrubber.addEventListener('input', (e) => {
      this.stopPlayback();
      this.scrubTo(parseInt(e.target.value, 10));
    });

    const speedSelect = document.getElementById('select-play-speed');
    if (speedSelect) speedSelect.addEventListener('change', (e) => {
      this.playSpeedMultiplier = parseFloat(e.target.value);
      if (this.isPlaying) {
        this.stopPlayback();
        this.startPlayback();
      }
    });

    // Global Action Buttons
    document.getElementById('btn-solve-now')?.addEventListener('click', () => this.runSolve(true));
    document.getElementById('btn-clear-grid')?.addEventListener('click', () => {
      this.grid.clearTerrain();
      this.runSolve(true);
    });

    // Procedural Generator Buttons
    document.getElementById('btn-gen-perlin')?.addEventListener('click', () => {
      this.grid.generateTopographicTerrain();
      this.runSolve(true);
    });
    document.getElementById('btn-gen-maze')?.addEventListener('click', () => {
      this.grid.generateRecursiveMaze();
      this.runSolve(true);
    });
    document.getElementById('btn-gen-voronoi')?.addEventListener('click', () => {
      this.grid.generateVoronoiBiomes();
      this.runSolve(true);
    });

    // City Ingestion Autocomplete Presets
    document.querySelectorAll('[data-city-preset]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cityKey = btn.dataset.cityPreset;
        const res = await ingestLocation(this.grid, cityKey);
        this.rendererA.resetCamera();
        this.runSolve(true);
        this.showToast(`Ingested ${res.preset.name}!`, 'success');
      });
    });

    // City Ingestion Search Input
    const cityInput = document.getElementById('input-city-search');
    const cityBtn = document.getElementById('btn-city-search');
    const runSearch = async () => {
      const q = cityInput?.value?.trim();
      if (q) {
        this.showToast(`Querying OSM vectors for "${q}"...`, 'warn');
        const res = await ingestLocation(this.grid, q);
        this.rendererA.resetCamera();
        this.runSolve(true);
        this.showToast(`Ingested ${res.preset.name}!`, 'success');
      }
    };
    if (cityBtn) cityBtn.addEventListener('click', runSearch);
    if (cityInput) cityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch();
    });

    // Audio Mute Toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    if (audioBtn) audioBtn.addEventListener('click', () => {
      this.audio.setMuted(!this.audio.muted);
      audioBtn.innerHTML = this.audio.muted ? '🔇' : '🔊';
    });

    // Combine Actions
    document.getElementById('btn-load-today-combine')?.addEventListener('click', () => {
      this.loadDailyCombine();
    });
    document.getElementById('btn-run-combine-solve')?.addEventListener('click', () => {
      this.solveCombineChallenge();
    });

    // Chaos Actions
    document.getElementById('btn-deploy-rover')?.addEventListener('click', () => {
      this.deployChaosAgent();
    });
    document.getElementById('btn-spawn-drone')?.addEventListener('click', () => {
      this.chaos.addPatrolDrone(20, 20);
      this.showToast('Patrol drone spawned!', 'warn');
    });
    document.getElementById('btn-spawn-collapse')?.addEventListener('click', () => {
      this.chaos.addCollapsingBridge(25, 25, 20);
      this.showToast('Bridge collapse scheduled at [25, 25]!', 'error');
    });

    // Scorecard Share Modal Close & Copy
    document.getElementById('btn-close-scorecard')?.addEventListener('click', () => {
      document.getElementById('modal-scorecard')?.classList.remove('open');
    });
    document.getElementById('btn-copy-scorecard-text')?.addEventListener('click', () => {
      const txt = document.getElementById('scorecard-share-text')?.textContent;
      if (txt) {
        navigator.clipboard.writeText(txt);
        this.showToast('Copied Markdown scorecard to clipboard!', 'success');
      }
    });
    document.getElementById('btn-download-scorecard-png')?.addEventListener('click', () => {
      const canvas = document.getElementById('scorecard-canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `labyrinth-combine-${this.combineEngine.seed}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    });

    // Potential field overlay toggle
    const toggleField = document.getElementById('toggle-potential-field');
    if (toggleField) toggleField.addEventListener('change', (e) => {
      const show = e.target.checked;
      this.rendererA.options.showPotentialField = show;
      if (show) {
        this.rendererA.options.potentialFieldData = generatePotentialField(this.grid, this.grid.target, this.heuristicKey, this.heuristicWeight);
      }
    });
  }

  switchMode(modeKey) {
    this.currentMode = modeKey;
    const arenaContainer = document.getElementById('arenas-container');
    const arenaCellB = document.getElementById('arena-cell-secondary');

    if (arenaContainer) {
      arenaContainer.classList.remove('solo', 'duel', 'quad');
      arenaContainer.classList.add(modeKey === 'duel' ? 'duel' : 'solo');
    }

    if (arenaCellB) {
      arenaCellB.style.display = modeKey === 'duel' ? 'flex' : 'none';
    }

    // Toggle sidebar sections according to active mode
    document.querySelectorAll('[data-mode-section]').forEach(sec => {
      sec.style.display = sec.dataset.modeSection.includes(modeKey) ? 'block' : 'none';
    });

    this.rendererA.resize();
    if (this.rendererB) this.rendererB.resize();

    if (modeKey === 'combine') {
      this.loadDailyCombine();
    } else {
      this.runSolve(true);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : (type === 'warn' ? '⚠️' : 'ℹ️')}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }
}

// Bootstrap Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new CartographicApp();
  app.init();
  window.__CARTOGRAPHIC_APP__ = app;
});
