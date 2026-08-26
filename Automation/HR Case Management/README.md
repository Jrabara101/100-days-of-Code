# Enterprise HR Case Management & SLA Automation Engine

In enterprise Human Resources and Corporate Compliance, treating employee grievances and ethics complaints as basic tracking tickets introduces severe legal risk. Mismanaging statutory response windows, leaking whistleblower identities, or failing to maintain a tamper-evident chain of custody can lead to regulatory penalties and employment litigation.

A senior engineering approach models HR case management as a **Role-Guarded State Machine** featuring **Automated SLA Breach Watchdogs**, **Whistleblower Cryptographic Anonymization**, and **Immutable Evidence Logging**.

```
   ┌───────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────────────┐
   │ INGESTION & ANONYMIZE │ ───► │ TRIAGE & SLA CLOCK BINDING  │ ───► │ INVESTIGATION & AUDIT SEAL  │
   │ (Grievance / Ethics)  │      │ (Critical: 24h / Med: 72h)  │      │ (SHA-256 Evidence Chain)    │
   └───────────────────────┘      └─────────────────────────────┘      └─────────────────────────────┘
```

---

## Architectural Overview & Reasoning Logic

### 1. Deterministic SLA Escalation Matrix
Every case is assigned an immutable Service Level Agreement deadline ($T_{\text{due}}$) computed dynamically based on category risk and legal severity at ingestion:

$$T_{\text{due}} = \text{IngestionTime} + \begin{cases} 
24\text{ hours} & \text{if Severity} = \text{CRITICAL\_LEGAL (Harassment/Whistleblower)} \\
48\text{ hours} & \text{if Severity} = \text{HIGH (Safety/Ethics)} \\
120\text{ hours} & \text{if Severity} = \text{MEDIUM (Wage/Workplace Dispute)} \\
240\text{ hours} & \text{if Severity} = \text{LOW (General Inquiry)}
\end{cases}$$

A background watchdog queries overdue cases ($t_{\text{current}} > T_{\text{due}}$) and automatically mutates state to `ESCALATED_SLA_BREACH`, alerting Corporate Legal and Senior HR Leadership.

### 2. Whistleblower Privacy Guard (Zero-Knowledge Reporter Token)
When a report is flagged as anonymous, the engine strips user relational IDs and computes an unalterable pseudonym token:

$$\text{ANON-} \mathbin{\Vert} \text{SHA-256}(\text{complainant\_salt} \mathbin{\Vert} \text{secret})$$

This allows the whistleblower to submit evidence and follow up without exposing their identity in database foreign keys.

### 3. Role-Based Access Control (RBAC) Isolation
Case records enforce clearance-level boundaries: `EMPLOYEE`, `HR_GENERALIST`, `HR_DIRECTOR`, and `LEGAL_COUNSEL`. Harassment and Whistleblower files are structurally quarantined from general HR visibility.

### 4. Tamper-Evident SHA-256 Investigation Chain
Every interview note, evidence attachment, and status mutation logs a cryptographic payload hash:

$$H = \text{SHA-256}(\text{case\_id} \mathbin{\Vert} \text{actor} \mathbin{\Vert} \text{notes} \mathbin{\Vert} \text{timestamp})$$

into an append-only audit ledger for court defensibility.

### 5. ANSI Table Normalization & SLA Countdown Bar
Visual progress bars compute active SLA depletion percentages. Text length calculations strip ANSI escape codes using regular expressions (`preg_replace`) to ensure borders align across all terminal emulators.

---

## Database Architecture (SQLite Vault)

- **`hr_personnel`**: Lead investigators, roles, and credential identities.
- **`hr_cases`**: Core state machine tracking case number, category, severity, status, anonymized reporter tokens, and dynamic `sla_due_at`.
- **`case_evidence_logs`**: Append-only cryptographic audit ledger signing author, role, entry type, notes, and SHA-256 signatures.
- **`sla_breach_logs`**: Incident ledger recording timestamped escalation actions triggered by the SLA Watchdog.

---

