/**
 * BoidsEngine3D - Headless 3D Boids Flocking Simulation Engine
 * 
 * Features:
 * - Zero-Allocation Struct-of-Arrays (SoA) Layout using Float32Array
 * - 3D Uniform Spatial Hash Grid for O(N) neighbor lookups
 * - Reynolds Steering Forces: Separation, Alignment, Cohesion
 * - Dynamic Target Attractor & Autonomous Predator Hunting Agent
 * - Soft Cubic Boundary Restoration
 * - Symplectic Euler Integration with strict Velocity Clamping
 */

export class BoidsEngine3D {
  constructor(numBoids = 1400) {
    this.numBoids = numBoids;
    this.bound = 45.0; // Domain: [-bound, bound]^3
    this.boundMargin = 8.0;

    // Steering Parameters
    this.neighborRadius = 8.5;
    this.separationRadius = 3.2;
    this.maxSpeed = 1.4;
    this.minSpeed = 0.6;
    this.maxForce = 0.08;

    // Behavioral Weights
    this.weightSep = 1.8;
    this.weightAli = 1.2;
    this.weightCoh = 1.0;
    this.weightTarget = 0.6;
    this.weightPredatorAvoid = 2.5;

    // Target / Attractor
    this.target = {
      x: 0,
      y: 0,
      z: 0,
      active: true,
      mode: 'lissajous', // 'lissajous' | 'mouse' | 'static' | 'off'
    };

    // Predator Agent
    this.predator = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0.5,
      vy: 0.3,
      vz: 0.4,
      active: false,
      speed: 1.8,
      fearRadius: 18.0,
    };

    // Diagnostics / Telemetry
    this.telemetry = {
      avgSpeed: 0,
      maxSpeed: 0,
      minSpeed: 0,
      activeBuckets: 0,
      maxBucketOccupancy: 0,
      stepDurationMs: 0,
    };

