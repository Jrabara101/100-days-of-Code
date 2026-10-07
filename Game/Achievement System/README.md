# 2D Block Achievement Matrix & Voxel DAG Archipelago

A production-ready, interactive, browser-native 2D block achievement matrix built with **Vite**, **React**, **TypeScript**, **Tailwind CSS**, and **shadcn UI** patterns on the frontend, paired with a lightweight, high-performance **Fastify** event-driven backend service.

---

## 🌟 Key Features

1. **"Living Biome" 2D Pan-and-Zoom Canvas**:
   - Infinite 2D block archipelago rendering four distinct biomes: **Overworld**, **Nether Core**, **Crystal Depths**, and **Celestial Spire**.
   - GPU-accelerated CSS transform matrix engine (`translate3d` + `scale` with `will-change: transform`).
   - Dynamic viewport culling rendering only visible milestone blocks and connections, maintaining locked 60fps performance.
   - Smooth gesture clamping, inertia on pointer release, touch pinch-to-zoom, and programmatic camera panning.

2. **"Conduit Pulse" Dependency Chains**:
   - Directed Acyclic Graph (DAG) state manager with parent-child milestone relationships.
   - SVG cubic bezier spline connectors (`M x1 y1 C x1+dx y1, x2-dx y2, x2 y2`) calculating smooth organic circuit paths between arbitrary 2D grid coordinates.
   - High-voltage energy pulses with animated dash-offsets rippling downstream when parent blocks are conquered.

3. **"Mystery Geode" Riddle Blocks**:
   - Shrouded secret achievements rendered as cracked obsidian blocks with pulsating runes and ancient glyphs (`animate-glyph-pulse`).
   - Hover reveals cryptic lore fragments that sharpen into legible hints as players satisfy prerequisite DAG milestones.

4. **Personalized "Flex Plinth" Showcase**:
   - Customizable **3x3** or **5x5** isometric trophy plinth where players pin their rarest unlocked milestone blocks.
   - Real-time Flex Score calculation and average rarity percentage index.
   - One-click copyable Discord card and markdown social badge generator.

5. **Milestone Velocity & Completionist Radar**:
   - Real-time telemetry HUD tracking category completion across biomes, unlock velocity (unlocks/day), and estimated time to 100% completion.
   - Highlights apex trophy rarity percentiles (e.g. "Global: 8.4% of Operators").

6. **Server-Authoritative Anti-Spoofing & Event Ledger**:
   - Achievement criteria are evaluated server-side to prevent client-side tampering.
   - Fastify backend pipeline verifies DAG prerequisite fulfillment and telemetry counters before minting an immutable, timestamped **HMAC-SHA256 unlock token**.
   - Real-time WebSocket broadcasting (`ws://localhost:3001/ws`) distributes milestone alerts, progress updates, and conduit pulse waves.

7. **Interactive Telemetry Simulator Dock**:
   - Built-in live telemetry injector allowing testers to fire gameplay actions (e.g. mining bedrock, siphoning crystal voxels, defeating leviathans, deploying solar sails) with 1 click.
   - Real-time audio synthesis (Web Audio API procedural melodic chimes) and particle confetti burst on milestone unlock.

---

## 🏗️ Architecture & Core Schema

### Core Data Model (`src/types/achievement.ts`)
```typescript
export type BlockTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BlockBiome = 'overworld' | 'nether' | 'crystal_depths' | 'celestial';

export interface AchievementNode {
  id: string;
  title: string;
  description: string;
  secretDescription?: string;
  isSecret: boolean;
  tier: BlockTier;
  biome: BlockBiome;
  points: number;
  gridCoordinates: { x: number; y: number }; // 2D layout coordinates
  parentIds: string[];
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  isUnlocked: boolean;
  unlockedAt: string | null;
  globalRarityPercent: number;
  icon: string;
  reward?: AchievementReward;
  unlockToken?: string;
  blockTexture: string;
}

export interface AchievementSystemState {
  nodes: Record<string, AchievementNode>;
  selectedNodeId: string | null;
  activeBiomeFilter: BlockBiome | 'all';
  viewport: { x: number; y: number; zoom: number };
  totalPoints: number;
  unlockedCount: number;
  recentUnlocks: string[];
}
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js >= 18
- npm >= 9

### Install Dependencies
```bash
npm install
```

### Start Both Services Concurrently
```bash
npm start
```
- **Frontend App**: `http://localhost:5178`
- **Fastify Backend**: `http://localhost:3001`
- **WebSocket Gateway**: `ws://localhost:3001/ws`

### Standalone Commands
```bash
# Start backend service only
npm run server

# Start frontend dev server only
npm run dev

# Build production bundle
npm run build
```

---

## 📡 REST & WebSocket API Specification

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check & engine metadata |
| `/api/achievements` | `GET` | Retrieve complete DAG matrix state & statistics |
| `/api/achievements/:id` | `GET` | Retrieve single achievement node details |
| `/api/telemetry/event` | `POST` | Ingest gameplay event telemetry (`{ event, count, targetNode }`) |
| `/api/achievements/unlock/:id` | `POST` | Authorize direct unlock of a milestone |
| `/api/reset` | `POST` | Reset matrix back to baseline initial state |
| `/ws` | `WS` | Real-time bidirectional WebSocket event stream |
