# Timesheet Approval Automation Engine

An enterprise-grade, high-compliance CLI timesheet automation and approval pipeline built with PHP and SQLite. It treats timesheets as a strict **State Machine** governed by compliance heuristics, atomic concurrency locks, and an unalterable SHA-256 cryptographic audit ledger.

---

## 🏛 Architectural Overview & State Machine

A naive implementation that simply updates `status = 'APPROVED'` risks wage-and-hour compliance penalties, overtime billing fraud, and duplicate payroll dispatches. This engine enforces deterministic lifecycle routing and atomic locks.

```
   ┌───────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
   │  SUBMITTED STAGE  │ ───► │  COMPLIANCE & OVERTIME  │ ───► │   APPROVED / REJECTED   │
   │ (Timesheet Ingest)│      │  (Auto-Flag / Manager)  │      │ (Locked & Audit Sealed) │
   └───────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### Deterministic State Transitions
$$\text{SUBMITTED} \longrightarrow \begin{cases} \text{PENDING\_APPROVAL} & \text{if Standard Hours } (\le 40\text{h and } \le 8\text{h/day}) \\ \text{OVERTIME\_FLAGGED} & \text{if Overtime Threshold Breached} \end{cases} \longrightarrow \text{APPROVED} \mid \text{REJECTED}$$

- **Direct State Jumps Blocked**: Approving an unsubmitted draft or bypassing overtime flags without manager review is prohibited at the domain layer.
- **Atomic Concurrency Guard**: Updates conditionally match expected state (`WHERE id = ? AND status = ?`), preventing race conditions when multiple managers review concurrently.
- **Cryptographic SHA-256 Audit Trail**: Every state transition commits a signature hash $H = \text{SHA-256}(\text{timesheet\_id} \mathbin{\Vert} \text{actor} \mathbin{\Vert} \text{total\_hours} \mathbin{\Vert} \text{timestamp})$ to an immutable audit ledger.

---

## ⏱ Overtime & Labor Compliance Math Engine

The engine calculates regular and overtime hours on daily and weekly thresholds:

- **Regular Hours**: $\text{Regular Hours} = \min(\text{Daily Hours}, 8.0)$
- **Overtime Hours**: $\text{Overtime Hours} = \max(0.0, \text{Daily Hours} - 8.0)$
- **Gross Pay Calculation**:
  $$\text{Gross Pay} = (\text{Regular Hours} \times \text{Base Rate}) + (\text{Overtime Hours} \times \text{Base Rate} \times 1.5)$$

---

## 📁 File Structure

```
Automation/Timesheet approval automation/
├── timesheet_approval.php     # CLI Application & Engine
├── timesheet_vault.sqlite     # SQLite Database Vault
└── README.md                  # Comprehensive Documentation
```

---

## 🚀 Usage Guide

### 1. Interactive Manager Workspace

Launch the interactive console:
```bash
php timesheet_approval.php
```

#### Menu Options:
1. **Review & Approve Pending Queue**: View all pending timesheets with overtime badges and execute manager override approvals.
2. **Run Auto-Approval Engine**: Clear clean 40-hour timesheets while keeping overtime-flagged timesheets for human manager sign-off.
3. **Submit New Employee Timesheet**: Ingestion wizard for submitting daily hours (Mon–Sun).
4. **Output Global Timesheets Registry**: View all submitted timesheets and their current state.
5. **Audit Compliance Trail & SHA-256 Hashes**: View the chronological tamper-evident audit history of any timesheet.
0. **Disconnect console**: Safely unmount and exit.

---

### 2. Headless Auto-Approval Batch Execution (`--auto`)

For automated background workers (cron jobs or systemd services) that run periodically (e.g., Friday evenings):

```bash
php timesheet_approval.php --auto
```

#### Example Crontab Entry (Linux):
```cron
0 23 * * 5 /usr/bin/php /var/www/html/scripts/timesheet_approval.php --auto >> /var/log/timesheet_autoapproval.log 2>&1
```

---

## 🗄 Database Schema

The database `timesheet_vault.sqlite` manages three tables:

- **`users`**: Employee and manager directory with hourly rates and roles.
- **`timesheets`**: Core timesheet records with regular/overtime hours, gross pay, and state machine status.
- **`timesheet_audit_logs`**: Immutable ledger recording actor, previous status, new status, timestamp, and SHA-256 signature hash.
