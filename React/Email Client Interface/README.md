# AeroMail — Sub-50ms Split-Horizon Email Client & Communication Command Center

A high-velocity, keyboard-first email workspace and communication command center built with **React**, **Vite**, **Tailwind CSS**, **Zustand**, and a local-first **IndexedDB (Dexie.js)** sync architecture.

Synthesizing the sub-100ms triage speed of **Superhuman**, the sender-screening and workflow boundaries of **HEY**, and the structural precision of **Linear** and **Cron**.

---

## 🚀 Key Highlights & Architectural Pillars

### 1. High-Velocity Inbox Triage, Split Horizons & The Screener ("Anti-Bankruptcy Engine")
- **First-Time Sender Screener Gate:**
  - Emails from unknown first-time senders never clutter your primary inbox.
  - Queued in a compact **Screener Strip (`🔔 4 New Senders to Screen`)**.
  - One-touch decisions: `[ 👍 Approve to Primary ]`, `[ 📰 Route to Newsletters ]`, `[ 🧾 Route to Receipts ]`, or `[ 🚫 Block & Screen Out Forever ]`.
- **Split-Horizon Inbox Lenses:**
  - Segments incoming mail into high-signal horizontal tabs with independent unread counters:
    - `Focused` (VIP contracts, incidents, direct requests)
    - `VIP` (Investors, key partners, board decks)
    - `Newsletters` (The Feed: Substack, curated engineering digests)
    - `Receipts` (Paper Trail: Stripe, AWS, Vercel billing statements)
    - `Waiting on Reply` (Overdue boomerang radar)
    - `All`
- **Keyboard-First Triage Ergonomics (100+ WPM):**
  - `J / K` or `↑ / ↓`: Step through threads with visual cobalt active cursor
  - `Enter`: Open / expand selected conversation
  - `E`: Mark Done / Archive
  - `H`: Snooze thread with natural language presets (*"Later Today"*, *"Tomorrow Morning"*, *"This Weekend"*, *"Next Monday"*)
  - `L`: Color-coded label picker popover with instant numeric hotkeys
  - `U`: Toggle read / unread
  - `Cmd+Shift+U` / `Ctrl+Shift+U`: **1-Click Unsubscribe + Archive All Past**
  - `?`: Toggle Keyboard Shortcuts HUD cheatsheet
- **"Reply-Needed" & Boomerang Follow-Up Radar:**
  - Detects outgoing messages containing questions (`"Would Tuesday work?"`, `"Can you send over the signed PDF?"`) and sets `[ ⏰ Remind me in 3 days if no reply ]`.
  - Automatically flags overdue threads with amber alert badges when recipients go silent.

### 2. Frictionless Compose Studio, Safety Guardrails & Timezone Ergonomics
- **Multi-Draft Docked & Full-Focus Composer:**
  - Floating bottom-right dock (`w-[580px]`) with draft tabs, minimize, and restore.
  - Expand with `Cmd+Shift+F` into distraction-free centered `max-w-4xl` editorial canvas.
- **Pre-Flight Safety Linter:**
  - **Missing Attachment Sentinel:** Scans body copy for phrases like `"attached"`, `"see the PDF"`, `"enclosed"` when 0 files are attached, halting dispatch before embarrassing mistakes occur.
  - **External Domain Warning:** Highlights external recipients in amber when replying to internal threads.
- **15-Second Grace Queue (`Undo Send`):**
  - Sent messages enter a server-side hold buffer with a live bottom-left draining progress toast (`"Sending to Elena... (14s) [Undo (Z)] [Send Now]"`).
  - Pressing `Z` or clicking `Undo` immediately restores the draft back into the composer at the exact cursor position.
- **Recipient Timezone Protection & Send-Later Scheduling:**
  - Resolves recipient's local timezone (e.g. London / Berlin / San Francisco) and displays a gentle quiet-hours banner when composing after-hours:
    *"🌙 It's 11:40 PM in London for Elena. [📅 Schedule for 8:30 AM GMT]"*.
- **Slash Snippets & Variable Piping:**
  - Type `/` to trigger reusable templates: `/intro`, `/pricing`, `/calendly`, `/nda`, `/followup` with dynamic `{{first_name}}` resolution.
- **Internal Team Side-Notes:**
  - Collaborate privately with teammates at the bottom of any thread via `@mentions` (e.g., `@marcus verify section 4.2 liability cap before countersigning`) without messy `Fwd:` chains.

### 3. Multi-Dimensional Labels, Visual Bundles & Zero-Code Triage Rules
- **Semantic Color Tokens:**
  - `[🔴 Urgent / P1]` (`#EF4444`)
  - `[🟣 Legal & MSA]` (`#8B5CF6`)
  - `[🟢 Finance & Invoices]` (`#10B981`)
  - `[🔵 Product & Eng]` (`#3B82F6`)
  - `[🟠 Clients & VIP]` (`#F97316`)
  - `[🌸 Hiring & People]` (`#EC4899`)
- **Inbox Bundle Roll-Ups ("Anti-Clutter Grouping"):**
  - Labels configured with `Bundle in Inbox` collapse daily receipts or updates into an expandable summary row (`"📦 [Finance & Invoices] — 3 bundled messages from Stripe, AWS, Vercel"`).
  - Triaged or archived in one click with `[ ✅ Mark All Done ]`.
