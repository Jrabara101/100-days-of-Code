# GourmetDrop — Modern High-Conversion Food Delivery & Telemetry Suite

A high-trust, appetite-driven culinary delivery web application engineered with **React 19**, **Vite**, **Tailwind CSS v4**, and a resilient **PostgreSQL / PostGIS / Redis** architecture.

Synthesizing the editorial restaurant curation of Wolt and Caviar with the real-time logistics precision of Uber Eats and DoorDash.

---

## 🌟 Key Product Features

### 1. Hyper-Contextual Restaurant Discovery & "Zero-Surprise" Fee Ergonomics
- **"True Out-the-Door Price" Toggle:** Eliminates checkout fee shock by allowing diners to toggle upfront landed fees (`"Include Delivery & Service Fees in Upfront Estimates"`) directly on the discovery feed using a smooth tabular odometer roll.
- **Live Kitchen Load & Dish "Travel-Quality" Scores:** Live POS ticket velocity indicators (`"⚡ Kitchen Quiet • Prep in 12m"` vs. `"🔥 Peak Dinner Rush • +15m"`), alongside dish-specific **Travel-Ability Badges** (`"📦 Crispy Vented Packaging • Holds Heat 35m"`).
- **Brick-and-Mortar vs. Virtual Kitchen Provenance:** Transparent origin verification badges (`"🏛️ Verified Neighborhood Dining Room — Est. 2018"` vs. `"🍳 Delivery-Only Commissary Kitchen"`), with direct physical street view links and official health inspection scorecard (`"🛡️ Grade A • 99/100"`).
- **Personal Dietary & Craving Guardrail Lens:** Multi-select filter bar (`Gluten-Free Safe`, `Halal Certified`, `High-Protein >35g`, `Under 25 Mins`, `$0 Delivery Fee`, `Brick-and-Mortar Only`, `4.8+ Rated`) dynamically filtering and re-ranking dishes and kitchens.
- **Omnisearch Bar (⌘K / Ctrl+K):** Real-time matching for dishes, cuisines, and restaurants with keyboard shortcuts.

### 2. Interactive Modifier Matrices, Stock Safeguards & Customization
- **Nested Modifier Groups with Strict Validation:** Min/max selection validation where required modifier badges flip dynamically from amber `[ Required • Select 1 ]` to emerald `[ ✓ Completed ]` and auto-scroll to the next required section.
- **Pre-Authorized "If Sold Out" Substitution Rules:** 1-click fallback rule for every dish (`"Swap with Chef's Closest Match"`, `"Replace with Specific Dish"`, `"Refund This Item & Keep Order"`, or `"Cancel Entire Order"`), eliminating kitchen phone tag during rush hour.
- **Utensil, Condiment & Eco-Packaging Ledger:** Defaults to `"🌱 No Plastic Utensils"` with a celebratory eco-counter (`"You've saved 24 single-use packets to date"`), while supporting structured toggles for chopsticks, chili oil, and napkins.
- **Context-Aware Smart Pairings:** Recommends high-affinity side and beverage pairings (`"Ordered together 84% of the time"`).

### 3. Multiplayer Group Carts, Split-Bill Settlement & Bundle Windows
- **Live Multiplayer Group Room (`GRP-4920`):** Roommates, families, or coworkers join a synchronized group cart with shareable links, host-set per-person spending caps (`"Max $25/person"`), and auto-lock countdown timers.
- **Participant-Grouped Sub-Carts:** Line items clearly organized by participant (`You (Host)`, `Maya Lin`, `Alex Rivera`), showing individual modifiers and substitution rules.
- **Proportional Split-Bill vs. Host-Pays-All:** One-click settlement toggle allowing the host to pay unified or calculate exact proportional shares (dish subtotal + pro-rated delivery fee + service fee + courier tip) with zero penny leakage.
- **Free-Delivery Threshold Meter:** Visual animated emerald progress bar (`"Add $4.20 more to unlock $0 Delivery Fee"`).
- **Logistics Dispatch Tiers:** Choose between `⚡ Priority Direct (+$2.99)`, `🌿 Standard ($0.00)`, or `🌱 Eco-Saver (-$2.00 Discount — grouped with neighbor)`.

### 4. Real-Time Geospatial Order Tracking & Telemetry Cockpit
- **6-Stage Kitchen-to-Doorstep Telemetry Stepper:**
  1. `Order Accepted by POS` (6:18 PM)
  2. `Fired on Line` (6:21 PM)
  3. `Quality Checked & Sealed in Thermal Bag` (6:29 PM)
  4. `Marcus Picked Up & En Route` (6:31 PM)
  5. `Arriving at Curb (< 1 min)` (6:41 PM)
  6. `Delivered to Porch Door` (6:42 PM)
- **Interactive Leaflet WebGL Map with Smooth 60 FPS Courier Gliding:** Custom animated SVG courier scooter marker interpolating GPS coordinates along road polylines via `requestAnimationFrame`.
- **150-Meter Curbside Geofence Pulse:** Zooms smoothly into street level, activates emerald radar pulse around customer entrance, and fires curbside notification (`"🛵 Marcus is pulling up outside now"`).
- **Transparent Multi-Stop Route Waypoint:** Renders batched neighbor drops transparently (`"Completing 1 quick drop-off 4 blocks away • Your food is in a heated 148°F thermal bag • ETA 6:42 PM unchanged"`).
- **Drop-Off Concierge & Photo Proof:** Encrypted gate code vault (`"1492#"`), customer porch photo thumbnail, and post-delivery **Drop-Off Verification Photo Proof** of the sealed package at the door.
- **10-Minute Zero-Fee Nearby Bundle Window:** Live countdown clock allowing diners to add convenience items, drinks, or desserts along the courier's path at $0 extra delivery fee.
- **30-Second Automated Instant Make-Good:** Post-delivery self-serve dispute resolution allowing diners to select affected dishes, attach photos, and receive immediate wallet credit without waiting for support agents.

---

## 🛠️ Technology Stack & Architecture

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React, Canvas Confetti.
- **Geospatial & Mapping:** Leaflet Map Engine with CartoDB Voyager / OpenStreetMap vector tile layers, Haversine spherical distance (`ST_DistanceSphere` equivalent), ray-casting point-in-polygon containment (`ST_Contains`), and GPS road heading interpolation.
- **Financial Architecture:** Integer-cents financial precision (avoiding floating point precision drift) with mathematical remainder reconciliation in `priceCalculator.js`.
- **Database Schema:** Production-grade PostgreSQL / PostGIS schema in `supabase/schema.sql` including stored procedures `fn_validate_item_price` and `fn_filter_deliverable_restaurants`.
- **Testing:** Vitest test suite with 26 unit and boundary condition tests covering financial precision, modifier validation, split-bill math, edge cases, and PostGIS calculations.
- **Verification Record:** 26 / 26 Vitest unit & boundary tests passing across 3 test suites (`src/tests/`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Run Test Suite
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🧪 Verification Record

- **Test Suite:** 26 / 26 Vitest unit & boundary tests passing across 3 test files in `src/tests/`.
- **Linting:** 0 warnings and 0 errors across all 23 files via Oxlint.
- **Production Build:** Clean Rollup / Vite production bundle compiled into `dist/`.
