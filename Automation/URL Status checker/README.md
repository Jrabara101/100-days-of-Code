# URL Status Checker — PHP CLI Automation Tool

```
╔══════════════════════════════════════════════════════════╗
║         URL STATUS CHECKER — PHP CLI Edition             ║
║         Professional HTTP Status Automation Tool         ║
║                   Version 1.0.0 • 2026                   ║
╚══════════════════════════════════════════════════════════╝
```

A professional **PHP CLI automation tool** that checks the HTTP status of one or multiple URLs. It validates URLs, performs cURL requests with retry logic, displays color-coded results in a polished terminal interface, logs results, and exports to CSV.

---

## 📁 Project Structure

```
url-status-checker/
│
├── app/
│   ├── UrlChecker.php      ← Core HTTP checker engine (cURL, validation, retry)
│   ├── ConsoleStyle.php    ← ANSI terminal styling (colors, tables, banners)
│   ├── FileLogger.php      ← Plain-text log file writer
│   └── CsvExporter.php     ← CSV export with UTF-8 BOM for Excel
│
├── storage/
│   ├── logs/               ← url-checks.log (auto-created)
│   └── exports/            ← url-check-YYYY-MM-DD_HH-MM-SS.csv (auto-created)
│
├── urls.txt                ← Sample URL list (edit as needed)
├── checker.php             ← CLI entry point
└── README.md               ← This file
```

---

## ⚙️ Requirements

| Requirement | Minimum Version |
|-------------|----------------|
| PHP         | 8.1+           |
| Extensions  | `curl`, `mbstring` |
| OS          | Windows / Linux / macOS |
| Run via     | Command Prompt / Terminal |

### Verify Requirements

```bash
php --version
php -m | findstr curl
php -m | findstr mbstring
```

---

## 🚀 Installation & Setup

1. **Clone or download** this project into any directory.
2. **No Composer needed** — this project uses pure PHP with PSR-4 autoloading via `spl_autoload_register`.
3. Ensure `storage/logs/` and `storage/exports/` directories are writable (created automatically on first run).

---

## 🖥️ Usage

### Check a Single URL

```bash
php checker.php https://www.google.com
```

### Check Multiple URLs from File

```bash
php checker.php --file=urls.txt
```

### With Custom Timeout and Retries

```bash
php checker.php --file=urls.txt --timeout=15 --retries=3
```

### Disable Logging or CSV Export

```bash
php checker.php --file=urls.txt --no-log
php checker.php --file=urls.txt --no-csv
php checker.php https://example.com --no-log --no-csv
```

### Show Help

```bash
php checker.php --help
```

---

## 📋 CLI Options

| Option            | Description                                   | Default |
|-------------------|-----------------------------------------------|---------|
| `<url>`           | Single URL to check                           | —       |
| `--file=<path>`   | Path to text file with URLs (one per line)    | —       |
| `--timeout=<int>` | Request timeout in seconds                    | `10`    |
| `--retries=<int>` | Number of retry attempts on failure           | `1`     |
| `--no-log`        | Disable log file writing                      | logging ON |
| `--no-csv`        | Disable CSV export                            | export ON |
| `--help`          | Display help screen                           | —       |

---

## 📄 urls.txt Format

```text
# Lines starting with # are comments — they are skipped
# Blank lines are also skipped

https://www.google.com
https://www.github.com
https://httpbin.org/status/404
not-a-valid-url
```

---

## 🎨 Color-Coded Output

| Color       | Category              | Meaning                              |
|-------------|-----------------------|--------------------------------------|
| 🟢 Green    | **Online**            | 2xx — URL is reachable               |
| 🟡 Yellow   | **Redirecting**       | 3xx — URL redirects to another       |
| 🔴 Red      | **Client Error**      | 4xx — Client-side error (404, 403…)  |
| 🔴 Dark Red | **Server Error**      | 5xx — Server-side error (500, 503…)  |
| 🟣 Magenta  | **Invalid URL**       | Malformed or non-http/https URL      |
| ⚫ Gray     | **Timeout / Failed**  | Connection failed or timed out       |

---

## 📤 Output Files

### Log File

Located at: `storage/logs/url-checks.log`

