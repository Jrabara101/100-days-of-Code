# Enterprise Data Warehouse ETL Pipeline in Laravel

[![Laravel](https://img.shields.io/badge/Laravel-11%2B%20%7C%2012%2B-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.3%20%7C%208.4-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Architecture](https://img.shields.io/badge/Architecture-Kimball%20Star%20Schema-0ea5e9?style=for-the-badge)](https://en.wikipedia.org/wiki/Star_schema)
[![Telemetry](https://img.shields.io/badge/CLI%20Telemetry-Termwind-10b981?style=for-the-badge)](https://github.com/nunomaduro/termwind)

An enterprise-grade, high-throughput **ETL (Extract, Transform, Load)** pipeline built in Laravel to bridge transactional OLTP systems and analytical OLAP stores (such as Snowflake, ClickHouse, Amazon Redshift, or a dedicated PostgreSQL/SQLite analytical warehouse).

---

## 1. Architectural Problems Solved

A naive ETL script that runs `Model::all()` or relies on standard `OFFSET`/`LIMIT` chunking introduces three critical failure modes:

| Failure Mode | Root Cause | Enterprise Safeguard Implemented |
|---|---|---|
| **$O(N^2)$ Query Degradation** | `chunk()` uses `OFFSET`, forcing the DB engine to scan and discard millions of rows on deep offsets. | **$O(1)$ Cursor Seek** via `chunkById()` index seek on `(updated_at, id)`. |
| **Eloquent Memory Leaks** | Model hydration loops retain model references, relation trees, and query logs in RAM. | **Direct Query Builder streams** with typed readonly DTO mapping and instant garbage collection. |
| **Silent Data Loss (Clock Drift)** | Clocks drift across distributed application servers and databases; records committed during an ETL run are bypassed on the next run. | **High-Water Mark (HWM) Overlap Buffer** ($\Delta t = 5\text{m}$) combined with **idempotent warehouse upserts**. |

```
   ┌────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
   │ INCREMENTAL EXTRACTION │ ───► │ IN-MEMORY VECTOR TRANSFORM   │ ───► │ IDEMPOTENT WAREHOUSE LOAD   │
   │ (HWM with Drift Buffer)│      │ (Denormalization & Cents)    │      │ (Bulk Upsert & Checkpoint)  │
   └────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
                                                                                        │
                                                                                        ▼
                                                                         ┌─────────────────────────────┐
                                                                         │ TERMWIND TELEMETRY REPORT   │
                                                                         │ (Latency, Throughput, Memory)│
                                                                         └─────────────────────────────┘
```

---

## 2. Engineering Safeguards & Mathematics

### Indexed Primary Key Cursor Extraction ($O(1)$)
Instead of pagination scans:
$$\text{SELECT } * \text{ FROM orders WHERE id } > \text{last\_id ORDER BY id ASC LIMIT 1000}$$
`chunkById` uses an index seek to pull batches without re-scanning preceding records.

### High-Water Mark with Clock-Drift Overlap Buffer
The extraction window begins before the previous checkpoint anchor to capture transactions delayed by commit latency or clock skew:
$$\text{Window Start} = T_{\text{last\_sync}} - \Delta t_{\text{lookback}} \quad (\text{Default: } 5\text{ minutes})$$
Because records within the lookback buffer may be extracted more than once, the warehouse schema enforces idempotency via composite unique keys and database upserts (`ON CONFLICT DO UPDATE`).

### Star Schema Denormalization & Financial Precision
- **`dim_customers`**: Slowly Changing Dimension (SCD Type 1) tracking customer attributes and email domains.
- **`fact_orders`**: Dimensional sales fact with `order_date_key` (`YYYY-MM-DD`).
- **Minor-Unit Monetary Storage**: All financial calculations are executed strictly in integer cents (e.g., `$108.00` $\rightarrow$ `10800`), eliminating binary floating-point rounding anomalies.

### Multi-Connection Transaction Isolation
- Extraction runs as read-only against the OLTP connection or read replica (`DB::table('orders')`).
- Loading targets the analytical warehouse connection (`DB::connection('warehouse')`) inside an isolated atomic transaction.

---

## 3. Database Schema

### Checkpoint Ledger (`etl_checkpoints`)
Tracks sync progress, high-water marks, execution time, and error state:
```php
Schema::create('etl_checkpoints', function (Blueprint $table) {
    $table->id();
    $table->string('pipeline_name')->unique();
    $table->dateTime('last_high_water_mark');
    $table->unsignedBigInteger('last_processed_id')->default(0);
    $table->string('status')->default('IDLE'); // IDLE, RUNNING, FAILED
    $table->unsignedBigInteger('total_rows_synced')->default(0);
    $table->float('last_duration_seconds')->default(0.0);
    $table->text('last_error')->nullable();
    $table->timestamps();
});
```

### Warehouse Fact Table (`fact_orders` on `warehouse` connection)
```php
Schema::connection('warehouse')->create('fact_orders', function (Blueprint $table) {
    $table->id('fact_id');
    $table->unsignedBigInteger('order_id')->unique(); // Natural OLTP Key
    $table->unsignedBigInteger('customer_key')->index();
    $table->string('order_status', 32);
    $table->unsignedInteger('item_count');
    $table->unsignedBigInteger('subtotal_cents');
    $table->unsignedBigInteger('tax_cents');
    $table->unsignedBigInteger('discount_cents');
    $table->unsignedBigInteger('total_net_cents');
    $table->date('order_date_key')->index();
    $table->dateTime('ordered_at_utc');
    $table->dateTime('etl_ingested_at');
    $table->timestamps();
});
```

### Warehouse Dimension Table (`dim_customers` on `warehouse` connection)
```php
Schema::connection('warehouse')->create('dim_customers', function (Blueprint $table) {
    $table->unsignedBigInteger('customer_key')->primary();
    $table->string('email_domain', 128)->index();
    $table->string('country_code', 3)->default('USA')->index();
    $table->string('lifetime_tier', 32)->default('BRONZE');
    $table->dateTime('account_created_at');
    $table->dateTime('etl_updated_at');
    $table->timestamps();
});
```

---

## 4. Configuration & Dual Connections

Configure `config/database.php` with default OLTP and analytical warehouse connections:

```php
'connections' => [
    'sqlite' => [
        'driver' => 'sqlite',
        'database' => env('DB_DATABASE', database_path('database.sqlite')),
        'prefix' => '',
        'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
    ],

    'warehouse' => [
        'driver' => env('WAREHOUSE_DB_CONNECTION', 'sqlite'),
        'host' => env('WAREHOUSE_DB_HOST', '127.0.0.1'),
        'port' => env('WAREHOUSE_DB_PORT', '5432'),
        'database' => env('WAREHOUSE_DB_DATABASE', database_path('warehouse.sqlite')),
        'username' => env('WAREHOUSE_DB_USERNAME', 'warehouse_user'),
        'password' => env('WAREHOUSE_DB_PASSWORD', ''),
        'prefix' => '',
        'search_path' => 'public',
        'sslmode' => 'prefer',
    ],
],
```

---

## 5. CLI Execution & Operational Verification

### 1. Pre-flight Dry-Run Simulation
Simulate query extraction, in-memory transformations, throughput, and memory without committing to the warehouse:
```bash
php artisan etl:warehouse-sync --dry-run
```

Output:
```text
  ⚡ ENTERPRISE DATA WAREHOUSE ETL SYNC             DRY-RUN SIMULATION
  Chunk: 1000 | Drift Buffer: 5m | Target: fact_orders & dim_customers
  Loading warehouse batches: ... DONE

  📊 TELEMETRY RECONCILIATION REPORT
  Total Records Extracted:               2500
  Idempotently Upserted into Warehouse: 0
  Dry-Run Skipped Rows:                  2500
  Execution Duration:                    0.13s (19231 rows/sec)
  Peak Memory Consumption:               30 MB
  New High-Water Mark Anchor:            2026-09-07T00:51:01+00:00
```

### 2. Live Incremental Sync
Run incremental extraction and load:
```bash
php artisan etl:warehouse-sync --chunk=500 --lookback=5
```

Output:
```text
  ⚡ ENTERPRISE DATA WAREHOUSE ETL SYNC             INCREMENTAL HWM SYNC
  Chunk: 500 | Drift Buffer: 5m | Target: fact_orders & dim_customers
  Loading warehouse batches: ..... DONE

  📊 TELEMETRY RECONCILIATION REPORT
  Total Records Extracted:               2500
  Idempotently Upserted into Warehouse: 2500
  Dry-Run Skipped Rows:                  0
  Execution Duration:                    0.27s (9259 rows/sec)
  Peak Memory Consumption:               30 MB
  New High-Water Mark Anchor:            2026-09-07T00:51:05+00:00
```

### 3. Full Historical Backfill
Re-sync entire history from epoch 0:
```bash
php artisan etl:warehouse-sync --full-refresh --force
```

---

## 6. Scheduling (Laravel 11+)

In `routes/console.php`:
```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('etl:warehouse-sync --force')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
```

---

## 7. Automated Testing

The automated test suite in `tests/Feature/WarehouseEtlTest.php` validates:
1. Dry-run safety (zero warehouse writes or checkpoints).
2. Live incremental sync, mathematical transformation, and SCD Type 1 upsert.
3. Drift-window re-execution idempotency (strict zero duplicate inserts).
4. Artisan command exit codes and CLI output.

Run tests:
```bash
php vendor/phpunit/phpunit/phpunit
```

Test Results:
```text
{"tool":"phpunit","result":"passed","tests":4,"passed":4,"assertions":33,"duration_ms":1518}
```
