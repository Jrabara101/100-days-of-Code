# Forge2D | Cartographic Level Studio & Engine Exporter

A browser-native cartographic studio and game staging ground that transforms 2D level design into a fluid, tactile sandbox. Built with **Vite, React 18+, TypeScript, Tailwind CSS, and shadcn UI aesthetics**, backed by an authoritative **Fastify (Node.js) server with SQLite persistence**.

---

## 🌟 Key Features

### 1. Instant "Paint-to-Play" Flight Check
- **Zero-Friction Transition:** Tap `[Space]` or click the prominent **PLAYTEST** pill button to instantly switch from edit mode into live 2D AABB platformer physics.
- **Flight Mechanics:** Run, variable jump, coyote time, jump buffering, one-way platform drop-through (`[S]` or `[Down]`), and ladder climbs.
- **Interactive Hazards & Pickups:** Real-time spike hazard collision with respawn particles, collectible gems/coins with retro Web Audio chimes, and pressure plate triggers that open locked blast doors via glowing logic conduits.

### 2. Intelligent 47-Tile & Biome Brush Engine
- **Procedural 8-Neighbor Bitmasking:** Implements standard Wang/blob 47-tile bitmasking. Dragging terrain brushes automatically resolves outer corners, inner corners, cliff ledges, and center fills.
- **Built-in Rich Biomes:**
  - 🌿 **Grass Overworld:** Lush green turf, stratified earth, cliff ledges, and wildflower props.
  - 🏰 **Castle Bastion:** Chiseled dark stone masonry, battlements, dungeon slabs, and wall cracks.
  - 🌋 **Magma Cavern:** Obsidian crags, molten magma veins, and smoking sulfur vents.
  - ⚡ **Neon Cyber Foundry:** Carbon alloy plating, cyan conduit runs, and holographic grates.

### 3. Multi-Depth Parallax & Atmospheric Staging
- **4-Layer HTML5 Canvas Viewport:**
  - `Layer 0`: Parallax backdrop (dynamic mountain/sky silhouettes) & world grid.
  - `Layer 1`: Base terrain & midground tilemaps (efficient blitting via OffscreenCanvas / atlas index rendering).
  - `Layer 2`: Entity & object layer (spawn markers, collectibles, doors, enemies, and live playtest player avatar).
  - `Layer 3`: Interactive guides, Bezier wire conduits, and ghost stamp previews.
- **Smooth 60fps Pan/Zoom:** Mouse wheel zoom centered on cursor, middle-click or spacebar drag panning, and frustum culling.

### 4. Tactile Entity Wiring & Trigger Conduits
- Visually link triggers (pressure plates, switches) to target mechanics (blast doors, spawners) using the **Wire Tool (`[W]`)**.
- Renders pulsing cyan Bezier curves with animated energy dashes and magnetic snapping.

### 5. Universal Engine-Ready Asset Exporter
- **Tiled JSON (`.tmj` / `.json`):** Compatible with Tiled Map Editor (orthogonal, chunked GID tilelayers and object groups).
- **Godot 4 (`.tscn`):** Godot 4 scene text format containing `TileMap` node with `PackedInt32Array` coordinates and entity nodes (`Marker2D`, `CharacterBody2D`, `Area2D`).
- **Unity CSV:** CSV coordinate matrix per layer for instant tilemap ingestion.
- **Composite High-Res PNG:** Upscaled multi-layer PNG export with embedded coordinate metadata.
- **Authoritative Blueprint JSON:** Clean schema representation for sharing, backup, or re-importing.

### 6. Arcade Vault & Community Death Heatmaps
- Fastify REST API with SQLite database (`/api/maps`, `/api/maps/:id`, `/api/maps/:id/fork`, `/api/maps/:id/telemetry`, `/api/maps/:id/heatmap`).
- Seed forking allows cloning community blueprints with original author attribution.
- Aggregated death coordinate heatmap overlay (`[Flame]` toggle) visualizes hazard kill zones.

---

## ⌨️ Studio Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `[Space]` | **Toggle Playtest Flight Check / Return to Editor** |
| `[B]` | **Tile Brush / Pencil** |
| `[G]` | **Bucket Flood Fill** |
| `[E]` | **Tile Eraser** |
| `[I]` | **Eyedropper / Tile Picker** |
| `[S]` | **Marquee Selection** |
| `[V]` | **Entity Placer** |
| `[W]` | **Conduit Wire Tool** |
| `[A]` | **Toggle 47-Tile Auto-Tiling** |
| `[Ctrl + Z]` | **Undo (Delta History Stack)** |
| `[Ctrl + Y]` / `[Ctrl + Shift + Z]` | **Redo** |
| `[Middle Drag]` / `[Alt + Drag]` | **Pan Viewport** |
| `[Mouse Wheel]` | **Zoom In / Out** |

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Run Fastify Backend and Vite Frontend concurrently
npm run dev
```

- **Frontend Studio:** `http://localhost:5173`
- **Fastify Backend:** `http://127.0.0.1:3002` (Health check at `/api/health`)
