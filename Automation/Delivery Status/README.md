# Enterprise Delivery Status Synchronization & Normalization Platform

An enterprise-grade, high-throughput Delivery Status Synchronization and Normalization engine built in PHP CLI. The platform orchestrates heterogeneous carrier webhook streams and polling gateways (FedEx, DHL, UPS, local couriers), resolving **out-of-order webhook arrivals**, **carrier-specific taxonomy divergence**, and **duplicate event ingestion** using a **Monotonic State Machine**, **Cryptographic SHA-256 Idempotency Seals**, and a **Transactional Webhook Outbox**.

---

## 🏛️ Architectural Overview & Reasoning Logic

```
   ┌────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
   │ CARRIER WEBHOOK / POLL │ ───► │ TAXONOMY & SEQUENCE GUARD    │ ───► │ WEBHOOK DISPATCH & AUDIT    │
   │ (Raw Carrier Payloads) │      │ (Monotonic Rank & Dedupe)    │      │ (Downstream Merchant Event) │
   └────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
```

In distributed logistics, carrier status updates suffer from latency anomalies, network jitter, and retries. An `OUT_FOR_DELIVERY` scan can easily hit ingestion endpoints after a `DELIVERED` event. Without state sequence guards, database records risk regressing into invalid historic states.

### Core Architectural Pillars

1. **Monotonic State Machine & Sequence Guard**:
   Each canonical status is assigned an immutable ordinal weight ($W$):
   $$\text{State Weight } W = \begin{cases} 
   \text{MANIFEST\_CREATED}: 10, & \text{PICKED\_UP}: 20, \\ 
   \text{IN\_TRANSIT}: 30, & \text{OUT\_FOR\_DELIVERY}: 40, \\ 
   \text{DELIVERY\_ATTEMPTED}: 45, & \text{DELIVERED}: 50 \text{ (Terminal)}, \\
   \text{EXCEPTION}: 99
   \end{cases}$$
   - State mutation is permitted **only** if $W_{\text{new}} \ge W_{\text{current}}$ or when transitioning into an explicit `EXCEPTION` branch.
   - Out-of-order events are preserved in the chronological `tracking_checkpoints` ledger with `is_out_of_order = 1` without mutating the parent shipment state.

2. **Carrier Adapter Strategy Layer (`CarrierAdapterInterface`)**:
   Normalizes proprietary carrier vocabularies into unified canonical domain models:
   - **FedEx**: `OC` $\to$ `MANIFEST_CREATED`, `PU` $\to$ `PICKED_UP`, `IT`/`AR`/`DP` $\to$ `IN_TRANSIT`, `OD` $\to$ `OUT_FOR_DELIVERY`, `DL` $\to$ `DELIVERED`, `DE`/`SE` $\to$ `EXCEPTION`.
   - **DHL**: `PL` $\to$ `MANIFEST_CREATED`, `PU` $\to$ `PICKED_UP`, `DF`/`WC` $\to$ `IN_TRANSIT`, `OD` $\to$ `OUT_FOR_DELIVERY`, `OK` $\to$ `DELIVERED`, `NH`/`CR` $\to$ `EXCEPTION`.
   - **UPS**: `M` $\to$ `MANIFEST_CREATED`, `P` $\to$ `PICKED_UP`, `I` $\to$ `IN_TRANSIT`, `O` $\to$ `OUT_FOR_DELIVERY`, `D` $\to$ `DELIVERED`, `X` $\to$ `EXCEPTION`.

3. **Cryptographic Event Deduplication (Idempotency Hash)**:
   Every inbound webhook computes an invariant signature:
   $$\text{Idempotency Key} = \text{SHA-256}(\text{shipment\_id} \mathbin{\Vert} \text{carrier\_event\_id} \mathbin{\Vert} \text{canonical\_status} \mathbin{\Vert} \text{event\_timestamp})$$
   Enforced via SQLite `UNIQUE(idempotency_hash)` to discard duplicate webhook deliveries at $O(1)$.

