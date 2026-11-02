# Hollis Trust & Reviews Governance Engine

An institutional-grade product review, dimensional rating, and high-velocity moderation platform designed for high-trust e-commerce brands. Synthesizes the dimensional buyer clarity of Wirecutter and Sephora, the media-rich commerce storytelling of Yotpo/Okendo, and the keyboard moderation ergonomics of Linear.

---

## 🌟 Key Feature Matrix

### 1. Multi-Dimensional Ratings & "People Like Me" Buyer Context
* **Category-Adaptive Dimensional Sliders:** Moves beyond blunt 1–5 star averages by capturing category-specific fit and performance vectors:
  * **Pour-Over Kettle / Kitchenware:** `Pour control (4.9)`, `Heat retention (4.6)`, `Build quality (4.8)`, `Flow Dynamic: Calibrated Optimal`.
  * **Wool Coat / Apparel:** `Sizing: Runs Small (-2) ↔ True to Size (0) ↔ Runs Large (+2)`, `Fabric Weight (4.9)`, `Seam Durability (3.1)`.
* **"People Like Me" Contextual Filter & Variant Matching:** Prospective buyers can filter reviews by their exact profile or variant attributes (*"Show reviews from buyers who are 5'7"–5'10", ordered Size Medium in Espresso, or have Chemex setups"*), directly reducing product return rates.
* **Guided Smart Prompts (Anti-Blank-Page Composer):** Dynamic topic chips (*"How was the pour control?"*, *"Did the color match the photos?"*, *"How is the heat retention?"*) that illuminate with a green checkmark as the reviewer naturally addresses each point in live text.
* **Long-Term Ownership & Durability Updates:** Verified buyers can append a timestamped `[ ⏱ 6-Month Ownership Update ]` beneath their original review, creating unmatched longitudinal trust.

### 2. Shoppable Customer Media & Privacy-First Upload Pipeline
* **Variant-Tagged Photo & Video Unboxing Gallery:** Shoppers browse a visual grid of customer photos where every media card automatically tags the exact SKU purchased (`Ordered: Matte Black · 1 L`) with a 1-click `[ Quick View Variant ]` trigger.
* **Client-Side EXIF GPS Stripping & Compression:** Pure in-browser pipeline (`useExifStripper`) that scrubs sensitive geolocation (GPS coordinates), camera make/model, and device serial numbers from raw customer uploads before generating compressed WebP derivatives.
* **Split-Screen Lightbox:** Modal connecting customer unboxing photos to the exact review, verified order token, and product variant.
* **Clickable Sentiment Pills:** Clickable highlight phrases above the review feed (`[ "pour control" (312) ]`, `[ "gooseneck" (148) ]`, `[ "fast shipping" (64) ]`, `[ "lid fit" (21) ]`) that filter the review stream on click.

### 3. High-Velocity Admin Moderation Cockpit & Inline Redaction Studio
* **Keyboard-First Triage Queue (`J`/`K` Speed):** Split-pane moderation workspace segmented into smart priority queues:
  * `Triage Inbox (Needs Review / Flagged)`
  * `Needs Redaction (PII / Claims)`
  * `Media Blur (Label Exposure)`
  * `Low-Star Escalations (1–2 ★)`
  * `Fraud Hold / Bot Quarantine`
  * `Published (Live on Storefront)`
  * **Hotkeys:** `J`/`K` Navigate, `A` Approve, `E` Redact & Approve, `B` Open Blur Tool, `R` Reject with Policy Reason, `M` Brand Response Dock.
* **Inline PII, Profanity & Medical Claim Redactor:** Automatically detects sensitive tokens inside review text (phone numbers, email addresses, street addresses, competitor URLs, and unverified medical curing claims). Moderators can mask individual tokens or click `[ 🪄 Apply 3 Redactions & Approve ]` in one keystroke.
* **In-Browser Photo Privacy Blur Brush:** Interactive HTML5 Canvas tool where moderators drag a Gaussian blur box or pixelate brush over exposed addresses or faces on customer photos with 8 geometric resize handles and auto-detect centering.
* **Public Brand Response & Private Make-Good Bridge:** Post official studio replies (`Ana Ruiz · Head of Product Quality`) and trigger automated ERP make-goods (`Replacement Sent · #TRK-882193-FEDEX $0.00`, full refund, or store credit).

### 4. Anti-Astroturfing Guardrails, FTC Compliance & Defect Radar
* **Cryptographic Provenance Badges:**
  * `[ ✓ Verified buyer • Order #HG-8492 · Token #TX-8820-F ]`
  * `[ 🎁 Gifted / Incentivized Review — Disclosed FTC ]`
  * `[ 🔁 Repeat Buyer (4x Orders) ]`
  * `[ 🌐 Community Unverified ]`
* **Review-Bomb & Bot-Brigading Circuit Breaker:** Monitors submission velocity, IP subnet clustering (`198.51.100.0/24`), device fingerprint overlap (`dev_9f4a1`), and perceptual image hashes (`pHash #a8f2`). Includes a one-click **"Verified-Purchase Lockdown"** switch.
* **SKU Defect Early-Warning Radar:** Aggregates negative dimensional trends and keyword spikes per product variant (`⚠️ Alert: 4 reports in last 72h for 'Wool Coat · Charcoal L' mention 'seam torn' / LOT-441B`) and notifies the warehouse QA team.

---

## 🛠 Tech Stack & Architecture

- **Frontend:** React 18, Vite 6, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Typography & Aesthetics:** Inter & JetBrains Mono typography, Surface Container palette `#fbf9f1`, `#006948` primary green, strict hairline borders.
- **Database Schema:** PostgreSQL / Supabase migration script in `server/db/schema.sql` featuring Bayesian weighted score recalculation triggers (`(v / (v + m)) * R + (m / (v + m)) * C`), denormalized aggregate tables, and audit logs.
- **State & Store:** Reactive Context API with auto-synchronizing `localStorage` persistence and factory reset capability.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Vite Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173/` in your browser.

### 3. Production Build
```bash
npm run build
```

### 4. Optional Backend API Server
```bash
npm run server
```

---

## ⌨️ Moderation Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `J` | Next review in active queue |
| `K` | Previous review in active queue |
| `A` | Approve review as is |
| `E` | Apply pending redactions & approve |
| `B` | Open Photo Privacy Blur Tool |
| `R` | Reject review with policy reason |
| `M` | Expand brand response draft dock |
| `Esc` | Blur input / Close modal |

