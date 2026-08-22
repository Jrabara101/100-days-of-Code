# Purchase Request (PR) to Purchase Order (PO) Workflow Engine

An enterprise-grade PHP CLI application that models the procurement lifecycle conversion from an internal **Purchase Request (PR)** into an official, legally binding external **Purchase Order (PO)**. Built with atomic database state machine transitions, encumbered budget cap checks, certified vendor binding, ANSI TUI rendering, and SHA-256 signed audit ledgers.

---

## 🏛 Architectural Overview & System Design

In enterprise resource planning (ERP) systems:
- **Purchase Request (PR)**: Internal document requesting authorization to purchase goods or services.
- **Purchase Order (PO)**: Legally binding commercial contract issued to an external vendor.

The engine guarantees that a PR is converted to a PO under strict transactional guarantees within a single isolation boundary.

---

## 🔄 State Machine & Linear Transitions

```
[ PR_SUBMITTED ] ──── (Manager Approval) ────> [ PR_APPROVED ]
                                                     │
                                           (Atomic PO Conversion)
                                                     │
                                                     ▼
[ PO_FULFILLED ] <──── (Vendor Fulfillment) ──── [ PO_ISSUED ] (PR -> PR_CONVERTED)
```

Skipping or regressing workflow states (e.g. issuing a PO for an unapproved PR) is prevented at the domain layer.

---

## 🛡 Encumbered Budget Guard Logic

Before converting an approved PR into an issued PO, the engine calculates the target department's total committed expenditure:

$$\text{Encumbered Funds} = \sum \text{PO}_{\text{ISSUED}} + \text{New PO Value}$$

If:

$$\text{Encumbered Funds} > \text{Department Budget Cap}$$

The entire transaction aborts and rolls back immediately, preventing unbudgeted liability creation.

---

## 🔒 Transactional Integrity Boundary (`BEGIN TRANSACTION`)

Each PR-to-PO conversion executes inside an explicit SQLite transaction:

1. **Lock Verification**: Asserts that the PR status is strictly `PR_APPROVED`.
2. **Vendor Validation**: Asserts that the selected vendor is `ACTIVE`.
3. **Encumbrance Check**: Verifies that department committed spend + new cost $\le$ department budget cap.
4. **PO Creation**: Inserts the new `purchase_orders` record with reference pattern `PO-2026-XXXX`.
5. **State Mutation**: Mutates `purchase_requests.status` to `PR_CONVERTED`.
6. **Audit Signing**: Appends SHA-256 hash-signed entries into `purchasing_audit_logs`.

---

## 📁 File Structure

```
Automation/Purchase Request/
├── pr_to_po_workflow.php      # Single-file CLI engine (UI, Repository, Engine, App)
├── purchasing_vault.sqlite    # SQLite Database (Auto-created on first execution)
└── README.md                  # System Documentation & Architecture Guide
```

---

## 🚀 How to Run & Test

### Prerequisites
- PHP 8.0+ CLI runtime
- `pdo_sqlite` extension enabled

### 1. Interactive Workspace (CLI Gateway)

Run the script interactively:

```bash
php pr_to_po_workflow.php
```

#### Menu Options:
1. **Convert Approved PR to Purchase Order**: Executes the PO conversion wizard with budget validation.
2. **Create New Purchase Request**: Ingests new PR requisitions into `PR_SUBMITTED` state.
3. **Approve Submitted Purchase Requests**: Manager gate to advance PRs to `PR_APPROVED`.
4. **Output Master Purchase Requests Registry**: Displays all PRs and status badges.
5. **Output Master Purchase Orders Registry**: Displays all issued PO contracts.
6. **Audit Compliance Log & SHA-256 Signature Trail**: Inspects chronological immutable audit logs.
0. **Disconnect workspace**: Exits application.

### 2. Headless Batch Auto-Conversion (`--convert`)

For automated background cron jobs or daemon processes:

```bash
php pr_to_po_workflow.php --convert
```

#### Crontab Automated Execution Example:
```cron
*/10 * * * * /usr/bin/php /var/www/html/scripts/pr_to_po_workflow.php --convert >> /var/log/procurement_batch.log 2>&1
```

---

## 🧪 Testing Scenarios

1. **Successful PO Conversion**:
   - Select Option `1`.
   - Choose `PR #1` (`PR-2026-001` - Engineering Operations, $38,000.00).
   - Select `Vendor [2]` (Dell Enterprise Direct).
   - **Result**: Success confirmation, PO generated (`PO-2026-XXXX`), PR status mutated to `PR_CONVERTED`.

2. **Budget Cap Rejection**:
   - Select Option `1`.
   - Choose `PR #2` (`PR-2026-002` - Corporate Marketing, $12,500.00).
   - Select `Vendor [3]` (Global Media Agency).
   - If total encumbered spend exceeds Corporate Marketing's budget cap ($25,000.00), the transaction rolls back with a detailed error message.

3. **Audit Inspection**:
   - Select Option `6`.
   - Enter PR ID `1`.
   - Review SHA-256 signature verification logs and transition timestamps.
