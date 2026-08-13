# Enterprise Payroll Processing Pipeline (PHP CLI)

A mission-critical enterprise financial subsystem built in PHP CLI. Designed with deterministic state machine transitions, SQLite transactional locks, fixed-precision arithmetic, composite database unique indexes for idempotency, SHA-256 compliance audit trails, and ANSI terminal rendering normalization.

---

## 🏗️ Architectural Overview & Design Principles

```
   ┌────────────────┐      ┌────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
   │  DRAFT STAGE   │ ───► │  CALCULATED STAGE  │ ───► │ AUDITED_APPROVED STAGE  │ ───► │ DISPATCHED_PAID STAGE   │
   │ (Run Initiated)│      │(Paystubs Computed) │      │  (Manager Compliance)   │      │ (Direct Deposit Issued) │
   └────────────────┘      └────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### 1. Deterministic Multi-Stage State Machine
Payroll processing follows a strictly non-reversible linear transition path:
$$\text{DRAFT} \longrightarrow \text{CALCULATED} \longrightarrow \text{AUDITED\_APPROVED} \longrightarrow \text{DISPATCHED\_PAID}$$
State skipping (e.g. attempting to dispatch funds before manager audit approval) or backward mutations are rejected at the domain boundary.

### 2. Idempotent Disbursement Guard
To prevent double payments during network retries or process restarts, duplicate paystub insertions are enforced at the database kernel level:
$$\text{UNIQUE INDEX } \text{idx\_run\_emp} \text{ ON } \text{paystubs}(\text{payroll\_run\_id}, \text{employee\_id})$$
If a process crashes mid-execution and restarts, SQLite rejects duplicate paystub records, ensuring complete idempotent calculation.

### 3. Semi-Monthly Precision Tax & Deduction Engine
Calculations utilize 24 annual pay periods with exact fixed-precision rounding to eliminate floating-point drift:
* **Base Gross Pay**: $\text{round}\left(\frac{\text{Annual Salary}}{24}, 2\right)$
* **Statutory Tax**: $\text{round}\left(\text{Base Gross} \times \frac{\text{Tax Rate \%}}{100}, 2\right)$
* **Benefits Deduction**: $\text{round}\left(\frac{\text{Monthly Benefits}}{2}, 2\right)$
* **Net Pay**: $\text{Base Gross} - \text{Tax Deduction} - \text{Benefits Deduction}$

### 4. Atomic Transaction Boundaries & Cryptographic Audit Seals
All state operations run inside explicit PDO transactions (`BEGIN TRANSACTION`). Upon every state transition, an immutable log entry with a cryptographically binding SHA-256 audit signature is written to the compliance ledger:
$$H = \text{SHA-256}(\text{run\_id} \mathbin{\Vert} \text{actor} \mathbin{\Vert} \text{action} \mathbin{\Vert} \text{prev\_status} \mathbin{\Vert} \text{new\_status} \mathbin{\Vert} \text{net\_total} \mathbin{\Vert} \text{timestamp})$$

### 5. ANSI Terminal Layout Normalization
The CLI UI engine uses regex pattern matching (`preg_replace`) to strip ANSI styling byte codes prior to calculating string lengths for tabular alignment:
```php
$cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)$content);
```

---

## 📁 File Structure

* `payroll_pipeline.php` - Single-file PHP CLI interactive console & headless batch processing daemon.
* `payroll_vault.sqlite` - SQLite storage containing tables for `employees`, `payroll_runs`, `paystubs`, and `payroll_audit_logs`.

---

## 🚀 Execution Instructions

### Prerequisites
* **PHP**: 8.0+ CLI runtime
* **Extensions**: `pdo`, `pdo_sqlite`

### Interactive TUI Console
Launch the interactive terminal operations console:
```bash
php payroll_pipeline.php
```

#### Menu Routes:
1. **Calculate Paystubs for Draft Payroll Run** — Computes gross, tax, benefits, and net pay for all active employees.
2. **Approve & Audit Calculated Payroll Run** — Audits calculated totals and locks the run into `AUDITED_APPROVED`.
3. **Dispatch Direct Deposit Disbursements** — Dispatches funds and updates paystub and run statuses to `DISPATCHED_PAID`.
4. **View Global Payroll Runs Registry** — Tabular summary of all payroll runs.
5. **Inspect Individual Employee Paystubs** — Detailed per-employee payroll breakdown.
6. **Audit Compliance Trail & SHA-256 Hashes** — Chronological audit trail showing state transitions and SHA-256 signatures.

### Automated Headless / Cron Mode
Run headless batch processing for automated schedulers:
```bash
php payroll_pipeline.php --process
```

#### Example Crontab Configuration
```cron
# Run payroll pipeline at midnight on semi-monthly pay dates (1st and 15th)
0 0 1,15 * * /usr/bin/php /var/www/html/scripts/payroll_pipeline.php --process >> /var/log/payroll_cron.log 2>&1
```
