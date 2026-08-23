# 3D Incompressible Eulerian Fluid Dynamics Engine

A high-performance, real-time 3D Eulerian fluid dynamics engine running natively in the browser using Three.js, React 18, Tailwind CSS, and WebGL. The engine implements **Jos Stam's Stable Fluids** framework over flat, cache-aligned `Float32Array` Struct-of-Arrays (SoA) buffers, enforcing strict incompressibility ($\nabla \cdot \vec{u} = 0$) via a 3D **Jacobi Pressure-Poisson solver**, preserving micro-turbulences with **3D Vorticity Confinement**, and rendering dynamic volumetric density fields at 60 FPS via a single batched `THREE.InstancedMesh`.

---

## 🏛️ System Architecture

```
                      [React 18 Telemetry & Control HUD]
                                      │
                                      ▼
                        [Three.js 3D Viewport Stage]
                  (OrbitControls & Dynamic Lighting Rig)
                                      │
                                      ▼
                      [3D Raycast Ingestion Vector]
            (Unprojects Screen Pointer to 3D Impulse Blobs)
                                      │
                                      ▼
                     [Flat Struct-of-Arrays (SoA)]
           (Velocity uX/uY/uZ, Density RGB, Pressure p, Div)
                                      │
      ┌───────────────────────────────┴───────────────────────────────┐
      ▼                                                               ▼
[Phase 1: Force & Plumes]                                   [Phase 2: Buoyancy]
• Mouse Momentum Drag                                       • Thermal Density Lift
• Continuous Jet Injectors                                  • Multi-Palette Dyes
      │                                                               │
      └───────────────────────────────┬───────────────────────────────┘
                                      ▼
                       [Phase 3: Vorticity Confinement]
                       • 3D Curl: ω = ∇ × u
                       • Gradient: η = ∇|ω| / |∇|ω||
                       • Swirl Energy: f_vort = ε · (η × ω)
                                      ▼
                     [Phase 4: Semi-Lagrangian Advection]
                     • Trilinear Particle Backtracing:
                       u(x, t+Δt) = u(x - u·Δt, t)
                                      ▼
                   [Phase 5: Jacobi Pressure Projection]
                   • Calculate Discrete Divergence: ∇ · u
                   • Solve Poisson Eq: ∇²p = ∇ · u / Δt
                   • Helmholtz-Hodge Projection: u_final = u - ∇p
                                      ▼
                     [Phase 6: GPU Volumetric Sync]
                     • Single THREE.InstancedMesh Draw Call
                     • Real-time Matrix & Dynamic RGB Upload
                     • 60 FPS Zero-GC Execution
```

---

## 🔬 Foundational Sources & Technical Lineage

