# Enterprise Insurance Claim Workflow & Adjudication Engine

An enterprise-grade insurance claim engine built around a **Deterministic Multi-Stage State Machine**, **Actuarial Coverage Limit & Deductible Calculation**, **Heuristic Fraud Scoring Accumulation**, and an **Immutable Cryptographic Audit Trail**.

---

## 🏛️ Architectural Overview

```
   ┌───────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────────────┐
   │ CLAIM INTAKE & POLICY │ ───► │ ADJUDICATION & FRAUD ENGINE │ ───► │ ADJUSTER REVIEW & SETTLE    │
   │ (Coverage Validation) │      │ (Deductible / SIU Flags)    │      │ (Atomic Payout Disbursement)│
   └───────────────────────┘      └─────────────────────────────┘      └─────────────────────────────┘
```

### 1. Actuarial Coverage & Deductible Allocation Math
When a claim is adjudicated, the engine determines eligible indemnification based on strict policy limits and deductibles:

$$\text{Remaining Coverage } L_{\text{rem}} = \max\left(0, \text{Policy Limit} - \sum \text{Prior Settled Claims in Term}\right)$$

$$\text{Payable Indemnity} = \max\left(0, \min\left(\text{Claimed Amount} - \text{Deductible}, L_{\text{rem}}\right)\right)$$

### 2. Heuristic Fraud Accumulator Matrix (SIU Routing)
Claims pass through automated risk rules. If accumulated risk points meet or exceed the Special Investigation Unit threshold ($\text{Score} \ge 50$), the claim transitions to `FLAGGED_SIU`, requiring explicit fraud investigator sign-off before adjuster approval:
- **Policy Age $< 30\text{ days}$ (Early Loss Inception)**: $+35\text{ pts}$
- **Claim Amount $> 75\%$ of Total Policy Limit**: $+30\text{ pts}$
- **High Frequency Incident History ($>2\text{ claims in 12 months}$)**: $+25\text{ pts}$

### 3. Deterministic Claim State Lifecycle

$$\text{FILED} \longrightarrow \text{ADJUDICATED} \longrightarrow \begin{cases} \text{FLAGGED\_SIU} & \text{if Fraud Score} \ge 50 \\ \text{PENDING\_ADJUSTER} & \text{if Low/Standard Risk} \end{cases} \longrightarrow \text{APPROVED} \longrightarrow \text{SETTLED\_PAID}$$

### 4. Atomic Double-Entry Audit Ledger
State transitions and monetary calculations execute within isolated database transactions. Every action commits a SHA-256 digital signature:

$$H = \text{SHA-256}(\text{claim\_id} \mathbin{\Vert} \text{actor} \mathbin{\Vert} \text{action} \mathbin{\Vert} \text{previous\_status} \mathbin{\Vert} \text{new\_status} \mathbin{\Vert} \text{payout} \mathbin{\Vert} \text{microtime})$$

---

## 🚀 How to Run & Verify

### Prerequisites
- PHP 8.1+ CLI Runtime
- Enabled PHP extensions: `ext-pdo`, `ext-pdo_sqlite`

### 1. Interactive Adjuster Console
Launch the interactive terminal UI console:
```bash
php insurance_claim_engine.php
```

### 2. Headless Auto-Adjudication Daemon (Batch Processing / Cron)
Run the headless adjudication daemon to automatically process pending inbound claims in batch:
```bash
php insurance_claim_engine.php --process
```

---

## 📁 File Structure
- `insurance_claim_engine.php`: Core CLI application containing visual TUI layout, SQLite persistence layer, actuarial adjudication engine, fraud matrix, and cryptographic chain-of-custody logger.
- `insurance_vault.sqlite`: Isolated local SQLite database containing policies, claims, and tamper-evident audit logs (auto-created on first run).