Each run appends a new session block:
```
================================================================================
  URL STATUS CHECKER — Session Log
  Date       : 2026-04-27 09:00:00
  URLs Queued: 5
  Timeout    : 10s
  Retries    : 1
================================================================================

------------------------------------------------------------
  URL        : https://www.google.com
  Status     : 200
  Meaning    : OK
  Category   : Online
  Resp. Time : 123.45 ms
  Redirected : No
  Checked At : 2026-04-27 09:00:01
```

### CSV Export

Located at: `storage/exports/url-check-YYYY-MM-DD_HH-MM-SS.csv`

Columns:
> URL | Valid | HTTP Status Code | Status Meaning | Category | Response Time (ms) | Redirected | Redirect Count | Final URL | Error | Checked At

---

## 🔍 How It Works

### Architecture Overview

```
checker.php (Entry Point)
    │
    ├── Parses CLI arguments
    ├── Loads URLs (single or from file)
    │
    ├── UrlChecker.php
    │   ├── isValidUrl()         → PHP filter_var validation
    │   ├── performRequest()     → cURL HEAD request
    │   ├── retry logic          → up to N attempts
    │   ├── categorize()         → 2xx/3xx/4xx/5xx/Error
    │   └── summarize()          → aggregate stats
    │
    ├── ConsoleStyle.php
    │   ├── banner()             → ASCII title banner
    │   ├── table()              → Unicode box-drawing table
    │   ├── progress()           → live progress bar
    │   └── dashboard()          → summary stat tiles
    │
    ├── FileLogger.php
    │   └── logResult()          → appends to url-checks.log
    │
    └── CsvExporter.php
        └── export()             → creates timestamped CSV
```

### cURL Configuration

Each request uses:
- **HEAD request** (no response body) for speed
- **SSL verification disabled** (for self-signed certs)
- **Follow redirects** with max 10 hops
- **Custom User-Agent**: `UrlStatusChecker/1.0 (PHP CLI Tool)`
- **Encoding**: Accepts compressed responses

---

## 📊 Example Terminal Output

```
  ✔ Loaded 5 URL(s) from: urls.txt

┌─────────────────────────────────────────────┐
│  Configuration                               │
│    URLs     : 5                              │
│    Timeout  : 10 seconds                     │
│    Retries  : 1                              │
│    Logging  : Enabled                        │
│    CSV      : Enabled                        │
└─────────────────────────────────────────────┘

──────────────────────────────────────────────────────────
  CHECKING URLS
──────────────────────────────────────────────────────────

  [██████████████████████████████] 100%  (5/5)

──────────────────────────────────────────────────────────
  RESULTS
──────────────────────────────────────────────────────────

┌─────┬──────────────────────────────────────┬──────┬──────────────...
│ #   │ URL                                  │ Code │ Status Meaning...
├─────┼──────────────────────────────────────┼──────┼──────────────...
│ 1   │ https://www.google.com               │ 200  │ OK           ...
│ 2   │ https://httpbin.org/status/404       │ 404  │ Not Found    ...
│ 3   │ not-a-url                            │ -    │ Invalid or…  ...
└─────┴──────────────────────────────────────┴──────┴──────────────...

  ✔ CSV exported → storage/exports/url-check-2026-04-27_09-00-00.csv
  ✔ Log saved   → storage/logs/url-checks.log
  ✔ Done! All checks completed at 09:00:05.
```

---

## 💡 Future Improvements

| Feature | Description |
|---------|-------------|
| **Async checking** | Use `curl_multi_exec` for parallel requests |
| **JSON export** | Add `--format=json` output option |
| **HTML report** | Generate a styled HTML report per run |
| **Cron support** | Schedule daily checks via Task Scheduler / cron |
| **SMTP alerts** | Email notification on critical errors |
| **Config file** | Load defaults from `config.ini` or `.env` |
| **Whitelist/Blacklist** | Filter URLs by domain patterns |
| **Response size** | Track and display response body size |
| **HTTP/2 support** | Force HTTP/2 with CURLOPT_HTTP_VERSION |
| **Proxy support** | Route requests through a proxy server |

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

*Built with ❤️ using PHP 8.1+ — No external dependencies required.*
