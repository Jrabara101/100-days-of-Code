# CoreLink CLI – Internal Zapier-Clone Integration Daemon

> A high-performance, internal webhook and automation routing daemon built on **Laravel 11.x**, **PHP 8.4/8.2+**, and **Termwind**.

---

## ⚡ Quick Start

### 1. View the Live Terminal Dashboard Daemon
Launch the live `htop`-style monitoring daemon:
```bash
php artisan corelink:monitor
```
*(Press `Ctrl+C` to terminate).*

To output a single snapshot frame (e.g. for CI/CD or logging):
```bash
php artisan corelink:monitor --once
```

### 2. Trigger a Workflow via CLI
Execute a multi-step workflow asynchronously or synchronously:

- **Trigger Workflow #8802 (Onboard New Client)**:
  ```bash
  php artisan corelink:trigger 8802 --sync
  ```
- **Trigger Workflow #8801 (Sync Jira Ticket)**:
  ```bash
  php artisan corelink:trigger 8801 --sync
  ```
- **Trigger Workflow #8800 (Failed Payment Alert with null channel to test failure handling)**:
  ```bash
  php artisan corelink:trigger 8800 --sync
  ```

### 3. Run Automated Tests
Execute the full unit and feature test suite:
```bash
php artisan test
```

---

## 🛠️ CLI Monitor Layout

```plaintext
CoreLink Daemon v2.4.0                                                      [Engine: Laravel 11 | Driver: Redis Horizon]
======================================================================
[ LIVE WORKFLOW MONITOR ]                                                                            Uptime: 04h 12m 09s

⚡ ACTIVE TRIGGERS (Listening)
  [✔] Webhook: Stripe.PaymentSuccess   -> Route: /hooks/stripe
  [✔] Schedule: Daily At Midnight      -> Route: CRON
  [✔] Event: Eloquent.UserCreated      -> Route: Internal Bus

======================================================================
[ RECENT EXECUTIONS ]
----------------------------------------------------------------------
ID       | Workflow Name         | Mapped Data                  | Status
----------------------------------------------------------------------
#8802    | Onboard New Client    | trigger.email -> slack.msg   | [SUCCESS]
#8801    | Sync Jira Ticket      | hook.issue_id -> db.ticket   | [SUCCESS]
#8800    | Failed Payment Alert  | null -> slack.channel        | [FAILED] ❌

======================================================================
[ DEBUG: WORKFLOW #8802 TOPOLOGY ]

  (Trigger) Inbound User Registration
      │
      ├─► Interpolating Payload...
      │   ├─ {{ trigger.user.name }}  => "Jane Doe"
      │   └─ {{ trigger.user.email }} => "jane@example.com"
      │
      ▼
  (Action) Create HubSpot Contact [✔] (0.32s)
      │
      ▼
  (Action) Send Slack Notification [✔] (0.15s)

======================================================================
System Health: Excellent | Throughput: 12 Zaps/min | Peak RAM: 26MB
Press 'Ctrl+C' to terminate daemon.
```

---

## 📖 Deep Architecture & Design Patterns

For a comprehensive explanation of the Mapper Pattern, `data_get()` interpolation, `Bus::chain()` background execution, and Service Container strategy resolution, refer to:
👉 **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**
