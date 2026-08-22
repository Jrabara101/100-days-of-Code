# 3D Granular Cellular Automata & SPH Navier-Stokes Fluid Engine

A high-performance, real-time 3D simulation engine running in the browser using Three.js, React 18, Tailwind CSS, and WebGL. It features dual simulation architectures: a **Volumetric 3D Cellular Automata (CA) Engine** for discrete granular matter and multi-phase chemical/thermal reactions, and a **Lagrangian Smoothed Particle Hydrodynamics (SPH) Navier-Stokes Solver** for continuous fluid dynamics.

---

## 🏛️ System Architecture

```
                                [React 18 Telemetry & Brush HUD]
                                                │
                                                ▼
                                  [Three.js 3D Viewport Stage]
                              (OrbitControls & THREE.InstancedMesh)
                                                │
                                                ▼
                               [Raycast Continuous 3D Cell Index]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    [3D Moore-Neighborhood CA Kernel]                         [3D SPH Navier-Stokes Solver]
  • Bottom-Up Vertical Sweep (Y=0..H-1)                     • Müller Poly6, Spiky & Viscosity Kernels
  • Stochastic Fisher-Yates Permutations                    • Tait / Ideal Gas Equation of State (EOS)
  • Multiphase Thermal & Chemical FSM                       • Uniform 3D Spatial Grid Hash (O(N))
  • Flat 1D Uint8Array Voxel Buffer                         • Symplectic Velocity Verlet Integration
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                                 [GPU Instanced Buffer Upload]
                            • instanceMatrix.needsUpdate = true
                            • instanceColor.needsUpdate = true
                            • Single Draw Call @ 60 FPS
```

---

## 🔬 Core Physical & Computational Principles

### 1. 3D Spatial Voxel Hashing ($O(1)$ Lookup)
A discrete 3D simulation volume of dimensions $W \times H \times D$ is mapped directly to flat, cache-friendly typed memory buffers:

$$\text{Index}(x, y, z) = z \cdot (W \cdot H) + y \cdot W + x$$

### 2. 3D Granular Flow & Directional Bias Elimination
In 2D sand games, grains check directly below $(x, y-1)$ and down-diagonals $(x \pm 1, y-1)$. In 3D space, gravity operates along the Y-axis, extending lateral dispersion to an 8-cell downward Moore neighborhood $\mathcal{N}_{\text{down}}$:

$$\mathcal{N}_{\text{down}}(x,y,z) = \left\{ (x + \Delta x, \, y - 1, \, z + \Delta z) \;\middle\vert{}\; \Delta x, \Delta z \in \{-1, 0, 1\} \right\}$$

- **Vertical Sweep Order:** Cells are processed bottom-up ($y = 0 \to H-1$) to eliminate multi-cell falling tunneling within single ticks.
- **Horizontal Stochastic Permutation:** For each layer $y$, the evaluation order of $(x, z)$ coordinates and candidate neighbor vectors are shuffled on every tick using Fisher-Yates permutations.
- **Frame Bitmasking:** Prevents particles that moved in the current frame from being evaluated multiple times.

---

## 🧪 Multiphase Chemical & Thermal Reaction Matrix

| Reactant A | Reactant B | Reaction Mechanism | Product / State |
| :--- | :--- | :--- | :--- |
| **Lava** ($\ge 1000^\circ\text{C}$) | **Water** | Instant thermal quenching | **Stone** + **Steam** vapor |
| **Lava** | **Sand** | Thermal vitrification | **Glass** |
| **Lava** / **Fire** | **Wood** / **Oil** | Rapid exothermic combustion | **Fire** + Smoke |
| **Lava** / **Fire** | **Gunpowder** | Thermal detonation | **Radial Shockwave & Explosion** |
| **Acid** | **Stone** / **Sand** | Chemical corrosion & dissolution | **Vapor / Steam** + Empty space |
| **Sand** | **Water** / **Oil** | Gravitational buoyancy displacement | **Sand sinks**, liquid displaced upward |

