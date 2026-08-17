# Rule-Based Notification & Alert Dispatch Engine

An enterprise-grade, distributed-ready **Rule-Based Notification & Alert Dispatch Engine** implemented in PHP CLI with SQLite persistence, multi-predicate evaluation AST, rolling cooldown alert storm suppression, quiet hours/DND priority escalation, decoupled multi-channel strategy dispatchers, and tamper-evident SHA-256 cryptographic audit logging.

---

## 🏗️ Architectural Overview

```
   ┌───────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────────────┐
   │ EVENT INGESTION GATE  │ ───► │ PREDICATE & RULE EVALUATION │ ───► │ MULTI-CHANNEL DISPATCH      │
   │ (Payload & Severity)  │      │ (Cooldown / Quiet Hours)    │      │ (Slack, Email, SMS, Webhook)│
   └───────────────────────┘      └─────────────────────────────┘      └─────────────────────────────┘
```

### Core Components & Reasoning Logic

1. **Predicate Evaluation Engine**:
   - Evaluates multi-attribute conditional predicates (`==`, `===`, `!=`, `>`, `>=`, `<`, `<=`, `CONTAINS`, `IN`) against structured JSON payloads.
   - Evaluates rules dynamically matching event types and payload criteria.

2. **Alert Storm Suppression & Cooldown Matrix**:
   - Prevents cascading alert floods during infrastructure incidents using rolling cooldown timers:
     $$\Delta t = t_{\text{current}} - t_{\text{last\_dispatched}}$$
   - When $\Delta t < \text{cooldown\_seconds}$ for a rule and recipient, the alert is automatically mutated to `SUPPRESSED` at the database level.

3. **Quiet Hours & Priority Escalation**:
   - Respects recipient Do-Not-Disturb (DND) windows (e.g. `22:00 - 07:00 UTC`).
   - `CRITICAL` severity events dynamically bypass quiet hours and escalate to urgent outbound channels (SMS, Email, Slack).

4. **Idempotent Queue & Channel Strategy Architecture**:
   - Decoupled via `NotificationChannelInterface` implementations:
     - **Slack Channel Provider** (BlockKit webhook simulation)
     - **Email Channel Provider** (SMTP relay simulation)
     - **SMS Channel Provider** (Carrier gateway simulation)
     - **Webhook Channel Provider** (HTTP POST integration simulation)
   - State machine lifecycle: `QUEUED` $\to$ `PROCESSING` $\to$ `SENT` | `SUPPRESSED` | `FAILED`.

5. **Tamper-Evident SHA-256 Audit Ledger**:
   - Every ingestion, rule evaluation, suppression, and dispatch generates an immutable cryptographic signature:
     $$H = \text{SHA-256}(\text{queue\_id} \mathbin{\Vert} \text{rule\_code} \mathbin{\Vert} \text{action} \mathbin{\Vert} \text{payload} \mathbin{\Vert} \text{timestamp})$$

6. **ANSI Terminal Layout Engine**:
   - Formatted ANSI tables and color badges.
   - Regex-based ANSI code stripping (`preg_replace`) ensures exact character width calculations and clean box-drawing borders.

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.1+ CLI runtime
- `ext-pdo` and `ext-pdo_sqlite` extensions enabled

### Execution Modes

#### 1. Interactive Control Panel
```bash
php notification_engine.php
```
Presents a full terminal UI to simulate events, dispatch queued notifications, inspect the rule matrix, view suppression logs, and audit cryptographic signatures.

#### 2. Headless Batch Queue Dispatcher (Cron Mode)
```bash
php notification_engine.php --cron
```
Processes pending alerts in the queue once and outputs execution logs. Perfect for system crontab jobs:
```crontab
* * * * * /usr/bin/php /path/to/notification_engine.php --cron >> /var/log/notification_engine.log 2>&1
```

#### 3. Continuous Event Consumer Daemon
```bash
php notification_engine.php --daemon
```
Runs a continuous polling worker (5-second polling intervals) to dispatch queue items in real-time.

---

## 📊 Pre-Seeded Baseline Data

### Recipients
| ID | Name | Email | Phone | Slack Channel | Quiet Hours (UTC) |
|---|---|---|---|---|---|
| `1` | Alice Vance (DevOps Lead) | `a.vance@infra.io` | `+1-555-0199` | `#ops-critical` | `22:00 - 07:00` |
| `2` | Bob Smith (SecOps Analyst) | `b.smith@secops.io` | `+1-555-0142` | `#security-alerts` | `23:00 - 06:00` |

### Rules Matrix
| Rule Code | Rule Name | Event Type | Predicates | Target Channels | Recipient | Cooldown |
|---|---|---|---|---|---|---|
| `RULE-SYS-01` | High CPU Exhaustion Alert | `SYSTEM_METRIC` | `metric_name == 'cpu_usage'` AND `value > 85` | `SLACK`, `EMAIL` | Alice Vance | 120s |
| `RULE-SEC-02` | Brute Force Auth Attack Spike | `SECURITY_INCIDENT` | `failed_attempts > 10` AND `geo_risk == 'HIGH'` | `SLACK`, `SMS`, `EMAIL` | Bob Smith | 60s |
| `RULE-FIN-03` | High-Value Transfer Flag | `PAYMENT_TRANSFER` | `amount > 50000` | `EMAIL`, `SLACK` | Alice Vance | 300s |

---

## 🧪 Testing Workflows

1. **Simulate Event Ingestion (Option 1)**:
   - Select Scenario 1 (`cpu_usage: 92.5`). The engine matches `RULE-SYS-01` and enqueues alerts for Slack & Email.
   - Select Scenario 2 (`failed_attempts: 25`, `geo_risk: HIGH`). Evaluated as `CRITICAL`, bypassing quiet hours and enqueuing Slack, SMS, and Email.
   - Select Scenario 4 (`cpu_usage: 45.0`). Normal metric below threshold; 0 alerts enqueued.

2. **Cooldown & Alert Storm Throttling**:
   - Ingest Scenario 1 immediately after a previous dispatch.
   - The engine detects elapsed time $< 120\text{s}$, marking the alerts as `SUPPRESSED` (`THROTTLED_COOLDOWN`).

3. **Dispatch Outbound Queue (Option 2)**:
   - Dispatches pending items through registered strategy providers and logs `DISPATCH_SUCCESS` signatures.

4. **Audit Trail Verification (Option 5)**:
   - Enter a Queue ID (e.g. `1`) to view chronological audit events, actions taken, and SHA-256 verification hashes.

---

## 🗄️ Database Schema

The isolated SQLite database (`notifications_vault.sqlite`) manages:
- `recipients`: User contact info and DND time windows.
- `rules`: Rules registry, event types, predicate JSON AST, target channels, and cooldown timers.
- `events`: Ingested event stream with UUIDs and raw payloads.
- `notification_queue`: Outbound dispatch ledger with queue states (`QUEUED`, `PROCESSING`, `SENT`, `SUPPRESSED`, `FAILED`).
- `notification_audit_logs`: Immutable cryptographic audit trail with SHA-256 signatures.
