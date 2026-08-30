# Enterprise-Grade Advanced Queue Email Campaign Engine

A high-throughput, memory-safe, and fault-tolerant email marketing and transactional campaign dispatch engine built on Laravel 11/12 and PHP 8.4+.

---

## 🏗️ Architectural Foundations & Pipeline Flow

In high-throughput email marketing and transactional blast architectures, dispatching campaigns via naive loops causes SMTP rate-limit bans, memory exhaustion (OOM crashes), silent delivery drop-offs, and double-send hazards during worker reconnections.

This engine relies on **Chunked Stream Ingestion**, **Distributed Bus Batching (`Bus::batch()`)**, **Atomic Recipient Idempotency Hashes**, **Pre-flight Suppression Filtering**, and **Termwind Visual Telemetry**.

```
   ┌────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
   │ CAMPAIGN STREAM INGEST │ ───► │ SUPPRESSION & IDEMPOTENCY    │ ───► │ DISTRIBUTED BUS BATCHING    │
   │ (O(1) Memory Chunking) │      │ (Hard Bounces & Unsubscribes)│      │ (Bus::batch with Throttling)│
   └────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
```

### 1. $O(1)$ Memory Ingestion via `chunkById()`
Subscribers are streamed in isolated database cursor chunks rather than loaded into an in-memory collection, preventing memory spikes when handling millions of recipients.

### 2. Cryptographic Recipient Idempotency Token
Every email dispatch row generates an immutable idempotency hash:
$$\text{Idempotency Key} = \text{SHA-256}(\text{campaign\_id} \mathbin{\Vert} \text{subscriber\_id})$$

Database unique constraints prevent duplicate queuing or dispatching if a job worker restarts mid-batch or if a dispatcher command is re-run.

### 3. Pre-Flight Suppression & Spam-Trap Isolation
Before any job enters the queue, the dispatcher filters out hard bounces (`bounce_count >= 1`), unverified records, and active unsubscribes (`is_subscribed = false`), preserving IP sender reputation and preventing wasted ESP API credits.

### 4. Distributed Batch Tracking (`Bus::batch`)
Jobs are organized into a monitored Laravel batch with failure isolation, progress event tracking, and automated completion callbacks (`then`, `catch`, `finally`).

### 5. Per-Domain Rate Throttling & Fault Resilience
The queued job handles domain extraction and failure handling (such as simulated mailbox provider connection timeouts or ESP rate limits), ensuring isolated failures do not abort the broadcast.

---

## 📁 Project Structure

```
Automation/Advanced Queue Email/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       └── DispatchCampaignCommand.php       # CLI command with Termwind visual telemetry
│   ├── Jobs/
│   │   └── SendCampaignEmailJob.php              # Batchable queue job with idempotency & retry logic
│   ├── Models/
│   │   ├── CampaignDispatch.php                  # Individual recipient audit dispatch record
│   │   ├── EmailCampaign.php                     # Broadcast campaign definition & state counters
│   │   └── Subscriber.php                        # Subscriber profile & deliverability heuristics
│   └── Services/
│       └── Campaigns/
│           └── CampaignDispatcherService.php     # Stream ingestion, pre-flight audit & Bus::batch coordinator
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   └── 2026_01_01_000001_create_email_campaign_schema.php
│   └── seeders/
│       ├── CampaignDemoSeeder.php                # Demo dataset (35 deliverable, 8 bounced, 7 unsub, 1 fail-test)
│       └── DatabaseSeeder.php
├── routes/
│   └── console.php                               # Scheduled recurring background runner
├── tests/
│   ├── Feature/
│   │   └── CampaignDispatchTest.php              # Feature tests (batching, idempotency, failure handling)
│   └── Unit/
│       ├── CampaignDispatcherServiceTest.php     # Unit tests for DTO and dry-run reporting
│       └── SubscriberTest.php                    # Unit tests for deliverability rules
└── README.md
```

---

## 📊 Database Migration Schema

| Table | Purpose | Key Columns & Indexes |
|---|---|---|
| `email_campaigns` | Broadcast campaign metadata & aggregated metrics | `id`, `name`, `subject`, `body_template`, `status`, `batch_id`, `total_recipients`, `suppressed_count`, `sent_count`, `failed_count`, `scheduled_at`, `started_at`, `completed_at` (Index: `['status', 'scheduled_at']`) |
| `subscribers` | Audience contact list & deliverability state | `id`, `email` (unique), `first_name`, `last_name`, `is_subscribed`, `bounce_count`, `last_bounced_at` (Index: `['is_subscribed', 'bounce_count']`) |
| `campaign_dispatches` | Atomic dispatch ledger & idempotency tracker | `id`, `email_campaign_id`, `subscriber_id`, `idempotency_hash` (unique), `status`, `recipient_email`, `error_message`, `dispatched_at` (Index: `['email_campaign_id', 'status']`) |
| `job_batches` | Distributed queue batch tracking | `id` (uuid), `name`, `total_jobs`, `pending_jobs`, `failed_jobs`, `failed_job_ids`, `options`, `cancelled_at`, `created_at`, `finished_at` |

