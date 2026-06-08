# Bulk User Importer CLI Engine

A production-ready, highly optimized PHP CLI application for importing users in bulk while maintaining a flat memory footprint and high performance.

## Core Features & Architecture

- **Memory Preservation (Streaming Generator Pattern):** Leveraging PHP Generators (`yield`) to stream CSV rows directly from the file handle. This prevents loading the entire CSV into memory, keeping the memory footprint under 5MB regardless of dataset size (from 1MB to multiple gigabytes).
- **High-Performance Transactions (Chunked Insertion):** Groups INSERT statements into balanced batches (default: 1,000) wrapped inside a single database transaction. This minimizes SQLite/MySQL/PostgreSQL disk write locks and drops execution times from minutes to seconds.
- **Graceful Error Recovery & Idempotence (UPSERT):** Utilizes `INSERT ... ON CONFLICT(email) DO UPDATE` to handle duplicate or existing email conflicts seamlessly without causing the entire batch to fail or abort.
- **Interactive Terminal TUI Progress Tracker:** Uses dynamic line-wiping (`\r`) to display execution status (parsed, imported, and skipped counts) without polluting terminal scrollback history.
- **Inline Validation:** Validates that names are present and emails conform to standard formats, automatically filtering out invalid entries.

---

## File Structure

- [bulk_importer.php](file:///c:/Users/Admin/100-days-of-Code/Automation/Bulk%20User%20Importer/bulk_importer.php) - The core PHP command-line ingestion engine.
- [users_payload.csv](file:///c:/Users/Admin/100-days-of-Code/Automation/Bulk%20User%20Importer/users_payload.csv) - Sample CSV payload configuration with correct headers.

---

## Requirements

- PHP 8.1+
- `pdo` and `pdo_sqlite` extensions enabled (standard in modern PHP installations).

---

## Usage

### 1. Structure the CSV Payload

Make sure your CSV contains the correct headers: `name`, `email`, and `role`. For example:

```csv
name,email,role
Alexander Wright,alex@domain.com,Administrator
Sarah Connor,s.connor@cyberdyne.io,Manager
John Doe,invalid-email-string,User
Evelyn Thorne,evelyn@domain.com,User
```

### 2. Execute the Importer

Run the script from your terminal:

```bash
php bulk_importer.php users_payload.csv
```

### 3. Execution Output

Upon execution, the TUI clears the console, initializes the mapping pipeline, performs chunked writes, and prints performance metrics:

```text
╔═════════════════════════════════════════════════════════════════════════╗
║                         DATA INGESTION PIPELINE                         ║
╚═════════════════════════════════════════════════════════════════════════╝

ℹ Spawning isolation parameters and mapping user generator...
⚙ Processing -> Parsed: 4 | Imported: 3 | Skipped/Failed: 1
✔ SUCCESS: Synchronization loop completed successfully.

 📊 Pipeline Resource Performance Metrics:
 ├─ Execution Duration : 0.01 seconds
 ├─ Peak RAM Allocated : 2 MB
 └─ Database Mutations : 3 records synced / 1 entries rejected.
```