1. **Jos Stam (1999) – *"Stable Fluids"* (SIGGRAPH '99):** Introduced unconditionally stable semi-Lagrangian advection and the Helmholtz-Hodge decomposition to computer graphics, eliminating the Courant-Friedrichs-Lewy (CFL) timestep restriction.
2. **Fedkiw, Stam, & Jensen (2001) – *"Visual Simulation of Smoke"*:** Developed Vorticity Confinement, an algorithm that calculates the curl of the velocity field and injects energy back into micro-turbulences, preventing coarse numerical grids from becoming artificially viscous.
3. **Mark J. Harris (2004) – *"Fast Fluid Dynamics on the GPU"* (GPU Gems, Ch 38):** Standardized the mapping of staggered and collocated Eulerian grid operations (Advection $\to$ Diffusion $\to$ Pressure Projection) to parallel execution pipelines.
4. **PavelDoGreat – *"WebGL-Fluid-Simulation"*:** The benchmark open-source browser implementation demonstrating high-throughput Jacobi iterations, bloom integration, and multi-color dye injection.

---

## 📐 Mathematical Formulation

### 1. Incompressible Navier-Stokes Equations

$$\frac{\partial \vec{u}}{\partial t} = -(\vec{u} \cdot \nabla)\vec{u} - \frac{1}{\rho}\nabla p + \nu \nabla^2 \vec{u} + \vec{f}_{\text{ext}}$$

$$\nabla \cdot \vec{u} = 0 \quad (\text{Incompressibility Condition})$$

Where:
- $\vec{u} = (u_x, u_y, u_z)$: 3D Velocity vector field.
- $p$: Scalar internal pressure field.
- $\rho$: Fluid density constant.
- $\nu$: Kinematic viscosity coefficient.
- $\vec{f}_{\text{ext}}$: External forces (thermal buoyancy, mouse drag impulses).

### 2. Helmholtz-Hodge Decomposition & Jacobi Pressure-Poisson Solver

Any vector field $\vec{w}$ can be uniquely decomposed into a divergence-free (solenoidal) component $\vec{u}$ and the gradient of a scalar potential field $\nabla p$:

$$\vec{w} = \vec{u} + \nabla p \implies \nabla \cdot \vec{w} = \nabla^2 p$$

We solve the 3D Poisson equation $\nabla^2 p = \nabla \cdot \vec{w}$ using relaxed Jacobi iterations:

$$p_{x,y,z}^{k+1} = \frac{p_{x-1,y,z}^k + p_{x+1,y,z}^k + p_{x,y-1,z}^k + p_{x,y+1,z}^k + p_{x,y,z-1}^k + p_{x,y,z+1}^k - (\nabla \cdot \vec{w})_{x,y,z} \cdot \Delta x^2}{6}$$

Once $p$ converges over 20 iterations, the velocity field is projected onto the divergence-free subspace:

$$u_x = w_x - \frac{p_{x+1,y,z} - p_{x-1,y,z}}{2 \Delta x}$$

$$u_y = w_y - \frac{p_{x,y+1,z} - p_{x,y-1,z}}{2 \Delta y}$$

$$u_z = w_z - \frac{p_{x,y,z+1} - p_{x,y,z-1}}{2 \Delta z}$$

### 3. 3D Vorticity Confinement

To counteract artificial numerical damping caused by linear interpolation during advection, vorticity $\vec{\omega} = \nabla \times \vec{u}$ is calculated:

$$\vec{\omega} = \begin{pmatrix} \frac{\partial u_z}{\partial y} - \frac{\partial u_y}{\partial z} \\ \frac{\partial u_x}{\partial z} - \frac{\partial u_z}{\partial x} \\ \frac{\partial u_y}{\partial x} - \frac{\partial u_x}{\partial y} \end{pmatrix}, \quad \vec{\eta} = \frac{\nabla \|\vec{\omega}\|}{\|\nabla \|\vec{\omega}\|\|}, \quad \vec{f}_{\text{vort}} = \epsilon \cdot (\vec{\eta} \times \vec{\omega}) \cdot \Delta x$$

### 4. 3D Semi-Lagrangian Advection with Trilinear Interpolation

Particles are back-traced along their characteristic trajectory:

$$\vec{x}_{\text{prev}} = \vec{x} - \vec{u}(\vec{x}) \cdot \Delta t$$

The quantity (velocity components and RGB dye densities) is sampled at $\vec{x}_{\text{prev}}$ using 3D trilinear interpolation across the 8 surrounding grid neighbors.

---

## ⚡ Zero-Allocation Memory Model (Cache-Aligned SoA)

On a 3D grid of size $28 \times 28 \times 28$ (21,952 voxels), multi-dimensional arrays (`grid[z][y][x]`) create memory fragmentation and trigger severe garbage collection stutter.

This engine pre-allocates flat `Float32Array` buffers with $O(1)$ stride indexing:

$$\text{Index}(x, y, z) = z \cdot N^2 + y \cdot N + x$$

All computational passes (Curl, Divergence, Pressure, Advection) operate in-place or swap pre-allocated ping-pong buffers with zero heap allocations during the 60 FPS animation loop.

---

## 🎮 Controls & Interaction

| Input | Action |
| :--- | :--- |
| **Left Click + Drag** | Inject 3D Force Impulse & Dye into fluid domain |
| **Right Click + Drag** | Orbit Three.js Camera |
| **Scroll Wheel** | Dolly Zoom In / Out |
| <kbd>Space</kbd> | Pause / Resume Simulation |
| <kbd>R</kbd> | Flush Fluid Grid (Reset all buffers) |
| <kbd>C</kbd> | Cycle Color Palettes |
| <kbd>V</kbd> | Toggle Vorticity Curl Visualization Mode |

---

## 🎨 Simulation Presets & Visual Modes

- **🔥 Thermal Plume:** Continuous upward buoyant thermal jet generating Kelvin-Helmholtz billows.
- **💥 Opposing Jets:** High-velocity dual colliding jets creating center turbulent stagnation and vortices.
- **🌪️ Toroid Vortex Ring:** Periodic pulsed annular ring ejector forming stable propagating vortex rings.
- **🌀 Cyclone:** Orbiting rotational plume generating a spiral convective vortex.
- **✋ Manual:** Pure sandbox mode for direct mouse interaction.

---

## 🚀 Running Locally

Simply open `index.html` in any modern web browser supporting WebGL (Chrome, Edge, Firefox, Safari). No build steps or node server required.
