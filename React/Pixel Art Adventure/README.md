# Chronicles of Aethelgard // Pixel Art Adventure

A browser-native, story-driven 2D pixel art adventure game that transforms exploration into an atmospheric, emotionally resonant journey. Built with **React 18+**, **Vite**, **TypeScript**, **Tailwind CSS**, an **HTML5 2D Canvas Engine**, a lightweight **Node.js (Fastify)** backend, and **Better-SQLite3** for persistence and narrative telemetry.

---

## 🎮 Key Features

- **Decoupled 60fps Canvas Engine**: 60Hz fixed-timestep game loop inside `requestAnimationFrame`, rendering multi-layer tile grids (Ground, Detail, Collisions, Canopy Overlay) with sub-pixel lerp camera tracking.
- **Dynamic 2D Pixel Lighting Engine**: Real-time 24-hour day/night cycle with canvas composite operations (`globalCompositeOperation = 'destination-out'` and `'lighter'`), casting ambient twilight/night darkness and warm flickering radial glows around the player's ancient lantern, torches, and spirit beacons.
- **Branching Dialogue Machine**: Pure TypeScript dialogue graph interpreter supporting conditional prerequisites (e.g. `has_flute`, `echo_viewed`), story flag mutations, typewriter text animation, and Web Audio API synthesized voice chirps tailored to each character.
- **Memory Echo Narrative Discovery**: Sepia-toned visual vignettes and ambient flashbacks triggered by touching ancient monoliths or relics.
- **Global Folk Chronicle Telemetry**: Real-time aggregated community decision tracking powered by SQLite and Fastify (`GET /api/choices/:chapterId/stats`), revealing how each player's moral choices compare with global travelers.
- **Seamless Input Parity**: Responsive controls across Keyboard (`WASD` / Arrow keys, `[E]` interact, `[Space]` inspect, `[1-3]` tools, `[J]` journal, `[M]` map), Gamepads, and Virtual On-Screen 4-way D-Pad with touch buttons for mobile and tablet browsers.

---

## 🕹️ Controls Guide

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Up / Down / Left / Right** | `W`, `A`, `S`, `D` or `Arrow Keys` | Virtual 4-Way D-Pad (Bottom-Left) |
| **Interact / Talk** | `[E]` | `[A]` Action Button (Bottom-Right) |
| **Inspect / Fast-forward Text** | `[Space]` or `[Enter]` | Tap Dialogue Text / `[A]` Button |
| **Select Dialogue Choice** | `[1]`, `[2]`, `[3]` or `↑`/`↓` + `Enter` | Tap Choice Pill |
| **Equip / Toggle Lantern** | `[1]` | `[B]` Tool Button / Tap Belt Slot |
| **Play Harmonic Flute** | `[2]` | Tap Belt Slot 2 |
| **Open Quest Journal** | `[J]` | Tap `[J] Journal` in HUD |
| **Open Illustrated Map** | `[M]` | Tap `[M] Map` in HUD |
| **Close Modals / Cancel** | `[ESC]` | Tap Return / Close Button |

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS & custom Neo-Pixel Atelier design tokens (`#0B0D14` void base, `#131826` frosted indigo dialogue, `#F59E0B` amber highlights, `#38BDF8` spirit cyan)
- **Typography**: Google Fonts (`Press Start 2P`, `Silkscreen`, `Outfit`, `JetBrains Mono`)
- **Graphics**: Procedural 16-bit pixel art generator (`src/game/sprites.ts`) producing authentic player walk animations, NPCs, and tilemaps directly on canvas
- **Audio**: Web Audio API Chiptune Synthesizer (`src/services/audio.ts`) with zero external sound asset dependencies

### Backend (Node.js + Fastify)
- **Fastify Server**: Listening on `http://localhost:3001` with `@fastify/cors`
- **SQLite Database**: `game.db` powered by `better-sqlite3` with WAL mode
- **REST Endpoints**:
  - `GET /api/save`: Fetches latest player save state, location, inventory, and narrative flags
  - `POST /api/save`: Upserts player save state snapshots
  - `POST /api/choices`: Submits major chapter moral dilemma decisions
  - `GET /api/choices/:chapterId/stats`: Computes and aggregates percentage distribution of global community choices
  - `GET /api/world/maps/:mapId`: Delivers tilemap matrices, collision bounds, NPC spawn coordinates, and interactive triggers in lightweight JSON format

---

## 🚀 Running the Project

To start both the Fastify backend and the Vite frontend simultaneously:

```bash
npm run dev
```

Or run them individually:

```bash
# Terminal 1: Fastify Backend
npm run dev:server

# Terminal 2: Vite Frontend
npm run dev:client
```

Open `http://localhost:5173` in your browser.
