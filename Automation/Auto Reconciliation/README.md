# Enterprise Automated Financial & Multi-Source Reconciliation Engine

A high-performance, deterministic financial automation subsystem implemented in **PHP CLI** with **SQLite persistence**, multi-tier rule matching, fuzzy memo heuristics, automated break classification, manual exception resolution workflows, and tamper-evident **SHA-256 compliance audit trails**.

---

## 🏗️ Architectural Overview & Design Principles

```
   ┌──────────────────────────────┐        ┌──────────────────────────────┐
   │    INTERNAL GENERAL LEDGER   │        │     EXTERNAL SETTLEMENT      │
   │   (Core DB / ERP Ingestion)  │        │ (Bank Feed / Stripe / Gateway)│
   └──────────────┬───────────────┘        └──────────────┬───────────────┘
                  │                                       │
                  └───────────────────┬───────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ MULTI-TIER MATCHING ENGINE│
                        │ - Tier 1: Exact Reference │
                        │ - Tier 2: Fuzzy Memo/Ref  │
                        │ - Tier 3: Fee Tolerance   │
                        │ - Tier 4: Discrepancy Cls │
                        └─────────────┬─────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │      MATCHED RECORDS      │             │  BREAKS & DISCREPANCIES   │
   │  (Zero-Variance / Auto)   │             │ (Amount / Missing / Date) │
   └─────────────┬─────────────┘             └─────────────┬─────────────┘
                 │                                         │
                 │                                         ▼
                 │                           ┌───────────────────────────┐
                 │                           │ MANUAL RESOLUTION & AUDIT │
                 │                           │ (Force Match / Write-Off) │
                 │                           └─────────────┬─────────────┘
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      ▼
                        ┌───────────────────────────┐
                        │  SHA-256 AUDIT LOG VAULT  │
                        │ (Cryptographic Integrity) │
                        └───────────────────────────┘
```

---

## ⚙️ Multi-Tier Matching Engine & Reasoning Logic

### 1. Tier 1: Exact Reference & Amount Matching
- Matches transactions where internal invoice/transaction code directly matches external statement reference (or occurs as an exact substring in raw memo text).
- Enforces exact amount equality:
  $$| \text{internal\_amount} - \text{external\_amount} | < 0.001$$
- Enforces value date clearing window ($\Delta t \le \text{window\_days}$, default 4 days).

### 2. Tier 2: Fuzzy Memo / Normalized Token Heuristics
- Normalizes punctuation, whitespace, and alphanumeric tokens from descriptions.
- Computes Jaccard/token similarity intersection:
  $$\text{Similarity}(S_1, S_2) = \frac{| T(S_1) \cap T(S_2) |}{\max(|T(S_1)|, |T(S_2)|)}$$
- Successfully links merchant payouts, wire transfers, and gateway summaries where transaction references are formatted with dynamic prefixes (e.g. `FEDWIRE INBOUND STARK IND TXN-WIR-2002`).

### 3. Tier 3: Tolerance & Payment Gateway Fee Absorption
- Automatically detects and absorbs micro-variances (e.g., gateway merchant fees, foreign exchange rounding discrepancies $\le \$0.50$).
- Deducts and categorizes fee variances into dedicated discrepancy tracking without blocking the reconciliation workflow.

### 4. Tier 4: Discrepancy Classification & Break Engine
Unmatched transactions are automatically categorized into actionable operational buckets:
- `UNMATCHED_INTERNAL`: Ledger entries without cleared external bank statement lines (uncleared checks, in-flight ACH transfers).
- `UNMATCHED_EXTERNAL`: Statement charges missing internal ledger bookings (unrecognized bank maintenance fees, dispute chargebacks).
- `AMOUNT_MISMATCH`: Matching reference detected, but the settled amount deviates beyond allowable tolerance limits.

### 5. Tamper-Evident SHA-256 Audit Trail
Every ingestion, automated match, tolerance absorption, manual exception override, and write-off generates an immutable cryptographic signature for SOX / regulatory compliance:
$$H = \text{SHA-256}(\text{record\_type} \mathbin{\Vert} \text{record\_id} \mathbin{\Vert} \text{action} \mathbin{\Vert} \text{prev\_state} \mathbin{\Vert} \text{new\_state} \mathbin{\Vert} \text{payload} \mathbin{\Vert} \text{timestamp})$$

