# NEON SLIPSTREAM // Infinite Gauntlet

A high-velocity, browser-native endless runner built with **Vite**, **React 18+**, **TypeScript**, **Tailwind CSS**, and **HTML5 Canvas Pseudo-3D Perspective**, paired with a **Node.js Fastify** backend with **WebSockets** and **SQLite**.

Built for instant play with **zero required installations, logins, or external asset downloads** — featuring procedural seed generation, near-miss overdrive mechanics, asynchronous hologram ghosts, and server-authoritative anti-cheat verification.

---

## 🎮 Core Features

### 1. Zero-Friction "Instant Sprint" Onboarding
- Instant drop onto the track with zero loading screen or asset downloads.
- Universal control parity: Keyboard (`WASD` / `Arrow Keys` / `Space` / `Shift`), Gamepad API, and Mobile Multi-Touch swipe gestures with haptic vibration feedback.

### 2. Dynamic "Slipstream Overdrive" & Near-Miss Engine
- **Dual-Hitbox Detection**: Lethal collision box + concentric 16px outer Near-Miss boundary.
- Skimming hazard hitboxes without crashing triggers electric spark bursts, adds score bonus, and feeds the **Overdrive Gauge**.
- **Overdrive Mode**: Temporary invincibility, vacuum coin magnet, supersonic speed boost, screen shake, and warp speed lines.

### 3. Asynchronous "Ghost Runner" Holograms
- Race side-by-side with semi-transparent neon hologram runners of global leaderboard record holders or personal bests.
- Dynamic split markers display lead/lag distance in real-time (`+340m` / `-120m`).

### 4. The Daily Seeded "Infinite Gauntlet"
- Globally synchronized endless course generated deterministically from calendar date seed (e.g., `DAILY-2026-09-29`) using **Mulberry32 PRNG**.
- Custom seed support for community challenges.
- One-click copyable spoiler-free scorecard:
  ```text
  🏃 ⚡ 💀 [NEON SLIPSTREAM // Daily 2026-09-29 // Distance: 3,420m // Near-Misses: 14 // Score: 32,500]
  ```

### 5. Procedural Biome Morphing
Traversing every 1,000 meters morphs the environment dynamically:
- **0m - 1,000m**: *Neon Cyber Highway* (Cyan / Magenta synthwave grid, glowing skyscrapers)
- **1,000m - 2,000m**: *Orbital Skybridge* (Deep space starfield, celestial glow, electric blue rails)
- **2,000m - 3,000m**: *Subterranean Magma Tunnels* (Crimson volcanic caverns, lava hazards)
- **> 3,000m**: Cycles with accelerating velocity and hazard clusters!

### 6. Server-Authoritative Anti-Cheat Verification
- Client logs timestamped telemetry (`timeMs`, `action`, `lane`, `y`).
- Upon run completion, the client submits run data to `POST /api/runs/submit`.
- Fastify server validates physics feasibility (average velocity bounds, maximum jump hangtimes, theoretical score maximums) before committing records to SQLite.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile | Gamepad |
| :--- | :--- | :--- | :--- |
| **Move Left** | `A` or `◄ Left Arrow` | Swipe Left / Tap `◄` | D-Pad Left / Left Stick |
| **Move Right** | `D` or `► Right Arrow` | Swipe Right / Tap `►` | D-Pad Right / Left Stick |
| **Jump** | `W` or `▲ Up` or `Space` | Swipe Up / Tap `▲` | Button A / D-Pad Up |
| **Slide / Duck** | `S` or `▼ Down` | Swipe Down / Tap `▼` | Button B / D-Pad Down |
| **Overdrive** | `Shift` or `E` | Tap Glowing `⚡` Button | Button X / Y |
| **Pause / Settings** | `Esc` or `P` | Tap Pause Icon | Start / Options |

---

## 🛠️ Architecture & Tech Stack

```text
├── server/
│   ├── server.ts        # Fastify REST & WebSocket Game Server
│   ├── db.ts            # SQLite database with WAL mode & seed ghost storage
│   └── antiCheat.ts     # Server-authoritative physics & telemetry validator
└── src/
    ├── engine/
    │   ├── prng.ts            # Mulberry32 32-bit PRNG & seed hasher
    │   ├── procedural.ts      # Chunk director with guaranteed solvable lanes
    │   ├── physics.ts         # 60Hz fixed kinematics, coyote time, jump buffer, near-miss
    │   ├── renderer.ts        # HTML5 Canvas Pseudo-3D Perspective engine & particles
    │   ├── audio.ts           # Zero-asset Web Audio API procedural sound synthesizer
    │   └── useRunnerEngine.ts # Decoupled physics/render hook with chunk pooling
    ├── components/
    │   ├── HudOverlay.tsx          # Glassmorphic telemetry HUD
    │   ├── PauseSheet.tsx          # Settings drawer with volume & motion sliders
    │   ├── DailyGauntletModal.tsx  # Daily seed challenge & global standings
    │   ├── GameOverDialog.tsx      # Run debrief & scorecard sharing
    │   └── MobileTouchControls.tsx # Low-latency mobile touchscreen buttons
    └── App.tsx                # Instant sprint root & WebSocket integration
```

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Frontend & Backend Concurrently**:
   ```bash
   npm run dev
   ```
   - Frontend Client: `http://localhost:5175`
   - Fastify Backend Server: `http://localhost:3002`

3. **Production Build**:
   ```bash
   npm run build
   ```
