# Multi-Tenant SaaS Recurring & Metered Billing Engine

An enterprise financial subsystem for recurring subscription settlement, metered consumption overage aggregation, pessimistic transaction locking, and automated dunning state machine management built on Laravel 11/12 & PHP 8.4+.

---

## 🏗️ Architectural Foundations & Domain Safeguards

```
   ┌───────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────────────┐
   │ TENANT CYCLE SELECTION│ ───► │ PESSIMISTIC LOCK & USAGE    │ ───► │ INVOICE & GATEWAY COMMIT    │
   │ (Billing Anchor Match)│      │ (Base Fee + Metered Overage)│      │ (Atomic Ledger & Dunning)   │
   └───────────────────────┘      └─────────────────────────────┘      └─────────────────────────────┘
```

### 1. Integer-Centric Minor Unit Accounting
All monetary values (base prices, tier caps, unit rates, subtotal, taxes, and final payment amounts) are stored and computed strictly as integers in minor units / cents (e.g., $\$49.00 \to 4900$). This eliminates IEEE 754 binary floating-point rounding errors and precision drift.

### 2. Deterministic Idempotency Key Hashes
Before persisting an invoice or charging a gateway, the engine computes a deterministic SHA-256 hash for the tenant's exact billing window:
$$\text{Idempotency Key} = \text{SHA-256}(\text{tenant\_id} \mathbin{\Vert} \text{subscription\_id} \mathbin{\Vert} \text{period\_start} \mathbin{\Vert} \text{period\_end})$$
A unique database constraint guarantees that re-running commands, worker retries, or server crashes cannot double-invoice a tenant for the same cycle.

### 3. Pessimistic Concurrency Locking (`lockForUpdate()`)
When processing a tenant's billing cycle, the engine acquires an exclusive row lock on the subscription and tenant within an isolated database transaction (`DB::transaction`). Concurrent background workers and web requests cannot execute simultaneous billing evaluations.

### 4. Metered Tier Aggregation Engine
Consumption metrics (e.g., API requests) recorded in `usage_records` during $[T_{\text{start}}, T_{\text{end}})$ are aggregated. If total consumption exceeds the plan's included quota, overage tiers are computed and appended as line items:
$$\text{Overage Fee} = \left\lceil \frac{\max(0, \text{Usage} - \text{Quota})}{1000} \right\rceil \times \text{Rate}_{\text{per 1k}}$$

### 5. Dunning State Machine with Retry Escalation
Payment failures do not abruptly terminate access. Subscriptions transition through a structured dunning lifecycle:
$$\text{ACTIVE} \longrightarrow \text{PAST\_DUE (Attempt 1/3)} \longrightarrow \text{PAST\_DUE (Attempt 2/3)} \longrightarrow \text{SUSPENDED (Grace Expired)}$$

```
                  ┌──────────────────────┐
                  │        ACTIVE        │
                  └──────────┬───────────┘
                             │ (Gateway Decline)
                             ▼
                  ┌──────────────────────┐
                  │       PAST_DUE       │ ◄─── (Retry 2/3)
                  │     (Attempt 1/3)    │
                  └──────────┬───────────┘
                             │ (Attempt 3 Decline)
                             ▼
                  ┌──────────────────────┐
                  │      SUSPENDED       │
                  │   (Access Revoked)   │
                  └──────────────────────┘
```

---

## 📁 File Structure

```
Automation/SaaS tenant billing automation/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       └── ProcessTenantBillingCommand.php  # CLI runner with Termwind rendering
│   ├── Models/
│   │   ├── Invoice.php                          # Invoice ledger model
│   │   ├── InvoiceItem.php                      # Line item model
│   │   ├── Plan.php                             # Subscription plan definition
│   │   ├── Subscription.php                     # Tenant subscription state
│   │   ├── Tenant.php                           # Tenant account model
│   │   └── UsageRecord.php                      # Metered consumption events
│   └── Services/
│       └── Billing/
│           └── TenantBillingService.php         # Atomic billing calculation & dunning engine
├── database/
│   ├── migrations/
│   │   └── 2026_01_01_000001_create_saas_billing_schema.php
│   └── seeders/
│       ├── BillingDemoSeeder.php                # Demo scenarios (Clean + Overage, Heavy, Dunning)
│       └── DatabaseSeeder.php
├── routes/
│   └── console.php                              # Nightly scheduled task registration
├── tests/
│   ├── Feature/
│   │   └── TenantBillingTest.php                # End-to-end billing & dunning tests
│   └── Unit/
│       └── TenantBillingServiceTest.php         # Unit tests for interval calculations & limits
└── README.md
```

