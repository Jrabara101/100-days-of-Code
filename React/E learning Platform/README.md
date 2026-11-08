# KINESIS — Active High-Retention E-Learning Platform

> **Synthesizing the conceptual clarity of Brilliant.org, the ergonomic lecture experience of Frontend Masters & Linear, and the knowledge synthesis of Readwise and Notion.**

Traditional Learning Management Systems (LMS) suffer from three fatal flaws:
1. **Passive Video Coma:** Learners binge hours of video lectures without active recall or cognitive friction.
2. **Disconnected Note-Taking:** Study notes written outside the player lose their exact timestamped context.
3. **Vanity Progress Bars ("65% Watched"):** Masks rapid Ebbinghaus memory decay and gives a false illusion of competence without spaced repetition.

**Kinesis** completely transforms passive video watching into active, durable mastery.

---

## Key High-Impact Features

### 1. Active Split-Screen Classroom (`/courses/:slug/learn/:lessonId`)
- **Interactive Theater:** Adaptive video player on the left paired with a synchronized auto-scrolling transcript, lab files, and a live Markdown Study Notebook on the right.
- **1-Click Timestamped Note & Slide Snipper (`⌘ + B`):** Pressing `⌘+B` captures the current slide diagram from the video canvas and embeds a clickable `[ ▶ 06:42 ]` seek pill directly into the student's study notes.
- **In-Video "Micro-Check" Pause Gates (`@ 08:15`):** Playback gently pauses at anchored timestamps, displaying a frosted overlay requiring the learner to answer an interactive concept check before continuing.
- **Confusion Heatmap & Rewind Density Radar:** Surfaces exact segments where cohort rewind frequency spikes (`"⏪ 58% of learners rewatched 09:15–09:50"`).
- **Millisecond-Anchored Q&A:** Questions and `[ ✓ Instructor Verified Answer ]` badges are pinned to specific seconds along the timeline.

### 2. Diagnostic & Spaced-Repetition Quiz Engine (`/courses/:slug/quiz/:quizId`)
- **Polymorphic Question Types:**
  - Multiple Choice with keyboard shortcuts (`1-4`, `A-D`)
  - Drag-and-Drop Sequence Ordering
  - Fill-in-the-Blank Cloze code blocks
  - Interactive Diagram Hotspot clicking
- **Confidence Weighting (Metacognitive Calibration):**
  - Learners tag confidence before submitting: `[ 🤔 Guessing ]` vs `[ 👍 Fairly Sure ]` vs `[ 🎯 100% Confident ]` (press `C` to cycle).
  - High confidence + Incorrect answer flags a **"Conceptual Blindspot"** for high-priority remediation.
  - Guessing correctly still enrolls the card into the Memory Vault.
- **Instant Video Remediation Cards:** Wrong answers immediately slide open a mini deep-linked 36-second video player (`04:12–04:48`) with instructor explanation.
- **Automated Memory Vault (FSRS / SM-2):** Missed items enter the student's daily 3-minute retention deck with expanding review intervals (`Again <10m`, `Hard 2d`, `Good 5d`, `Easy 12d`).

### 3. Competency Radar & Progress Tracker (`/dashboard`)
- **"Watched vs. Mastered" Dual-Ring Telemetry:** Separates consumption progress (`68% Watched`) from retention health (`91% Strong`), modeling the Ebbinghaus decay curve.
- **Goal-Paced Finish Line Forecaster:** Computes projected graduation date (`"Dec 18, 2026"`).
- **1-Click Zero-Guilt Schedule Rebalancer (`[ ✨ Rebalance My Study Schedule ]`):** Recalculates pacing without red alerts or guilt trips, protecting habit momentum.
- **365-Day Study Activity Matrix & Streak Shields:** GitHub-style heatmap with daily intensity levels and earnable **Streak Freeze Shields** (`🔥 18-Day Streak • 🛡️ 2 Shields Active`).
- **Verifiable Credential Portal (`/verify/CERT-2026-8841`):** Cryptographically verifiable certificate (SHA-256 hash) showcasing the learner's multi-axis Skill Radar, 1-click LinkedIn export, and OpenBadges 3.0 JSON-LD.

### 4. Skill-Tree Syllabus & DAG Curriculum Map (`/courses/:slug/syllabus`)
- Visual Directed Acyclic Graph (DAG) displaying module prerequisites.
- Dual completion & mastery rings per module node (`Fresh`, `Fading`, `Unlocked`, `Capstone`).
- **"Test Out" Diagnostic Checkpoints:** Experienced engineers can take a 5-minute diagnostic quiz to bypass foundational chapters and unlock advanced material immediately.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Audio Synthesis:** Web Audio API oscillator synthesis (subtle tactile clicks, chimes, shutter sounds without external asset dependencies).
- **Backend:** Node.js, Express, PostgreSQL / Supabase, Redis cache.
- **Algorithms:**
  - Free Spaced Repetition Scheduler (FSRS / SM-2)
  - Ebbinghaus Retention Decay: $R = 100 \cdot e^{-t / (S \cdot 8)}$

---

## Getting Started

### 1. Run Frontend
```bash
# Navigate to project directory
cd "E learning Platform"

# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev
```

### 2. Run Backend (Optional / Standalone API)
```bash
cd backend
npm install
node server.js
```

### 3. Database Schema
Deploy `backend/schema.sql` directly to any PostgreSQL or Supabase instance.
