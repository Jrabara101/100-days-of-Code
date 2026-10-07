# AeroLogix Command - Next-Gen Operations & Inventory Intelligence Platform

A high-velocity, operations-first inventory command center built to replace slow, clunky ERP spreadsheets with high-velocity telemetry, automated replenishment intelligence, and interactive spatial tracking.

---

## 🚀 Key Non-Technical Vision & High-Impact Features

1. **Predictive "Burn-Rate" Depletion Forecaster**:
   - Continuously computes rolling 7-day and 30-day sales velocity, seasonality, and supplier lead times.
   - Calculates the exact calendar day an item will stock out.
   - Automatically generates draft purchase orders with recommended Economic Order Quantities (EOQ).

2. **Zero-Hardware "Scan & Stash" Mobile Hub**:
   - Turns any phone, tablet, or laptop webcam into a barcode/QR scanning terminal with zero specialized hardware.
   - Floor staff can batch-scan incoming pallets, instantly verify shipments against vendor packing slips, and flag damaged or missing cartons on the fly.
   - Web Audio API synthesized feedback (POS laser chirps, success tones, error buzzes).

3. **Digital Twin Visual Shelf & Bin Mapper**:
   - 2D interactive spatial schematic of warehouse zones (Zone A High Velocity, Zone B Cleanroom Vault, Zone C Cold Chain -20°C, Zone D Bulk Heavy).
   - Visual heatmaps showing shelf fill percentages and congestion levels.
   - Calculated optimal pick path overlay minimizing walking distance between AGV docks and pack stations.

4. **Supplier Drift & Price-Creep Radar**:
   - Automated audit engine that monitors vendor reliability, tracking delivery punctuality %, damaged goods percentages, and unit price increases against contracted quotes over 30-, 90-, and 365-day windows.
   - Quantifies cumulative annual financial leakage due to vendor price creep.

5. **Cycle-Count Sentry & Shrinkage Telemetry**:
   - Replaces painful annual inventory freezes with rolling, gamified micro-audits.
   - Schedules daily 5-minute spot-counts for high-variance SKUs.
   - Calculates discrepancy confidence intervals and records variance reconciliation into the immutable ledger.

6. **Multi-Channel Reservation Locks**:
   - Real-time synchronized stock pooling partitioning available inventory across Shopify, Amazon, B2B wholesale orders, and physical showrooms.
   - Temporarily locks stock during active checkout funnels with automatic 15-minute TTL expirations to eliminate backorders and out-of-stock cancellations.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **React 18+ & Vite** (TypeScript)
- **Tailwind CSS & shadcn UI design system** (Obsidian dark logistics aesthetic, semantic badges, custom scrollbars)
- **TanStack Table** with virtualized rendering, sticky headers, multi-sort, fuzzy search (<10ms), and CSV export
- **Interactive SVG Digital Twin floorplan** with visual heatmaps & dynamic pick path rendering
- **Web Audio API Sound Synthesizer** (zero-latency barcode scanner beeps)
- **Global Command Menu (CMD+K / F2)** for rapid SKU/bin spotlight navigation
- **Sliding Sheet SKU Drawer** with live telemetry, financial margin analysis, and one-click restock PO dispatcher

### Backend
- **Node.js + Fastify**
- **Transactional Event-Sourcing Ledger**: Immutable `StockTransaction` logs (`INBOUND`, `OUTBOUND`, `TRANSFER`, `CYCLE_COUNT`, `SCRAP`, `RESERVATION_HOLD`, `RESERVATION_RELEASE`) with materialized rollups for atomic balance calculation.
- **Concurrency & Reservation Lock Engine**: Automatic TTL sweep interval expiring stale cart holds.
- **Predictive Analytics & Forecasting Pipeline**: Rolling velocity, Days of Inventory Remaining (DIR), and Economic Order Quantity ($EOQ = \sqrt{(2DS)/H}$).
- **Real-Time Push Layer**: WebSocket server (`ws://localhost:3005/ws`) broadcasting live stock mutations, low-stock threshold triggers, and inbound receipt events.

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Both Backend and Frontend Concurrently
```bash
npm run dev
```
- Frontend Dev Server: `http://localhost:5173`
- Fastify Backend Server: `http://localhost:3005`
- WebSocket Telemetry Stream: `ws://localhost:3005/ws`

### 3. Run Backend Only
```bash
npm run dev:server
```

### 4. Run Frontend Only
```bash
npm run dev:client
```
