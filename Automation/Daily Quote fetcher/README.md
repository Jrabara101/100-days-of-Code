# ✦ Daily Quote Fetcher from API

> A production-grade PHP 8.2 CLI tool that fetches daily inspirational quotes from a public API, renders elegant terminal output, saves results to structured files, and generates premium HTML quote cards — ready for cron automation.

```
──────────────────────────────────────────────────────────────────
          ✦  DAILY QUOTE FETCHER  ✦
       Powered by ZenQuotes API  |  v1.0.0
──────────────────────────────────────────────────────────────────

  ────────────────────────────────────────────────────────────────
  │
  │ "The only way to do great work is to love what you do."
  │
  │ — Steve Jobs
  │
  │   Fetched: Mon, 21 Apr 2026  09:00:28 UTC
  ────────────────────────────────────────────────────────────────

 ✔ SAVED   Text  → storage/output/quote-2026-04-21.txt
 ✔ SAVED   JSON  → storage/output/quote-2026-04-21.json
 ✔ SAVED   HTML  → storage/html/quote-2026-04-21.html
```

---

## 📁 Folder Structure

```
Daily Quote fetcher/
├── bin/
│   └── quote.php               ← CLI entry point
├── src/
│   ├── App/
│   │   └── Application.php     ← Orchestrator
│   ├── Cli/
│   │   ├── CliOptions.php      ← Parsed options (value object)
│   │   ├── CliParser.php       ← Argument parser
│   │   └── Formatter.php       ← ANSI terminal output engine
│   ├── Exception/
│   │   ├── ApiException.php
│   │   ├── CliException.php
│   │   ├── DuplicateQuoteException.php
│   │   └── StorageException.php
│   ├── Model/
│   │   └── Quote.php           ← Immutable domain model
│   ├── Renderer/
│   │   └── HtmlRenderer.php    ← Premium HTML card generator
│   ├── Service/
│   │   ├── Logger.php          ← File logger
│   │   └── QuoteApiService.php ← HTTP API client with retry
│   └── Storage/
│       └── StorageHandler.php  ← Persistence layer
├── storage/
│   ├── html/                   ← Generated HTML pages
│   ├── logs/                   ← Daily log files
│   └── output/                 ← .txt and .json quotes
├── .env                        ← Your local config (NOT committed)
├── .env.example                ← Config template
├── .gitignore
├── composer.json
└── README.md
```

---

## ⚡ Quick Setup

