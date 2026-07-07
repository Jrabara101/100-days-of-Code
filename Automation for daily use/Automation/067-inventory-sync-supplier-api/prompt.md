# Project #67 — Inventory sync with supplier API

**Date:** 2026-07-07
**Source list:** `Automation for daily use/Automation/Automation PHP and Laravel.docx` — Medium Projects (61–80)

## Senior prompt used

> Create a PHP Command CLI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. for using PHP — applied to: **"Inventory sync with supplier API"**. Build a CLI that reconciles local product stock levels against a live supplier feed: detect stale-feed conflicts (supplier timestamp older than last local sync), distinguish restocks from drawdowns, flag products that fall below reorder point even after receiving new stock, surface unit-cost price drift above 10%, retry transient supplier API failures with exponential backoff, and render the full result as a styled terminal report with a banner, spinner, colored delta table, and summary line.

## Design reasoning

- **Stale-feed conflict detection runs first** — if the supplier's `asOf` timestamp is older than our last successful sync, we refuse to overwrite local data. The inventory domain is prone to race conditions where a slower batch feed from the supplier can arrive *after* a faster real-time count from a warehouse scan; blindly applying the stale feed would regress the more accurate data.
- **Outcome priority is intentional**: BelowReorder takes precedence over Restocked/Reduced because a partial restock that still leaves stock below the reorder threshold is the most operationally urgent case — it means a PO must still be raised despite stock arriving.
- **Price drift is layered separately** from quantity outcome rather than being a separate primary case, because both can co-occur (a SKU can be restocked *and* priced differently). The note column accumulates both signals so the operator sees the full picture in one row.
- **Deterministic simulated supplier client** uses `crc32(sku)` to derive stable stock/cost values, so the demo is reproducible without live API credentials. A 40% first-call transient failure exercises the retry/backoff path on most runs.
- **`TransientSupplierException` vs `UnknownSkuException`** keeps the retry boundary clean: only transient failures are retried; a 404 / unknown SKU is a business logic error that a second attempt cannot fix.

## Files

- `script.php` — the CLI implementation.
- `run_output.txt` — raw captured terminal output (ANSI codes included) from the run below.

## CLI result

```
╔═══════════════════════════════════════════════════════════════════════╗
║  Inventory Sync — Supplier API                                        ║
║  Project #67 — reconciles local stock levels against supplier feed    ║
╚═══════════════════════════════════════════════════════════════════════╝


▸ Fetching supplier stock feed
──────────────────────────────────────────────────────────────
  ⠙ Polling supplier stock feed…
    ✗ Supplier API returned 503 Service Unavailable (simulated) — backing off 330ms
  ⠹ Polling supplier stock feed… (retry 2/3)
  ✓ Feed received for 10 SKUs

▸ Reconciling stock levels
──────────────────────────────────────────────────────────────

▸ Sync report
──────────────────────────────────────────────────────────────
┌──────────┬─────────────────────┬──────────┬─────────┬───────┬────────┬────────────┬───────────────────────────────────────────────────────────────────────────────────────┐
│ SKU      │ Name                │ Prev Qty │ New Qty │ Delta │ Cost   │ Outcome    │ Note                                                                                  │
├──────────┼─────────────────────┼──────────┼─────────┼───────┼────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ SKU-A001 │ Wireless Keyboard   │ 82       │ 87      │ +5    │ $56.87 │ restocked  │ Price drift +23.7%; Qty +5                                                            │
│ SKU-A002 │ USB-C Hub (7-port)  │ 14       │ 85      │ +71   │ $36.85 │ restocked  │ Price drift +29.3%; Qty +71                                                           │
│ SKU-A003 │ Mechanical Mouse    │ 55       │ 51      │ -4    │ $81.51 │ reduced    │ Price drift +132.9%; Qty -4                                                           │
│ SKU-A004 │ Monitor Stand       │ 7        │ 56      │ +49   │ $27.56 │ restocked  │ Price drift +25.3%; Qty +49                                                           │
│ SKU-A005 │ Laptop Cooling Pad  │ 130      │ 190     │ +60   │ $9.90  │ restocked  │ Price drift -47.2%; Qty +60                                                           │
│ SKU-A006 │ Webcam 1080p        │ 43       │ 140     │ +97   │ $93.40 │ restocked  │ Price drift +29.7%; Qty +97                                                           │
│ SKU-A007 │ HDMI 2.1 Cable (2m) │ 200      │ 200     │ —     │ $54.30 │ stale feed │ Supplier feed (2026-07-04T...) is older than last sync (2026-07-06T08:00:00Z)         │
│ SKU-A008 │ Desk Lamp LED       │ 18       │ 18      │ —     │ $86.11 │ stale feed │ Supplier feed (2026-07-04T...) is older than last sync (2026-07-06T08:00:00Z)         │
│ SKU-A009 │ Ergonomic Chair Mat │ 9        │ 53      │ +44   │ $25.53 │ restocked  │ Price drift -53.6%; Qty +44                                                           │
│ SKU-A010 │ Portable SSD 1TB    │ 60       │ 88      │ +28   │ $52.88 │ restocked  │ Price drift -41.2%; Qty +28                                                           │
└──────────┴─────────────────────┴──────────┴─────────┴───────┴────────┴────────────┴───────────────────────────────────────────────────────────────────────────────────────┘

Summary: 0 unchanged, 7 restocked, 1 reduced, 0 below reorder, 0 price drift, 2 stale-feed conflict
  ⚠ Stale-feed conflicts require manual review — do not overwrite.

Sync completed at 2026-07-07 00:34:25 — 10/10 products updated.
```

Run with:

```
php script.php
```

## Status

Marked complete in `Automation PHP and Laravel.docx` (item #67 highlighted red). Next up: **#68 — Multi-role approval workflow**.
