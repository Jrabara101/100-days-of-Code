/**
 * Algorithmic Suite & Step Recording Engine
 * Implements A*, Dijkstra, Bidirectional A*, Greedy Best-First, BFS, DFS, JPS, and D* Lite / LPA*
 * Cartographic Pathfinding Laboratory
 */

import { HEURISTIC_FORMULAS } from './heuristics.js';

// =========================================================================
// 1. FAST BINARY MIN-HEAP PRIORITY QUEUE
// =========================================================================
export class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.comparator = comparator;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap[0] || null;
  }

  enqueue(item, priority) {
    const node = { item, priority };
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top.item;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIdx = (index - 1) >>> 1;
      if (this.comparator(this.heap[index], this.heap[parentIdx]) < 0) {
        const tmp = this.heap[index];
        this.heap[index] = this.heap[parentIdx];
        this.heap[parentIdx] = tmp;
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  _sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      const leftChild = (index << 1) + 1;
      const rightChild = leftChild + 1;
      let smallest = index;

      if (leftChild < length && this.comparator(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < length && this.comparator(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        const tmp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = tmp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Common Result Builder
 */
function createResult(pathFound, path, pathCost, steps, exploredSet, peakFrontier, startTime, grid) {
  const endTime = performance.now();
  const executionTimeMs = parseFloat((endTime - startTime).toFixed(2));

  // Compute heuristic divergence along the final path if path exists
  let heuristicDivergence = 0;
  if (pathFound && path.length > 1) {
    let diffSum = 0;
    const target = path[path.length - 1];
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const actualRemainingCost = pathCost - u.g;
      const estimatedH = HEURISTIC_FORMULAS.octile.calculate(target.x - u.x, target.y - u.y);
      diffSum += Math.abs(actualRemainingCost - estimatedH);
    }
    heuristicDivergence = parseFloat((diffSum / (path.length - 1)).toFixed(2));
  }

  return {
    pathFound,
    path: path.map(n => ({ x: n.x, y: n.y })),
    pathCost: parseFloat(pathCost.toFixed(2)),
    pathLength: path.length,
    nodesExplored: exploredSet.size,
    totalCells: grid.width * grid.height,
    peakFrontier,
    executionTimeMs,
    heuristicDivergence,
    steps // Recorded step timeline for playback scrubber
  };
}

// =========================================================================
// 2. A* SEARCH ALGORITHM
// =========================================================================
export function astar(grid, startCoord, targetCoord, options = {}) {
  const startTime = performance.now();
  const {
    heuristicKey = 'octile',
    heuristicWeight = 1.0,
    allowDiagonal = true,
    tieBreaking = true
  } = options;

  const hFn = HEURISTIC_FORMULAS[heuristicKey]?.calculate || HEURISTIC_FORMULAS.octile.calculate;
  const start = grid.getNode(startCoord.x, startCoord.y);
  const target = grid.getNode(targetCoord.x, targetCoord.y);

  if (!start || !target || !start.isPassable() || !target.isPassable()) {
    return createResult(false, [], 0, [], new Set(), 0, startTime, grid);
  }

  const pq = new PriorityQueue((a, b) => a.priority - b.priority);
  const gScores = new Map();
  const cameFrom = new Map();
  const visitedSet = new Set();
  const steps = [];

  const keyOf = (n) => `${n.x},${n.y}`;
  const startKey = keyOf(start);
  const targetKey = keyOf(target);

  gScores.set(startKey, 0);

  // Tie-breaking factor to prefer paths along the straight line to goal
  const initialH = hFn(target.x - start.x, target.y - start.y) * heuristicWeight;
  pq.enqueue(start, initialH);

  let peakFrontier = 1;
  let targetFound = false;

  while (!pq.isEmpty()) {
    if (pq.size() > peakFrontier) peakFrontier = pq.size();

    const current = pq.dequeue();
    const currentKey = keyOf(current);

    if (visitedSet.has(currentKey)) continue;
    visitedSet.add(currentKey);

    steps.push({
      type: 'visit',
      x: current.x,
      y: current.y,
      g: gScores.get(currentKey) || 0,
      f: current.fVal || 0
    });

    if (currentKey === targetKey) {
      targetFound = true;
      break;
    }

    const currentG = gScores.get(currentKey);
    const neighbors = grid.getNeighbors(current, allowDiagonal);

    for (const neighbor of neighbors) {
      const neighborKey = keyOf(neighbor);
      if (visitedSet.has(neighborKey)) continue;

      const edgeCost = grid.getEdgeCost(current, neighbor);
      const tentativeG = currentG + edgeCost;
      const knownG = gScores.get(neighborKey) ?? Infinity;

      if (tentativeG < knownG) {
        cameFrom.set(neighborKey, current);
        gScores.set(neighborKey, tentativeG);

        let hVal = hFn(target.x - neighbor.x, target.y - neighbor.y) * heuristicWeight;
        if (tieBreaking) {
          // Slight epsilon nudge proportional to cross product with start-target vector
          const dx1 = neighbor.x - target.x;
          const dy1 = neighbor.y - target.y;
          const dx2 = start.x - target.x;
          const dy2 = start.y - target.y;
          const cross = Math.abs(dx1 * dy2 - dx2 * dy1);
          hVal += cross * 0.001;
        }

        const fVal = tentativeG + hVal;
        neighbor.fVal = fVal;
        pq.enqueue(neighbor, fVal);

        steps.push({
          type: 'frontier',
          x: neighbor.x,
          y: neighbor.y,
          g: tentativeG,
          h: hVal,
          f: fVal
        });
      }
    }
  }

  // Path reconstruction
  const path = [];
  let pathCost = 0;
  if (targetFound) {
    let curr = target;
    while (curr) {
      path.unshift({ x: curr.x, y: curr.y, g: gScores.get(keyOf(curr)) || 0 });
      curr = cameFrom.get(keyOf(curr));
    }
    pathCost = gScores.get(targetKey) || 0;
    steps.push({ type: 'path', pathNodes: path });
  }

  return createResult(targetFound, path, pathCost, steps, visitedSet, peakFrontier, startTime, grid);
}

// =========================================================================
// 3. DIJKSTRA'S ALGORITHM (UNIFORM-COST SEARCH)
// =========================================================================
export function dijkstra(grid, startCoord, targetCoord, options = {}) {
  // Dijkstra is equivalent to A* with heuristic weight w = 0
  return astar(grid, startCoord, targetCoord, {
    ...options,
    heuristicWeight: 0.0,
    tieBreaking: false
  });
}

// =========================================================================
// 4. GREEDY BEST-FIRST SEARCH
// =========================================================================
export function greedyBestFirst(grid, startCoord, targetCoord, options = {}) {
  const startTime = performance.now();
  const { heuristicKey = 'octile', allowDiagonal = true } = options;
  const hFn = HEURISTIC_FORMULAS[heuristicKey]?.calculate || HEURISTIC_FORMULAS.octile.calculate;

  const start = grid.getNode(startCoord.x, startCoord.y);
  const target = grid.getNode(targetCoord.x, targetCoord.y);

  if (!start || !target || !start.isPassable() || !target.isPassable()) {
    return createResult(false, [], 0, [], new Set(), 0, startTime, grid);
  }

  const pq = new PriorityQueue((a, b) => a.priority - b.priority);
  const cameFrom = new Map();
  const visitedSet = new Set();
  const steps = [];

  const keyOf = (n) => `${n.x},${n.y}`;
  const targetKey = keyOf(target);

  pq.enqueue(start, hFn(target.x - start.x, target.y - start.y));

  let peakFrontier = 1;
  let targetFound = false;

  while (!pq.isEmpty()) {
    if (pq.size() > peakFrontier) peakFrontier = pq.size();

    const current = pq.dequeue();
    const currentKey = keyOf(current);

    if (visitedSet.has(currentKey)) continue;
    visitedSet.add(currentKey);

    steps.push({ type: 'visit', x: current.x, y: current.y });

    if (currentKey === targetKey) {
      targetFound = true;
      break;
    }

    const neighbors = grid.getNeighbors(current, allowDiagonal);
    for (const neighbor of neighbors) {
      const neighborKey = keyOf(neighbor);
      if (visitedSet.has(neighborKey)) continue;

      if (!cameFrom.has(neighborKey)) {
        cameFrom.set(neighborKey, current);
        const hVal = hFn(target.x - neighbor.x, target.y - neighbor.y);
        pq.enqueue(neighbor, hVal);
        steps.push({ type: 'frontier', x: neighbor.x, y: neighbor.y, h: hVal });
      }
    }
  }

  const path = [];
  let pathCost = 0;
  if (targetFound) {
    let curr = target;
    while (curr) {
      path.unshift({ x: curr.x, y: curr.y, g: pathCost });
      const parent = cameFrom.get(keyOf(curr));
      if (parent) {
        pathCost += grid.getEdgeCost(parent, curr);
      }
      curr = parent;
    }
    steps.push({ type: 'path', pathNodes: path });
  }

  return createResult(targetFound, path, pathCost, steps, visitedSet, peakFrontier, startTime, grid);
}

// =========================================================================
// 5. BIDIRECTIONAL A* SEARCH
// =========================================================================
export function bidirectionalAstar(grid, startCoord, targetCoord, options = {}) {
  const startTime = performance.now();
  const { heuristicKey = 'octile', allowDiagonal = true } = options;
  const hFn = HEURISTIC_FORMULAS[heuristicKey]?.calculate || HEURISTIC_FORMULAS.octile.calculate;

  const start = grid.getNode(startCoord.x, startCoord.y);
  const target = grid.getNode(targetCoord.x, targetCoord.y);

  if (!start || !target || !start.isPassable() || !target.isPassable()) {
    return createResult(false, [], 0, [], new Set(), 0, startTime, grid);
  }

  const pqF = new PriorityQueue((a, b) => a.priority - b.priority); // Forward
  const pqB = new PriorityQueue((a, b) => a.priority - b.priority); // Backward

  const gF = new Map();
  const gB = new Map();
  const parentF = new Map();
  const parentB = new Map();

  const visitedF = new Set();
  const visitedB = new Set();
  const visitedAll = new Set();
  const steps = [];

  const keyOf = (n) => `${n.x},${n.y}`;
  const startKey = keyOf(start);
  const targetKey = keyOf(target);

  gF.set(startKey, 0);
  gB.set(targetKey, 0);

  pqF.enqueue(start, hFn(target.x - start.x, target.y - start.y));
  pqB.enqueue(target, hFn(start.x - target.x, start.y - target.y));

  let peakFrontier = 2;
  let meetingNode = null;
  let bestCost = Infinity;

  while (!pqF.isEmpty() && !pqB.isEmpty()) {
    const curFrontier = pqF.size() + pqB.size();
    if (curFrontier > peakFrontier) peakFrontier = curFrontier;

    // Expand Forward
    if (!pqF.isEmpty()) {
      const curF = pqF.dequeue();
      const kF = keyOf(curF);
      if (!visitedF.has(kF)) {
        visitedF.add(kF);
        visitedAll.add(kF);
        steps.push({ type: 'visit', x: curF.x, y: curF.y, dir: 'forward' });

        if (visitedB.has(kF)) {
          const cost = (gF.get(kF) || 0) + (gB.get(kF) || 0);
          if (cost < bestCost) {
            bestCost = cost;
            meetingNode = curF;
            break;
          }
        }

        const neighbors = grid.getNeighbors(curF, allowDiagonal);
        for (const n of neighbors) {
          const kn = keyOf(n);
          if (visitedF.has(kn)) continue;
          const tentativeG = gF.get(kF) + grid.getEdgeCost(curF, n);
          if (tentativeG < (gF.get(kn) ?? Infinity)) {
            gF.set(kn, tentativeG);
            parentF.set(kn, curF);
            const prio = tentativeG + hFn(target.x - n.x, target.y - n.y);
            pqF.enqueue(n, prio);
            steps.push({ type: 'frontier', x: n.x, y: n.y, dir: 'forward' });
          }
        }
      }
    }

    // Expand Backward
    if (!pqB.isEmpty()) {
      const curB = pqB.dequeue();
      const kB = keyOf(curB);
      if (!visitedB.has(kB)) {
        visitedB.add(kB);
        visitedAll.add(kB);
        steps.push({ type: 'visit', x: curB.x, y: curB.y, dir: 'backward' });

        if (visitedF.has(kB)) {
          const cost = (gF.get(kB) || 0) + (gB.get(kB) || 0);
          if (cost < bestCost) {
            bestCost = cost;
            meetingNode = curB;
            break;
          }
        }

        const neighbors = grid.getNeighbors(curB, allowDiagonal);
        for (const n of neighbors) {
          const kn = keyOf(n);
          if (visitedB.has(kn)) continue;
          const tentativeG = gB.get(kB) + grid.getEdgeCost(n, curB);
          if (tentativeG < (gB.get(kn) ?? Infinity)) {
            gB.set(kn, tentativeG);
            parentB.set(kn, curB);
            const prio = tentativeG + hFn(start.x - n.x, start.y - n.y);
            pqB.enqueue(n, prio);
            steps.push({ type: 'frontier', x: n.x, y: n.y, dir: 'backward' });
          }
        }
      }
    }
  }

  // Splice bidirectional path
  const path = [];
  if (meetingNode) {
    // Forward half
    let curr = meetingNode;
    while (curr) {
      path.unshift({ x: curr.x, y: curr.y, g: gF.get(keyOf(curr)) || 0 });
      curr = parentF.get(keyOf(curr));
    }
    // Backward half
    curr = parentB.get(keyOf(meetingNode));
    while (curr) {
      path.push({ x: curr.x, y: curr.y, g: (bestCost - (gB.get(keyOf(curr)) || 0)) });
      curr = parentB.get(keyOf(curr));
    }
    steps.push({ type: 'path', pathNodes: path });
  }

  return createResult(meetingNode !== null, path, bestCost === Infinity ? 0 : bestCost, steps, visitedAll, peakFrontier, startTime, grid);
}

// =========================================================================
// 6. BREADTH-FIRST SEARCH (BFS)
// =========================================================================
export function bfs(grid, startCoord, targetCoord, options = {}) {
  const startTime = performance.now();
  const { allowDiagonal = false } = options;

  const start = grid.getNode(startCoord.x, startCoord.y);
  const target = grid.getNode(targetCoord.x, targetCoord.y);

  if (!start || !target || !start.isPassable() || !target.isPassable()) {
    return createResult(false, [], 0, [], new Set(), 0, startTime, grid);
  }

  const queue = [start];
  const cameFrom = new Map();
  const visitedSet = new Set();
  const steps = [];

  const keyOf = (n) => `${n.x},${n.y}`;
  const targetKey = keyOf(target);
  visitedSet.add(keyOf(start));

  let peakFrontier = 1;
  let targetFound = false;

  while (queue.length > 0) {
    if (queue.length > peakFrontier) peakFrontier = queue.length;
    const current = queue.shift();
    const currentKey = keyOf(current);

    steps.push({ type: 'visit', x: current.x, y: current.y });

    if (currentKey === targetKey) {
      targetFound = true;
      break;
    }

    const neighbors = grid.getNeighbors(current, allowDiagonal);
    for (const neighbor of neighbors) {
      const neighborKey = keyOf(neighbor);
      if (!visitedSet.has(neighborKey)) {
        visitedSet.add(neighborKey);
        cameFrom.set(neighborKey, current);
        queue.push(neighbor);
        steps.push({ type: 'frontier', x: neighbor.x, y: neighbor.y });
      }
    }
  }

  const path = [];
  let pathCost = 0;
  if (targetFound) {
    let curr = target;
    while (curr) {
      path.unshift({ x: curr.x, y: curr.y, g: pathCost });
      const parent = cameFrom.get(keyOf(curr));
      if (parent) {
        pathCost += grid.getEdgeCost(parent, curr);
      }
      curr = parent;
    }
    steps.push({ type: 'path', pathNodes: path });
  }

  return createResult(targetFound, path, pathCost, steps, visitedSet, peakFrontier, startTime, grid);
}

// =========================================================================
// 7. DEPTH-FIRST SEARCH (DFS)
// =========================================================================
export function dfs(grid, startCoord, targetCoord, options = {}) {
  const startTime = performance.now();
  const { allowDiagonal = false } = options;

  const start = grid.getNode(startCoord.x, startCoord.y);
  const target = grid.getNode(targetCoord.x, targetCoord.y);

  if (!start || !target || !start.isPassable() || !target.isPassable()) {
    return createResult(false, [], 0, [], new Set(), 0, startTime, grid);
  }

  const stack = [start];
  const cameFrom = new Map();
  const visitedSet = new Set();
  const steps = [];

  const keyOf = (n) => `${n.x},${n.y}`;
  const targetKey = keyOf(target);

  let peakFrontier = 1;
  let targetFound = false;

  while (stack.length > 0) {
    if (stack.length > peakFrontier) peakFrontier = stack.length;
    const current = stack.pop();
    const currentKey = keyOf(current);

    if (visitedSet.has(currentKey)) continue;
    visitedSet.add(currentKey);

    steps.push({ type: 'visit', x: current.x, y: current.y });

    if (currentKey === targetKey) {
      targetFound = true;
      break;
    }

    const neighbors = grid.getNeighbors(current, allowDiagonal);
    for (const neighbor of neighbors) {
      const neighborKey = keyOf(neighbor);
      if (!visitedSet.has(neighborKey)) {
        cameFrom.set(neighborKey, current);
        stack.push(neighbor);
        steps.push({ type: 'frontier', x: neighbor.x, y: neighbor.y });
      }
    }
  }

  const path = [];
  let pathCost = 0;
  if (targetFound) {
    let curr = target;
    while (curr) {
      path.unshift({ x: curr.x, y: curr.y, g: pathCost });
      const parent = cameFrom.get(keyOf(curr));
      if (parent) {
        pathCost += grid.getEdgeCost(parent, curr);
      }
      curr = parent;
    }
    steps.push({ type: 'path', pathNodes: path });
  }

  return createResult(targetFound, path, pathCost, steps, visitedSet, peakFrontier, startTime, grid);
}

// =========================================================================
// 8. D* LITE / INCREMENTAL LPA* REPLANNER
// =========================================================================
export class DStarLiteReplanner {
  constructor(grid, startCoord, targetCoord, options = {}) {
    this.grid = grid;
    this.start = grid.getNode(startCoord.x, startCoord.y);
    this.target = grid.getNode(targetCoord.x, targetCoord.y);
    this.allowDiagonal = options.allowDiagonal ?? true;
    this.hFn = HEURISTIC_FORMULAS.octile.calculate;

    this.g = new Map();
    this.rhs = new Map();
    this.U = new PriorityQueue((a, b) => {
      if (a.priority[0] !== b.priority[0]) return a.priority[0] - b.priority[0];
      return a.priority[1] - b.priority[1];
    });

    this.km = 0;
    this.lastStart = { ...startCoord };
    this.replanCount = 0;

    this.init();
  }

  keyOf(n) {
    return `${n.x},${n.y}`;
  }

  calculateKey(s) {
    const sG = this.g.get(this.keyOf(s)) ?? Infinity;
    const sRhs = this.rhs.get(this.keyOf(s)) ?? Infinity;
    const minVal = Math.min(sG, sRhs);
    const h = this.hFn(this.start.x - s.x, this.start.y - s.y);
    return [minVal + h + this.km, minVal];
  }

  init() {
    this.g.clear();
    this.rhs.clear();
    this.U = new PriorityQueue((a, b) => {
      if (a.priority[0] !== b.priority[0]) return a.priority[0] - b.priority[0];
      return a.priority[1] - b.priority[1];
    });
    this.km = 0;

    // In D* Lite, search is reverse: rhs(target) = 0
    this.rhs.set(this.keyOf(this.target), 0);
    this.U.enqueue(this.target, this.calculateKey(this.target));
  }

  updateVertex(u) {
    const uKey = this.keyOf(u);
    if (uKey !== this.keyOf(this.target)) {
      let minRhs = Infinity;
      const succs = this.grid.getNeighbors(u, this.allowDiagonal);
      for (const s of succs) {
        const cost = this.grid.getEdgeCost(u, s);
        const sG = this.g.get(this.keyOf(s)) ?? Infinity;
        minRhs = Math.min(minRhs, sG + cost);
      }
      this.rhs.set(uKey, minRhs);
    }

    const uG = this.g.get(uKey) ?? Infinity;
    const uRhs = this.rhs.get(uKey) ?? Infinity;
    if (uG !== uRhs) {
      this.U.enqueue(u, this.calculateKey(u));
    }
  }

  computeShortestPath() {
    const visitedSet = new Set();
    const steps = [];
    let iterations = 0;

    while (!this.U.isEmpty() && iterations < 5000) {
      iterations++;
      const top = this.U.peek();
      if (!top) break;

      const u = top.item;
      const uKey = this.keyOf(u);
      const startKey = this.keyOf(this.start);
      const startKeyVals = this.calculateKey(this.start);

      // Compare top key with start key
      const topKey = top.priority;
      const isTopSmaller = (topKey[0] < startKeyVals[0]) || (topKey[0] === startKeyVals[0] && topKey[1] < startKeyVals[1]);
      const startG = this.g.get(startKey) ?? Infinity;
      const startRhs = this.rhs.get(startKey) ?? Infinity;

      if (!isTopSmaller && startRhs === startG) {
        break; // Shortest path to current start is already consistent!
      }

      this.U.dequeue();
      visitedSet.add(uKey);
      steps.push({ type: 'visit', x: u.x, y: u.y });

      const uG = this.g.get(uKey) ?? Infinity;
      const uRhs = this.rhs.get(uKey) ?? Infinity;

      if (uG > uRhs) {
        this.g.set(uKey, uRhs);
        const preds = this.grid.getNeighbors(u, this.allowDiagonal);
        for (const p of preds) {
          this.updateVertex(p);
        }
      } else {
        this.g.set(uKey, Infinity);
        this.updateVertex(u);
        const preds = this.grid.getNeighbors(u, this.allowDiagonal);
        for (const p of preds) {
          this.updateVertex(p);
        }
      }
    }

    // Extract path from start to target
    const path = [];
    let curr = this.start;
    let totalCost = 0;
    const visitedPath = new Set();

    while (curr && this.keyOf(curr) !== this.keyOf(this.target) && path.length < 500) {
      path.push({ x: curr.x, y: curr.y, g: totalCost });
      visitedPath.add(this.keyOf(curr));

      let nextNode = null;
      let minVal = Infinity;

      const succs = this.grid.getNeighbors(curr, this.allowDiagonal);
      for (const s of succs) {
        const cost = this.grid.getEdgeCost(curr, s);
        const sG = this.g.get(this.keyOf(s)) ?? Infinity;
        if (cost + sG < minVal) {
          minVal = cost + sG;
          nextNode = s;
        }
      }

      if (!nextNode || visitedPath.has(this.keyOf(nextNode)) || minVal === Infinity) {
        // Path blocked
        break;
      }

      totalCost += this.grid.getEdgeCost(curr, nextNode);
      curr = nextNode;
    }

    if (curr && this.keyOf(curr) === this.keyOf(this.target)) {
      path.push({ x: curr.x, y: curr.y, g: totalCost });
    }

    return {
      pathFound: path.length > 0 && path[path.length - 1].x === this.target.x && path[path.length - 1].y === this.target.y,
      path,
      pathCost: parseFloat(totalCost.toFixed(2)),
      pathLength: path.length,
      nodesExplored: visitedSet.size,
      steps
    };
  }

  /**
   * Handle dynamic change in edge cost or obstacle creation
   */
  notifyCostChanged(changedNodes, newStartCoord) {
    this.replanCount++;
    this.km += this.hFn(this.lastStart.x - newStartCoord.x, this.lastStart.y - newStartCoord.y);
    this.lastStart = { ...newStartCoord };
    this.start = this.grid.getNode(newStartCoord.x, newStartCoord.y);

    for (const node of changedNodes) {
      this.updateVertex(node);
      const neighbors = this.grid.getNeighbors(node, this.allowDiagonal);
      for (const n of neighbors) {
        this.updateVertex(n);
      }
    }

    return this.computeShortestPath();
  }
}
