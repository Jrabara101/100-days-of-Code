/**
 * "Chaos Incident" Live Replanning & Dynamic Obstacles Engine
 * Autonomous Agent Simulation with D* Lite Rerouting
 * Cartographic Pathfinding Laboratory
 */

import { DStarLiteReplanner, astar } from './algorithms.js';

export class ChaosSimulator {
  constructor(grid, onIncident = () => {}, onAgentStep = () => {}) {
    this.grid = grid;
    this.onIncident = onIncident;
    this.onAgentStep = onAgentStep;

    this.enabled = false;
    this.patrolDrones = [];
    this.collapsingBridges = [];
    this.floodSources = [];
    this.agent = null;
    this.activePath = [];
    this.replanner = null;
    this.timer = null;
    this.tickIntervalMs = 280;
  }

  start() {
    this.enabled = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  stop() {
    this.enabled = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  addPatrolDrone(startX, startY, patrolPoints = []) {
    const drone = {
      id: `drone-${Date.now()}-${Math.random()}`,
      x: startX,
      y: startY,
      patrolPoints: patrolPoints.length > 0 ? patrolPoints : [
        { x: startX, y: startY },
        { x: Math.min(this.grid.width - 2, startX + 4), y: startY },
        { x: Math.min(this.grid.width - 2, startX + 4), y: Math.min(this.grid.height - 2, startY + 4) },
        { x: startX, y: Math.min(this.grid.height - 2, startY + 4) }
      ],
      currentPointIdx: 0,
      sensorRadius: 2
    };
    this.patrolDrones.push(drone);
    return drone;
  }

  addCollapsingBridge(x, y, countdownTicks = 20) {
    const bridge = {
      x,
      y,
      ticksRemaining: countdownTicks,
      collapsed: false
    };
    this.collapsingBridges.push(bridge);
    return bridge;
  }

  addFloodSource(x, y, maxRadius = 4) {
    const flood = {
      x,
      y,
      radius: 0,
      maxRadius,
      spreadIntervalTicks: 8,
      ticksUntilSpread: 8
    };
    this.floodSources.push(flood);
    return flood;
  }

  deployAgent(initialPath) {
    if (!initialPath || initialPath.length === 0) return;
    this.activePath = [...initialPath];
    this.agent = {
      x: initialPath[0].x,
      y: initialPath[0].y,
      pathIndex: 0,
      sensorRange: 3,
      isRerouting: false,
      rerouteHistory: []
    };

    // Initialize D* Lite replanner
    this.replanner = new DStarLiteReplanner(
      this.grid,
      { x: this.agent.x, y: this.agent.y },
      { x: this.grid.target.x, y: this.grid.target.y }
    );
  }

  tick() {
    if (!this.enabled) return;

    const changedNodes = [];

    // 1. Update Patrol Drones
    for (const drone of this.patrolDrones) {
      // Clear previous temporary obstacle
      const prevNode = this.grid.getNode(drone.x, drone.y);
      if (prevNode) {
        prevNode.isTemporaryObstacle = false;
        changedNodes.push(prevNode);
      }

      // Move toward next patrol waypoint
      const targetPoint = drone.patrolPoints[drone.currentPointIdx];
      const dx = Math.sign(targetPoint.x - drone.x);
      const dy = Math.sign(targetPoint.y - drone.y);

      drone.x += dx;
      drone.y += dy;

      if (drone.x === targetPoint.x && drone.y === targetPoint.y) {
        drone.currentPointIdx = (drone.currentPointIdx + 1) % drone.patrolPoints.length;
      }

      // Mark new temporary obstacle
      const currNode = this.grid.getNode(drone.x, drone.y);
      if (currNode && !currNode.isStart && !currNode.isTarget) {
        currNode.isTemporaryObstacle = true;
        changedNodes.push(currNode);
      }
    }

    // 2. Update Collapsing Bridges
    for (const bridge of this.collapsingBridges) {
      if (!bridge.collapsed) {
        bridge.ticksRemaining--;
        if (bridge.ticksRemaining <= 0) {
          bridge.collapsed = true;
          const node = this.grid.getNode(bridge.x, bridge.y);
          if (node) {
            node.biome = 'wall'; // Collapses into impassable chasm
            changedNodes.push(node);
            this.onIncident({
              type: 'bridge_collapse',
              x: bridge.x,
              y: bridge.y,
              message: `BRIDGE COLLAPSED at [${bridge.x}, ${bridge.y}]! Passage severed.`
            });
          }
        }
      }
    }

    // 3. Update Floodwaters
    for (const flood of this.floodSources) {
      if (flood.radius < flood.maxRadius) {
        flood.ticksUntilSpread--;
        if (flood.ticksUntilSpread <= 0) {
          flood.ticksUntilSpread = flood.spreadIntervalTicks;
          flood.radius++;

          // Flood nearby low cells
          for (let dy = -flood.radius; dy <= flood.radius; dy++) {
            for (let dx = -flood.radius; dx <= flood.radius; dx++) {
              if (Math.hypot(dx, dy) <= flood.radius) {
                const fn = this.grid.getNode(flood.x + dx, flood.y + dy);
                if (fn && fn.biome !== 'wall' && !fn.isStart && !fn.isTarget) {
                  if (fn.elevation < 25) {
                    fn.biome = 'swamp';
                    changedNodes.push(fn);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 4. Update Autonomous Agent & Live Rerouting
    if (this.agent && this.activePath.length > 0) {
      this.stepAgent(changedNodes);
    }
  }

  stepAgent(changedNodes) {
    if (!this.agent) return;

    // Check if upcoming path is obstructed within sensor range
    let obstacleDetected = false;
    let obstacleLocation = null;

    for (let i = this.agent.pathIndex + 1; i < Math.min(this.activePath.length, this.agent.pathIndex + this.agent.sensorRange + 1); i++) {
      const stepNode = this.grid.getNode(this.activePath[i].x, this.activePath[i].y);
      if (stepNode && !stepNode.isPassable()) {
        obstacleDetected = true;
        obstacleLocation = { x: stepNode.x, y: stepNode.y };
        break;
      }
    }

    if (obstacleDetected) {
      const replanStart = performance.now();
      this.agent.isRerouting = true;

      // Real-time D* Lite replan from current agent position
      let replanResult = null;
      if (this.replanner && changedNodes.length > 0) {
        replanResult = this.replanner.notifyCostChanged(changedNodes, { x: this.agent.x, y: this.agent.y });
      }

      // If D* Lite didn't resolve or was blocked, fallback to fast local A*
      if (!replanResult || !replanResult.pathFound) {
        replanResult = astar(this.grid, { x: this.agent.x, y: this.agent.y }, { x: this.grid.target.x, y: this.grid.target.y });
      }

      const replanDuration = (performance.now() - replanStart).toFixed(2);

      if (replanResult && replanResult.pathFound) {
        this.activePath = replanResult.path;
        this.agent.pathIndex = 0;
        this.agent.rerouteHistory.push({
          at: { x: this.agent.x, y: this.agent.y },
          obstacle: obstacleLocation,
          durationMs: replanDuration
        });

        this.onIncident({
          type: 'agent_reroute',
          x: obstacleLocation.x,
          y: obstacleLocation.y,
          durationMs: replanDuration,
          repairedSteps: replanResult.path.length,
          message: `INCIDENT REROUTE: Blockage detected at [${obstacleLocation.x}, ${obstacleLocation.y}]. D* Lite replanned in ${replanDuration}ms!`
        });
      } else {
        this.onIncident({
          type: 'agent_trapped',
          x: this.agent.x,
          y: this.agent.y,
          message: `CRITICAL ALERT: Agent trapped at [${this.agent.x}, ${this.agent.y}]! No viable bypass found.`
        });
      }
    } else {
      // Step agent forward along active route
      if (this.agent.pathIndex < this.activePath.length - 1) {
        this.agent.pathIndex++;
        const nextStep = this.activePath[this.agent.pathIndex];
        this.agent.x = nextStep.x;
        this.agent.y = nextStep.y;
        this.agent.isRerouting = false;

        this.onAgentStep(this.agent, this.activePath);
      }
    }
  }

  clear() {
    this.stop();
    // Reset any temporary obstacles
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        this.grid.nodes[y][x].isTemporaryObstacle = false;
      }
    }
    this.patrolDrones = [];
    this.collapsingBridges = [];
    this.floodSources = [];
    this.agent = null;
    this.activePath = [];
    this.replanner = null;
  }
}