    this.allocateBuffers(this.numBoids);
    this.initSpatialGrid();
    this.initBoids();
  }

  allocateBuffers(count) {
    this.numBoids = count;

    // Struct-of-Arrays (SoA) Float32Array Buffers
    this.posX = new Float32Array(count);
    this.posY = new Float32Array(count);
    this.posZ = new Float32Array(count);

    this.velX = new Float32Array(count);
    this.velY = new Float32Array(count);
    this.velZ = new Float32Array(count);

    this.accX = new Float32Array(count);
    this.accY = new Float32Array(count);
    this.accZ = new Float32Array(count);
  }

  initSpatialGrid() {
    this.cellSize = Math.max(4.0, this.neighborRadius);
    this.gridDim = Math.ceil((this.bound * 2) / this.cellSize);
    this.totalBuckets = this.gridDim * this.gridDim * this.gridDim;
    this.maxPerBucket = 64;

    this.gridBuckets = new Int32Array(this.totalBuckets * this.maxPerBucket);
    this.gridCounts = new Int32Array(this.totalBuckets);
  }

  setNumBoids(newCount) {
    if (newCount === this.numBoids) return;
    this.allocateBuffers(newCount);
    this.initBoids();
  }

  initBoids() {
    const spread = this.bound * 1.4;
    for (let i = 0; i < this.numBoids; i++) {
      this.posX[i] = (Math.random() - 0.5) * spread;
      this.posY[i] = (Math.random() - 0.5) * spread;
      this.posZ[i] = (Math.random() - 0.5) * spread;

      // Random unit vector scaled to initial speed
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const initSpeed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

      this.velX[i] = Math.sin(phi) * Math.cos(theta) * initSpeed;
      this.velY[i] = Math.sin(phi) * Math.sin(theta) * initSpeed;
      this.velZ[i] = Math.cos(phi) * initSpeed;

      this.accX[i] = 0;
      this.accY[i] = 0;
      this.accZ[i] = 0;
    }

    // Reset Predator position
    this.predator.x = (Math.random() - 0.5) * this.bound;
    this.predator.y = (Math.random() - 0.5) * this.bound;
    this.predator.z = (Math.random() - 0.5) * this.bound;
  }

  scramble(intensity = 1.0) {
    for (let i = 0; i < this.numBoids; i++) {
      const angle = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI;
      const speed = this.maxSpeed * (0.8 + Math.random() * 0.5 * intensity);

      this.velX[i] = Math.cos(pitch) * Math.cos(angle) * speed;
      this.velY[i] = Math.sin(pitch) * speed;
      this.velZ[i] = Math.cos(pitch) * Math.sin(angle) * speed;
    }
  }

  radialImpulse(cx = 0, cy = 0, cz = 0, force = 2.0) {
    for (let i = 0; i < this.numBoids; i++) {
      const dx = this.posX[i] - cx;
      const dy = this.posY[i] - cy;
      const dz = this.posZ[i] - cz;
      const dist = Math.hypot(dx, dy, dz) + 0.1;
      if (dist < this.bound * 0.8) {
        const factor = (force / (dist + 2.0)) * 1.5;
        this.velX[i] += (dx / dist) * factor;
        this.velY[i] += (dy / dist) * factor;
        this.velZ[i] += (dz / dist) * factor;
      }
    }
  }

  getBucketIndex(x, y, z) {
    const gx = Math.floor((x + this.bound) / this.cellSize);
    const gy = Math.floor((y + this.bound) / this.cellSize);
    const gz = Math.floor((z + this.bound) / this.cellSize);

    if (gx < 0 || gx >= this.gridDim || gy < 0 || gy >= this.gridDim || gz < 0 || gz >= this.gridDim) {
      return -1;
    }
    return gz * (this.gridDim * this.gridDim) + gy * this.gridDim + gx;
  }

  stepSimulation(dt = 1.0) {
    const startTime = performance.now();

    // 1. REBUILD SPATIAL HASH GRID
    this.gridCounts.fill(0);
    for (let i = 0; i < this.numBoids; i++) {
      const bIdx = this.getBucketIndex(this.posX[i], this.posY[i], this.posZ[i]);
      if (bIdx !== -1) {
        const count = this.gridCounts[bIdx];
        if (count < this.maxPerBucket) {
          this.gridBuckets[bIdx * this.maxPerBucket + count] = i;
          this.gridCounts[bIdx]++;
        }
      }
    }

    const nRadSq = this.neighborRadius * this.neighborRadius;
    const sRadSq = this.separationRadius * this.separationRadius;
    const predFearSq = this.predator.fearRadius * this.predator.fearRadius;

    let flockCenterX = 0;
    let flockCenterY = 0;
    let flockCenterZ = 0;

    let totalSpeed = 0;
    let maxSpd = 0;
    let minSpd = 999;

    // 2. ACCUMULATE STEERING FORCES PER BOID
    for (let i = 0; i < this.numBoids; i++) {
      const px = this.posX[i], py = this.posY[i], pz = this.posZ[i];
      const vx = this.velX[i], vy = this.velY[i], vz = this.velZ[i];

      flockCenterX += px;
      flockCenterY += py;
      flockCenterZ += pz;

      let sepX = 0, sepY = 0, sepZ = 0;
      let aliX = 0, aliY = 0, aliZ = 0;
      let cohX = 0, cohY = 0, cohZ = 0;
      let neighbors = 0;

      const gx = Math.floor((px + this.bound) / this.cellSize);
      const gy = Math.floor((py + this.bound) / this.cellSize);
      const gz = Math.floor((pz + this.bound) / this.cellSize);

      // Query 27 Neighboring 3D Buckets (3x3x3)
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const cx = gx + dx, cy = gy + dy, cz = gz + dz;

            if (cx >= 0 && cx < this.gridDim && cy >= 0 && cy < this.gridDim && cz >= 0 && cz < this.gridDim) {
              const bIdx = cz * (this.gridDim * this.gridDim) + cy * this.gridDim + cx;
              const count = this.gridCounts[bIdx];

              for (let k = 0; k < count; k++) {
                const j = this.gridBuckets[bIdx * this.maxPerBucket + k];
                if (i === j) continue;

                const rx = px - this.posX[j];
                const ry = py - this.posY[j];
                const rz = pz - this.posZ[j];
                const distSq = rx * rx + ry * ry + rz * rz;

                if (distSq < nRadSq && distSq > 0.0001) {
                  // Alignment Accumulator
                  aliX += this.velX[j];
                  aliY += this.velY[j];
                  aliZ += this.velZ[j];

                  // Cohesion Accumulator
                  cohX += this.posX[j];
                  cohY += this.posY[j];
                  cohZ += this.posZ[j];
                  neighbors++;

                  // Separation Accumulator (Inverse Distance Squared)
                  if (distSq < sRadSq) {
                    const invDistSq = 1.0 / distSq;
                    sepX += rx * invDistSq;
                    sepY += ry * invDistSq;
                    sepZ += rz * invDistSq;
                  }
                }
              }
            }
          }
        }
      }

      let steerX = 0, steerY = 0, steerZ = 0;

      if (neighbors > 0) {
        // Alignment: Desired velocity = average velocity
        const invN = 1.0 / neighbors;
        aliX = (aliX * invN) - vx;
        aliY = (aliY * invN) - vy;
        aliZ = (aliZ * invN) - vz;

        // Cohesion: Vector towards center of mass
        cohX = (cohX * invN) - px;
        cohY = (cohY * invN) - py;
        cohZ = (cohZ * invN) - pz;

        steerX += sepX * this.weightSep + aliX * this.weightAli + cohX * this.weightCoh;
        steerY += sepY * this.weightSep + aliY * this.weightAli + cohY * this.weightCoh;
        steerZ += sepZ * this.weightSep + aliZ * this.weightAli + cohZ * this.weightCoh;
      }

      // 3. TARGET ATTRACTOR / SEEK FORCE
      if (this.target.active) {
        const tx = this.target.x - px;
        const ty = this.target.y - py;
        const tz = this.target.z - pz;
        const tDist = Math.hypot(tx, ty, tz);
        if (tDist > 0.1) {
          steerX += (tx / tDist) * this.weightTarget;
          steerY += (ty / tDist) * this.weightTarget;
          steerZ += (tz / tDist) * this.weightTarget;
        }
      }

      // 4. PREDATOR EVASION FORCE
      if (this.predator.active) {
        const predDx = px - this.predator.x;
        const predDy = py - this.predator.y;
        const predDz = pz - this.predator.z;
        const predDistSq = predDx * predDx + predDy * predDy + predDz * predDz;

        if (predDistSq < predFearSq && predDistSq > 0.01) {
          const predDist = Math.sqrt(predDistSq);
          const fleeMag = (1.0 - predDist / this.predator.fearRadius) * this.weightPredatorAvoid;
          steerX += (predDx / predDist) * fleeMag * 2.5;
          steerY += (predDy / predDist) * fleeMag * 2.5;
          steerZ += (predDz / predDist) * fleeMag * 2.5;
        }
      }

      // 5. SOFT BOUNDARY RESTORATION FORCE
      const margin = this.boundMargin;
      const b = this.bound;
      if (px < -b + margin) steerX += Math.pow((-b + margin - px) / margin, 2) * 0.45;
      if (px >  b - margin) steerX -= Math.pow((px - (b - margin)) / margin, 2) * 0.45;
      if (py < -b + margin) steerY += Math.pow((-b + margin - py) / margin, 2) * 0.45;
      if (py >  b - margin) steerY -= Math.pow((py - (b - margin)) / margin, 2) * 0.45;
      if (pz < -b + margin) steerZ += Math.pow((-b + margin - pz) / margin, 2) * 0.45;
      if (pz >  b - margin) steerZ -= Math.pow((pz - (b - margin)) / margin, 2) * 0.45;

      // Clamp Steering Force
      const forceMag = Math.hypot(steerX, steerY, steerZ);
      if (forceMag > this.maxForce) {
        const scale = this.maxForce / forceMag;
        steerX *= scale;
        steerY *= scale;
        steerZ *= scale;
      }

      this.accX[i] = steerX;
      this.accY[i] = steerY;
      this.accZ[i] = steerZ;
    }

    // 6. UPDATE PREDATOR DYNAMICS (Hunts flock center)
    if (this.predator.active && this.numBoids > 0) {
      flockCenterX /= this.numBoids;
      flockCenterY /= this.numBoids;
      flockCenterZ /= this.numBoids;

      const chaseDx = flockCenterX - this.predator.x;
      const chaseDy = flockCenterY - this.predator.y;
      const chaseDz = flockCenterZ - this.predator.z;
      const chaseDist = Math.hypot(chaseDx, chaseDy, chaseDz) + 0.1;

      // Smooth predator steering
      this.predator.vx += (chaseDx / chaseDist) * 0.08;
      this.predator.vy += (chaseDy / chaseDist) * 0.08;
      this.predator.vz += (chaseDz / chaseDist) * 0.08;

      const predSpd = Math.hypot(this.predator.vx, this.predator.vy, this.predator.vz);
      if (predSpd > this.predator.speed) {
        this.predator.vx = (this.predator.vx / predSpd) * this.predator.speed;
        this.predator.vy = (this.predator.vy / predSpd) * this.predator.speed;
        this.predator.vz = (this.predator.vz / predSpd) * this.predator.speed;
      }

      this.predator.x += this.predator.vx * dt;
      this.predator.y += this.predator.vy * dt;
      this.predator.z += this.predator.vz * dt;

      // Constrain predator within bounds
      const pb = this.bound * 0.9;
      this.predator.x = Math.max(-pb, Math.min(pb, this.predator.x));
      this.predator.y = Math.max(-pb, Math.min(pb, this.predator.y));
      this.predator.z = Math.max(-pb, Math.min(pb, this.predator.z));
    }

    // 7. SYMPLECTIC EULER INTEGRATION & VELOCITY CLAMPING
    for (let i = 0; i < this.numBoids; i++) {
      this.velX[i] += this.accX[i] * dt;
      this.velY[i] += this.accY[i] * dt;
      this.velZ[i] += this.accZ[i] * dt;

      const speed = Math.hypot(this.velX[i], this.velY[i], this.velZ[i]);
      if (speed > this.maxSpeed) {
        const invSpd = this.maxSpeed / speed;
        this.velX[i] *= invSpd;
        this.velY[i] *= invSpd;
        this.velZ[i] *= invSpd;
      } else if (speed < this.minSpeed && speed > 0.0001) {
        const invSpd = this.minSpeed / speed;
        this.velX[i] *= invSpd;
        this.velY[i] *= invSpd;
        this.velZ[i] *= invSpd;
      }

      this.posX[i] += this.velX[i] * dt;
      this.posY[i] += this.velY[i] * dt;
      this.posZ[i] += this.velZ[i] * dt;

      const currSpeed = Math.hypot(this.velX[i], this.velY[i], this.velZ[i]);
      totalSpeed += currSpeed;
      if (currSpeed > maxSpd) maxSpd = currSpeed;
      if (currSpeed < minSpd) minSpd = currSpeed;
    }

    // 8. TELEMETRY STATS COMPUTATION
    let activeBuckets = 0;
    let maxBucketOcc = 0;
    for (let b = 0; b < this.totalBuckets; b++) {
      const c = this.gridCounts[b];
      if (c > 0) activeBuckets++;
      if (c > maxBucketOcc) maxBucketOcc = c;
    }

    this.telemetry.avgSpeed = this.numBoids > 0 ? (totalSpeed / this.numBoids) : 0;
    this.telemetry.maxSpeed = maxSpd;
    this.telemetry.minSpeed = minSpd === 999 ? 0 : minSpd;
    this.telemetry.activeBuckets = activeBuckets;
    this.telemetry.maxBucketOccupancy = maxBucketOcc;
    this.telemetry.stepDurationMs = performance.now() - startTime;
  }
}
