# Enterprise Loan Origination & Underwriting Engine

A mission-critical, enterprise-grade loan origination and automated credit underwriting CLI platform written in PHP 8.x with SQLite isolation, deterministic state transitions, actuarial debt-to-income (DTI) calculations, double-entry treasury liquidity locking, and immutable SHA-256 cryptographic audit logs.

---

## 🏛 Architectural Overview

```
┌─────────────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────────────┐
│   BORROWER & LOAN INTAKE    │ ───► │  UNDERWRITING & DTI ENGINE  │ ───► │ DISBURSEMENT & AMORTIZATION │
│   (FICO, Income, Debts)     │      │  (Auto-Approve / SIU Desk)  │      │ (Treasury Capital Lock)     │
└─────────────────────────────┘      └─────────────────────────────┘      └─────────────────────────────┘
```

---

## 📐 Actuarial & Financial Formulas

### 1. Fixed Monthly Installment & Amortization
Given Principal ($P$), Annual Percentage Rate ($\text{APR}$), monthly interest rate ($r = \frac{\text{APR}}{1200}$), and tenure in months ($n$):

$$M = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$

### 2. Post-Loan Debt-To-Income (DTI)
$$\text{Gross Monthly Income} = \frac{\text{Annual Income}}{12}$$

$$\text{DTI} = \left(\frac{\text{Existing Monthly Debt} + M}{\text{Gross Monthly Income}}\right) \times 100$$

### 3. Credit Risk Tiering Matrix
* **Prime Tier (Auto-Approved):** $\text{DTI} \le 35\%$ AND $\text{FICO} \ge 720$ $\longrightarrow$ Lowest APR Tier ($6.75\% - 8.95\%$).
* **Borderline Tier (Manual Underwriter Review):** $35\% < \text{DTI} \le 45\%$ OR $\text{FICO } 640 - 719$ $\longrightarrow$ Escalated to Credit Committee Review Desk.
* **Hard Decline Tier:** $\text{DTI} > 45\%$ OR $\text{FICO} < 600$ $\longrightarrow$ Instant adverse action log.

### 4. Treasury Reserve Double-Entry Capital Lock
Atomic conditional deduction prevents over-allocation and race conditions:

$$\text{UPDATE treasury\_reserves SET available\_capital} = \text{available\_capital} - P \text{ WHERE available\_capital} \ge P$$

### 5. Cryptographic SHA-256 Audit Seal
Each lifecycle state transition generates an immutable cryptographic signature payload:

$$H = \text{SHA-256}(\text{loan\_id} \mathbin{\Vert} \text{actor} \mathbin{\Vert} \text{action} \mathbin{\Vert} \text{prev\_status} \mathbin{\Vert} \text{new\_status} \mathbin{\Vert} \text{microtime})$$

---

## 📁 Database Schema (`loan_vault.sqlite`)

* `treasury_reserves`: Tracks available liquidity capital pool ($5,000,000 baseline) and cumulative disbursements.
* `borrowers`: Central registry of verified borrower demographics, annual income, existing liabilities, and FICO credit scores.
* `loan_applications`: Master application registry with dynamic APR, monthly installments, DTI ratios, underwriting notes, and state machine lifecycle.
* `amortization_schedules`: Month-by-month principal, interest, and residual balance breakdown.
* `loan_audit_logs`: Append-only tamper-evident audit ledger with SHA-256 signature hashes.

---

## 🚀 Execution & Usage Guide

### Prerequisites
* PHP 8.1+ CLI runtime
* Extensions enabled: `pdo`, `pdo_sqlite`

### 1. Interactive Underwriter Console Workspace
Launch the full interactive TUI workspace:

```bash
php loan_workflow_engine.php
```

#### Menu Options:
1. **Ingest New Loan Application**: Wizard to register new applications against borrower profiles.
2. **Run Automated Underwriting & Actuarial DTI Engine**: Evaluates applications via actuarial formulas and risk matrices.
3. **Credit Committee Manual Review Desk**: Interface for human underwriters to review borderline applications (`MANUAL_REVIEW`).
4. **Disburse Approved Loan Funds**: Executes atomic capital reservation and deduction from treasury liquidity vault.
5. **Inspect Loan Disclosure & Amortization Schedule**: Displays month-by-month payment schedules and APR disclosures.
6. **View Master Loan Applications Registry**: Overview table with ANSI-colored status badges and DTI visual gauge bars.
7. **Audit Cryptographic SHA-256 Decision Trail**: Inspects tamper-evident audit chain of custody for any application ID.

### 2. Headless Batch Underwriting Daemon Mode
For background workers, cron jobs, and high-throughput ingestion pipelines:

```bash
php loan_workflow_engine.php --process
```
