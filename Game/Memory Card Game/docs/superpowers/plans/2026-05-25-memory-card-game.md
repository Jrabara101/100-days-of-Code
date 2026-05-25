# Memory Card Game (Tech Match) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional 4x4 Memory Match game using Phaser 3, Vite, and TypeScript with a "Clean Minimalist" aesthetic and robust state-machine logic.

**Architecture:** Scene-centric approach within a modern structured project. Logic is contained in `GameScene.ts` using TypeScript classes, interfaces, and enums for safety.

**Tech Stack:** Phaser 3.60+, Vite, TypeScript, Vanilla CSS.

---

### Task 1: Project Initialization

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/style.css`
- Create: `src/main.ts`, `src/scenes/GameScene.ts`, `src/types/index.ts`

- [ ] **Step 1: Create package.json and install dependencies**
Run: `npm init -y && npm install phaser && npm install -D vite typescript @types/node`

- [ ] **Step 2: Create project configuration files**
**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

**`vite.config.ts`**:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
  },
});
```

**`index.html`**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tech Match - Memory Game</title>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 3: Setup basic src files**
**`src/style.css`**:
```css
body {
  margin: 0;
  padding: 0;
  background-color: #F5F6FA;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
#game {
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border-radius: 8px;
}
```

**`src/main.ts`**:
```typescript
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 800,
  backgroundColor: '#F5F6FA',
  scene: GameScene,
};

new Phaser.Game(config);
```

- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "chore: initialize vite phaser project"
```

### Task 2: Define Types and Scene Skeleton

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Define Enums and Interfaces**
**`src/types/index.ts`**:
```typescript
export interface CardData {
  lang: string;
  color: number;
  textColor: string;
}

export interface CardObject {
  container: Phaser.GameObjects.Container;
  front: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  back: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
}

export enum GameState {
  IDLE,
  LOCKED,
  GAME_OVER
}
```

- [ ] **Step 2: Create GameScene skeleton**
**`src/scenes/GameScene.ts`**:
```typescript
import Phaser from 'phaser';
import { CardData, CardObject, GameState } from '../types';

export class GameScene extends Phaser.Scene {
  private firstCard: CardObject | null = null;
  private secondCard: CardObject | null = null;
  private isLocked: boolean = false;
  private isGameOver: boolean = false;
  private moves: number = 0;
  private matchesFound: number = 0;
  private totalPairs: number = 8;
  private timeRemaining: number = 45;

  private movesText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private gameTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super('GameScene');
  }

  create() {
    // Logic will go here
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add src/types/index.ts src/scenes/GameScene.ts
git commit -m "feat: define core types and scene skeleton"
```

### Task 3: Grid Generation and Card Container

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Implement Fisher-Yates shuffle and data preparation**
Duplicate 8 card types and shuffle them.

- [ ] **Step 2: Implement `createCard` method**
Build the container with Back, Front, and Logo Text.

- [ ] **Step 3: Loop and generate 4x4 grid**
Calculate coordinates and place cards.

- [ ] **Step 4: Commit**
```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement grid generation and card containers"
```

### Task 4: Flip Animation and Input Locking

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Implement `handleCardClick` with Input Guard**
Check `isLocked`, `isFlipped`, and `isGameOver`.

- [ ] **Step 2: Implement 2.5D Flip Tween**
Add the two-phase scaleX tween with texture swap in the middle.

- [ ] **Step 3: Commit**
```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement 2.5d flip animation and input locking"
```

### Task 5: Match Logic and Turn State

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Implement `evaluateState`**
Handle `firstCard` and `secondCard` assignment.

- [ ] **Step 2: Implement `handleMatch` and `handleMismatch`**
Add "Pulse" animation for matches and "Flip Back" for mismatches.

- [ ] **Step 3: Commit**
```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement matching logic and turn state"
```

### Task 6: Timer and UI Polish

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/style.css`

- [ ] **Step 1: Implement `tickTimer` and progress bar**
Update text every second and shrink the bar.

- [ ] **Step 2: Implement Game Over / Win overlays**
Show high-contrast modal with result and restart button.

- [ ] **Step 3: Final visual polish**
Adjust spacing and font sizes for Clean Minimalist look.

- [ ] **Step 4: Commit**
```bash
git add src/scenes/GameScene.ts src/style.css
git commit -m "feat: add timer, ui overlays, and visual polish"
```
