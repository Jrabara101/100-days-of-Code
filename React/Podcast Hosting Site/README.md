# RESONANCE STUDIO // Modern Podcast Hosting & Interactive Listening Platform

Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, designed according to the **Stitch.md UI Design System Specification** ("Tactile Broadcast Studio & Warm Acoustic Editorial").

---

## 🎙️ Flagship Features

### 1. Anti-Commit Discovery & Commute-Aware Episode Cards
- **⚡ 45-Second Highlight Sample (`[⚡ Sample Best Moment]`)**: Every episode card includes a signature hook sampler with an animated circular countdown ring. Allows listeners to sample the episode's #1 insight before committing to the full runtime, with seamless handoff to the persistent player dock.
- **Speed-Adjusted Runtime & Commute Filter Bar**: Sticky filter allowing listeners to slice episodes by time window (`[☕ 15-Min Coffee Break]`, `[🚇 30-Min Commute]`, `[🧠 Deep-Dive Conversation]`, `[All]`). Dynamically recalculates all episode durations when toggling `1.0x`, `1.25x`, `1.5x`, or `2.0x`.
- **"Start Here" Curated Onboarding Tracks**: Beginner-friendly tracks ("New to the Show? Start with These 3 Classics", "Solo Builder Economics Arc", "15-Minute Coffee Sprints") with aggregate listen budgets.

### 2. Interactive Episode Stage (Waveform, Chapters & Read-Along Transcript)
- **Persistent Studio Waveform Dock (Bottom Bar)**:
  - 80-bar amplitude waveform segmented by chapter ticks.
  - Subtle **"Most Replayed" Crowd Heatmap** overlay in coral glow behind peak insight moments.
  - **Hover Scrub Tooltip**: Displays exact timestamp (`18:42`), chapter title, and a 5-word transcript preview of that exact second.
  - Transport controls (-15s rewind, +30s fast-forward, tactile circular amber play/pause).
  - **Dynamic "Skip the Banter" Intro Button**: `[⏭️ Jump to Main Conversation (02:40)]` surfaces during intro banter and disappears once main conversation starts.
- **Bi-Directional "Read-Along" Transcript & Search**:
  - Sentence-level lighting: active spoken sentence gently illuminates with amber accent border in real time.
  - Clicking any paragraph or sentence immediately seeks audio to that exact second.
  - Transcript search input with keyword matching and speaker filter pills (`All`, `Host`, `Guest`).
  - Auto-scroll with manual scroll detection and floating `[↓ Sync to Live Audio]` button.
- **Resonance Web Audio Voice-Cadence Synthesizer**: Built-in zero-latency Web Audio API synthesizer that provides warm broadcast presence, pitch-shifts with speed changes, and works 100% offline.

### 3. "Mentioned in This Episode" Live Companion Shelf
- Replaces messy URLs with structured visual cards for **Books**, **Tools**, **Articles**, and **People**.
- Every card features an exact timestamp badge (`[💬 Discussed at 24:10]`)—clicking the badge jumps audio directly to the discussion moment.

### 4. 1-Click "Audio Quote & Audiogram" Clipper
- Highlighting any text in the transcript opens a floating studio bar (`14:22 – 14:49 • 27 sec clip`).
- **Save to Vault**: Stores quotes in personal Listening Vault.
- **Export Audiogram Card**: Interactive modal with animated waveform bars, 4 studio themes (Studio Amber, Coral Sunset, Emerald Broadcast, Cyber Obsidian), and social export actions.

### 5. Creator "Studio & Analytics" View (Hosting Dashboard)
- Toggled via top-right `[🎙️ Creator Studio]` switch.
- **Episode Retention & Replay Curve**: Interactive area chart showing listener retention percentage across time, with labeled retention peaks (`[🔥 +42% Listener Rewinds]`) and a 1-click `[⚡ Promote to 45s Hook]` button.
- **Chapter Break Editor**: Add and edit chapter timestamps and descriptions.
- **AI Co-Producer Ingestion Dropzone**: Simulated audio upload showing green checklist (`✓ Loudness Normalized (-16 LUFS)`, `✓ Chapters Auto-Detected`, `✓ 4 Links Extracted`).
- **Guest Press-Kit & Share Pack**: Ready-to-copy social quotes, referral links with listen tracking, and audiogram generator.

### 6. Listener Q&A / Voicemail Mailbag Drawer
- Tactile `"Leave a 60-Sec Question"` recorder modal with animated VU meter / waveform recording animation, 60s countdown, audio review, and community mailbag questions list.

### 7. Cross-Catalog "Spoken Word" Search (`⌘K` / `Ctrl+K`)
- Global search bar indexing spoken word timestamps across the entire show archive.
- Returns playable 20-second audio snippets with surrounding context and jump button.

### 8. Theme System (Stitch.md)
- **Warm Studio Slate (Dark Default)**: `#0D0E11` acoustic obsidian foam, `#15171C` console elevated, amber `#F59E0B` and coral `#FB7185` accents.
- **Daylight Editorial Paper (Light Toggle)**: `#F7F5F0` paper with `#EFECE6` cards for daytime long-form transcript reading.

---

## 🚀 Running the Project

```bash
# Navigate to the project directory
cd "Podcast Hosting Site"

# Run development server
npm run dev

# Or run preview server
npm run preview
```
