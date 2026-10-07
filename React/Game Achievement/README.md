# Neo-Arcade Vault — Game Achievement Tracker & Progression Codex

A browser-native achievement command center and progression vault that transforms dry reward checklists into an interactive, high-stakes hall of fame. Built with **React 18+, TypeScript, Tailwind CSS, shadcn UI design principles, Fastify event-driven backend, WebSockets, and zero-asset Web Audio API synthesizers**.

---

## ⚡ High-Impact Features

1. **Zero-Friction "Instant Codex" & Dynamic Progression Roadmap**:
   - Categorized by **Combat**, **Discovery**, **Mastery**, and **Secrets**.
   - Dynamic real-time progress meters and multi-step objective trackers updated live over WebSockets without manual page refresh.
2. **Tiered Badge Evolution & Holographic Prestige**:
   - Badges evolve across 4 visual tiers: **Bronze** $\to$ **Silver** $\to$ **Gold** $\to$ **Prismatic Obsidian**.
   - Includes custom procedural SVG crests, glowing conduits, metallic tier borders, and an infinite animated prismatic foil shimmer.
3. **"Shrouded Relic" Mystery Milestones & Clue De-Cloaking**:
   - Secret achievements conceal spoilers while displaying progressive cryptic clues as players approach criteria thresholds.
4. **The "Loot Vault" & Instant Reward Dispenser**:
   - Milestones unlock tangible in-game rewards (titles, profile banners, currency).
   - Claiming a reward triggers a celebratory modal with physical chest-cracking animation, god-rays, fanfare audio synthesis, and confetti bursts.
5. **Personalized "Flex Plinth" Showcase**:
   - Dedicated 3-slot spotlight plinth highlighting the player's rarest unlocked badges with holographic pedestal bases.
6. **Shareable Trophy Passport**:
   - Exportable, high-contrast visual Trophy Passport card with Discord embed generator, completion tallies, and cryptographic verification hash.
7. **Server-Authoritative Event Ledger & Anti-Spoofing Evaluator**:
   - Evaluates criteria thresholds idempotently on the Fastify backend.
   - Enforces monotonic session sequencing and rate limiting to prevent replay and spoofing attacks.
   - Generates immutable HMAC-SHA256 signed unlock receipts (`REC-...`).
8. **Interactive Gameplay Telemetry Dock**:
   - A live action simulator dock at the bottom of the screen allowing players to trigger real gameplay events (`BOSS_DEFEATED`, `COMBO_INCREASED`, `BEACON_DISCOVERED`, `ARTIFACT_SYNTHESIZED`, etc.) or simulate a spoofed packet burst to test anti-tamper defenses in real time.

---

## 🏗️ Architecture

```
Game Achievement/
├── server/                          # Fastify Event-Driven Backend
│   ├── src/
│   │   ├── index.ts                 # Fastify server, REST endpoints, and WebSocket server
│   │   ├── engine/
│   │   │   ├── evaluator.ts         # Authoritative rule engine & rate limiting
│   │   │   └── signer.ts            # Cryptographic HMAC-SHA256 receipt & claim signer
│   │   ├── data/
│   │   │   └── achievements.data.ts # Rich multi-step milestone dataset
│   │   └── types.ts                 # Backend data models
│   ├── package.json
│   └── tsconfig.json
│
├── client/                          # Vite + React 18+ Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopNavHUD.tsx        # Top ribbon: Gamerscore capsule, progress bar, category tabs
│   │   │   ├── FlexPlinth.tsx       # 3-slot pinned achievement plinth showcase
│   │   │   ├── AchievementCard.tsx  # 3D tilt card with radial progress and claim beacons
│   │   │   ├── AchievementGrid.tsx  # Responsive 3-4 column grid with search & tier filters
│   │   │   ├── AchievementDrawer.tsx# shadcn Sheet slide-out with lore, checklist, and receipt
│   │   │   ├── LootVaultModal.tsx   # Chest-cracking reward sequence with fanfare
│   │   │   ├── TrophyPassportModal.tsx # Shareable visual passport card & Discord export
│   │   │   ├── TelemetryDock.tsx    # Live game action simulator dock & anti-tamper demo
│   │   │   ├── ToastNotification.tsx# Juiced floating milestone banners
│   │   │   └── BadgeArt.tsx         # Procedural SVG crests with foil gleams
│   │   ├── hooks/
│   │   │   └── useAchievementTracker.ts # WebSocket subscription, optimistic updates & rollback
│   │   ├── audio/
│   │   │   └── soundEffects.ts      # Web Audio API milestone chimes, chest crack, and confetti
│   │   ├── types/
│   │   │   └── achievement.ts       # Frontend TypeScript types
│   │   ├── lib/
│   │   │   └── utils.ts             # Styling & formatting utilities
│   │   ├── App.tsx                  # Root application assembly
│   │   ├── index.css                # Stitch design tokens & prismatic animations
│   │   └── main.tsx
│   ├── index.html                   # Outfit, Plus Jakarta Sans, JetBrains Mono fonts
│   ├── tailwind.config.js
│   ├── vite.config.ts               # Proxy configuration (/api & /ws -> :3001)
│   └── package.json
│
└── package.json                     # Root orchestrator with concurrently scripts
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Development Servers
Runs both the Fastify backend (`port 3001`) and Vite frontend (`port 5173` / `5174`) concurrently:
```bash
npm run dev
```

### 3. Open in Browser
Visit:
```
http://localhost:5174/   (or http://localhost:5173/)
```

---

## 📡 REST & WebSocket API Specification

- `GET /api/achievements`: Returns full tracker state, categories, points, and pinned IDs.
- `GET /api/achievements/:id`: Returns detailed milestone item with objectives and attached rewards.
- `POST /api/achievements/:id/claim`: Validates cryptographic token and claims reward vault item.
- `POST /api/achievements/:id/pin`: Toggles pin status for the Flex Plinth showcase (max 3 slots).
- `POST /api/telemetry/event`: Evaluates gameplay event telemetry, runs anti-tamper checks, advances criteria, issues signed receipts, and broadcasts over WebSocket.
- `GET /api/passport`: Returns cryptographic summary card digest, completion %, top rarity, and verification signature.
- `POST /api/reset`: Reinitializes tracker to baseline benchmark.
- `WS /ws`: Real-time bidirectional WebSocket stream broadcasting `ACHIEVEMENT_UNLOCKED`, `PROGRESS_UPDATE`, `REWARD_CLAIMED`, `PIN_TOGGLED`, and `TAMPER_ALERT`.
