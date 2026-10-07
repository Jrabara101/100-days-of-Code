# ⚡ Avionics FPS // Tactical Performance HUD & Diagnostic Suite

A browser-native, ultra-low-overhead runtime telemetry command center and performance diagnostic suite inspired by tactical avionics and aerospace telemetry displays.

---

## 🚀 Key Features

### 1. Zero-Friction "Ghost HUD" & Ambient Pacing Glow
- **Compact Glassmorphic HUD Pill**: Draggable overlay with edge-snapping physics, high-contrast monospace readouts, and a pulsing status dot.
- **Micro-Jitter Stutter Alert**: The pill executes an 80ms horizontal tremor (`animate-stutter-tremor`) whenever a frame hitch (>33.3ms) or `longtask` occurs.
- **Ambient Edge Mode**: Subtle peripheral border glow dynamically pulsing in **emerald** (optimal 60/120 FPS), **amber** (frame drops), or **crimson warning** (severe hitches).
- **Graph Strip HUD Mode**: Horizontal telemetry bar with an integrated live micro-sparkline canvas.

### 2. High-Precision Timing Pipeline & 1% Low Hitch Radar
- **Zero Profiling Overhead (<0.05ms/frame)**: Frame delta times calculated strictly via `window.performance.now()` in a dedicated `requestAnimationFrame` loop.
- **Typed Float32Array Circular Buffer**: 1800 samples (15–30 seconds) allocated outside React state, decoupling metric updates from React rendering.
- **Rolling 1% & 0.1% Low Radar**: Detects and exposes micro-stutters disguised by deceptive average framerates.
- **Direct HTML5 Canvas Sparklines**: Real-time frame latency graphs and histograms with 8.33ms (120Hz) and 16.66ms (60Hz) target reference lines and interactive cursor scrub reticles.

### 3. "Chaos Rig" Throttling Sandbox
- **Web Worker CPU Burner**: Configurable off-thread busy-wait loops (0% to 100% load) simulating background computations or mobile thermal throttling.
- **Synchronous Delay Injection**: Injects customizable blocking computation (0–45ms) into the game loop.
- **Target Framerate Limiter**: Locks rAF cadence to 30, 45, 60, 120 FPS or Uncapped.
- **Memory Pressure & GC Spurt**: Allocates Float64Array chunks to induce heap pressure and trigger garbage collection pauses.
- **Instant Hitch Injectors**: One-click 80ms and 150ms freeze buttons for instant verification of diagnostic telemetry.

### 4. Black-Box "Flight Recorder" & Circular Incident Buffer
- **15-Second Rolling Incident History**: Continuously records frame deltas, instant framerates, memory heap allocations, and thread freezes.
- **Replayable Flamegraph Canvas**: Interactive timeline scrub with step-by-step playback controls and color-coded latency bars.
- **Incident Snapshot Capture (`F2` / `~`)**: Saves pre-stutter telemetry traces into an archive with one-click export.
- **Event & Exception Ticker**: Virtualized log capturing `PerformanceObserver` `longtask` entries (>50ms freezes) and unhandled window exceptions.

### 5. One-Click "Benchmark Passport" & Discord Scorecard
- **Markdown Tables & Badges**: Formatted diagnostic reports ready for GitHub issue filing and QA defect tickets.
- **Discord ASCII Scorecard**: Monospace ASCII scorecard for Discord alpha channels.
- **JSON Diagnostic Bundle**: Instant export of complete machine-readable telemetry dumps (`.json`).
- **Emerald Bloom Feedback**: Visual border pulse confirming clipboard copy.

### 6. Authoritative Fleet Telemetry & Regression Beacon (Fastify + SQLite)
- **Ingestion Route (`POST /api/telemetry/report`)**: Ingests client sessions using `navigator.sendBeacon` or `keepalive: true` fetch.
- **Fleet Analytics Route (`GET /api/telemetry/summary`)**: Computes global fleet stability scores, average FPS across devices, GPU hardware distributions, and automated regression alerts (flagging devices with 1% low < 30 FPS or excessive long tasks).

---

## 🛠️ Architecture & Tech Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Profiling Engine** | Sub-millisecond `performance.now()`, `Float32CircularBuffer`, `PerformanceObserver` |
| **Graphics & HUD** | HTML5 2D Canvas (HiDPI / DPR scaled), CSS Glassmorphism, Avionics Theme |
| **Stress Rig** | Web Workers, Typed Memory Buffers, rAF Interceptors |
| **Backend** | Fastify, `@fastify/cors`, `node:sqlite` (Zero-dependency embedded database) |

---

## ⌨️ Controls & Hotkeys

- **`F2` or `~` / `` ` ``**: Toggle Expanded Avionics Diagnostic Deck
- **`Escape`**: Close Diagnostic Deck
- **Left-Click & Drag HUD Pill**: Freely position HUD anywhere on screen (with edge-snapping physics)
- **Left-Click & Drag Particle Rig**: Gravity repulsion and shockwave dispersal

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Environment (Backend + Frontend)
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173/` (or next available port)
- **Fastify Telemetry Backend**: `http://127.0.0.1:3001/`

### 3. Production Build
```bash
npm run build
```
