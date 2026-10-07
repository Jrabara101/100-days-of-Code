/**
 * Heuristics Suite, Analytical Pareto Radar & Potential Field Engine
 * Cartographic Pathfinding Laboratory
 */

export const HEURISTIC_FORMULAS = {
  octile: {
    id: 'octile',
    name: 'Octile Distance (Diagonal-Admissible)',
    formula: 'Δx + Δy + (√2 - 2) · min(Δx, Δy)',
    calculate: (dx, dy) => {
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      const min = Math.min(adx, ady);
      const max = Math.max(adx, ady);
      return (max - min) + Math.SQRT2 * min;
    },
    description: 'Mathematically optimal admissible metric for 8-directional movement grids.'
  },
  euclidean: {
    id: 'euclidean',
    name: 'Euclidean Distance (Straight-Line)',
    formula: '√(Δx² + Δy²)',
    calculate: (dx, dy) => Math.hypot(dx, dy),
    description: 'Direct straight-line distance; strictly admissible and smooth.'
  },
  manhattan: {
    id: 'manhattan',
    name: 'Manhattan Distance (Taxicab / L1)',
    formula: '|Δx| + |Δy|',
    calculate: (dx, dy) => Math.abs(dx) + Math.abs(dy),
    description: 'Admissible for 4-directional grids; slightly overestimates on 8-way grids.'
  },
  chebyshev: {
    id: 'chebyshev',
    name: 'Chebyshev Distance (Chess King / L∞)',
    formula: 'max(|Δx|, |Δy|)',
    calculate: (dx, dy) => Math.max(Math.abs(dx), Math.abs(dy)),
    description: 'Uniform king movement metric where diagonal moves cost the same as orthogonal.'
  }
};

/**
 * Generate 2D scalar potential field matrix for goal visualization
 */
export function generatePotentialField(grid, target, formulaKey = 'octile', weight = 1.0) {
  const formula = HEURISTIC_FORMULAS[formulaKey]?.calculate || HEURISTIC_FORMULAS.octile.calculate;
  const field = [];

  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let y = 0; y < grid.height; y++) {
    const row = [];
    for (let x = 0; x < grid.width; x++) {
      const h = formula(target.x - x, target.y - y) * weight;
      row.push(h);
      if (h < minVal) minVal = h;
      if (h > maxVal) maxVal = h;
    }
    field.push(row);
  }

  return { field, minVal, maxVal };
}

/**
 * Generate Heuristic Trade-off Radar Curve (Pareto frontier metrics)
 */
export function computeRadarMetrics(result, baselineOptimalCost = null) {
  if (!result || !result.pathFound) {
    return {
      searchVelocity: 10,
      pathOptimality: 0,
      memoryEfficiency: 10,
      computeDuration: 10,
      paretoScore: 0
    };
  }

  const optimalCost = baselineOptimalCost || result.pathCost;
  // Optimality: 100% when cost matches optimal, penalizes excess cost
  const pathOptimality = Math.max(10, Math.min(100, Math.round((optimalCost / Math.max(0.1, result.pathCost)) * 100)));

  // Search Velocity: Normalized by nodes explored vs total grid cells (higher is faster / fewer visited)
  const totalCells = result.totalCells || 2500;
  const visitRatio = result.nodesExplored / totalCells;
  const searchVelocity = Math.max(15, Math.min(100, Math.round((1.0 - visitRatio) * 100)));

  // Memory Efficiency: Peak open set size vs total grid
  const peakRatio = (result.peakFrontier || 50) / totalCells;
  const memoryEfficiency = Math.max(15, Math.min(100, Math.round((1.0 - peakRatio * 2) * 100)));

  // Compute Duration: Scaled score (sub-5ms is 95+, 50ms is lower)
  const computeDuration = Math.max(20, Math.min(100, Math.round(100 - (result.executionTimeMs || 2) * 4)));

  const paretoScore = Math.round((pathOptimality * 0.4) + (searchVelocity * 0.3) + (memoryEfficiency * 0.15) + (computeDuration * 0.15));

  return {
    searchVelocity,
    pathOptimality,
    memoryEfficiency,
    computeDuration,
    paretoScore
  };
}