## How to Run and Verify the Engine

### Prerequisites
- PHP 8.1+ with `ext-pdo` and `ext-pdo_sqlite` enabled.

### 1. Launch the Operations Console
Run the interactive TUI:
```bash
php hr_case_manager.php
```

The application initializes an isolated SQLite database (`hr_cases_vault.sqlite`) and seeds baseline personnel (Alice Vance, Marcus Brody, Elena Fisher) along with pre-seeded cases covering different severity levels.

### 2. Ingest an Anonymous Grievance (Option 1)
1. Select **Option 1** (Ingest New Grievance).
2. Enter Title: `Executive Kickback in Cloud Infrastructure Procurement`.
3. Choose Classification: `[2] Ethics / Whistleblower Accounting Fraud (High - 48h SLA)`.
4. Select `Y` to file as an Anonymous Whistleblower.
5. The engine strips identifying details, generates a zero-knowledge token (e.g., `ANON-4B1F8C92`), computes the 48-hour SLA deadline, and records the intake hash in the evidence vault.

### 3. Inspect Active Cases & Dynamic SLA Depletion (Option 5)
Select **Option 5** to view the active cases grid. Pre-seeded Case #3 (`HRC-2026-0099`) is highlighted with an active `BREACH` badge because its historical SLA timestamp is past due:

```text
┌────┬────────────────┬─────────────────┬──────────┬────────────────┬────────────┐
│ ID │ Case Code      │ Complainant     │ Severity │ SLA Depletion  │ Status     │
├────┼────────────────┼─────────────────┼──────────┼────────────────┼────────────┤
│ 3  │ HRC-2026-0099  │ John Doe        │  MEDIUM  │ [BREACH +4.0h] │  TRIAGED   │
│ 2  │ HRC-2026-0002  │ ANON-9F1B2C3D   │   HIGH   │ [■■■■      ]42%│  INGESTED  │
│ 1  │ HRC-2026-0001  │ Sarah Connor    │ CRITICAL │ [■■■■■■    ]65%│  INGESTED  │
└────┴────────────────┴─────────────────┴──────────┴────────────────┴────────────┘
```

### 4. Trigger the SLA Watchdog Scanner (Option 7)
Select **Option 7** to execute the watchdog check. The engine detects overdue cases, auto-escalates the status to `ESCALATED_SLA_BREACH`, commits an incident entry to the breach log, and flags the case for Corporate Legal:

```text
 [08:34:10] [HR-WATCHDOG] CRITICAL BREACH: Case HRC-2026-0099 [Overtime Classification Dispute] overdue! Auto-escalated to Legal.
✖ ERROR: Escalation triggered! 1 case(s) breached SLA and escalated to Legal.
```

### 5. Audit Chain of Custody (Option 6)
Select **Option 6** and enter Case ID 1 to inspect the tamper-evident SHA-256 evidence log:

```text
CHAIN-OF-CUSTODY EVIDENCE LOG FOR CASE #1:
  ├─ [2026-08-24 08:15:00] SYSTEM_INTAKE (INTAKE) ──► Type: INTAKE
  │  Detail   : Case ingested under severity [CRITICAL_LEGAL] with 24h SLA.
  │  SHA Seal : 8b1f2a019c4d8e2033...
  ├─ [2026-08-24 08:20:12] Alice Vance (HR_DIRECTOR) ──► Type: ASSIGNMENT
  │  Detail   : Case assigned to investigator Marcus Brody (HR_GENERALIST).
  │  SHA Seal : e3b0c44298fc1c149a...
  └─ Sequence Analysis End.
```

---

## Headless Server & Cron Integration
To run the SLA Watchdog continuously in the background (e.g., scanning for overdue cases every 15 minutes via server cron or CI/CD worker):

```bash
php hr_case_manager.php --watch
```

### Linux Crontab Entry Example
```cron
*/15 * * * * /usr/bin/php /var/www/html/scripts/hr_case_manager.php --watch >> /var/log/hr_sla_watchdog.log 2>&1
```
