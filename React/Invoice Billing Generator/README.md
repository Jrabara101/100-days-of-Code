# LedgerCraft • Modern Invoice, Billing & Multi-Rail Settlement Suite

> Precision FinTech minimalism meets tactile editorial stationery. Engineered with React 19, Vite, Tailwind CSS, TypeScript, and a resilient multi-rail backend architecture (Node.js / Supabase / PostgreSQL).

---

## 🌟 Key Product Highlights & Value Proposition

Traditional invoicing platforms burden freelancers, agencies, and B2B SaaS teams with static PDF attachments, opaque payment statuses, awkward manual follow-up emails, high 2.9%–3.5% gateway processing fees eroding margins, and fragmented reconciliation across Stripe and PayPal.

**LedgerCraft** transforms billing into an interactive, high-trust settlement experience:
1. **Interactive WYSIWYG Invoice Studio & Dynamic Client Proposals**
   * **Live Split-Screen Paper Canvas:** Real-time tactile preview rendering invoices as high-craft digital stationery with multi-currency (`USD`, `EUR`, `GBP`, `CAD`), dynamic tax calculations, line-item/subtotal discounts, and scannable payment QR codes.
   * **Interactive Client Add-Ons & Upsells:** Clients viewing the hosted portal can toggle optional line items (e.g., *"+ $400 Priority 48h Delivery"* or *"+ $250 Maintenance Retainer"*) with instantaneous recalculation.
   * **Milestone Payments:** Support for **50% Upfront Milestone Deposit** vs. **100% Full Balance** with automated 2% early settlement discount.
   * **One-Click Quote-to-Invoice Conversion:** Interactive proposals that atomically convert to active invoices the moment the client provides an electronic signature.
   * **Unbilled Hours & Expense Pull-In:** 1-click import of billable time entries and reimbursable expenses with deliverable/receipt links.

2. **Unified Multi-Rail Checkout Gateway (Stripe + PayPal Orchestration)**
   * **Single-Link Omni-Channel Settlement (`/pay/:invoice_token`):** Distraction-free, mobile-optimized client payment portal.
   * **Stripe Financial Connections US ACH Direct Debit ($0 Fee):** Nudges enterprise clients toward zero-fee bank debits, capping processing fees at $5 max instead of 2.9%–3.5%.
   * **Stripe Cards, Apple Pay & Google Pay:** Native Stripe Payment Element aesthetic with Express Checkout.
   * **PayPal Commerce & Smart Buttons:** Official PayPal button styling, PayPal Pay Later (4 bi-weekly interest-free installments), and Venmo.
   * **Cross-Gateway Mutual Exclusion Lock:** When an ACH transfer enters processing or card payment succeeds via Stripe, open PayPal orders are invalidated so clients can never double-pay.

3. **"Zero-Awkwardness" Smart Dunning, View Telemetry & Late-Fee Guardrails**
   * **Real-Time Client Engagement Radar:** "Read receipts for billing" logging email opens, live portal views, and PDF downloads with client email and location.
   * **Automated Dunning Cadence (4-Stage Sequence):** Gentle Heads-Up (3d before due) → Due Date Notice → Firm Follow-Up (7d overdue) → Final Notice.
   * **Dunning Auto-Pause Safeguard:** Sequences auto-pause the instant an ACH transfer enters processing or a payment clears.
   * **Contractual Late-Fee Accrual & Courtesy Waivers:** Automatic $50 flat fee or 1.5% interest accrual after a 5-day grace period, paired with a 1-click courtesy waiver.

4. **Net-Revenue Reconciliation, Tax Readiness & Tamper-Evident Receipts**
   * **True Net-to-Bank Ledger:** Visual waterfall decomposing every settled invoice into Gross Billed, Gateway Processing Fee, Tax Reserved, and Net Deposited to Mercury Checking.
   * **One-Click Credit Notes & Reversals:** Generates sequential Credit Notes (`CN-2026-xxx`) upon refund.
   * **Cryptographic "PAID" Stamp Slam:** Spring-bounce vector watermark with transaction hash and downloadable tamper-evident receipt.

---

## 🏗️ Technical Architecture

### Tech Stack
* **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons, Canvas Confetti, QRCode.react.
* **Payment SDKs:** `@stripe/stripe-js`, `@stripe/react-stripe-js`, `@paypal/react-paypal-js`.
* **Backend:** Node.js, Express, CORS, Crypto (Webhook Signature Verification).
* **Database / Ledger:** PostgreSQL / Supabase schema with strict integer-cents arithmetic (`BIGINT`) and basis points (`100 bps = 1.00%`).

### Directory Layout
```
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── Badge.tsx               # High-craft FinTech status pills
│   │   ├── dashboard/
│   │   │   ├── SidebarNav.tsx           # 240px navigation rail with gateway health
│   │   │   ├── MetricHorizonRibbon.tsx  # 4-card cashflow & aging horizon bar
│   │   │   ├── InvoiceLedgerTable.tsx   # 40px high-density ledger with filter facets
│   │   │   ├── ClientsDirectory.tsx     # Client profiles & VAT numbers
│   │   │   ├── QuotesProposalsView.tsx  # Interactive proposals & signing
│   │   │   ├── PayoutsAndFeesView.tsx   # True net-to-bank ledger & fee comparison
│   │   │   ├── DunningRulesView.tsx     # 4-stage dunning cadence & late fee settings
│   │   │   └── RevenueCommandDashboard.tsx
│   │   ├── studio/
│   │   │   ├── InvoiceStudioEditor.tsx  # Split-screen WYSIWYG composer
│   │   │   ├── InvoiceStationeryPaper.tsx # 1:1 paper canvas with QR & stamps
│   │   │   └── UnbilledTimeExpenseModal.tsx # Pull-in modal for hours & expenses
│   │   ├── portal/
│   │   │   ├── HostedClientPortal.tsx   # Public zero-login payment page
│   │   │   ├── AchBankTransferDock.tsx  # Stripe ACH direct debit with bank picker
│   │   │   ├── StripeCheckoutDock.tsx   # Stripe Elements & Apple Pay dock
│   │   │   └── PayPalCheckoutDock.tsx   # PayPal Smart Buttons & Pay Later
│   │   └── inspector/
│   │       └── SettlementAndWebhookInspector.tsx # Waterfall & telemetry drawer
│   ├── data/
│   │   └── mockData.ts                 # Pre-populated clients, invoices, & telemetry
│   ├── services/
│   │   └── api.ts                      # Resilient storage, calculation, & mock API
│   ├── types/
│   │   └── index.ts                    # Complete domain types & schemas
│   ├── utils/
│   │   └── currency.ts                 # Integer-cents financial math
│   ├── App.tsx                         # View router and state coordinator
│   └── main.tsx
├── server/
│   └── index.js                        # Idempotent webhooks & mutual exclusion locks
├── supabase/
│   └── schema.sql                      # PostgreSQL DDL with integer arithmetic
├── tailwind.config.js                  # FinTech design tokens & animations
└── package.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Frontend Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Backend Server (Optional / Webhooks)
```bash
node server/index.js
```
Runs the Express API on port `3001` with `/api/webhooks/stripe` and `/api/webhooks/paypal`.

---

## 💳 Keyboard Shortcuts
* `⌘I` / `Ctrl+I`: Open New Invoice / Quote Studio from anywhere in the app.
