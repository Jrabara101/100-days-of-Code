# Quantum Foundry: Celestial Antimatter Incremental Engine

A browser-native, compounding incremental clicker and cosmic production foundry that transforms passive idle resource generation into an active, tactile empire builder. Engineered with React 18, Vite, TypeScript, Tailwind CSS, BreakInfinity.js, Web Audio API, Fastify, and Node.js SQLite with authoritative monotonic time synchronization.

---

## ⚡ High-Impact Features

- **Zero-Friction "First Spark" Onboarding:**
  - Instant browser play with zero logins, installs, or heavy asset downloads.
  - Generates initial energy sparks on first click and allows unlocking the first autonomous drone (*Flux Nanobot*) in under 30 seconds.

- **Tactile "Kinetic Core" & Spring-Deformed Tapping:**
  - Real-time spring physics simulation (squash & stretch, stiffness, damping) responding to click velocity.
  - Radiating concentric shockwave rings and pre-allocated object-pooled floating numbers (`+14.2K`, `+1.2M CRIT!`).
  - Web Audio API synthesizer generating clean, low-latency clicks and melodic pentatonic scaling.

- **Dynamic "Quantum Anomaly" Frenzy Windows:**
  - Random orbital anomalies (*Quantum Rift*, *Solar Hyper-Flare*, *Void Shard*, *Tachyon Anomaly*) drift along orbital paths.
  - Sniping anomalies triggers temporary **Overdrive Frenzies** (7x manual tap yield, 3x global production warp, 30s instant flux loot).

- **Authoritative Monotonic Offline Yield & Time-Lock:**
  - Fastify backend validates offline duration against server monotonic UTC timestamps, clamping maximum offline time (8 hours by default) to neutralize system-clock manipulation exploits.
  - Offline Welcome-Back Briefing detailing elapsed duration, verified passive gain, and time-lock badge.

- **The "Singularity Collapse" Prestige Constellation:**
  - Collapsing the reactor converts accumulated matter into permanent Antimatter Shards.
  - Interactive SVG/Canvas Constellation Tree with non-linear perk nodes (*Critical Core Resonance*, *Chrono Time-Warp*, *Drone Overclock Matrix*, *Autonomous Foundry Bot*, *Anomaly Gravity Lens*, *Singularity Convergence*).

- **Server-Authoritative Anti-Macro & Economy Integrity:**
  - Heuristic cadence analyzer filtering inhuman square-wave autoclickers (>25 CPS steady-state or near-zero interval variance).
  - Global competitive leaderboard tracking player rankings, lifetime wealth, highest CPS, and verification badges.

---

## 🚀 Tech Stack

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, BreakInfinity.js, Lucide Icons, Canvas-Confetti
- **Audio:** Zero-asset procedural Web Audio API Synthesizer (pentatonic pitch scaling, harmonic resonance)
- **Backend:** Node.js Fastify, `@fastify/websocket`, `@fastify/cors`, `@fastify/static`
- **Database:** Node 24 native `node:sqlite` (`DatabaseSync`) persistent storage (`data/foundry.sqlite`)
- **Telemetry & Anti-Cheat:** Poisson cadence analyzer, monotonic time validation, BigNumber score indexing

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server (Concurrent Client & Server)
```bash
npm run dev
```
- **Client:** `http://localhost:5175/`
- **Fastify Backend & WebSockets:** `http://localhost:3009/`

### 3. Production Build & Start
```bash
npm run build
npm run start
```
