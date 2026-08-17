# 2D Microscopic Traffic Simulation Engine

A decoupled, high-performance **2D Microscopic Traffic Simulation Engine** built with React 18, Vite, Tailwind CSS, and HTML5 Canvas. The simulation models autonomous and human driver behavior using Martin Treiber’s **Intelligent Driver Model (IDM)** differential equations on 1D parametric arc-length tracks with real-time shockwave tracking, signal FSMs with virtual obstacle injection, and rich telemetry.

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │      React Telemetry & Control HUD (60Hz)    │
                                  │  (Scenario Selector, IDM Sliders, Diagrams)  │
                                  └───────────────▲──────────────────────────────┘
                                                  │ (Throttled Telemetry / Actions)
                                  ┌───────────────▼──────────────────────────────┐
                                  │      2D Canvas Hardware-Accelerated Stage    │
                                  │   (Vehicles, Splines, Heatmaps, Visualizers) │
                                  └───────────────▲──────────────────────────────┘
                                                  │
 ┌────────────────────────────────────────────────┼────────────────────────────────────────────────┐
 │                        HEADLESS SIMULATION ENGINE (Decoupled Core)                              │
 │                                                                                                 │
 │  ┌────────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────────────┐  │
 │  │ Intersection Signal    │   │ 1D Arc-Length Coordinate  │   │ IDM Car-Following Physics    │  │
 │  │ FSM & Virtual Obstacle │──▶│ Mapper Engine             │──▶│ Integrator (Euler / RK2)     │  │
 │  │ (Red/Yellow Injection) │   │ s, laneId -> (X, Y, θ)    │   │ O(N) Headway & Shockwaves    │  │
 │  └────────────────────────┘   └───────────────────────────┘   └──────────────────────────────┘  │
 │                                                                                                 │
 │  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │ Space-Time Trajectory & Macroscopic Fundamental Flow-Density Recorder                     │  │
 │  └───────────────────────────────────────────────────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Mathematical Formulation: Intelligent Driver Model (IDM)

The longitudinal acceleration $\dot{v}$ of vehicle $\alpha$ following lead vehicle $\alpha-1$ is calculated via the continuous differential equation:

$$\dot{v} = a \left[ 1 - \left( \frac{v}{v_0} \right)^\delta - \left( \frac{s^*(v, \Delta v)}{s} \right)^2 \right]$$

Where the desired dynamic equilibrium gap $s^*(v, \Delta v)$ is defined as:

$$s^*(v, \Delta v) = s_0 + v T + \frac{v \Delta v}{2\sqrt{a b}}$$

### Parameter Definitions:
- $v_0$: Desired free-flow speed.
- $s_0$: Minimum standstill bumper-to-bumper distance ($2.0\text{m} - 7.0\text{m}$).
- $T$: Safe time headway ($0.5\text{s} - 2.4\text{s}$).
- $a$: Maximum comfortable acceleration ($0.7 - 2.8\text{ m/s}^2$).
- $b$: Comfortable braking deceleration ($1.2 - 3.0\text{ m/s}^2$).
- $\delta$: Acceleration exponent (typically $\delta = 4$).
- $s$: Actual net bumper distance ($x_{\alpha-1} - x_\alpha - L_{\text{veh}}$).
- $\Delta v$: Approach velocity ($v_\alpha - v_{\alpha-1}$).

---

## 🚦 Intersection Signaling via Virtual Obstacle Injection

Traffic lights are modeled without modifying vehicle steering code:
- A red or yellow light injects a stationary **Virtual Obstacle Vehicle** ($v_{\text{lead}} = 0, \text{length} = 0$) at stop-line distance $s_{\text{light}}$.
- Approaching vehicles naturally apply smooth IDM deceleration to stop at the line.
- **Yellow Light Dilemma Zone**: If a vehicle cannot safely stop within comfortable deceleration $b \le b_{\text{comf}}$, the obstacle is omitted, allowing the car to safely clear the intersection.

---

## 🛣️ Topologies & Scenarios

1. **Sugiyama Ring (Phantom Traffic Jam)**: Closed circular track showing emergent backward-traveling shockwave waves ($v_{\text{wave}} \approx -15\text{ km/h}$) from subtle human driver headway variance.
2. **4-Way Signalized Intersection**: Urban crossroads with dual approach lanes, configurable green/yellow phases, and adaptive queue-length detection.
3. **Highway Bottleneck & Lane Drop**: 3-lane into 2-lane merge demonstrating capacity drop, queue formation, and downstream discharge flow.
4. **Modern Turbo Roundabout**: Continuous circulating ring with yield-on-entry priority rules.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Toggle Simulation Pause / Resume |
| `R` | Reset Current Scenario |
| `1`, `2`, `3`, `4` | Switch Scenario (Ring, 4-Way, Bottleneck, Roundabout) |
| `B` | Tap Brake Wave on Lead Vehicle |
| `S` | Stall / Unstall Selected Vehicle (Roadblock) |
| `H` | Toggle Speed-to-Color Heatmap |
| `T` | Toggle Space-Time & Fundamental Diagram HUD |
| `C` | Toggle IDM Parameter & Control Deck |

---

## 🚀 Running Locally

```bash
# Navigate to project directory
cd "Game/Traffic Simulator"

# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build production bundle
npm run build
```