4. **Transactional Merchant Webhook Outbox Pattern**:
   State advances atomically insert downstream merchant callbacks into `webhook_outbox`. Retries implement exponential backoff:
   $$\text{Next Retry Interval} = \min(60 \times 2^{\text{attempt\_count}}, 3600\text{ seconds})$$

5. **Cryptographic Audit Trail**:
   All state changes and sequence intercept events are recorded in `sync_audit_logs` sealed with a SHA-256 signature.

---

## 🗄️ Database Vault Schema (`delivery_vault.sqlite`)

- **`shipments`**: Master record containing tracking number, carrier code, recipient details, canonical status, ordinal status weight, estimated delivery, and synchronization timestamps.
- **`tracking_checkpoints`**: Chronological ledger of all carrier scans, raw status codes, locations, out-of-order flags, and SHA-256 idempotency hashes.
- **`webhook_outbox`**: Transactional outbox queue for merchant notifications with retry counts and next retry timestamps.
- **`sync_audit_logs`**: Tamper-evident ledger of sync engine actions sealed with cryptographic hashes.

---

## 🚀 Usage & Commands

### Prerequisites
- PHP 8.1+ with `ext-pdo` and `ext-pdo_sqlite` extensions enabled.

### 1. Interactive Operations Workspace
Launch the full ANSI TUI interactive operations dashboard:
```bash
php delivery_sync_platform.php
```

#### Menu Options:
1. **Simulate Carrier Webhook Event**: Test live ingestion, state transitions, duplicate deduplication, and out-of-order sequence guards.
2. **Inspect Shipment History & Checkpoint Timeline**: View package journey details and chronological scan timelines with `[OUT-OF-ORDER SCAN]` flags.
3. **View Global Shipments Grid & Progress Bar**: Display active shipments, destination cities, status badges, and journey progress percentages.
4. **Dispatch Downstream Merchant Webhooks Outbox**: Flush pending merchant webhooks with simulated HTTP network latency and backoff retry logic.
5. **Audit Synchronization SHA-256 Ledger**: Inspect the cryptographic audit ledger.
0. **Disconnect Platform**: Clean exit.

### 2. Headless Sync Mode (Cron / Schedulers)
Run a single headless pass to dispatch pending outbox webhooks:
```bash
php delivery_sync_platform.php --sync
```

Example cron setup (every 5 minutes):
```bash
*/5 * * * * /usr/bin/php /path/to/delivery_sync_platform.php --sync >> /var/log/delivery_sync.log 2>&1
```

### 3. Continuous Daemon Mode
Run a persistent background daemon polling carrier updates and processing outbox notifications:
```bash
php delivery_sync_platform.php --daemon
```

---

## 🧪 Simulation Walkthrough & Verification Scenarios

| Test Scenario | Action / Input | Expected Result | Guard Mechanism |
| :--- | :--- | :--- | :--- |
| **Normal Status Progression** | Select `FDX-9901-US`, choose Scenario `[1] Out for Delivery (OD)` | Status advances `IN_TRANSIT` $\to$ `OUT_FOR_DELIVERY` ($W=30 \to W=40$), progress jumps to 80%, merchant webhook enqueued | Monotonic Sequence Guard ($W_{\text{new}} \ge W_{\text{current}}$) |
| **Out-of-Order Replay Guard** | Select `FDX-9901-US`, choose Scenario `[3] Out-of-Order Replay (PU)` | Checkpoint recorded with `is_out_of_order = 1`, parent status safely preserved at `OUT_FOR_DELIVERY` | Sequence Guard Interceptor ($W=20 < W=40$) |
| **Duplicate Webhook Delivery** | Replay identical webhook event twice | Second event discarded at database layer with zero state mutation | SHA-256 Idempotency Hash Seal |
| **Carrier Taxonomy Normalization** | Ingest DHL `WC` or UPS `I` | Unified domain status `IN_TRANSIT` assigned seamlessly | Strategy Pattern Carrier Adapters |
| **Merchant Outbox Dispatch** | Execute Outbox Dispatch (Option 4 / `--sync`) | Pending webhooks dispatched with backoff on failure | Transactional Outbox & Exponential Backoff |
