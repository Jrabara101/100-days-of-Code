# L’Atelier du Feu — Michelin-Grade Digital Hospitality Flagship

A modern, high-conversion Restaurant Website featuring an **Interactive Living Culinary Menu with Sub-Millisecond Dietary Intelligence**, **Spatial Architectural Table Reservation Engine**, **Relational Editorial Visual Gallery**, and **Reservation-Verified Diner Reviews**.

Built with **React 19**, **Vite**, **Tailwind CSS v4**, and a resilient **PostgreSQL / Supabase** relational backend architecture.

---

## 🌟 Key Architectural & Hospitality Features

### 1. Living Culinary Menu & Dietary Intelligence Engine ("Zero-PDF Ergonomics")
* **Service-Period & Tasting Switcher:** Seamlessly navigates across distinct culinary chapters:
  * `Evening À La Carte` (Wood-fired coastal cuisine & hearth plates)
  * `Chef's 7-Course Autumn Tasting ($145)` (Provenance journey by Chef Mateo Solís)
  * `Midday Service` (Pastas, crudos, wood-fired flatbreads)
  * `Aperitivo & Raw Bar` (Vermouth on tap, oysters & small plates)
  * `Sommelier Cellar & Zero-Proof` (Biodynamic natural wines & botanical ferments)
* **Sub-Millisecond Personal Allergen Guardrail Filter:** Multi-select guardrail chips (`🌾 Gluten-Free`, `🥜 Nut-Free`, `🥛 Dairy-Free`, `🌱 Vegan`, `🐟 Pescatarian`, `🥩 Halal`, `🧄 Allium-Free`). Rather than hiding dishes, the engine:
  * Highlights naturally safe dishes with botanical sage badges (`✓ Safe`).
  * Reveals explicit **Kitchen Modification Callouts** (e.g., *"✨ Can be prepared Gluten-Free using house-extruded rice pasta (+2 min prep)"*).
  * Softly dims incompatible items to 35% opacity with an allergen explanation.
* **One-Click Sommelier & Pairing Bridge:** Every entrée and tasting course includes an expandable Bordeaux-tinted pairing drawer detailing producer, vintage, region, price, and tasting metrics:
  * **Acidity:** (e.g. *High Tension / Crisp*)
  * **Minerality:** (e.g. *Crushed Limestone / Flint*)
  * **Body:** (e.g. *Medium-Plus / Silky*)
* **Live Kitchen Scarcity & 86'd Signals:** Displays real-time portion countdowns (e.g., *"🔥 Only 3 portions remaining tonight"* for Breton Turbot) and kitchen 86'd statuses synced via real-time broadcasts.

---

### 2. Spatial Table Reservation Engine & Pacing Concierge
* **Interactive Vector Architectural Floorplan Canvas:**
  * Scaled SVG blueprint rendering Chef's Counter (C1–C4), Main Dining Room banquettes & booths (T11–T14), Heated Olive Tree Courtyard (P1–P4), and Semi-Private Wine Vault (V1).
  * Color-coded availability: Emerald Glow (*Available*), Amber Outline (*5-Minute Slot Hold*), Muted Slate (*Occupied*).
  * **Table Sightline Photo Popover:** Hovering or tapping any table node illuminates the exact camera sightline from that seat, accompanied by real acoustic decibel ratings (`🔊 Conversational • ~64 dB`).
* **Ephemeral 5-Minute Slot Hold Timer:** When a guest selects a table, it is locked in a `held_5m` state for 300 seconds with an animated countdown (`04:48`) to prevent reservation sniping during checkout.
* **Hospitality Pre-Briefing:** Captures high-value guest preferences during booking:
  * **Special Occasion:** `🥂 Anniversary`, `🎂 Birthday`, `💼 Business Dinner`, `✨ Date Night`.
  * **Preferred Pacing:** `⚡ Pre-Theater (60m)`, `🍷 Standard (1h 45m)`, `🕯️ Unhurried Evening (2.5h)`.
  * **Pre-Linked Dietary Notes:** Automatically imports active menu filters into the kitchen pre-brief.
  * **Anti-No-Show Card Hold Policy:** $0 charged at booking; $25/person fee only if cancelled < 12h.
* **Tactile Perforated Digital Table Ticket:** Upon booking confirmation, the modal morphs into a perforated paper ticket featuring:
  * Host Stand Check-In QR Code
  * Confirmation Code (e.g. `RES-9482`)
  * Table & Seating Wave specifications
  * 1-Click **Add to Calendar (`.ics` download)**
  * 1-Click **Share Guest Invite** (copies formatted invitation to clipboard)

---

### 3. Relational Visual Gallery & Atmospheric Storytelling
* **Dish- & Table-Linked Interactive Hotspots:** Every photograph is relationally bound:
  * Food photos feature floating glass pills: `[ 🍽️ Dry-Aged Rohan Duck • $48 — View on Menu ↗ ]`
  * Architecture photos feature: `[ 📍 Heated Olive Courtyard • 68°F — Book This Space ↗ ]`
* **Dual-Atmosphere Theme Engine:**
  * **Daylight Mode:** Unbleached linen (`#FAF7F2`), warm espresso ink, sunlit daytime café energy.
  * **Candlelight Mode (Default):** Charred hearth obsidian (`#0D0C0B`), warm alabaster text, amber table candles.
  * Executed with a smooth 500ms CSS transition across all borders, typography, and backgrounds.

---

### 4. Reservation-Verified Diner Reviews
* **Verified Diner Provenance Badges:** Stamped with proof of visit (`"✓ Verified Reservation • Evening Service • Seated in Heated Courtyard"`).
* **Dimensional Hospitality Breakdown:** Scores across `Culinary Execution` (4.9), `Service Warmth` (4.9), `Pacing & Timing` (4.8), and `Ambience & Acoustics` (4.8).
* **Live Noise & Decibel Gauge:** Spectrum meter showing `Quiet (~52 dB)` → `[ ● Intimate & Conversational (~64 dB) ]` → `Lively (~74 dB)`.
* **Most-Mentioned Plates Cross-Linking:** Clickable chips for top-rated dishes (`Agnolotti del Plin`, `Breton Turbot`, `Basque Cheesecake`).

---

### 5. Host Stand Live Cockpit (`/admin/host`)
* Back-office staff view for floor managers and kitchen brigade:
  * **Floor Table Status:** Transition table states between `Available`, `Seated`, `Entrées Fired`, `Check Dropped`, and `Occupied`.
  * **Live 86'd Kitchen Matrix:** Stepper controls for remaining portions and 1-click 86'd toggles that broadcast to all active diner browsers.
  * **VIP Standby Waitlist Manager:** View waiting guests and simulate 15-minute SMS claim links.

---

## 🗄️ PostgreSQL / Supabase Schema Architecture

Located in `supabase/schema.sql`:
* **Zero-Double-Booking Temporal Exclusion Constraint:**
  ```sql
  ALTER TABLE reservations 
  ADD CONSTRAINT no_overlapping_reservations 
  EXCLUDE USING gist (
      table_id WITH =,
      tstzrange(reserved_start, reserved_end) WITH &&
  )
  WHERE (status IN ('held_5m', 'confirmed', 'seated'));
  ```
* **Strict Integer-Cents Pricing:** `price_cents BIGINT CHECK (price_cents >= 0)` eliminates floating-point rounding errors across cellars and deposits.
* **Dietary Tag Matrices:** PostgreSQl `TEXT[]` arrays with GIN indexing for sub-millisecond query evaluation.

---

## 🚀 Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```
