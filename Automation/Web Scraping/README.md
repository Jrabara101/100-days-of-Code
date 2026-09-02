# Resilient Enterprise Web Scraping Pipeline

An enterprise-grade, high-performance web scraping and data aggregation pipeline built with Laravel 12+, PHP 8.4+, and native DOM/XPath abstractions.

```
   ┌───────────────────────┐      ┌─────────────────────────────┐      ┌─────────────────────────────┐
   │ POLITE TRANSPORT      │ ───► │ STRATEGY DOM PARSER (XPath) │ ───► │ DEDUPE & FINGERPRINTING     │
   │ (Jitter, UA Rotation) │      │ (Resilient Null-Safe DTOs)  │      │ (SHA-256 Unique Constraint) │
   └───────────────────────┘      └─────────────────────────────┘      └─────────────────────────────┘
                                                                                      │
                                                                                      ▼
                                                                       ┌─────────────────────────────┐
                                                                       │ STRUCTURED REPORTING        │
                                                                       │ (Termwind, CSV, JSON Export)│
                                                                       └─────────────────────────────┘
```

---

## 🚀 Architectural Foundations & Domain Safeguards

1. **Polite Transport Layer with Dynamic Jitter**:
   - Rotates randomized enterprise desktop User-Agents.
   - Configurable per-target base rate-limit delays ($T_{\text{delay}}$) with dynamic random jitter:
     $$\text{Latency} = T_{\text{delay}} + \text{rand}(50, 150)\text{ms}$$
   - Resilient HTTP retry policies and timeout controls.
   - Mock simulation fallback for local testing and isolated CI environments (`*.internal`).

2. **Cryptographic Deduplication Fingerprint Engine**:
   - Generates SHA-256 collision-resistant content hashes prior to ingestion:
     $$\text{Fingerprint} = \text{SHA-256}(\text{target\_id} \mathbin{\Vert} \text{canonical\_url} \mathbin{\Vert} \text{extracted\_title} \mathbin{\Vert} \text{numeric\_value\_cents})$$
   - Enforced by unique database constraints guaranteeing $O(1)$ duplicate discard without modifying audit histories.

3. **Native DOM/XPath Strategy Abstraction**:
   - Zero third-party scraper dependencies.
   - Utilizes PHP's native `DOMDocument` and `DOMXPath` with suppressed libxml error handling (`LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET`).
   - Strategy pattern (`ScraperStrategyInterface`) allowing pluggable parsers per domain/site structure with automatic fallback selectors.

4. **Terminal Telemetry & Structured Reporting**:
   - Rich interactive CLI dashboards powered by Laravel Termwind.
   - Live reconciliation summaries (Total Elements Extracted, Warehouse Persisted, Duplicates Intercepted).
   - Multi-format data export pipelines (`.csv`, `.json`).

---

## 📁 Pipeline Components

| Path | Description |
|---|---|
| [`database/migrations/2026_01_01_000001_create_scraping_pipeline_schema.php`](file:///Automation/Web%20Scraping/database/migrations/2026_01_01_000001_create_scraping_pipeline_schema.php) | Tables for `crawl_targets`, `scraped_records`, and `crawl_runs` |
| [`app/Models/CrawlTarget.php`](file:///Automation/Web%20Scraping/app/Models/CrawlTarget.php) | Target configuration entity with relationships |
| [`app/Models/ScrapedRecord.php`](file:///Automation/Web%20Scraping/app/Models/ScrapedRecord.php) | Ingested record with SHA-256 dedupe key and metadata |
| [`app/Models/CrawlRun.php`](file:///Automation/Web%20Scraping/app/Models/CrawlRun.php) | Execution telemetry, performance metrics, and audit log |
| [`app/Services/Scraper/Dto/ScrapedItemDto.php`](file:///Automation/Web%20Scraping/app/Services/Scraper/Dto/ScrapedItemDto.php) | Immutable DTO with deterministic SHA-256 fingerprinting |
| [`app/Services/Scraper/Contracts/ScraperStrategyInterface.php`](file:///Automation/Web%20Scraping/app/Services/Scraper/Contracts/ScraperStrategyInterface.php) | Strategy interface for HTML parser implementations |
| [`app/Services/Scraper/Strategies/TechNewsScraperStrategy.php`](file:///Automation/Web%20Scraping/app/Services/Scraper/Strategies/TechNewsScraperStrategy.php) | Resilient XPath strategy with price normalization and fallback parsing |
| [`app/Services/Scraper/ScrapingPipelineService.php`](file:///Automation/Web%20Scraping/app/Services/Scraper/ScrapingPipelineService.php) | Core execution service managing transport, parsing, transactions & telemetry |
| [`app/Console/Commands/ScrapePipelineCommand.php`](file:///Automation/Web%20Scraping/app/Console/Commands/ScrapePipelineCommand.php) | Artisan CLI command `scrape:pipeline` with Termwind telemetry |
| [`database/seeders/ScraperPipelineSeeder.php`](file:///Automation/Web%20Scraping/database/seeders/ScraperPipelineSeeder.php) | Seeders for initial mock & live crawl targets |
| [`routes/console.php`](file:///Automation/Web%20Scraping/routes/console.php) | Scheduler configuration for automated background crawls |

---

## 🛠️ Installation & Verification

### 1. Run Migrations & Seed Targets
```bash
php artisan migrate:fresh
php artisan db:seed --class=Database\Seeders\ScraperPipelineSeeder
```

### 2. Execute Pre-Flight Dry-Run
Parse DOM structures without committing database mutations:
```bash
php artisan scrape:pipeline --dry-run
```

### 3. Execute Live Scraping with CSV/JSON Export
```bash
# Export to CSV
php artisan scrape:pipeline --export=storage/app/scraped_feed.csv

# Export to JSON
php artisan scrape:pipeline --export=storage/app/daily_crawl.json
```

### 4. Verify Cryptographic Content Deduplication
Running the pipeline a second time intercepts existing records:
```bash
php artisan scrape:pipeline
```
*Output demonstrates `New Saved: 0` and `Deduplicated: 33`.*

### 5. Filter Targets & Override Delays
```bash
# Scrape only target ID 1 with 100ms rate-limiting delay override
php artisan scrape:pipeline --target=1 --rate-limit=100
```

---

## 🧪 Automated Testing

Execute the test suite with PHPUnit:
```bash
php artisan test
```

Includes 100% passing tests for:
- Deterministic DTO fingerprint generation and hash change assertions
- Strategy XPath selector parsing, price normalization, and malformed HTML resilience
- Database transactions, duplicate interception, and audit telemetry in `ScrapingPipelineService`
- Full CLI command execution, dry-run mode, and CSV/JSON export generation
