# Relay — High-Velocity Chat, Living Contacts & Contextual Threads

A full-stack, offline-resilient communication workspace built with **React 18**, **Vite**, **Tailwind CSS**, **TanStack Query**, **TanStack Virtual**, **Zustand**, **IndexedDB (`idb`)**, **Node.js / Express**, **WebSockets (`ws`)**, and **PostgreSQL** schema & triggers.

## Architecture Overview

### Unified 4-Zone Workspace
1. **Zone 1 (`64px` Mode Switcher Rail):** Live presence status editor, primary mode switching (`Active Chats`, `My Threads`, `Contacts Directory`, `Saved Bookmarks`, `Shared Memory Vault`), live WebSocket / Offline simulation toggle, `⌘K` Command Switcher, and Obsidian Dark / Crisp Day Light theme toggle.
2. **Zone 2 (`320px` Resizable Active Chats Sidebar):** 4-column Pinned VIP Dock, smart filter lenses (`All`, `Unread`, `🧵 Threads`, `@Mentions`, `Requests`, `Archived`), ambient live typing/recording whispers, `[Draft]` persistence indicators, and virtualized conversation roster.
3. **Zone 3 (Primary Message Stream):** Sticky timezone-aware chat header, cycling sticky pinned messages bar, `@tanstack/react-virtual` message stream with unread horizon divider (`N New Messages`), floating `@Mention` / `Unread` jump pills, interactive 32-bar Voice Note waveform scrubber + `[Aa Transcript]`, decision polls, code blocks, link unfurls, `(edited)` word-diff tooltips, and timezone-aware silent-send / 9:00 AM scheduler composer.
4. **Zone 4 (Contextual Split Drawer):**
   - **Thread Drawer (`380px`):** Pinned parent anchor card, chronological replies, follow toggle, and `[ ☑ Also send to main chat ]` broadcast support.
   - **Contact Inspector (`340px`):** Live local time pill, custom alias editor, dynamic circle tags, auto-saving private relationship notes, shared group overlaps, 1-on-1 to Group Escalation, and tabbed Shared Memory Vault (`Media`, `Files`, `Links`, `Voice`).

### Offline-First & Idempotent Queueing
- Outbound messages mount optimistically in `<16ms` with a client-generated `clientMsgId` UUID and persist to **IndexedDB** (`relay-chat-workspace-db`).
- Toggle **Offline Mode** via the bottom-left connection badge in Zone 1 to verify messages stay queued as `Sending ⏳` and automatically reconcile (`Sent ✓` → `Delivered ✓✓` → `Read ✓✓`) upon WebSocket reconnection.

### PostgreSQL Schema & Thread Rollup Trigger
See [`server/db/schema.sql`](./server/db/schema.sql) for the complete PostgreSQL DDL (`users`, `contacts`, `conversations`, `conversation_members`, `messages`), cursor-pagination indexes, and the `trg_messages_thread_rollup` trigger that atomically maintains `reply_count`, `thread_participants` (max 4), `latest_thread_snippet`, and `last_thread_reply_at`.

## Quick Start

```bash
npm install
npm run dev
```

- **Frontend (Vite):** `http://localhost:5173`
- **Backend API & WebSocket Server:** `http://localhost:3001`

### Verification Commands

```bash
npm run test    # Run Vitest unit & integration suite
npm run build   # TypeScript type-check & production Vite bundle
```

## Keyboard Shortcuts
- `Cmd/Ctrl + K` — Open Command Switcher
- `Cmd/Ctrl + N` — New Chat or Group
- `R` (while hovering a message bubble) — Snap message into Quote-Reply
- `Esc` — Close active modal or right-hand drawer