---

## 🚀 Step-by-Step Setup & Verification

### 1. Run Migrations & Seed Demo Data
```bash
php artisan migrate:fresh --seed
```

This populates 51 sample subscriber profiles:
- **35 Deliverable Subscribers**: `developer_{1..35}@enterprise.io` (Clean inbox)
- **8 Hard Bounces**: `bounced_user_{1..8}@dead-mailbox.com` (`bounce_count = 2`)
- **7 Unsubscribed**: `optout_user_{1..7}@privacy.org` (`is_subscribed = false`)
- **1 Simulated Fail Domain**: `gateway.fail-test@telecom.org` (Simulates network timeout)

### 2. Execute a Pre-Flight Dry Run
Verify audience segmentation and suppression isolation without queuing jobs or altering campaign state:
```bash
php artisan campaign:dispatch --dry-run
```

**Expected Visual Output:**
```
  🚀 ENTERPRISE EMAIL CAMPAIGN ENGINE                                DRY-RUN SIMULATION
  Campaign: Q3 Product Feature Announcement (ID: #1) | Subject: "Introducing Distributed Edge Cloud 2.0 ⚡"

  ⚡ Streaming subscriber pipeline and verifying suppressions... DONE

  📊 PRE-FLIGHT AUDIENCE AUDIT
  Total Subscriber Master Audience:             51
  Deliverable Pipeline Clean:                   36 (70.6%)
  Suppressed (Hard Bounces and Unsubscribes):   15 (29.4%)
  Queued Jobs / Bus Batch ID:                   0 jobs • None (Simulation)
```

### 3. Start Live Campaign Dispatch with In-Console Monitoring
For production asynchronous queue setups with Redis or Database workers:

**Terminal 1 (Start Queue Worker):**
```bash
php artisan queue:work --queue=default
```

**Terminal 2 (Execute Dispatch with Live Batch Monitor):**
```bash
php artisan campaign:dispatch --monitor
```

**Expected Telemetry Output:**
```
  🚀 ENTERPRISE EMAIL CAMPAIGN ENGINE                               LIVE QUEUE DISPATCH
  Campaign: Q3 Product Feature Announcement (ID: #1) | Subject: "Introducing Distributed Edge Cloud 2.0 ⚡"

  ⚡ Streaming subscriber pipeline and verifying suppressions... DONE

  📊 PRE-FLIGHT AUDIENCE AUDIT
  Total Subscriber Master Audience:             51
  Deliverable Pipeline Clean:                   36 (70.6%)
  Suppressed (Hard Bounces and Unsubscribes):   15 (29.4%)
  Queued Jobs / Bus Batch ID:                   36 jobs • 9c8f2a10-4b21-4d1e-8120-109283746152

  ⏳ LIVE QUEUE WORKER PROGRESS:
  [========================================] 100% -- Processed: 36/36 | Sent: 35 | Failed: 1

  BATCH BROADCAST FINALIZED:                    COMPLETED
  Delivered: 35 • Failed: 1 • Suppressed: 15
```

---

## 🧪 Automated Test Suite

Run the full PHPUnit / Pest test suite:
```bash
php artisan test
```

### Test Coverage Highlights
- ✅ **`SubscriberTest`**: Validates deliverability filtering rules, boolean states, and bounce thresholds.
- ✅ **`CampaignDispatcherServiceTest`**: Validates deterministic SHA-256 hash generation and zero-mutation dry-run reports.
- ✅ **`CampaignDispatchTest`**:
  - Validates $O(1)$ memory chunked streaming ingestion.
  - Validates pre-flight suppression isolation.
  - Validates idempotency uniqueness (no double-queuing or double-dispatching).
  - Validates `Bus::batch` job lifecycle and atomic campaign counters (`sent_count`, `failed_count`, `suppressed_count`).
  - Validates simulated ESP gateway failure handling and error logging.
  - Validates secondary safety suppression in worker handles for mid-flight bounces.
  - Validates Artisan command `--dry-run` and `--force` options.

---

## ⏰ Production Queue Scheduler Integration

To automate scheduled campaigns, the command is registered in `routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('campaign:dispatch --force')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
```