- **Zero-Code Auto-Triage Rule Studio:**
  - Interactive split-pane rule builder with Condition Cards (Sender Domain, Subject contains) and Action Cards (Apply Label, Bundle in Inbox, Skip Primary) with retroactive application to past threads.
- **Sender 360° Context Inspector (Zone 4):**
  - Collapsible right rail with Sender Avatar, VIP halo, Title & Company, Local Timezone, Mutual interaction stats (`14 past threads`), and shared files vault.

### 4. Sub-50ms Faceted Search & Visual Attachment Vault
- **Interactive Tokenized Search Bar (`Cmd+K` / `/`):**
  - Structured syntax tokens: `from:elena`, `label:legal`, `has:attachment`, `is:unread`, `is:starred`.
  - Real-time search latency badge (`"14 results in 8ms"`).
- **Dual-Mode Results:**
  - **Mode A: Matching Threads:** Keyword highlight matching with instant navigation.
  - **Mode B: Visual Attachment & Link Vault:** Live grid of PDFs, spreadsheets, and docs with page thumbnails, download, and `"Jump to Email ↗"`.
  - **Mode C: Quick Actions:** Instant execution for composing, toggling dark mode, reviewing screener, or opening rules.

---

## 📐 4-Zone Master Desktop Architecture

```
+---------------------------------------------------------------------------------------------------------+
| Zone 1: Navigation Rail    | Zone 2: Split Inbox       | Zone 3: Reading Stage     | Zone 4: Sender 360° |
| (240px)                    | (440px)                   | (Flexible Width)          | (300px collapsible) |
|                            |                           |                           |                     |
| - Account Switcher         | - Tokenized Search Bar    | - Sticky Action Header    | - Profile & Avatar  |
| - Primary [ ✍️ Compose ]   | - Split Horizon Tabs      |   [Done (E)] [Snooze (H)] | - Local Timezone    |
| - Screener Callout Capsule |   [Focused][VIP][Feed]... |   [Unsubscribe (⌘⇧U)]     | - VIP Sender Toggle |
| - System Views (Inbox,     | - Bundled Roll-up Rows    | - Stacked Message Cards   | - Past Threads (14) |
|   Starred, Snoozed, etc.)  |   📦 [Finance & Invoices] | - Attachment Shelf        | - Shared Files (4)  |
| - Labels & Bundles Tree    | - Thread Rows (44px/64px) | - Privacy Shield (Trackers| - Relationship Notes|
| - Sync Status & Toggles    | - Inbox Zero Horizon      | - Team Side-Notes (@team) |                     |
|                            |                           | - Smart 1-Click Replies   |                     |
+---------------------------------------------------------------------------------------------------------+
| Floating Overlays:                                                                                      |
|  - SmartComposeDock (Multi-draft floating / full-focus Cmd+Shift+F)                                    |
|  - UndoSendToast (15s draining cobalt progress bar with instant [Z] restore)                           |
|  - TokenizedSearchPalette (Cmd+K / / with AST chip parsing & Visual Attachment Vault)                  |
|  - ScreenerModal (First-time senders review deck)                                                      |
|  - RuleStudioModal (Zero-code auto-triage rules & retroactive application)                             |
|  - KeyboardShortcutsModal (Cheatsheet HUD triggered by ?)                                              |
+---------------------------------------------------------------------------------------------------------+
```

---

## 🛠️ Tech Stack & Implementation Details

- **Frontend Framework:** React 19 + Vite 8
- **Styling & Design System:** Tailwind CSS with Obsidian dark / Crisp light modes
- **Local-First Database:** Dexie.js (IndexedDB) with real-time reactive hooks (`useLiveQuery`)
- **Global State:** Zustand (`useMailStore`) with optimistic UI mutations
- **Icons & Typography:** Lucide React, Google Fonts (`Inter`, `JetBrains Mono`, `Newsreader`)
- **Micro-Interactions:** Canvas Confetti, CSS transitions, tabular-nums alignment

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build & Linting
```bash
npm run build
npm run lint
```

---

## ⌨️ Essential Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `J` / `K` | Step down / up through thread list |
| `Enter` | Open / expand selected thread |
| `E` | Mark Done / Archive thread |
| `H` | Snooze thread (Tomorrow, Weekend, Next Week) |
| `L` | Assign color-coded label |
| `U` | Toggle read / unread status |
| `Cmd + Shift + U` | 1-Click Unsubscribe + Archive All Past |
| `C` | Compose new message |
| `R` | Quick Reply to last message |
| `A` | Reply All |
| `F` | Forward thread |
| `⌘ + Enter` | Send draft (starts 15s undo grace queue) |
| `Z` | Undo Send (restores draft immediately) |
| `⌘ + ⇧ + F` | Toggle Full-Focus Editorial Canvas |
| `⌘ + K` or `/` | Instant Faceted Search & Visual Attachment Vault |
| `?` | Open Keyboard Shortcuts HUD Cheatsheet |
| `Esc` | Close modals and popovers |