### Prerequisites
- PHP **8.2+** with `mbstring`, `curl`, `json` extensions
- [Composer](https://getcomposer.org/) installed globally

### 1. Navigate to project directory

```bash
cd "Daily Quote fetcher"
```

### 2. Install dependencies

```bash
composer install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if you want a different API URL or log level
```

### 4. Run it!

```bash
php bin/quote.php
```

---

## 🎛️ CLI Options

| Option | Description |
|---|---|
| `--save` | Save quote to dated `.txt` file |
| `--json` | Save quote to dated `.json` file |
| `--html` | Generate premium HTML quote card |
| `--verbose` | Show detailed request/response info |
| `--api-url=URL` | Override the API endpoint at runtime |
| `--version` | Print version and PHP info |
| `--help` | Show full help screen |

---

## 🚀 Example Commands

```bash
# Fetch and display only (no files saved)
php bin/quote.php

# Fetch and save as text
php bin/quote.php --save

# Fetch and save as both text and JSON
php bin/quote.php --save --json

# Fetch, save all formats, generate HTML, show verbose output
php bin/quote.php --save --json --html --verbose

# Use a different API endpoint (random instead of today)
php bin/quote.php --save --json --api-url=https://zenquotes.io/api/random

# Quiet mode for cron (redirect stdout to log)
php bin/quote.php --save --json --html >> /var/log/quote-cron.log 2>&1
```

---

## 🕐 Cron Job Setup

### Linux / macOS (crontab)

```cron
# Fetch daily quote at 08:00 every day
0 8 * * * cd /path/to/Daily-Quote-fetcher && php bin/quote.php --save --json --html >> storage/logs/cron.log 2>&1
```

### Windows Task Scheduler (batch file approach)

Create `run_quote.bat`:
```bat
@echo off
cd /d "C:\Users\Admin\100-days-of-Code\Automation\Daily Quote fetcher"
php bin\quote.php --save --json --html
```

Then in Task Scheduler:
- **Trigger**: Daily at 08:00
- **Action**: Run `run_quote.bat`

---

## 📤 Sample Outputs

### `storage/output/quote-2026-04-21.txt`
```
─────────────────────────────────────────────
DAILY QUOTE — Mon, 21 Apr 2026
─────────────────────────────────────────────

"The only way to do great work is to love what you do."

  — Steve Jobs

Source    : ZenQuotes API
Fetched At: 2026-04-21 09:00:28 UTC
─────────────────────────────────────────────
```

### `storage/output/quote-2026-04-21.json`
```json
{
    "meta": {
        "generator": "DailyQuoteFetcher/1.0",
        "generated": "2026-04-21T09:00:28+00:00",
        "schema": "1.0"
    },
    "quote": {
        "quote": "The only way to do great work is to love what you do.",
        "author": "Steve Jobs",
        "source": "ZenQuotes API",
        "fetched_at": "2026-04-21T09:00:28+00:00",
        "date": "2026-04-21"
    }
}
```

---

## 🛡️ Features

| Feature | Detail |
|---|---|
| **Retry logic** | Exponential back-off (3 attempts, 2s base delay) |
| **Duplicate prevention** | One quote file per calendar day |
| **Exit codes** | `0` success · `1` soft error · `2` config error · `3` fatal |
| **TTY detection** | ANSI colours only when output is a real terminal |
| **Cron-safe** | Clean plain-text output when piped or redirected |
| **Daily logs** | Dated log files with configurable level filter |
| **HTML card** | Responsive, dark, glassmorphism design with hover polish |
| **OOP / PSR-4** | Namespaced, strict-typed, autoloaded |
| **`.env` config** | All settings configurable without code changes |

---

## 🗺️ Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | API fetch failed or storage write failed |
| `2` | Configuration error (bad `.env`, missing dirs) |
| `3` | Unexpected fatal error |

---

## 🔭 Future Improvements

- [ ] Support additional quote APIs (Quotable.io, API Ninjas, etc.)
- [ ] Database storage (SQLite / MySQL) for quote history
- [ ] Telegram / Slack / Discord webhook notifications
- [ ] Quote de-duplication by content hash (not just date)
- [ ] `--format=markdown` output option
- [ ] Stats command: `php bin/quote.php --stats` (total saved, streak, etc.)
- [ ] Docker container with pre-configured cron
- [ ] PHPUnit test suite

---

## 📋 Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `QUOTE_API_URL` | `https://zenquotes.io/api/today` | API endpoint |
| `QUOTE_API_TIMEOUT` | `10` | HTTP timeout (seconds) |
| `QUOTE_API_RETRY_ATTEMPTS` | `3` | Max retry count |
| `QUOTE_API_RETRY_DELAY` | `2` | Base delay between retries (seconds) |
| `STORAGE_DIR` | `storage` | Root storage path |
| `LOG_DIR` | `storage/logs` | Log file directory |
| `OUTPUT_DIR` | `storage/output` | Text/JSON output directory |
| `HTML_OUTPUT_DIR` | `storage/html` | HTML output directory |
| `LOG_LEVEL` | `info` | Min log level (`debug/info/warning/error/critical`) |
| `LOG_ENABLED` | `true` | Enable/disable file logging |
| `APP_TIMEZONE` | `UTC` | PHP timezone for timestamps |

---

## 🧑‍💻 Tech Stack

- **PHP 8.2** — strict types, readonly properties, enums, match expressions
- **Composer** — PSR-4 autoloading
- **Guzzle HTTP 7** — HTTP client with middleware
- **vlucas/phpdotenv 5** — `.env` configuration
- **ZenQuotes API** — Free, no-key public quote API

---

*Built with ❤ as part of the 100 Days of Code automation series.*
