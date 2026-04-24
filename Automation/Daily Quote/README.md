# Daily Quote Fetcher — PHP 8.2+ CLI Application

> A production-quality, OOP PHP CLI tool that fetches a daily inspirational
> quote from a free public API, displays it beautifully in your terminal,
> and maintains a searchable local history — ready for daily cron automation.

---

## ✦ Features

| Feature | Details |
|---|---|
| **Live API fetch** | ZenQuotes (free, no key) — swap via `.env` |
| **Retry logic** | Configurable attempts with delay |
| **Duplicate guard** | SHA-256 fingerprint prevents re-saving the same quote |
| **Local history** | JSON file, capped at configurable limit |
| **Polished terminal UI** | ANSI colours, box-drawing characters, quote card layout |
| **Logging** | Rotating daily log file via Monolog |
| **Env config** | Full `.env` support via vlucas/phpdotenv |
| **SOLID architecture** | Separate Client / Service / Storage / Command layers |
| **Cron-ready** | Designed for unattended daily automation |

---

## 📂 Project Structure

```
Daily Quote/
├── src/
│   ├── App/            # Application bootstrap
│   ├── Commands/       # Symfony Console commands
│   │   ├── FetchCommand.php
│   │   ├── SaveCommand.php
│   │   ├── HistoryCommand.php
│   │   └── RandomCommand.php
│   ├── Clients/        # HTTP API client (GuzzleHTTP)
│   │   └── QuoteApiClient.php
│   ├── Config/         # Config manager
│   │   └── Config.php
│   ├── Exceptions/     # Domain exceptions
│   │   ├── ApiException.php
│   │   └── StorageException.php
│   ├── Helpers/        # Terminal UI helper
│   │   └── TerminalUI.php
│   ├── Logger/         # Monolog factory
│   │   └── AppLogger.php
│   ├── Services/       # Business logic layer
│   │   └── QuoteService.php
│   └── Storage/        # JSON history storage
│       └── QuoteStorage.php
├── logs/               # Auto-created on first run
├── storage/            # Auto-created on first run
│   └── quotes.json     # Persisted quote history
├── vendor/             # Composer dependencies
├── app.php             # CLI entry point
├── composer.json
├── .env                # Your local config (not committed)
├── .env.example        # Template
└── README.md
```

---

## 🚀 Quick Start

### 1 · Prerequisites

- **PHP 8.2+** — `php --version`
- **Composer** — `composer --version`

### 2 · Install dependencies

```bash
cd "path/to/Daily Quote"
composer install
```

### 3 · Configure environment

```bash
cp .env.example .env
# Edit .env if you want to change the API or log settings
```

### 4 · Run

```bash
# Fetch & display a quote (default command)
php app.php

# Or explicit commands:
php app.php quote:fetch           # fetch & display
php app.php quote:fetch --save    # fetch, display, and save
php app.php quote:save            # fetch & save to history
php app.php quote:history         # browse all saved quotes
php app.php quote:history --page=2
php app.php quote:random          # random quote from history
```

---

## 🖥️ Terminal Output Preview

```
  ╔════════════════════════════════════════════════════════════════════╗
  ║               ✦  DAILY QUOTE FETCHER  ✦                          ║
  ║           v2.0.0  ·  Powered by ZenQuotes API                    ║
  ╚════════════════════════════════════════════════════════════════════╝

  ┌────────────────────────────────────────────────────────────────────┐
  │   🌐  FETCHING QUOTE FROM API                                     │
  └────────────────────────────────────────────────────────────────────┘
    ℹ  Connecting to https://zenquotes.io/api/random …
    ✔  Quote received!

  ╔════════════════════════════════════════════════════════════════════╗
  ║                                                                    ║
  ║    The only way to do great work is to love what you do.          ║
  ║                                                                    ║
  ║    — Steve Jobs                                                    ║
  ╠════════════════════════════════════════════════════════════════════╣
  ║  Source: zenquotes.io                                             ║
  ║  Fetched: 2026-04-22T09:15:00+08:00                              ║
  ╚════════════════════════════════════════════════════════════════════╝

  ──────────────────────────────────────────────────────────────────────
    ✔  Operation completed successfully
    2026-04-22 09:15:01 +08
  ──────────────────────────────────────────────────────────────────────
```

