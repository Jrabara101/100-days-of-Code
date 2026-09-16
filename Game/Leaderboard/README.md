# Apex Elite • Real-Time Competitive Leaderboard System

A high-performance, real-time competitive leaderboard system built for modern web applications and esports gaming hubs. Designed to showcase player rankings, game statistics, and seasonal achievements with absolute clarity at a locked 60 FPS.

## 🚀 Tech Stack
- **Framework**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Virtualization**: [@tanstack/react-virtual](https://tanstack.com/virtual/latest) for effortlessly rendering 10,000+ rows without layout thrashing
- **Server State & Real-Time Sync**: [@tanstack/react-query](https://tanstack.com/query/latest) with simulated real-time rank delta mutations and optimistic match updates
- **Design System & Styling**: [Tailwind CSS](https://tailwindcss.com/) + custom esports dark theme tokens + glassmorphic surface panels
- **UI Primitives**: Custom [shadcn UI](https://ui.shadcn.com/) primitives built with Radix UI (`Table`, `Avatar`, `Tabs`, `Dialog`, `Badge`, `Button`, `Input`, `Tooltip`)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## ⚡ High-Impact Features

### 1. 🏆 Cinematic Podium Showcase
- Elevated spotlight cards for the top 3 contenders (#1 Gold Champion, #2 Silver, #3 Bronze).
- Tier border glows, crown crests, win rates, LP scores, and click-to-open player profile modals.

### 2. ⚡ Window Virtualization (10,000+ Rows at 60 FPS)
- TanStack Virtual (`useVirtualizer`) calculates dynamic translation transforms with a lightweight DOM footprint (keeps DOM node count below ~30 elements even during high-velocity scrolling).

### 3. 🔄 Real-Time Rank Delta Tickers & Background Sync
- Simulated real-time polling updates player ratings and recalculates ranks live.
- Dynamic ticker badges display position shifts:
  - `+N` (Green up arrow with rank elevation)
  - `-N` (Red down arrow with rank demotion)
  - `0` (Neutral dash)

### 4. 🎮 Optimistic Match Simulation
- Click **"Simulate Match"** in the top bar to simulate an instant match victory (+45 LP), immediately promoting your rank, recalculating table positions, and triggering celebratory visual particle effects with zero network lag.

### 5. 🔍 Multi-Dimensional Filtering & Debounced Search
- **Timeframe views**: Daily, Weekly, All-Time.
- **Categories**: Global, Friends-only, Regional, Starred/Bookmarked.
- **Region dropdown**: All Regions, North America, Europe, Asia-Pacific, South America.
- **Tier filter**: Master, Diamond, Gold, Silver, Bronze.
- **Instant debounced search**: Filter across player handles, tags (`#NA1`), countries, and favorite agents.

### 6. 👤 Deep-Dive Player Profile Modal
- Click any player card or table row to inspect:
  - Global Rank & Tier Banner
  - K/D Ratio with regional trend
  - Headshot Accuracy %
  - Favorite Agent & hours played
  - Form Tracker: Recent 5 matches with match scores (e.g. `13 - 7`), map names, and KDA
  - Verified badges and achievements

### 7. 🏛️ Hall of Fame & Seasonal Archives
- Preserves long-term user prestige with dedicated archives for Season 1, Season 2, and Season 3 champions.

---

## 📁 Project Architecture

```
Leaderboard/
├── index.html                           # Modern Vite entry HTML
├── index.legacy.html                    # Legacy prototype backup
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── vite.config.ts                       # Vite bundler configuration with @/ alias
├── tailwind.config.js                   # Esports dark theme & tier glow tokens
└── src/
    ├── main.tsx                         # QueryClientProvider & React root
    ├── App.tsx                          # TooltipProvider & App container
    ├── index.css                        # Design system tokens, glassmorphism, animations
    ├── types/
    │   └── leaderboard.ts               # Strict LeaderboardItem and Filter interfaces
    ├── services/
    │   └── mockDataGenerator.ts         # Generates 10,000+ realistic competitive players
    ├── hooks/
    │   ├── useLeaderboardData.ts        # TanStack Query hook, live interval ticks, optimistic updates
    │   ├── useDebounce.ts               # Debounced search hook
    │   └── useFavorites.ts              # LocalStorage persistence for bookmarks
    ├── lib/
    │   └── utils.ts                     # shadcn `cn` utility, formatters, and tier themes
    └── components/
        ├── ui/                          # shadcn UI components
        │   ├── table.tsx
        │   ├── avatar.tsx
        │   ├── tabs.tsx
        │   ├── dialog.tsx
        │   ├── badge.tsx
        │   ├── button.tsx
        │   ├── input.tsx
        │   ├── tooltip.tsx
        │   └── card.tsx
        └── dashboard/
            ├── LeaderboardDashboard.tsx # Root state orchestrator & layout
            ├── HeaderBar.tsx            # Live arena status, player count, user LP widget
            ├── PodiumSection.tsx        # Top 3 spotlight showcase
            ├── FilterToolbar.tsx        # Timeframes, categories, search, live toggle
            ├── LeaderboardTable.tsx     # TanStack Virtual table with sticky headers
            ├── LeaderboardRow.tsx       # Memoized row with delta badges & actions
            ├── PlayerProfileModal.tsx   # Detailed player analytics & match history
            └── HallOfFameModal.tsx      # Past season archives
```

---

## 💻 Getting Started

### Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
```
Generates a production build in the `dist/` directory.
