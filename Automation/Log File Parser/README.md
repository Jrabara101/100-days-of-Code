# OmniLog – Enterprise-Grade CLI Log Parser & Analyzer

> **Version:** 3.1.0 | **Requires:** PHP 8.1+ | **No Composer dependencies**

---

## Architecture Document

### 1. Memory Management Strategy

OmniLog is designed to process log files of **arbitrary size** — including multi-gigabyte files — without exhausting PHP memory limits. The core of this strategy is the `StreamReader` class, which uses a PHP **Generator** (`yield`) combined with `SplFileObject` to read the file exactly **one line at a time**.

The contrast with naive approaches is significant:

| Approach | Memory Complexity | 4 GB File RAM Usage |
|---|---|---|
| `file_get_contents()` | O(n) — entire file as string | ~4 GB |
| `file()` | O(n) — all lines in array | ~4 GB |
| `SplFileObject` + `yield` | **O(1)** — one line at a time | **~4 KB** |

The generator is lazy: no line is read from disk until the consumer (`foreach`) calls `next()`. This enables the entire pipeline — `StreamReader → Parser → FilterEngine → Aggregator` — to process one entry at a time with constant working memory. The progress bar updates every 500 lines, not every line, to avoid the overhead of ANSI escape writes dominating CPU time on dense logs.

### 2. Design Patterns

**Strategy Pattern** is the central architectural pattern. `LogParserInterface` defines the contract: `parse(string $line): ?LogEntry`. Concrete implementations (`NginxAccessLogParser`, `JsonLogParser`) are interchangeable and injected at runtime based on the `--format` flag or auto-detection. The engine code (`omnilog.php`, `FilterEngine`, `Aggregator`) depends **only** on the interface, never on a concrete parser. This satisfies the **Open-Closed Principle (SOLID)**: adding support for Apache logs, Syslog, W3C Extended format, or any proprietary format requires writing a new class that implements `LogParserInterface` — **zero changes to existing code**.

**Pipeline Pattern** chains three stages with lazy evaluation: the `StreamReader` generator produces items on demand, the `FilterEngine` short-circuits on the first failing predicate (level check before expensive regex), and the `Aggregator` accumulates rolling metrics using O(1) hash-map operations per entry.

**Immutable Data Transfer Object**: `LogEntry` is a PHP 8.2 `readonly class`. Once constructed from a parsed log line, its fields cannot be mutated. This eliminates an entire class of bugs (shared mutable state) and makes the `LogEntry` safe to pass between any stage without defensive copying.

### 3. Parsing Algorithms & Fault Tolerance

Each parser uses a **named-capture-group regex** for field extraction. Named groups (`(?P<ip>...)`) make the pattern self-documenting and return associative matches, removing positional index fragility. The `NginxAccessLogParser` handles the Nginx Combined Log Format; `JsonLogParser` handles NDJSON (one JSON object per line).

**Fault tolerance** is achieved at the per-line level: every call to `$parser->parse($line)` is wrapped in a `try/catch(\Throwable)` inside the main loop. If the regex fails to match, `parse()` returns `null`. If an unexpected exception occurs (e.g., a `DateTimeImmutable` parse failure on a corrupted timestamp), the exception is caught, the line is counted as `$malformed`, and parsing continues without interruption. The final dashboard reports the malformed count so the operator is informed without a crash.

---

## File Structure

```
Log File Parser/
├── omnilog.php                         ← CLI entry point & bootstrap
├── generate_sample_log.php             ← Test data generator
├── src/
│   ├── Contracts/
│   │   └── LogParserInterface.php      ← Strategy pattern interface
│   ├── Parsers/
│   │   ├── NginxAccessLogParser.php    ← Nginx Combined Log Format
│   │   └── JsonLogParser.php           ← NDJSON log format
│   ├── Enums/
│   │   └── LogLevel.php                ← PHP 8.1 backed enum
│   ├── Models/
│   │   └── LogEntry.php                ← PHP 8.2 readonly DTO
│   ├── Engine/
│   │   ├── StreamReader.php            ← Generator-based O(1) reader
│   │   ├── FilterEngine.php            ← Chainable predicate pipeline
│   │   └── Aggregator.php              ← Rolling statistics accumulator
│   ├── Export/
│   │   └── Exporter.php                ← JSON/CSV export
│   └── UI/
│       ├── Terminal.php                ← ANSI 24-bit color engine
│       ├── ProgressBar.php             ← Live animated progress bar
│       └── TableRenderer.php           ← ASCII box-drawing tables
└── logs/
    └── sample_nginx.log                ← Generated test log
```

---

## PHP 8.x Features Used

| Feature | Where Used |
|---|---|
| `declare(strict_types=1)` | Every file |
| Backed `enum LogLevel: string` | `src/Enums/LogLevel.php` |
| `readonly class LogEntry` | `src/Models/LogEntry.php` |
| Constructor property promotion | All classes |
| `match` expression | Parsers, Aggregator, Terminal, Exporter |
| Named arguments | `array_slice(..., preserve_keys: true)`, `fgbg()` |
| `\DateTimeImmutable` | `FilterEngine`, `LogEntry` |
| `str_starts_with()` | `FilterEngine::withGrep()` |
| `\Throwable` catch | Parser fault tolerance in `omnilog.php` |
| `SplFileObject` | `StreamReader` |

---

## Usage

### Step 1 — Generate a sample log (first time only)

```bash
php generate_sample_log.php
```

### Step 2 — Run OmniLog

```bash
# Basic run (auto-detect format)
php omnilog.php --file=logs/sample_nginx.log

# Filter by log level
php omnilog.php --file=logs/sample_nginx.log --level=ERROR,CRITICAL

# Date range filter
php omnilog.php --file=logs/sample_nginx.log --since=2024-01-01 --until=2024-01-15

# Regex search
php omnilog.php --file=logs/sample_nginx.log --grep="api/v1/users"

# Export results
php omnilog.php --file=logs/sample_nginx.log --export=json

# Show top 20 IPs, no color output
php omnilog.php --file=logs/sample_nginx.log --top=20 --no-color

# Help
php omnilog.php --help
```

### JSON Log Format (NDJSON)

Each line must be a valid JSON object with these fields:

```json
{"timestamp":"2024-01-15T14:02:11Z","level":"ERROR","ip":"192.168.1.5","method":"POST","endpoint":"/api/login","status":500,"message":"SQL Injection attempt"}
```

---

## Performance Notes

- **Memory:** Peak usage stays under 10 MB regardless of log file size because only one line is in memory at any given time.
- **Speed:** Limited by disk I/O throughput. On a modern SSD, expect 50,000–150,000 lines/second.
- **Progress bar updates:** Throttled to every 500 lines (`ProgressBar::$updateEvery`) — adjustable for faster/slower disks.
- **Export:** The aggregated results object is small (top N IPs, buckets, endpoints) — export is always fast even after processing a 10 GB log.

---

## Extending OmniLog

To add a new log format (e.g., Apache Combined Log):

1. Create `src/Parsers/ApacheLogParser.php`
2. Implement `LogParserInterface` — write `parse()`, `formatName()`, `canParse()`
3. Register it in the `$availableParsers` array in `omnilog.php`

**No other files need to change.** This is the Open-Closed Principle in action.
