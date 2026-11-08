# Agora Salon — Real-Time Human-Centric Discussion System

> A modern, human-centric Real-Time Commenting & Live Discussion platform built with React, Vite, and Tailwind CSS. Designed to prioritize zero-jank real-time updates, constructive nuance reactions, passage-anchored context, and scannable thread ergonomics over chaotic auto-jumping feeds, squished staircase replies, and binary upvote/downvote wars.

---

## 🏛️ System Philosophy: The Tactile Editorial Salon

Traditional online comment sections are architected like append-only database transaction dumps. When participants join, incoming messages violently dislodge viewports, deep threads squish into 3-word margins on mobile, and binary upvote/downvote buttons reduce complex debate to tribal conflict.

**Agora Salon** reconceives commenting as a living intellectual parlor:
- **Calm Real-Time Presence:** New comments never forcefully displace the reader's scroll. They wait gracefully in a client delta buffer behind a floating glass activity pill until invited.
- **Constructive Nuance Over Binary Wars:** Thumbs-up/down are replaced with four semantic feedback pills: `[💡 Changed My Mind]`, `[🎯 Spot On]`, `[📎 Great Source]`, and `[🤔 Good Question]`.
- **Zero-Squish Ergonomics:** Strict 2-level visual nesting with clickable 2px vertical thread spine rails, paired with a dedicated 55ch Focus Thread slide-over drawer for deep discourse (`Depth >= 3`).
- **Passage-Anchored Context:** Comments can anchor directly to specific paragraphs in the source article. Selecting any text displays a floating `[💬 Reply to Selection]` pill.

---

## 🚀 Key Architectural Features

### 1. Calm Real-Time Presence & Non-Jarring Stream Control
- **Viewport-Safe Activity Pill:** When incoming comments stream in via WebSocket/SSE while a reader is engaged, they are held in a client delta buffer. A tactile floating glass pill (`[● 3 New Replies in thread — Click to Flow In]`) displays avatars of new contributors. Clicking flows them in with a soft emerald background wash (`unread-flow-in`).
- **Live Salon Presence Bar:** Warm presence indicator (`"31 readers • 2 actively typing"`) with soft pulsing avatar rings on threads with live typers.
- **Dual Context Mode:** Toggle between **Town Square Feed** (780px centered discussion below article) and **Split Margin Pins** (side-by-side reading layout with paragraph pins).

### 2. Anti-Noise Perspective Lenses & Thread Synthesis
- **Perspective Lenses:**
  - `[✨ High-Signal & Nuanced]` (Default): Ranks by cognitive weight (`[💡 Changed My Mind]` carries 3.5x, `[📎 Great Source]` carries 3.0x).
  - `[✍️ Author & Expert Replies]`: Filters down to threads where the author or verified domain guests answered.
  - `[⚖️ Constructive Counterpoints]`: Highlights respectful devil's-advocate and alternative paradigms.
  - `[🔥 Live Right Now]`: Highlights threads with active real-time typing velocity.
  - `[🕒 Newest]`: Strict chronological order.
- **"Catch Me Up" Discussion Snapshot:** Collapsible synthesis card summarizing **Core Consensus**, **Key Point of Debate**, and **Top Inquiry**, each with 1-click jump-links to the exact comment.

### 3. Zero-Squish Thread Ergonomics
- **Interactive Thread Spine Rails:** 2px vertical rails with hover glow, collapse indicator, and 1-click folding (`[+ 4 replies folded]`).
- **"Focus Thread" Slide-Over Drawer:** For conversation branches at `Depth >= 3`, a full slide-over panel opens with an ancestral breadcrumb trail and dedicated composer, maintaining a golden 55–65ch reading width.
- **Semantic Nuance Reactions:**
  - `💡 Changed My Mind` (triggers celebratory confetti and high-signal weight)
  - `🎯 Spot On` (domain resonance)
  - `📎 Great Source` (epistemic citation)
  - `🤔 Good Question` (inquiry)

### 4. Smart Constructive Composer & Tone Helpers
- **Highlight-to-Quote Anchor:** Highlighting text anywhere in the article pops up `[💬 Reply to Selection]` and anchors the comment to that paragraph with a serif italic quote block.
- **Intent & Stance Tag Selector:** Commenters can declare their contribution's intent:
  - `[🌱 Building on this]`
  - `[🔄 Counter-Example]`
  - `[❓ Question for Author]`
  - `[📎 Sharing a Resource]`
  - `[🛠️ Fix / Clarification]`
- **"Already Answered?" Pre-Post Helper:** As a user drafts a question in the composer, subtle detection surfaces an author answer card if that topic was already clarified earlier in the thread.
- **Graceful "Cool-Down" & Tone Mirror:** Detects high capitalization, sharp language, or hostile markers and provides a 1-click "Apply Constructive Reframe" preview before posting.