---

## 🌊 3D Smoothed Particle Hydrodynamics (SPH)

Continuous fluid dynamics is solved using Lagrangian particle discretization of the Navier-Stokes momentum equation:

$$\frac{d\vec{v}_i}{dt} = -\frac{1}{\rho_i}\nabla p_i + \frac{\mu}{\rho_i}\nabla^2 \vec{v}_i + \vec{g}$$

### Müller Smoothing Kernels

1. **Density Evaluation ($W_{\text{poly6}}$):**
   $$W_{\text{poly6}}(\vec{r}, h) = \frac{315}{64 \pi h^9} (h^2 - r^2)^3, \quad 0 \le r \le h$$
   $$\rho_i = \sum_{j} m_j W_{\text{poly6}}(\vec{r}_i - \vec{r}_j, h)$$

2. **Pressure Gradient ($W_{\text{spiky}}$) & Tensile Instability Prevention:**
   Standard kernels produce vanishing gradients as $r \to 0$, causing particles to cluster under pressure. The Spiky kernel provides a strict repulsive gradient:
   $$\nabla W_{\text{spiky}}(\vec{r}, h) = -\frac{45}{\pi h^6} \frac{\vec{r}}{r} (h - r)^2$$
   $$\vec{F}_i^{\text{pressure}} = -\sum_{j} m_j \frac{p_i + p_j}{2 \rho_j} \nabla W_{\text{spiky}}(\vec{r}_i - \vec{r}_j, h)$$

3. **Viscosity Laplacian ($W_{\text{viscosity}}$):**
   $$\nabla^2 W_{\text{viscosity}}(\vec{r}, h) = \frac{45}{\pi h^6} (h - r)$$
   $$\vec{F}_i^{\text{viscosity}} = \mu \sum_{j} m_j \frac{\vec{v}_j - \vec{v}_i}{\rho_j} \nabla^2 W_{\text{viscosity}}(\vec{r}_i - \vec{r}_j, h)$$

4. **Equation of State (EOS):**
   $$p_i = k (\rho_i - \rho_0)$$

---

## 🚀 Performance & Memory Strategy

| Pillar | Strategy | Operational Benefit |
| :--- | :--- | :--- |
| **Instanced GPU Batching** | `THREE.InstancedMesh` with dynamic transform & color buffers | **Single GPU Draw Call:** Eliminates CPU draw-call bottleneck and renders 60,000+ voxels at 60 FPS. |
| **Typed Array Memory Layout** | `Uint8Array` (CA) and `Float32Array` (SPH) pre-allocated buffers | **Zero GC Stutter:** Eliminates runtime object allocation and V8 engine garbage collection spikes. |
| **Uniform Spatial Grid** | $O(1)$ Hash table partitioned by smoothing radius $h$ | **Linear Time SPH:** Reduces neighbor lookups from $O(N^2)$ to $O(N)$. |
| **3D Cross-Section Slicing** | Dynamic Y-plane clipping slider | **Internal Inspection:** Allows looking inside complex 3D geological strata, fluid channels, and magma chambers. |

---

## 🎮 Controls & Hotkeys

- **Left Click + Drag:** Paint selected material (Sand, Water, Lava, Acid, Stone, Gunpowder, Oil, etc.)
- **Right Click + Drag / Two-Finger Drag:** Orbit and rotate 3D camera
- **Middle Click / Scroll Wheel:** Zoom in and out
- **Pause / Play Button:** Pause simulation or step frame-by-frame
- **Slice Slider:** Cut through the 3D volume along the Y-axis to inspect internal chambers
- **Audio Toggle:** Real-time synthesized Web Audio API sound effects for all physical interactions

---

## 🛠️ Getting Started

Open `index.html` directly in any modern WebGL2-compatible browser (Chrome, Edge, Firefox, Safari). No build steps or bundlers required.
