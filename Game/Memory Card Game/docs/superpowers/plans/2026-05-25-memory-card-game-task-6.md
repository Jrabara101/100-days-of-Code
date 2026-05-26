# Task 6: Timer and UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a countdown timer, progress bar, game over/win overlays, and apply final visual polish.

**Architecture:** 
- Use Phaser's `Time.TimerEvent` for the countdown.
- Use `Phaser.GameObjects.Graphics` for a dynamic progress bar.
- Create UI overlays using `Phaser.GameObjects.Container` for grouping background, text, and buttons.
- Update CSS for global styles.

**Tech Stack:** Phaser 3, TypeScript, CSS.

---

### Task 1: Implement Timer Logic and Progress Bar

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Define necessary properties and initialize timer in `create()`**

Add `progressBar` to private properties.
In `create()`, initialize `gameTimer` and `progressBar`.

```typescript
  private progressBar!: Phaser.GameObjects.Graphics;
  // ... inside create()
  this.progressBar = this.add.graphics();
  this.updateProgressBar();

  this.gameTimer = this.time.addEvent({
    delay: 1000,
    callback: this.tickTimer,
    callbackScope: this,
    loop: true
  });
```

- [ ] **Step 2: Implement `tickTimer()`**

```typescript
  private tickTimer() {
    if (this.isGameOver) return;

    this.timeRemaining--;
    this.timerText.setText(`Time: ${this.timeRemaining}s`);
    this.updateProgressBar();

    if (this.timeRemaining <= 0) {
      this.triggerGameOver();
    }
  }
```

- [ ] **Step 3: Implement `updateProgressBar()`**

```typescript
  private updateProgressBar() {
    this.progressBar.clear();
    const width = 400;
    const height = 10;
    const x = 20;
    const y = 90;
    const progress = this.timeRemaining / 45;

    // Background
    this.progressBar.fillStyle(0xdcdde1, 1);
    this.progressBar.fillRect(x, y, width, height);

    // Progress
    this.progressBar.fillStyle(0x2c3e50, 1);
    this.progressBar.fillRect(x, y, width * progress, height);
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement game timer and progress bar"
```

### Task 2: Implement Game Over and Success Overlays

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Implement `triggerGameOver()`**

```typescript
  private triggerGameOver() {
    this.isGameOver = true;
    if (this.gameTimer) this.gameTimer.remove();
    this.showOverlay("TIME OUT - SYSTEM FAILURE", 0xe74c3c);
  }
```

- [ ] **Step 2: Refine `gameWon()`**

```typescript
  private gameWon() {
    this.isGameOver = true;
    if (this.gameTimer) this.gameTimer.remove();
    this.showOverlay("SUCCESS - SYSTEM OVERRIDE COMPLETE", 0x27ae60);
  }
```

- [ ] **Step 3: Implement `showOverlay(message, color)`**

```typescript
  private showOverlay(message: string, color: number) {
    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0).setDepth(1000);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, width, height);
    overlay.add(bg);

    const title = this.add.text(width / 2, height / 2 - 40, message, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
    overlay.add(title);

    const btn = this.add.container(width / 2, height / 2 + 60);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(color, 1);
    btnBg.fillRoundedRect(-100, -25, 200, 50, 5);
    btn.add(btnBg);

    const btnText = this.add.text(0, 0, 'REBOOT SYSTEM', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    btn.add(btnText);

    btn.setSize(200, 50);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      this.scene.restart();
    });

    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));
    
    overlay.add(btn);
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add game over and success overlays"
```

### Task 3: Final Visual Polish

**Files:**
- Modify: `src/style.css`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Update `src/style.css` colors**

```css
body {
  /* ... */
  background-color: #F5F6FA;
}
```

- [ ] **Step 2: Update UI Colors and spacing in `src/scenes/GameScene.ts`**

Update `movesText`, `timerText` color to `#2C3E50`.
Adjust spacing if needed.

- [ ] **Step 3: Verify the build**

Run `npm run build` or `npm run dev` to ensure everything is correct.

- [ ] **Step 4: Commit**

```bash
git add src/style.css src/scenes/GameScene.ts
git commit -m "style: final visual polish"
```
