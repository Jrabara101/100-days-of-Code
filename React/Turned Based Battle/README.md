# Solar Ember // Volcanic Mecha Arena (Turn-Based Combat MVP)

A cinematic, tactical turn-based battle arena engineered with **Vite**, **React 18+**, **TypeScript**, **Tailwind CSS**, and **shadcn UI** patterns on the frontend, paired with a **Node.js (Fastify)** backend powered by **WebSockets** and an **in-memory SQLite session store**.

---

## ⚡ Non-Technical Overview & High-Impact Features

- **Frictionless "Instant Duel" Matchmaking**: Players can jump immediately into a Solo Training Arena against an adaptive tactical AI combatant (`Ignis-Typhon Mk.IV`), or spin up a private 1v1 PvP room using a 4-character room code or camera-scanned QR code with zero installs or logins.
- **Simultaneous "Blind Commitment" Turn Clashes**: Both combatants select their actions within a shared 15-second decision window. Moves lock in blind and resolve simultaneously in a cinematic clash phase determined by priority brackets and speed.
- **Authoritative Commit-Reveal Anti-Cheat**: To prevent client-side inspection or devtools payload snooping, action intents are cryptographically stored on the Fastify backend until both players commit or the timer expires. Opponents only receive a masked `{ isCommitted: true }` status packet.
- **Tactile "Stagger & Break" Momentum Engine**: Direct hits and parries fill the opponent's Stagger Gauge. Reaching 100% triggers a **Guard Break**, causing the opponent to lose their action while rendering them vulnerable to devastating, screen-shaking critical strikes (+65% critical multiplier).
- **Dynamic Ability Deck & Resource Synergy**: Combatants manage Action Points (AP / Reactor Energy). Guarding mitigates 70% damage and restores +25 Energy; Class skills inflict volatile elemental status effects (e.g. Plasma Burn DoT); and Ultimates unleash cataclysmic Overdrive sequences when charged to 100 AP.
- **Combat Timeline & Initiative Foresight**: An interactive header turn-order track visualizes upcoming queue order, base fighter agility, and priority brackets.
- **Built-in Procedural Web Audio Engine**: Zero external audio asset dependencies—all sound effects (blade slashes, metal shields, parry chimes, critical explosions, glass break stagger, countdown pings) are synthesized procedurally in real-time via the Web Audio API.

---

## 🛠️ Architecture & Tech Stack

### Backend (`server/`)
- **Fastify 5+**: Ultra-low overhead HTTP & REST server with `@fastify/websocket`, `@fastify/cors`, and `@fastify/static`.
- **WebSocket Protocol**: Real-time room lifecycle state machine (`LOBBY` -> `PLANNING_PHASE` -> `SIMULTANEOUS_COMMIT` -> `RESOLVING_ACTIONS` -> `ROUND_RECAP` -> `MATCH_OVER`).
- **In-Memory SQLite Store (`node:sqlite`)**: Uses Node 24's native `DatabaseSync` for zero-overhead in-memory tables storing player sessions, active room states, and match history.
- **Deterministic Action Resolution Engine (`server/combatEngine.ts`)**:
  - **Priority 3 (Defend / Parry)**: Bypasses attacks, counters fast strikes for +40 stagger rebound, and refunds +25 energy.
  - **Priority 2 (Fast Skill - Magma Lance)**: High-speed piercing strike inflicting Plasma Burn DoT.
  - **Priority 1 (Standard Attack - Inferno Strike)**: Reliable base damage and steady stagger pressure.
  - **Priority 0 (Heavy Break - Tectonic Quake)**: Heavy seismic hammer that shatters guarding shields for double stagger!
  - **Ultimate (Supernova Meltdown)**: Requires 100 AP, unstoppable screen-shaking critical hit.
- **Tactical AI Decision Engine (`server/ai.ts`)**: Evaluates player HP, poise, stagger meter, and ultimate readiness to switch stances and counter-attack.

### Frontend (`src/`)
- **React 18+ & TypeScript**: Strict types, custom hooks, and modular UI components.
- **`useCombatEngine` Custom Hook**: Decoupled state and animation orchestrator managing WebSocket connectivity, session recovery tokens in `localStorage`, 15-second planning timer, and step-by-step resolution playback.
- **FighterStage Viewport**: 2.5D side-by-side fighter stage with CSS perspective transforms, animated SVG mechas, reactor glows, shield bubbles, and spring-based floating combat text engine.
- **CommandTray**: Ergonomic bottom action deck with hotkey support:
  - `[1]` Basic Attack (Inferno Strike)
  - `[2]` Guard / Defensive Parry
  - `[3]` Magma Lance (Fast Piercing Skill)
  - `[4]` Tectonic Quake (Heavy Break)
  - `[Space]` Supernova Meltdown (Ultimate) or Lock In Action
  - Stance Selector (`BALANCED`, `AGGRESSIVE`, `DEFENSIVE`)
- **CombatLogDrawer**: Slide-out telemetry audit log with high-contrast text badges (`CRIT`, `BLOCK`, `PARRY`, `BREAK`, `DOT`).
- **MatchSummaryModal**: Post-match victory / defeat dialog with round count, total damage dealt, MVP ability, and instant Rematch ready checks.

---

## 🚀 Running the Project

### Development (Client + Server concurrently)
```bash
npm run dev
```
- Client runs on `http://localhost:5174` (proxies `/api` and `/ws` to server)
- Fastify server runs on `http://localhost:3008`

### Standalone Production Server
```bash
npm run build
npm start
```
- Serves both API, WebSockets, and built frontend on `http://localhost:3008`

---

## 🎮 Hotkeys Reference
| Key | Action |
| --- | --- |
| `[1]` | Select Inferno Strike (Basic Attack) |
| `[2]` | Select Aegis Guard / Thermal Parry |
| `[3]` | Select Magma Lance (Piercing Burn Skill) |
| `[4]` | Select Tectonic Quake (Heavy Break) |
| `[Space]` | Commit Selected Action / Prime Ultimate |
