# DISPATCH CORE | Omnichannel Order Management & Fulfillment Suite

An institutional-grade operational command center synthesizing the fulfillment precision of **Shopify Plus** and **Flexport**, the financial ledger clarity of **Stripe**, and the keyboard-driven triage speed of **Linear**.

---

## 🌟 Core Product Features

### 1. Intelligent Order Routing, Split-Fulfillment & Inventory Guardrails
- **Proximity & Margin-Aware Warehouse Allocation:** Dynamically assigns incoming orders to the optimal fulfillment node (`Austin-3PL`, `LA-West`, `NJ-East`) based on destination ZIP distance, stock availability, and lowest splits.
- **Interactive Split-Shipment Orchestrator:** Instantly partitions orders containing mixed in-stock and pre-order/backordered items into separate parcels (`Parcel A - Ship Immediately`, `Parcel B - Hold for Restock on Nov 12`), recalculating weights, separate carrier costs, and net margin impact in real time.
- **Customer "Edit-Before-Pick" 15-Minute Grace Window:** Holds new orders in a countdown grace state before releasing to the warehouse floor, allowing customer address updates or line item edits without warehouse cancellation fees.
- **Safety-Stock & Channel Reservation Locks:** Disaggregates `On-Hand`, `Committed/Reserved`, `Quality Quarantine`, and `Available to Sell (ATS)` across sales channels (`DTC Web`, `B2B Wholesale`, `Marketplace`, `POS`) to guarantee zero overselling.

### 2. Proactive Exception Triage, Address Healing & Fraud Hold Cockpit
- **1-Click USPS Address Healing:** Validates destination addresses against USPS CASS/DPV standards. Shows side-by-side diffs (e.g. normalizing abbreviations, appending ZIP+4 routing codes) and applies verified corrections in a single keystroke (`A`).
- **Carrier Transit Delay & SLA Breach Radar:** Monitors carrier tracking webhooks to flag stalled parcels (>48h of zero movement), enabling proactive CX credits and outreach before the customer asks *"Where is my order?"*.
- **Risk Velocity & Fraud Inspector:** Flags high-risk orders (proxy IPs, mismatched card/shipping countries, high-value first-time buyers) with full risk score telemetry while fast-tracking repeat VIP buyers.
- **Same-Day Dispatch SLA Horizon:** Real-time countdown clocks (`⏱ 01h 40m remaining to 4:00 PM EST Cutoff`) with dynamic urgency shifts (amber pulsing to crimson for breached SLAs).

### 3. High-Velocity Warehouse Scan-to-Pack & Carrier Rate Shopping
- **Full-Screen Tablet/Desktop Packing HUD:** Web Audio API sound synthesis produces electronic barcode beeps for matches, double buzzers for mismatched SKUs, and celebratory chimes on 100% packed.
- **Smart Corrugated Box Recommender:** Suggests the optimal carton (`Box #B2 • 12 × 9 × 4 in • 88% Volume Utilization`) based on volumetric weight calculations.
- **Live Multi-Carrier Rate Matcher:** Real-time commercial comparison across USPS, UPS, FedEx, and DHL. Highlights the **Margin-Optimal Carrier** that satisfies the promised delivery date at lowest cost (`💡 Saves $2.95 vs UPS`).
- **Thermal 4×6 ZPL/PDF Shipping Label Mockup:** Generates commercial labels complete with Code 128 barcodes, Postnet routing codes, tear-off slips, and direct printer execution.
- **Batch Wave Picking & Optimal Walking Path:** Groups single-item bestseller orders into consolidated pick waves with sorted aisle/bin walking paths (`Aisle 1 → Bin A02 → Aisle 2 → Bin B04`).

### 4. Frictionless Returns (RMA), Exchanges & Net Profit Ledger
- **Per-Order Real-Time Net Margin Waterfall:** Full integer-cents unit economics:
  $$\text{Gross Paid} - \text{Promo Discount} - \text{Landed COGS} - \text{Stripe Fee} - \text{Carrier Label} - \text{Pick/Pack Fee} = \text{True Net Profit}$$
- **Keep-the-Item Return Economizer:** Automatic detection when return shipping ($11.50) + restock exceeds item COGS ($8.00), recommending instant store credits to maximize recovery value.
- **Warehouse Dock Condition Grading:** Dock receiving controls (`Grade A: Pristine → Restock to ATS`, `Grade B: Open Box → Refurbish Queue`, `Grade C: Defective → Vendor Claim & Quarantine`).

---

## ⌨️ Linear-Speed Global Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `J` / `↓` | Navigate down through high-density order ledger |
| `K` / `↑` | Navigate up through high-density order ledger |
| `Space` / `↵` | Open Order 360° Inspector drawer |
| `P` | Open Scan-to-Pack Station or Buy optimal shipping label |
| `S` | Open interactive Split-Shipment Orchestrator |
| `A` | 1-Click Approve Hold / Accept USPS Address Match / Release Grace |
| `⌘K` / `Ctrl+K` | Global Omni-Command Palette (Orders, SKUs, Views) |
| `Esc` | Close any open drawer or modal dialog |
| `?` | Toggle Keyboard Shortcuts Cheatsheet |

---

## 🗄️ Database Architecture (PostgreSQL / Supabase)

The database schema (`supabase/migrations/20261031_order_management_schema.sql`) enforces:
1. **Integer-Cents Financial Precision (`BIGINT`):** Prevents IEEE-754 floating-point rounding errors on currency math.
2. **Atomic Inventory Reservation:** Uses `SELECT ... FOR UPDATE` row locks inside `reserve_inventory_atomic()` to eliminate overselling race conditions during flash sales.
3. **Generated ATS Columns:** `available_qty INT GENERATED ALWAYS AS (on_hand_qty - reserved_qty - quarantined_qty) STORED`.
4. **Automated Net Margin Trigger:** `trg_compute_net_margin` calculates true net margin on every order modification.

---

## 🚀 Getting Started

```bash
# Navigate to the project directory
cd "Order Management"

# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

