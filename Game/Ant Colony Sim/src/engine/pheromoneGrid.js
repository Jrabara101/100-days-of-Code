/**
 * High-performance 2D Pheromone Grid Matrix
 * Implements evaporation, diffusion, and sensory gradient sampling.
 */
export class PheromoneGrid {
  constructor(worldWidth, worldHeight, cellSize = 8) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.cellSize = cellSize;

    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);
    this.size = this.cols * this.rows;

    // Typed arrays for pheromones (0.0 to 1.0+)
    this.food = new Float32Array(this.size);
    this.home = new Float32Array(this.size);
    this.danger = new Float32Array(this.size);

    // Swap buffers for diffusion
    this.tempBuffer = new Float32Array(this.size);

    // Evaporation rates (per second)
    this.evaporationRate = 0.985;
    this.diffusionRate = 0.15;
  }

  getIndex(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;
    return row * this.cols + col;
  }

  getColRow(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return { col, row };
  }

  deposit(x, y, type, amount) {
    const { col, row } = this.getColRow(x, y);
    const idx = this.getIndex(col, row);
    if (idx === -1) return;

    if (type === 'food') {
      this.food[idx] = Math.min(this.food[idx] + amount, 15.0);
    } else if (type === 'home') {
      this.home[idx] = Math.min(this.home[idx] + amount, 15.0);
    } else if (type === 'danger') {
      this.danger[idx] = Math.min(this.danger[idx] + amount, 20.0);
    }
  }

  getVal(col, row, type) {
    const idx = this.getIndex(col, row);
    if (idx === -1) return 0;
    if (type === 'food') return this.food[idx];
    if (type === 'home') return this.home[idx];
    if (type === 'danger') return this.danger[idx];
    return 0;
  }

  /**
   * Sample pheromone concentration at a specific world coordinate
   */
  sampleAt(x, y, type) {
    const { col, row } = this.getColRow(x, y);
    return this.getVal(col, row, type);
  }

  /**
   * Sample three directional antenna sensors (left, center, right)
   * to determine the best steering angle towards highest pheromone concentration.
   */
  sampleSensor(x, y, heading, distance, sensorSpreadAngle, type) {
    const leftAngle = heading - sensorSpreadAngle;
    const centerAngle = heading;
    const rightAngle = heading + sensorSpreadAngle;

    const leftX = x + Math.cos(leftAngle) * distance;
    const leftY = y + Math.sin(leftAngle) * distance;

    const centerX = x + Math.cos(centerAngle) * distance;
    const centerY = y + Math.sin(centerAngle) * distance;

    const rightX = x + Math.cos(rightAngle) * distance;
    const rightY = y + Math.sin(rightAngle) * distance;

    const leftVal = this.sampleAt(leftX, leftY, type);
    const centerVal = this.sampleAt(centerX, centerY, type);
    const rightVal = this.sampleAt(rightX, rightY, type);

    return {
      left: leftVal,
      center: centerVal,
      right: rightVal,
      total: leftVal + centerVal + rightVal,
      strongestAngle:
        centerVal >= leftVal && centerVal >= rightVal
          ? centerAngle
          : leftVal > rightVal
          ? leftAngle
          : rightAngle
    };
  }

  /**
   * Diffuse and evaporate pheromones across the grid
   */
  update(dt, rainIntensity = 0) {
    // Evaporation multiplier factoring delta-time and rain (rain washes away trails faster)
    const decay = Math.pow(this.evaporationRate * (1 - rainIntensity * 0.08), dt * 30);

    this.diffuseAndEvaporate(this.food, decay);
    this.diffuseAndEvaporate(this.home, decay);
    this.diffuseAndEvaporate(this.danger, decay * 0.95); // Danger fades faster
  }

  diffuseAndEvaporate(grid, decay) {
    const cols = this.cols;
    const rows = this.rows;
    const diff = this.diffusionRate;
    const retain = 1.0 - diff;

    // Fast 4-neighbor diffusion pass
    for (let r = 1; r < rows - 1; r++) {
      const rowOffset = r * cols;
      for (let c = 1; c < cols - 1; c++) {
        const idx = rowOffset + c;
        const val = grid[idx];
        if (val < 0.005) {
          this.tempBuffer[idx] = 0;
          continue;
        }

        const avgNeighbors = (grid[idx - 1] + grid[idx + 1] + grid[idx - cols] + grid[idx + cols]) * 0.25;
        this.tempBuffer[idx] = (val * retain + avgNeighbors * diff) * decay;
      }
    }

    // Copy tempBuffer back
    grid.set(this.tempBuffer);
  }

  clear() {
    this.food.fill(0);
    this.home.fill(0);
    this.danger.fill(0);
    this.tempBuffer.fill(0);
  }

  /**
   * Render pheromones onto offscreen canvas or directly to viewport
   */
  renderToCanvas(ctx, viewX, viewY, viewW, viewH, activeFilters = { food: true, home: true, danger: true }) {
    const minCol = Math.max(0, Math.floor(viewX / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.ceil((viewX + viewW) / this.cellSize));
    const minRow = Math.max(0, Math.floor(viewY / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.ceil((viewY + viewH) / this.cellSize));

    const cs = this.cellSize;

    for (let r = minRow; r <= maxRow; r++) {
      const rowOffset = r * this.cols;
      for (let c = minCol; c <= maxCol; c++) {
        const idx = rowOffset + c;
        const fVal = activeFilters.food ? this.food[idx] : 0;
        const hVal = activeFilters.home ? this.home[idx] : 0;
        const dVal = activeFilters.danger ? this.danger[idx] : 0;

        if (fVal < 0.05 && hVal < 0.05 && dVal < 0.05) continue;

        const px = c * cs;
        const py = r * cs;

        if (dVal > 0.08) {
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.65, dVal * 0.12)})`;
          ctx.fillRect(px, py, cs, cs);
        } else if (fVal > 0.05) {
          ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(0.6, fVal * 0.15)})`;
          ctx.fillRect(px, py, cs, cs);
        } else if (hVal > 0.05) {
          ctx.fillStyle = `rgba(245, 158, 11, ${Math.min(0.45, hVal * 0.1)})`;
          ctx.fillRect(px, py, cs, cs);
        }
      }
    }
  }
}
