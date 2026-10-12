# 🎨 Sprite Sheet Viewer & Animation Studio

A browser-native asset inspection studio and animation workbench that transforms static 2D sprite sheets into interactive, game-ready character rigs. Tailored for indie game developers, pixel artists, animators, and game jam participants.

Built with **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Fastify** (Node.js) backed by **SQLite** and **Sharp**.

---

## 🌟 Key Features

### 1. Dual-Viewport Rendering Subsystem
- **Atlas Viewport (Center Canvas):**
  - Smooth pan and zoom from **25% to 3200%** with crisp nearest-neighbor pixelated rendering.
  - Interactive grid overlays with slice boundaries, sequence index badges (`#01`, `#02`), and active frame highlight halos.
  - Box marquee multi-selection (`Shift + Drag`) and click-to-select frame inspection.
  - Floating HUD displaying cursor coordinates (`X: 42, Y: 96`), hovered frame dimensions, and GPU texture VRAM calculation.
- **Animation Preview Viewport (Right HUD Stage):**
  - Decoupled `requestAnimationFrame` render loop with sub-millisecond delta-time accumulation matching target FPS (1–60 FPS).
  - Multi-layer render stack:
    1. Background canvas switcher (Checkerboard, Pitch Black Void, Chroma Green, Stage Floor).
    2. Onion-skin ghost frames (opacity-controlled previous and next frames with violet/cyan tinting).
    3. Active frame blit centered relative to the anchor pivot point.
    4. Interactive anchor pivot marker (draggable gold crosshair with magnetic guides).
    5. Hitbox / Hurtbox / Terrain Colliders SVG & Canvas wireframe overlay with corner handles.
  - Tactile transport controls: Step Back, glowing Play/Pause button, Step Forward, Loop, Ping-Pong, and FPS slider.

### 2. Slicing Engine (Uniform Grid & Heuristic Alpha)
- **Uniform Grid Slicer:** Calculates tile bounding boxes based on user-defined frame width, height, X/Y offsets, and row/column margins with instant presets (16×16, 24×24, 32×32, 48×48, 64×64).
- **Heuristic Auto-Slice Algorithm:** Scans image pixel buffer via `getImageData()` to detect connected non-transparent alpha pixel clusters (bounding box islands).

### 3. Tactile Hitbox Sculptor & Pivot Anchor Pinning
- Set global or per-frame anchor pivot points (Ground Center, True Center, Top-Left) so characters never jitter or clip into floors when transitioning between animations.
- Drag color-coded bounding boxes for:
  - **Hurtboxes (Amber `#F59E0B`):** Vulnerable character damage zones.
  - **Hitboxes (Crimson `#EF4444`):** Active weapon/blade strike zones.
  - **Terrain Colliders (Emerald `#10B981`):** Footing and world collision boxes.

### 4. Interactive "Micro-Stage" Playtest Sandbox
- Tap the **"Playtest"** button to drop the animated character into an interactive 2D physics sandbox.
- Controls:
  - `[WASD]` / `[Arrows]`: Run left and right with sprite flipping.
  - `[Space]` / `[W]` / `[Up]`: Jump with simulated gravity.
  - `[J]` / `[F]` / Left-Click: Attack combos.
  - Physical Gamepad support via standard Gamepad API.
- Training Dummy target: Strike the dummy to trigger hit sparks, damage numbers (`-45 CRIT!`), screen recoil, and Web Audio API retro sound effects!

### 5. Sprite Sheet Compactor & Redundancy Auditor (Backend Engine)
- Lightweight **Fastify** backend with **Sharp** image processing.
- Detects identical duplicate frames using SHA-256 pixel buffer hashing.
- Trims redundant transparent border margins.
- Repacks frames tightly using a high-density **MaxRects 2D bin packing algorithm**.
- Calculates texture VRAM savings percentage (e.g. 50%+ reduction).

### 6. Universal Multi-Engine Metadata Exporter
One-click export compiles sprite configurations into industry standards:
- **TexturePacker JSON (Array):** Phaser 3 and PixiJS compatible.
- **TexturePacker JSON (Hash):** Keyed dictionary format.
- **Godot 4 `.tres` (SpriteFrames):** Native Godot 4 animation resource.
- **CSS Keyframes:** Web-ready `@keyframes` with `steps(...)` playback.
- **Unity CSV / Hitbox Meta:** Coordinate and bounding box manifest.
- Lossless repackaged PNG atlas texture download.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `[Space]` | Play / Pause active animation clip |
| `[A]` / `[Left]` | Step 1 frame backward |
| `[D]` / `[Right]` | Step 1 frame forward |
| `[Z]` | Toggle Nearest-Neighbor (Crisp) vs Bilinear filtering |
| `[Ctrl + Z]` | Undo slice or hitbox edit |
| `[Ctrl + Y]` / `[Ctrl + Shift + Z]` | Redo edit |
| `[Shift + Drag]` | Marquee select multiple atlas frames |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Fullstack Studio (Frontend + Fastify Backend)
```bash
npm run start
```
- **Frontend:** http://localhost:5173
- **Fastify Backend:** http://localhost:3001

### 3. Build for Production
```bash
npm run build
```