### 5. Flagship Community Intelligence Differentiators
- **"Since You Last Visited" Time-Travel Highlight:** Amber banner with `[Step Through New Replies (1/14) ➔]` stepping sequentially through all unread comments since the reader's last session.
- **"The Temperature Check" Micro-Poll:** 1-click visual pulse slider (`Strongly Resonant`, `Nuanced / Contextual`, `Skeptical / Counter`) revealing live room breakdown cross-tabulated with anchor commentary.
- **Author "Office Hours" Live Mode:** When the article author is online, displays a live Q&A stage with `Queue Unanswered Qs` and real-time typing notifications.
- **Real-Time Simulation Testing Dock:** Built-in floating studio in the bottom-right corner to test incoming streams, typing bursts, author presence toggles, and daylight/dark themes live.

---

## 🎨 Stitch.md Design Tokens

| Token | Daylight Mode | Midnight Dark Mode | Purpose |
|---|---|---|---|
| `canvas-salon-base` | `#FAF8F5` | `#0D0F14` | Warm editorial paper / deep slate canvas |
| `surface-comment-card` | `#FFFFFF` | `#151821` | Primary elevated discussion cards |
| `surface-thread-nested` | `#F4F1EA` | `#1A1E29` | Quoted snippets and nested well |
| `surface-author-highlight` | `rgba(245, 158, 11, 0.07)` | `rgba(245, 158, 11, 0.14)` | Author / Host comment highlight |
| `surface-unread-pulse` | `rgba(16, 185, 129, 0.12)` | `rgba(16, 185, 129, 0.18)` | Soft emerald glow for flowed-in comments |
| `spine-rail-idle` | `#E4E0D8` | `#2A2F3D` | 2px vertical interactive rail |
| `spine-rail-hover` | `#4F46E5` | `#818CF8` | Spine rail highlight on hover |
| `accent-live-emerald` | `#10B981` | `#10B981` | Live presence dots and typing indicator |
| `accent-author-amber` | `#D97706` | `#F59E0B` | Author badge & `[💡 Changed My Mind]` |

---

## 🛠️ Project Structure

```
Real TIme Commenting System/
├── index.html                     # HTML5 entry with Plus Jakarta Sans & Newsreader fonts
├── vite.config.js                 # Vite bundler configuration
├── tailwind.config.js             # Stitch.md custom tokens & animations
├── package.json                   # Dependencies: React 18, Lucide React, Tailwind, Canvas Confetti
└── src/
    ├── main.jsx                   # Entrypoint
    ├── App.jsx                    # Root app layout (Town Square vs Split Margin)
    ├── data/
    │   ├── mockArticle.js         # Editorial essay with paragraph IDs
    │   └── initialComments.js     # Thread dataset with stances, reactions, unread timestamps
    ├── services/
    │   ├── rankingEngine.js       # Bridge-building & nuance ranking calculation
    │   └── toneAnalyzer.js        # Already-answered detector & tone mirror heuristics
    ├── context/
    │   └── DiscussionContext.jsx  # Reactive central store, delta buffer, presence, lenses
    ├── styles/
    │   └── index.css              # Custom CSS variables, scrollbars, highlight animations
    └── components/
        ├── ArticleStage/
        │   ├── ArticleStage.jsx   # Article presentation & highlight-to-quote listener
        │   └── PassagePin.jsx     # Paragraph comment count margin pin
        ├── SalonHeader/
        │   ├── LivePresenceBar.jsx   # Online reader cluster & Author Office Hours stage
        │   ├── TimeTravelBanner.jsx  # "Since You Last Visited" stepper
        │   ├── DiscussionSnapshot.jsx# "Catch Me Up" synthesis card
        │   ├── TemperatureCheck.jsx  # 1-click stance micro-poll
        │   └── PerspectiveLenses.jsx # High-Signal, Author, Counterpoints, Live Now
        ├── ThreadStream/
        │   ├── TownSquareView.jsx    # Main 2-level indented thread stream
        │   ├── ThreadCard.jsx        # Ergonomic card with spine, reactions, typing indicator
        │   ├── ThreadSpine.jsx       # 2px interactive rail with hover glow & folding
        │   ├── NuanceReactions.jsx   # 4 nuance feedback pills with counter animations
        │   ├── FocusThreadDrawer.jsx # Slide-over drawer for Depth >= 3 (55ch width)
        │   └── ActivityPill.jsx      # Viewport-safe floating glass pill
        ├── Composer/
        │   └── SmartComposer.jsx     # Stance tags, quote block, already-answered card, cool-down
        ├── MarginRail/
        │   └── MarginAnnotationDrawer.jsx # Side-by-side reading in Split Mode
        └── Controls/
            └── SimulationControlDock.jsx  # Real-time testing dock for events & simulation
```

---

## 🏃 Running the Project

```bash
# Navigate to the project directory
cd "c:\Users\Admin\100-days-of-Code\React\Real TIme Commenting System"

# Install dependencies (already completed)
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```

The application is served at `http://localhost:5173/`.

