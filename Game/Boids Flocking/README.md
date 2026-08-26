# 3D Boids Flocking Simulation Engine (React + Vite + Three.js)

A high-performance, GPU-accelerated 3D Boids Flocking Simulation Engine engineered with a **Staff Systems Architecture** in **React 18**, **Vite**, **Tailwind CSS**, and **Three.js**.

---

## ⚡ Computational Architecture & Core Pillars

### 1. 3D Uniform Spatial Hash Grid ($O(N)$ Sensory Sampling)
Eliminates the naive $O(N^2)$ global distance matrix bottleneck. Bins 3D continuous space into discrete cubic buckets of size $S_{\text{cell}} = r_{\text{neighbor}}$. For each boid, sensory lookups sample only the 27 surrounding 3D buckets ($3 \times 3 \times 3$), allowing thousands of agents to simulate at continuous 60 FPS.

### 2. Zero-Allocation Struct-of-Arrays (SoA) Layout
Prevents V8 JavaScript heap fragmentation and GC frame drops by organizing agent states into contiguous `Float32Array` buffers:
- `posX, posY, posZ`
- `velX, velY, velZ`
- `accX, accY, accZ`

### 3. Single-Call GPU Instanced Batching (`THREE.InstancedMesh`)
Calculates dynamic orientation quaternions:
$$\vec{q} = \text{fromUnitVectors}\left(\begin{bmatrix}0\\0\\1\end{bmatrix}, \hat{v}_i\right)$$
and matrix transforms uploaded directly into a single instanced mesh in **1 WebGL draw call**.

---

## 🔬 Craig Reynolds 3D Mathematical Formulations

1. **Separation Force ($\vec{F}_{\text{sep}}$)**:
   $$\vec{F}_{\text{sep}} = \sum_{j \in \mathcal{N}_i, \, \Vert\vec{r}_{ij}\Vert < r_{\text{sep}}} \frac{\vec{p}_i - \vec{p}_j}{\Vert\vec{p}_i - \vec{p}_j\Vert^2}$$

2. **Alignment Force ($\vec{F}_{\text{ali}}$)**:
   $$\vec{v}_{\text{avg}} = \frac{1}{K} \sum_{j \in \mathcal{N}_i} \vec{v}_j, \quad \vec{F}_{\text{ali}} = \frac{\vec{v}_{\text{avg}}}{\Vert\vec{v}_{\text{avg}}\Vert} v_{\text{max}} - \vec{v}_i$$

3. **Cohesion Force ($\vec{F}_{\text{coh}}$)**:
   $$\vec{c}_{\text{avg}} = \frac{1}{K} \sum_{j \in \mathcal{N}_i} \vec{p}_j, \quad \vec{F}_{\text{coh}} = \text{Steer}(\vec{c}_{\text{avg}} - \vec{p}_i)$$

4. **Soft Cubic Boundary Restoration ($\vec{F}_{\text{bound}}$)**:
   $$\vec{F}_{\text{bound}} = \pm \left(\frac{|\vec{p}_k| - (B - d_{\text{margin}})}{d_{\text{margin}}}\right)^2 \hat{e}_k \quad \text{when } |\vec{p}_k| > B - d_{\text{margin}}$$

---

## 🎮 Key Features & Interactive Modes

- **Curated Behavior Presets**:
  - *Starling Murmuration* (Harmonic aerial sweeps)
  - *Deep Sea School* (Fluid aquatic schooling)
  - *Apex Predator Hunt* (Autonomous predator chasing the scatter flock)
  - *Chaotic Insect Swarm* (High-entropy micro-drone swarm)
  - *Quantum Particle Vortex* (Luminous cosmic singularity stream)
- **Interactive 3D Raycast Targeting**: Click & drag anywhere in 3D space to guide flock trajectories.
- **Apex Predator Agent**: Autonomous hunter that tracks and scatters the flock's center of mass.
- **Glassmorphic Cyber HUD**: Real-time FPS, velocity telemetry, spatial grid diagnostics, and Reynolds sliders.
- **Web Audio Generative Synth**: Harmonic drone modulated by flock velocity and impulse bursts.
- **5 Spectral Color Palettes**: *Cyber Cyan*, *Deep Ocean*, *Thermal Heatmap*, *Matrix Emerald*, *Electric Neon*.

---

## 🚀 Getting Started

### Installation
```bash
cd "Game/Boids Flocking"
npm install
```

### Run Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
