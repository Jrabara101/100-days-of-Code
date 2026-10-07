# ⚡ SpeedSync // Multiplayer Speedrun Timer & Race Platform

> A high-velocity, browser-native competitive speedrun engine and synchronized race hub that transforms solo time-attack routing into an electrifying head-to-head esport.

---

## 🚀 Key Highlights & Architecture

### 1. Monotonic Clock Authority & NTP-Style Latency Calibration
- **Zero Clock Manipulation**: Local client clocks and Cheat Engine manipulation cannot distort race results. Timers are anchored to high-resolution monotonic server clocks (`process.hrtime.bigint()`).
- **Ping-Pong Calibration**: Continual NTP-style round-trip ping calculations calibrate client-server offset:
  $$\text{clientEstimatedServerTime} = \text{localNow} + \text{offset}$$
  Where $\text{offset} = \text{serverMonoTime} - (\text{clientSendTime} + \frac{\text{RTT}}{2})$.

### 2. Clock Engine Decoupling (High-Precision 60fps / 120fps Rendering)
- Timer execution is completely decoupled from top-level React state loops.
- `usePrecisionStopwatch` leverages a dedicated `requestAnimationFrame` loop reading directly from `performance.now()`.
- Updates write straight to isolated, memoized leaf DOM nodes (`.textContent`), entirely eliminating costly full React DOM reconciliation trees at 60fps.

### 3. Server-Authoritative Split Ingestion & Anti-Cheat Validation
- Server enforces strict segment order consistency (`splitIndex === currentSplitIndex`).
- Segments must satisfy the **Minimum Human Duration Sanity Threshold** ($\ge 350\text{ms}$) to prevent macro bot attacks.
- Authoritative calculation of leader deltas, personal best deltas, and Gold splits with instant multi-client broadcast.

### 4. Dual Viewport Layouts
- **Runner HUD**: Ultra-minimal, high-contrast, distraction-free interface configured for side-by-side positioning next to emulators or PC games.
- **Caster / Broadcast Arena**: Multi-runner comparative telemetry columns, dynamic relative position progress track, live velocity speedometer (px/s), APM meters, audio visualizers, and caster commentary notes.

### 5. "Gold Split" Momentum Surge & Web Audio API Synthesis
- Synthetic Web Audio API engine produces countdown chimes, mechanical split bells, and multi-note gold fanfare chords with sub-bass whooshes. Zero external audio file dependencies.
- Visual gold flares, animated border pulses, and momentum surge banners.

### 6. Asynchronous Ghost Duels & LiveSplit (.lss) Interoperability
- Solo runners can race against World Record ghosts, Personal Best ghosts, or Pacer ghosts.
- Full import and export compatibility with standard LiveSplit `.lss` XML files and JSON presets.

---

## ⌨️ Global Keyboard Hotkeys

| Action | Primary Key | Alternate Keys |
| :--- | :--- | :--- |
| **Split / Next Segment** | `[Space]` | `[NumPad 1]`, `[Z]` |
| **Undo Last Split** | `[NumPad 8]` | `[Backspace]`, `[U]` |
| **Skip Segment** | `[NumPad 2]` | `[S]` |
| **Reset Run** | `[NumPad 3]` | `[R]` |

*Note: All hotkeys feature automatic input immunity when typing in text fields or modals.*

---

## 🎮 Built-in Game Categories

1. **Apex Cyber-Runner (Any% Glitchless)** — 8 Sectors with dynamic laser hazards.
2. **Super Mario 64 (16 Star)** — Classic BLJ routing & Bowser throws.
3. **Celeste (Any%)** — Chapters 1 through 7 Summit climb.
4. **The Legend of Zelda: Ocarina of Time (Any%)** — Deku Tree, Door of Time, Ganon Collapse.

---

## 🛠️ Tech Stack

- **Frontend**: Vite 6, React 18+, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API, Canvas/SVG QR Generator.
- **Backend**: Node.js (v24), Fastify 5, `@fastify/websocket`, `@fastify/cors`, `@fastify/static`.
- **Runtime**: `tsx` for TypeScript execution with zero manual build steps in dev.

---

## 🏁 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run both Server & Client concurrently in dev mode
npm run dev

# 3. Or run production build
npm run build
npm start
```

Default access points:
- **Web App**: `http://localhost:5173` (or `http://localhost:3005` in production)
- **Fastify API & WebSocket**: `http://localhost:3005` / `ws://localhost:3005/ws`
- **Default Instant Demo Room**: `NX9Q`
