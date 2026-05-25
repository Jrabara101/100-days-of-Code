# Design Specification: Memory Card Game (Tech Match)

**Date:** 2026-05-25
**Status:** Draft
**Topic:** Memory Match Game with Phaser 3 + Vite + TypeScript

---

## 1. Project Overview
A professional, senior-architected Memory Match game featuring programming language logos. The game focuses on state-machine reliability, clean minimalist aesthetics, and modern development standards.

### Core Goals
- Implement a robust 4x4 Memory Match grid.
- Use a 2.5D flip animation for card transitions.
- Enforce strict input locking during animations.
- Feature a 45-second countdown timer with visual "tension" feedback.
- Use a Modern Structured (Vite + TypeScript) setup.

---

## 2. Technical Architecture

### Tech Stack
- **Engine:** Phaser 3.60+
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Minimalist)

### Project Structure
```text
memory-card-game/
├── src/
│   ├── main.ts            // Game initialization & config
│   ├── style.css          // Global minimalist styles
│   ├── scenes/
│   │   └── GameScene.ts   // Monolithic scene-centric logic
│   ├── types/
│   │   └── index.ts       // Shared interfaces & enums
│   └── assets/            // (Optional) images/sounds
├── public/                // Static assets
├── index.html             // Entry point
├── tsconfig.json          // TypeScript configuration
└── package.json           // Dependencies
```

---

## 3. Gameplay Mechanics

### State Machine
The game operates under a strict state machine to prevent race conditions:
- **IDLE:** Waiting for player input.
- **LOCKED:** Animation in progress (Input ignored).
- **GAME_OVER:** Timer reached zero or all matches found (Input ignored).

### The Card Component (Container-based)
Each card is a `Phaser.GameObjects.Container` containing:
1. **Card Back:** Rounded rectangle with minimalist design.
2. **Card Front:** Rounded rectangle with language-specific branding.
3. **Logo Text:** Large, bold text representing the language (JS, PY, etc.).

### 2.5D Flip Animation
1. **Phase 1:** `scaleX` tweens from 1 to 0 over 150ms.
2. **Phase 2:** `onComplete` swaps visibility from Back to Front.
3. **Phase 3:** `scaleX` tweens from 0 to 1 over 150ms.

### Turn Logic
1. **Click 1:** Flip card, store as `firstCard`.
2. **Click 2:** Flip card, store as `secondCard`, set `isLocked = true`.
3. **Evaluation:**
   - **Match:** Trigger "Pulse" tween, set `isMatched = true`, clear card references, set `isLocked = false`.
   - **Mismatch:** Wait 1000ms, flip both back (2.5D), clear card references, set `isLocked = false`.

---

## 4. Visual Design (Clean Minimalist)

### Color Palette
- **Background:** `#F5F6FA` (Soft light gray).
- **Card Back:** `#DCDDE1` with `#7F8C8D` text.
- **Card Fronts:**
  - JS: `#F1C40F` (Yellow)
  - PY: `#3498DB` (Blue)
  - RUST: `#E67E22` (Orange)
  - ...etc (Vibrant but professional).
- **UI Text:** `#2C3E50` (Deep charcoal).

### UI Layout
- **Header:** "TECH MATCH" (Bold 32px).
- **Stats Row:** "Moves: X" (Left) | "Time: Xs" (Right).
- **Progress Bar:** A thin line below the header that shrinks as time runs out.
- **Game Over Overlay:** A high-contrast modal showing "SUCCESS" or "FAILURE".

---

## 5. Success Criteria
1. No "click-spam" bugs (input locking works).
2. Timer triggers game over at exactly 0s.
3. Card shuffle is non-biased (Fisher-Yates).
4. Responsive layout (centered 4x4 grid on various screens).
5. TypeScript type-safety maintained across the project.