---

## 📊 Database Schema Overview

| Table | Purpose | Key Columns |
|---|---|---|
| `tenants` | Customer / Tenant accounts | `name`, `email`, `currency`, `status`, `payment_method_token` |
| `plans` | Subscription tiers | `code`, `name`, `base_price_cents`, `included_api_calls`, `overage_rate_cents_per_thousand` |
| `subscriptions` | Active tenant plans & periods | `tenant_id`, `plan_id`, `status`, `current_period_start`, `current_period_end`, `failed_payment_attempts` |
| `usage_records` | Granular consumption telemetry | `tenant_id`, `metric_name`, `quantity`, `recorded_at`, `is_billed`, `invoice_id` |
| `invoices` | Immutable billing ledger | `tenant_id`, `subscription_id`, `invoice_number`, `idempotency_hash`, `subtotal_cents`, `tax_cents`, `total_cents`, `status` |
| `invoice_items` | Itemized invoice breakdown | `invoice_id`, `description`, `unit_price_cents`, `quantity`, `total_cents` |

---

## 🚀 Execution & Verification

### 1. Database Setup & Seeding
Reset the database schema and populate realistic test scenarios:
```bash
php artisan migrate:fresh --seed
```

The seeder provisions three tenant profiles:
1. **Acme Cloud Systems**: Growth Plan ($99.00) + 15,000 calls (5,000 over quota @ $2/1k = +$10.00). Total: **$117.72** (includes 8% tax) -> **PAID**.
2. **Cyberdyne Research Labs**: Scale Enterprise Plan ($499.00) + 42,000 calls (within 50,000 quota). Total: **$538.92** -> **PAID**.
3. **Stark Aeronautics**: Growth Plan + declining payment method token (`pm_fail_insufficient_funds`). Total: **$106.92** -> **FAILED** (transitions to `PAST_DUE` attempt 1/3).

---

### 2. Dry-Run Simulation
Simulate calculations without mutating database state, updating periods, or charging cards:
```bash
php artisan billing:tenant-cycle --dry-run
```

---

### 3. Live Settlement Run
Execute atomic transactions, persist invoices, mark usage records billed, advance period anchors, and progress dunning states:
```bash
php artisan billing:tenant-cycle
```

#### Output Example:
```
  ⚡ SAAS MULTI-TENANT RECURRING BILLING ENGINE   LIVE PRODUCTION SETTLEMENT
  Target Execution Anchor: Aug 29, 2026 | Engine: Strict Minor-Units / Pessimistic Locking

+-------------------------+-------------------+--------------+-----------------+-------------------+
| Tenant Profile          | Invoice Ref       | Total Billed | Metered Overage | Settlement Status |
+-------------------------+-------------------+--------------+-----------------+-------------------+
| Acme Cloud Systems      | INV-202608-IPIMFS | $117.72      | +$10.00         | ✔ PAID            |
| Cyberdyne Research Labs | INV-202608-UIK45A | $538.92      | $0.00           | ✔ PAID            |
| Stark Aeronautics       | INV-202608-SDDQPH | $106.92      | $0.00           | ✖ FAILED          |
+-------------------------+-------------------+--------------+-----------------+-------------------+

 📊 RECONCILIATION SUMMARY
 Total Invoices Evaluated:     3
 Gross Settlement Volume:      $656.64
 Metered Overages Captured:    $10.00
 Dunning / Collection Failures: 1
```

---

### 4. Running the Automated Test Suite
Execute the automated test suite covering overage math, ceiling calculations, tax computation, idempotency collision guards, simulation dry-runs, and dunning progression:
```bash
php artisan test
```

---

### 5. Automated Nightly Schedule
Registered in `routes/console.php`:
```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('billing:tenant-cycle --force')
    ->dailyAt('00:05')
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
```
