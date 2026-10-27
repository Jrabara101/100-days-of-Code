# Aetherial Frontier — Browser 2D MMO Sandbox Prototype

A browser-native, zero-install 2D persistent micro-MMO sandbox built with **React 18+**, **TypeScript**, **Tailwind CSS**, and **HTML5 2D Canvas** on the frontend, paired with an authoritative **Node.js (Fastify)** WebSocket world engine.

![Aetherial Frontier Banner](https://img.shields.io/badge/Architecture-Authoritative%20Tick%20Loop%20(20Hz)-amber?style=for-the-badge)
![Network Sync](https://img.shields.io/badge/Network-Client%20Prediction%20%2B%20Reconciliation-cyan?style=for-the-badge)
![Aesthetics](https://img.shields.io/badge/Aesthetics-Glassmorphic%20HUD-violet?style=for-the-badge)

---

## ⚔️ Key Features & Architectural Highlights

### 1. Zero-Friction "Drop-Into-The-Realm" Onboarding & Shard Hopping
- **Instant Browser Execution:** Zero mandatory account creation or downloads. Spawn directly into the town hub within seconds using randomized adventurer silhouettes or custom handles.
- **Universal Input Parity:**
  - `WASD` / Arrow keys for directional stride
  - Point-and-click / tap pathfinding
  - On-screen touch virtual thumbstick for mobile/tablets
  - Gamepad analog stick support
- **Shard Hopping:** 4-character shard codes (e.g. `REALM`, `EDEN`, `NOVA`, `VALE`) and one-click shareable invite URLs (`?shard=A4F2`) allow players to warp into shared world instances on demand.

### 2. Expressive "Kinetic Speech Bubbles" & Proximity Spatial Chat
- **Diegetic World-Space Speech Bubbles:** Live, comic-style speech bubbles with avatar-tracking directional tails and spring scale pop animations render directly above avatars in world space.
- **Proximity Chat Channels:**
  - `LOCAL`: Broadcast strictly to adventurers within a 400px Euclidean radius, with font opacity dynamically scaling based on physical distance from the speaker.
  - `GLOBAL`: Shard-wide realm broadcast.
  - `PARTY`: Dedicated party communications.
  - `WHISPER`: Direct player-to-player private messaging.
  - `SYSTEM`: Shard event notices.
- **Floating Emoji Reactions:** Trigger overhead emotes (`⚔️`, `🛡️`, `✨`, `🔥`, `👑`, `🪙`, `👋`, `🍺`, `💀`, `❤️`) with radial glow auras.
- **Token-Bucket Rate Limiting:** 5 messages per 3 seconds with HTML tag sanitization against XSS.

### 3. Tactile Spatial Backpack & Live Ground Loot Drops
- **8x5 2D Spatial Grid Bag:** Items occupy distinct dimensions (1x1 potions/gems, 1x2 daggers/scrolls, 1x3 broadswords/staves, 2x2 shields/cuirasses).
- **Physical Drag-to-Drop World Spawning:** Dragging an item outside the backpack window physically tosses it onto the ground at the player's feet as a glowing entity with a 60-second public despawn timer.
- **Proximity Loot Halos:** Walking near ground loot illuminates a pulsing cyan floor ring and prompts `[E] Take Item`.
- **Atomic Mutex Pickup:** Server-enforced mutex locks ensure that multiple players clicking the same drop simultaneously cannot duplicate loot.
- **Rotation & Auto-Sort:** Press `[R]` while dragging or hovering to rotate items. One-click "Sort" packs items into the grid by descending rarity and size.

### 4. Live Paper-Doll Synchronization & Quick-Inspect
- **6 Equipment Sockets:** `Main Hand`, `Off Hand`, `Head`, `Chest`, `Feet`, `Relic`.
- **Live Overworld Sprite Layering:** Equipping weapons or armor immediately updates the overworld avatar sprite (layered helmet, cuirass, weapon, and boots) and aggregates character stats in real time.
- **Quick-Inspect:** Clicking any adventurer opens an inspection frame displaying their equipped relics, title, faction, and triggers to whisper, invite to party, or trade.

### 5. Frictionless "Double-Lock" Peer-to-Peer Trading
- **Synchronized 2-Player Trade Chamber:** Dual-column item staging matrix with gold inputs.
- **Anti-Bait-and-Switch Protection:** Both adventurers must click "Lock Offer". Any last-second item or gold modification automatically unlocks both sides and cancels the confirmation countdown.
- **3-Second Verification Countdown:** Once both sides are locked, a 3-second verification countdown begins before the final "Confirm Trade" button unlocks.

### 6. Decoupled Render & Physics Pipeline (60Hz Canvas / 20Hz Server)
- **Decoupled Architecture:** 60fps player coordinates and camera panning are rendered directly to HTML5 2D Canvas via `useMMOEngine` using `requestAnimationFrame`, avoiding React state churn.
- **Client-Side Prediction & Reconciliation:** Local inputs apply instantly on client with an unacknowledged ring buffer; incoming server snapshots smoothly correct position drift.
- **Remote Entity Interpolation:** 100ms snapshot delay buffer lerps remote players at 60fps over 20Hz network ticks.

---

## 🛠️ Tech Stack & Directory Structure

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, HTML5 2D Canvas.
- **Backend:** Node.js, Fastify, `@fastify/websocket`, `ws`.
- **Audio:** Web Audio API procedural synthesizer (zero external sound files needed).

```
Browser MMO Prototype/
├── server/
│   ├── index.ts               # Fastify app, REST API & WebSocket /ws handler
│   ├── tsconfig.json          # Server TypeScript configuration
│   └── world/
│       ├── types.ts           # Server packet and player definitions
│       ├── tilemap.ts         # Authoritative 50x50 tilemap & AABB collision
│       ├── itemLedger.ts      # UUID item factory, spatial collision & ground loot
│       ├── spatialGrid.ts     # Spatial Hash Grid for Area of Interest (AoI)
│       ├── chatRouter.ts      # Multi-channel proximity chat & token bucket limiter
│       ├── tradeManager.ts    # Synchronized 2-player double-lock trade state machine
│       └── simulation.ts      # Authoritative 20Hz tick loop & bot AI
├── src/
│   ├── types/mmo.ts           # Shared MMO interfaces & data contracts
│   ├── engine/
│   │   ├── sound.ts           # Web Audio procedural sound synthesizer
│   │   ├── tilemapRenderer.ts # Layered viewport-culled tilemap drawer
│   │   ├── spriteRenderer.ts  # Layered paper-doll avatars & speech bubbles
│   │   └── renderer.ts        # Main canvas rendering & minimap radar
│   ├── hooks/
│   │   ├── useMMONetwork.ts   # Real-time WebSocket lifecycle & telemetry
│   │   └── useMMOEngine.ts    # 60Hz decoupled game loop, prediction & camera
│   ├── components/hud/
│   │   ├── UnitFrame.tsx      # Top-Left adventurer status & shard copy
│   │   ├── TargetFrame.tsx    # Selected target frame with actions
│   │   ├── MinimapRadar.tsx   # Top-Right radar canvas & ping indicator
│   │   ├── ChatDock.tsx       # Bottom-Left multi-tab chat & emote picker
│   │   ├── ActionHotbar.tsx   # Bottom-Center 8-slot belt & drawer toggles
│   │   ├── SpatialInventory.tsx # 8x5 grid bag, [R] rotation, drag-to-drop
│   │   ├── PaperDollEquipment.tsx # 6 equipment sockets & live stat sheet
│   │   ├── TradeModal.tsx     # Double-lock P2P trade chamber
│   │   ├── TradeInviteBanner.tsx # Incoming trade invitation toast
│   │   ├── PlayerInspectorModal.tsx # Target gear inspector card
│   │   ├── ShardSelector.tsx  # Shard hopping gate modal
│   │   ├── ControlsHelpModal.tsx # Keybindings and mechanics codex
│   │   ├── OnboardingModal.tsx # Zero-friction drop-into-realm modal
│   │   └── VirtualJoystick.tsx # Touch / mobile on-screen thumbstick
│   ├── App.tsx                # Main screen coordinator
│   ├── main.tsx               # Entrypoint mounting React
│   └── index.css              # Tailwind and glassmorphism styles
├── package.json
└── vite.config.ts
```

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Environment (Client + Server Concurrently)
```bash
npm run dev
```
- **Client:** `http://localhost:5176`
- **Fastify Backend:** `http://localhost:3009`
- **WebSocket Endpoint:** `ws://localhost:3009/ws`

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle in `dist/` and compiles server TypeScript into `dist-server/`.

---

## 🎮 Controls & Shortcuts

| Action | Primary Input | Alternative |
|---|---|---|
| **Move / Stride** | `W` `A` `S` `D` | `Arrow Keys` or Click World Canvas |
| **Quick Pickup Loot** | `E` | Click Ground Item Entity |
| **Spatial Backpack** | `I` | Click Bag Icon on Hotbar |
| **Rotate Item in Bag** | `R` (while dragging) | Hotkey |
| **Character Sheet & Stats** | `C` | Click Avatar Frame / Hotbar |
| **Focus Proximity Chat** | `Enter` | Click Chat Input Bar |
| **Quick Consumables** | `[1]` – `[8]` | Click Hotbar Sockets |
| **Inspect / Target** | Click Remote Player | Quick-Inspect Button |
| **Controls & Codex** | `H` | Help Button on Hotbar |
| **Mute / Unmute Audio** | Audio Icon on Unit Frame | Mute Toggle |
