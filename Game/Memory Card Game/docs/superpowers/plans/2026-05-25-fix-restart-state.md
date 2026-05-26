# Fix Game Restart State and Magic Numbers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the game state is properly reset upon restart, replace magic numbers with constants, and unify fonts.

**Architecture:** Move state initialization to a dedicated `init()` method (called by Phaser on restart) and use private constants for game configuration.

**Tech Stack:** TypeScript, Phaser 3

---

### Task 1: Move State Initialization to `init()` and Define Constants

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Define private constants for game configuration**
Add `INITIAL_TIME` and `TOTAL_PAIRS` as private static readonly or just private readonly properties if they don't change.

- [ ] **Step 2: Add `init()` method to reset game state**
Initialize `firstCard`, `secondCard`, `isLocked`, `isGameOver`, `moves`, `matchesFound`, `timeRemaining`, and clear `cards` array.

- [ ] **Step 3: Update `create()` and other methods to use constants**
Replace magic numbers `8` and `45` with the new constants.

- [ ] **Step 4: Fix Font Inconsistency**
Set `fontFamily: 'Arial, sans-serif'` (or similar) for both the title and button text in `showOverlay`.

- [ ] **Step 5: Verify with build**
Run `npm run build` to ensure no TypeScript errors.

- [ ] **Step 6: Commit**
Commit with message: "fix: ensure game state is reset on restart"
