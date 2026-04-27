# PHP CLI Currency Converter Automation

A professional command-line currency converter built with **pure PHP 8+** that fetches **real-time exchange rates** from a live public API. Designed to run exclusively in the terminal with a visually rich ANSI-styled interface.

---

## ✨ Features

| Feature | Details |
|---|---|
| Live exchange rates | Fetches from ExchangeRate-API (free tier, no key required) |
| 20+ currencies | USD, EUR, GBP, JPY, PHP, AUD, CAD, SGD, KRW, CNY and more |
| Interactive menu | Convert, view currencies, browse history, exit |
| Conversion history | Saved to `storage/history.json` (last 100 entries) |
| ANSI terminal UI | Color-coded boxes, spinners, success/error panels |
| Input validation | Invalid codes, bad amounts, empty input all handled |
| API error handling | Timeouts, HTTP errors, malformed JSON — all caught |
| Strict typing | `declare(strict_types=1)` throughout |
| PSR-4 autoloading | Clean OOP namespace structure |

---

## 📁 Project Structure

```
Currency Converter/
├── index.php               ← CLI entry point
├── composer.json
├── .env.example
├── .gitignore
├── storage/
│   └── history.json        ← Created automatically on first run
└── src/
    ├── helpers.php         ← ANSI colors, box drawing, I/O helpers
    ├── ApiService.php      ← cURL HTTP client + response parser
    ├── CurrencyConverter.php ← Conversion logic, validation, rate cache
    ├── HistoryService.php  ← JSON persistence (save/load/clear)
    └── Application.php     ← Interactive menu loop + display rendering
```

---

## 🚀 Setup & Installation

### Prerequisites
- PHP 8.0 or higher (`php --version`)
- Composer (`composer --version`)
- Internet connection

### Steps

```bash
# 1. Navigate to the project directory
cd "Automation/Currency Converter"

# 2. Install Composer dependencies
composer install

# 3. (Optional) Copy environment file
cp .env.example .env

# 4. Run the application
php index.php
```

---

## 🖥️ CLI Commands

| Command | Description |
|---|---|
| `php index.php` | Launch the interactive menu |
| `composer start` | Alias for `php index.php` |

---

## 🎮 Interactive Menu

```
╔══════════════════════════════════════════════╗
║          PHP CURRENCY CONVERTER              ║
║          Real-Time Exchange Rates            ║
╚══════════════════════════════════════════════╝

────────────────────────────────────────────────
  ╔══════════════════════════════════════════╗
  ║           M A I N   M E N U             ║
  ╠══════════════════════════════════════════╣
  ║ [1] 💱 Convert Currency                 ║
  ║ [2] 📋 View Supported Currencies        ║
  ║ [3] 🕐 View Conversion History          ║
  ║ [4] 🚪 Exit                             ║
  ╚══════════════════════════════════════════╝
```

---

## 💱 Sample Conversion Output

```
╔══════════════════════════════════════════════╗
║            CONVERSION RESULT  ✔              ║
╠══════════════════════════════════════════════╣
║ Amount:        100.00 USD (US Dollar)        ║
║ Converted:     5,720.00 PHP (Philippine Peso)║
║ Rate:          1 USD = 57.200000 PHP         ║
║ Rate Date:     2026-04-24                    ║
║ Converted At:  2026-04-24 10:30 AM           ║
╚══════════════════════════════════════════════╝

  100.00 USD  =  5,720.00 PHP
```

---

## 🛡️ Error Handling

| Error Type | How it's handled |
|---|---|
| Invalid currency code | Validated with regex before API call |
| Invalid/negative amount | Caught before any network request |
| No internet connection | cURL error caught → friendly message |
| API timeout | `CURLOPT_TIMEOUT = 10s` → descriptive error |
| HTTP error (non-200) | Caught and displayed in red error box |
| Malformed JSON | `json_last_error()` check → graceful fallback |
| Unsupported currency | API rate-missing check → clear error message |
| File write failure | `file_put_contents()` result checked |

---

## 🔧 Supported Currencies

| Code | Name |
|---|---|
| USD | US Dollar |
| EUR | Euro |
| GBP | British Pound Sterling |
| JPY | Japanese Yen |
| AUD | Australian Dollar |
| CAD | Canadian Dollar |
| SGD | Singapore Dollar |
| CNY | Chinese Yuan Renminbi |
| KRW | South Korean Won |
| PHP | Philippine Peso |
| HKD | Hong Kong Dollar |
| INR | Indian Rupee |
| MYR | Malaysian Ringgit |
| THB | Thai Baht |
| IDR | Indonesian Rupiah |
| VND | Vietnamese Dong |
| CHF | Swiss Franc |
| NZD | New Zealand Dollar |
| SAR | Saudi Riyal |
| AED | UAE Dirham |

> The API supports 160+ currencies. You can enter any valid ISO 4217 code even if not in this list.

---

## ⚙️ How the Automation Works

1. **Input** — User selects [1] Convert, enters base currency (e.g. `USD`), target (`PHP`), and amount (`100`)
2. **Validation** — `CurrencyConverter` validates the code format and amount before any HTTP call
3. **Fetching** — `ApiService` fires a cURL GET to `https://api.exchangerate-api.com/v4/latest/USD`
4. **Parsing** — JSON decoded, rates extracted as `float` array
5. **Caching** — Rate data stored in memory; repeat conversions from the same base currency skip the API call
6. **Calculation** — `converted = amount × rate`
7. **Display** — `Application` renders the green result box with ANSI styling
8. **Persistence** — `HistoryService` appends the result to `storage/history.json`

---

## 📦 Dependencies

| Package | Version | Purpose |
|---|---|---|
| `php` | ^8.0 | Runtime |
| `vlucas/phpdotenv` | ^5.6 | `.env` file loading |

> Exchange rate fetching uses native PHP `cURL` — no Guzzle required.

---

## 📝 License

MIT — Free to use and extend.