---

## 📅 Automation — Daily Cron / Task Scheduler

### Linux / macOS Cron

Open crontab:
```bash
crontab -e
```

Add one of these lines:

```cron
# Fetch & save a quote every day at 8:00 AM
0 8 * * * /usr/bin/php /path/to/Daily\ Quote/app.php quote:save --no-banner >> /path/to/Daily\ Quote/logs/cron.log 2>&1

# Fetch & display only (no save) — useful for desktop notifications
0 9 * * * /usr/bin/php /path/to/Daily\ Quote/app.php quote:fetch --no-banner
```

### Windows Task Scheduler

1. Open **Task Scheduler** → *Create Basic Task*
2. **Trigger**: Daily, at your preferred time
3. **Action**: Start a program
   - Program: `C:\php\php.exe`
   - Arguments: `app.php quote:save --no-banner`
   - Start in: `C:\Users\Admin\100-days-of-Code\Automation\Daily Quote`

Or via PowerShell:
```powershell
$action  = New-ScheduledTaskAction -Execute "php.exe" `
             -Argument "app.php quote:save --no-banner" `
             -WorkingDirectory "C:\Users\Admin\100-days-of-Code\Automation\Daily Quote"

$trigger = New-ScheduledTaskTrigger -Daily -At "08:00AM"

Register-ScheduledTask -TaskName "DailyQuoteFetcher" `
  -Action $action -Trigger $trigger -RunLevel Highest
```

---

## 📦 Sample `storage/quotes.json`

```json
[
  {
    "id": "a3f8c92d1b4e",
    "text": "The only way to do great work is to love what you do.",
    "author": "Steve Jobs",
    "source": "zenquotes.io",
    "fetched_at": "2026-04-22T09:15:00+08:00",
    "saved_at":   "2026-04-22T09:15:01+08:00"
  },
  {
    "id": "d7b1e034a5f2",
    "text": "In the middle of every difficulty lies opportunity.",
    "author": "Albert Einstein",
    "source": "zenquotes.io",
    "fetched_at": "2026-04-21T09:10:00+08:00",
    "saved_at":   "2026-04-21T09:10:02+08:00"
  }
]
```

---

## 🔌 Switching the API

Edit `.env`:
```env
# ZenQuotes (default — no key needed)
QUOTE_API_URL=https://zenquotes.io/api/random

# Quotable.io (alternative — no key needed)
QUOTE_API_URL=https://api.quotable.io/random
```

The `QuoteApiClient::normalize()` method handles both response formats automatically.
To add a new API, add a recognition branch inside `normalize()`.

---

## 📋 Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `QUOTE_API_URL` | `https://zenquotes.io/api/random` | API endpoint |
| `QUOTE_API_TIMEOUT` | `10` | HTTP timeout (seconds) |
| `QUOTE_API_RETRY` | `3` | Max retry attempts |
| `QUOTE_API_RETRY_DELAY` | `2` | Seconds between retries |
| `QUOTE_STORAGE_FILE` | `storage/quotes.json` | History file path |
| `QUOTE_HISTORY_LIMIT` | `100` | Max entries in history |
| `LOG_CHANNEL` | `file` | `file` / `stderr` / `null` |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warning` / `error` |
| `LOG_FILE` | `logs/app.log` | Log file path |
| `DISPLAY_BANNER` | `true` | Show ASCII banner |
| `DISPLAY_TIMESTAMP` | `true` | Show fetch timestamp |

---

## 🏗️ Architecture

```
app.php
  └── Application (bootstrap, DI)
        ├── Config          (env vars + defaults)
        ├── AppLogger       (Monolog factory)
        └── Commands
              ├── FetchCommand   → QuoteService.fetch()
              ├── SaveCommand    → QuoteService.fetchAndSave()
              ├── HistoryCommand → QuoteService.history()
              └── RandomCommand  → QuoteService.random()
                    QuoteService
                      ├── QuoteApiClient   (HTTP + retry + normalize)
                      └── QuoteStorage     (JSON CRUD + dedup)
```

---

## 📄 License

MIT — free for personal and commercial use.
