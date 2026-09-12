# Enterprise Multi-Channel Notification Center

An enterprise-grade message routing bus and mission-control notification center built with **Laravel**, **Termwind**, and **SQLite**. It prevents thread pool starvation, cascading upstream timeouts, duplicate dispatches, and quiet-hours violations under heavy load.

---

## Architecture Overview

```
   ┌────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
   │ INGESTION & PRIORITY   │ ───► │ CIRCUIT BREAKER & PREFS      │ ───► │ CHANNEL STRATEGY & DISPATCH │
   │ (P0 Critical to P3 Low)│      │ (State: Closed/Open/Half-Op) │      │ (Slack ➔ Discord ➔ SMS ➔ SES)│
   └────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
                                                                                        │
                                                                                        ▼
                                                                         ┌─────────────────────────────┐
                                                                         │ OUTBOX RECONCILIATION       │
                                                                         │ (Termwind Telemetry & SLA)  │
                                                                         └─────────────────────────────┘
```

### Core Engineering Capabilities

1. **Distributed Circuit Breaker Pattern (`CLOSED` $\to$ `OPEN` $\to$ `HALF_OPEN`)**:
   - Detects external provider 5xx errors or network timeouts.
   - 3 consecutive failures within the evaluation window trips the circuit to `OPEN`.
   - Downstream dispatches skip failing providers immediately at **$0\text{ms}$ bypass latency**, fast-routing to the next available fallback channel.
   - After a cooling window ($60\text{ seconds}$), transitions to `HALF_OPEN` to probe provider recovery with a single canary dispatch.
2. **Priority-Based Dynamic Channel Escalation Matrix**:
   - **$P_0$ (Critical - Security / Infra Breach)**: Forces simultaneous parallel fanout across all active channels (`SLACK`, `DISCORD`, `TWILIO_SMS`, `AWS_SES`) while bypassing recipient Do-Not-Disturb (DND) quiet hours.
   - **$P_1$ (High - Operational / Billing Alert)**: Sequential fallback routing ($\text{Slack} \xrightarrow{\text{Fail / Open Circuit}} \text{Discord} \xrightarrow{\text{Fail}} \text{SMS} \xrightarrow{\text{Fail}} \text{SES}$).
   - **$P_2$ / $P_3$ (Normal / Low)**: Single preferred channel delivery. Strictly suppressed if within local recipient quiet hours ($22:00 - 08:00$ local timezone).
3. **Idempotent Transactional Outbox Engine**:
   $$\text{Idempotency Key} = \text{SHA-256}(\text{recipient\_id} \mathbin{\Vert} \text{event\_type} \mathbin{\Vert} \text{reference\_id} \mathbin{\Vert} \text{channel})$$
   Database unique constraints and pre-flight hash verification prevent duplicate queuing or dispatching during worker restarts.
4. **Termwind Real-Time CLI Telemetry**:
   Live console dashboard rendering gateway provider circuit states, consecutive failures, channel latency gauges, and delivery SLA uptime.
5. **Interactive Mission-Control Web GUI**:
   A dark-mode dashboard providing live gateway metrics, recipient profiles, outbox ledgers, and one-click dispatch triggers.

---

## File Structure

```
Automation/Virtual Private Network GUI/
├── app/
│   ├── Console/Commands/
│   │   └── DispatchCenterCommand.php         # Termwind CLI Command (notifications:orchestrate)
│   ├── Models/
│   │   ├── NotificationProvider.php          # Gateway circuits & state machine
│   │   ├── NotificationSubscriber.php        # Recipient preferences & quiet-hours
│   │   ├── DispatchEvent.php                 # Ingestion event ledger
│   │   └── DispatchOutbox.php                # Immutable transactional outbox
│   └── Services/NotificationCenter/
│       ├── CircuitBreakerManager.php         # Tri-state circuit breaker engine
│       ├── NotificationOrchestratorService.php# Core routing & escalation bus
│       ├── Contracts/
│       │   └── ChannelProviderInterface.php  # Provider strategy contract
│       ├── Dto/
│       │   ├── IngestedEventDto.php
│       │   ├── ProviderDeliveryResponse.php
│       │   └── OutboxAuditReceipt.php
│       └── Providers/
│           ├── SlackGateway.php              # Slack webhook with outage injection
│           ├── DiscordGateway.php            # Discord webhook channel
│           ├── TwilioSmsGateway.php          # Twilio direct carrier SMS
│           └── AwsSesEmailGateway.php        # AWS SES transactional email
├── database/
│   ├── migrations/
│   │   └── 2026_01_01_000001_create_notification_center_infrastructure.php
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── NotificationCenterInfrastructureSeeder.php
├── resources/views/
│   └── dashboard.blade.php                   # Mission Control Web GUI
├── routes/
│   ├── console.php                           # Scheduled heartbeat jobs
│   └── web.php                               # Web GUI routes & dispatch actions
└── tests/Feature/
    └── NotificationCenterTest.php            # Automated PHPUnit test suite (7/7 passing)
```

---

## Verification & Execution Guide

### 1. Database Initialization
```bash
php artisan migrate:fresh --seed
```

### 2. Pre-Flight Dry Run Simulation
Verify recipient quiet hours and channel preferences without committing transactions:
```bash
php artisan notifications:orchestrate --dry-run
```

### 3. $P_1$ High-Priority Incident (Fallback Escalation)
Demonstrates Marcus Brody's failing Slack gateway automatically falling back to Discord, while Elena Fisher is suppressed due to local Tokyo quiet hours:
```bash
php artisan notifications:orchestrate --priority=P1 --type=CLUSTER_DOWN
```

### 4. Trip Circuit Breaker to `OPEN`
Run 2 additional times to exceed the 3 consecutive failure threshold:
```bash
php artisan notifications:orchestrate --priority=P1
php artisan notifications:orchestrate --priority=P1
```
On subsequent runs, dispatches bypass Slack with a **$0\text{ms}$ latency penalty** straight to Discord.

### 5. Inspect Live Gateway Health & SLA Dashboard
```bash
php artisan notifications:orchestrate --health
```

### 6. $P_0$ Critical Broadcast (All-Channel Fanout & DND Bypass)
```bash
php artisan notifications:orchestrate --priority=P0 --type=SECURITY_BREACH
```

### 7. Reset Circuits
```bash
php artisan notifications:orchestrate --reset-circuits --health
```

### 8. Run Automated Test Suite
```bash
php artisan test
```

### 9. Launch the Web Mission Control GUI
```bash
php artisan serve
```
Open `http://127.0.0.1:8000` to interact with the visual dashboard.
