# PHYS-SIM X1 - Particle Life Simulator

An interactive, high-performance continuous artificial life sandbox built with HTML5 Canvas, Tailwind CSS, and optimized Spatial Grid Partitioning in JavaScript.

![PHYS-SIM X1 Preview](https://img.shields.io/badge/Physics-Continuous%20Particle%20Life-38bdf8?style=for-the-badge)
![FPS](https://img.shields.io/badge/Performance-60%2B%20FPS-4edea3?style=for-the-badge)
![Particles](https://img.shields.io/badge/Particles-1200%2B-c7c8ff?style=for-the-badge)

---

## 🌟 Overview

**Particle Life** is an artificial life simulation that produces lifelike, self-organizing complexity from simple mathematical interaction rules between multiple species of particles. 

Without explicit programming for biology or kinematics, emergent phenomena spontaneously appear:
- **Swimming Snakes / Worms** that crawl and change direction.
- **Cell Membranes & Organelles** that enclose inner particles and divide (mitosis).
- **Gravitational Clusters & Planetary Orbits**.
- **Symbiotic Predator-Prey Loops** that chase and evade across the universe.
- **Hexagonal / Crystal Lattices**.

---

## 🔬 Mathematical Model

For any two particles $i$ and $j$ separated by vector $(\Delta x, \Delta y)$ and distance $r = \sqrt{\Delta x^2 + \Delta y^2}$ in a toroidal field with maximum interaction radius $r_{max}$:

$$\text{Normalized distance: } u = \frac{r}{r_{max}}$$

### 1. Close-Range Hardcore Repulsion ($u < \beta$)
Prevents infinite density collapse and creates physical volume:
$$F(u) = \frac{u}{\beta} - 1 \quad (F \in [-1, 0])$$

### 2. Mid-Range Species Interaction ($\beta \le u < 1$)
Governed by interaction matrix coefficient $A_{ij} \in [-1, 1]$:
$$F(u) = A_{ij} \times \left(1 - \frac{|2u - 1 - \beta|}{1 - \beta}\right)$$

### 3. Velocity Integration & Damping
$$v_x(t+1) = \left(v_x(t) + \sum F_x \cdot k_{force}\right) \times (1 - \text{friction})$$
$$v_y(t+1) = \left(v_y(t) + \sum F_y \cdot k_{force}\right) \times (1 - \text{friction})$$

---

## 🧬 Particle Species & Color Palette

| Species | Color Name | Hex | Role |
|:---:|:---:|:---:|:---|
| **A** | Coral / Red | `#ffb4ab` | Primary Actor / Nucleus |
| **B** | Emerald / Green | `#4edea3` | Membrane / Flagella |
| **C** | Sky / Cyan | `#8ed5ff` | Orbiting Organelle |
| **D** | Lavender / Violet | `#c7c8ff` | Matrix Stabilizer |

---

## 🎮 Features & Controls

### 🎛️ Interaction Matrix Controls
- **Live Numeric Inputs**: Click and adjust force values between species from `-1.0` (strong repulsion) to `+1.0` (strong attraction).
- **Asymmetric Coupling**: Making $A \to B$ positive while $B \to A$ is negative creates persistent unidirectional chase locomotion.
- **Quick Operations**: `Zero`, `Invert` (flip all forces), `Mirror` (symmetrize matrix).

### 🌌 8 Built-In Archetype Presets
1. **WORMS**: Interlocking chase loops that form self-steering biological snakes.
2. **CELLS**: Bilayer membranes that capture inner cytoplasm particles.
3. **SOUP**: Dynamic chemical turbulence with constantly reacting clusters.
4. **ORBITS**: Centrifugal planetary orbits and vortex rings.
5. **SYMBIOSIS**: Paired predator-prey dynamics and hunting patterns.
6. **CRYSTAL**: High-symmetry geometric crystal lattices.
7. **PULSAR**: Rhythmic breathing clusters that pulsate in place.
8. **CHAOS**: High-energy erratic swarm dynamics.

### 🖱️ Interactive Brush Tools
- **Attractor Well**: Hold left click to attract particles to cursor.
- **Repulsor Field**: Disperse dense clusters with a force wave.
- **Vortex Swirl**: Impart angular momentum and create whirlpools.
- **Particle Emitter**: Inject fresh bursts of particles at your mouse pointer.

### 📊 Real-Time Telemetry HUD & Analytics
- **Live FPS & Particle Counter**: Real-time framerate and active entity tracking.
- **Kinetic Energy Oscilloscope**: Real-time graph of overall universe energy.
- **Species Population Balance**: Individual count and distribution monitors.

---

## 🚀 How to Run

Simply open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari):

```bash
# Optional: Launch with a local HTTP server
npx serve .
# or
python -m http.server 8000
```