### 6. ANSI Terminal Layout Normalization
The TUI layout engine strips ANSI terminal escape sequences via regular expressions before computing character display lengths, ensuring perfect table borders, zero-drift columns, and crisp formatting.

---

## 🚀 Execution Instructions

### Prerequisites
- PHP 8.1+ CLI runtime
- `ext-pdo` and `ext-pdo_sqlite` extensions enabled

### Execution Modes

#### 1. Interactive Control Panel
```bash
php reconciliation_engine.php
```
Launches the full interactive terminal operations console with dashboards, break investigators, manual override wizards, and cryptographic ledger viewers.

#### 2. Quick Sample Batch Run
```bash
php reconciliation_engine.php --run-sample
```
Re-seeds realistic baseline datasets and performs an immediate automated multi-tier reconciliation run.

#### 3. Headless Cron Batch Dispatcher
```bash
php reconciliation_engine.php --cron
```
Runs a single automated sweep over all pending transactions, outputs structured execution metrics, and exits. Ideal for crontab scheduling:
```crontab
0 * * * * /usr/bin/php /path/to/reconciliation_engine.php --cron >> /var/log/reconciliation_cron.log 2>&1
```

#### 4. Continuous Real-Time Ingestion Daemon
```bash
php reconciliation_engine.php --daemon
```
Runs a persistent background worker listening for new transaction streams and executing periodic reconciliation cycles.

---

## 📊 Pre-Seeded Baseline Data Scenarios

| Internal Code | Description | Internal Amount | External Match Ref | External Amount | Settlement / Match Result |
|---|---|---|---|---|---|
| `TXN-INV-1001` | Acme Corp SaaS License | `$4,500.00` | `BANK-TXN-INV-1001` | `$4,500.00` | **Tier 1: Exact Match** |
| `TXN-SUB-1002` | Globex Monthly Pro | `$299.00` | `STRIPE-SUB-1002` | `$299.00` | **Tier 1: Exact Match** |
| `TXN-PAY-1003` | AWS Infrastructure | `-$1,850.50` | `BANK-PAY-1003` | `-$1,850.50` | **Tier 1: Exact Match** |
| `TXN-INV-1004` | Initech Retainer | `$12,450.00` | `BANK-INV-1004` | `$12,450.00` | **Tier 1: Exact Match** |
| `TXN-REF-1005` | Customer Refund | `-$150.00` | `BANK-REF-1005` | `-$150.00` | **Tier 1: Exact Match** |
| `TXN-STR-2001` | Stripe Checkout Payout | `$850.00` | `EXT-STR-2001` | `$850.00` | **Tier 2: Fuzzy Token Match** |
| `TXN-WIR-2002` | Stark Industries Wire | `$7,200.00` | `WIRE-STARK-2002` | `$7,200.00` | **Tier 2: Fuzzy Memo Match** |
| `TXN-FEE-3001` | Merchant Batch Deposit | `$1,000.00` | `GATEWAY-FEE-3001` | `$999.65` | **Tier 3: Fee Tolerance ($0.35)** |
| `TXN-MIS-4001` | Equipment Purchase | `$3,200.00` | `BANK-MIS-4001` | `$3,250.00` | **Tier 4: Amount Mismatch Break** |
| `TXN-UNC-5001` | Vendor Legal Check | `$5,800.00` | *(None)* | *N/A* | **Break: Unmatched Internal** |
| `BANK-FEE-9901`| *(None)* | *N/A* | `BANK-FEE-9901` | `-$45.00` | **Break: Unmatched External Fee** |

---

## 🧪 Testing & Verification Guide

1. **Execute Sample Pipeline**:
   ```bash
   php reconciliation_engine.php --run-sample
   ```
2. **Launch Interactive Console**:
   ```bash
   php reconciliation_engine.php
   ```
3. **Investigate & Resolve Exceptions (Option 3)**:
   - Select Option 3 to inspect open breaks.
   - Choose `[1]` to write off the bank maintenance fee (`BANK-FEE-9901`).
   - Choose `[2]` to perform an audited manual match override on `TXN-MIS-4001`.
4. **Audit Cryptographic Signatures (Option 6)**:
   - Review SHA-256 audit ledger records confirming immutable state transitions.
