# Project #66 — Payment status sync from API

**Date:** 2026-07-06
**Source list:** `Automation for daily use/Automation/Automation PHP and Laravel.docx` — Medium Projects (61–80)

## Senior prompt used

> Create a PHP Command CLI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. for using PHP — applied to: **"Payment status sync from API"**. Build a CLI that reconciles local order payment statuses against a remote payment gateway: retry transient gateway failures with exponential backoff + jitter, distinguish safe forward status transitions (pending → authorized → captured) from ones that need human review (e.g. a captured payment flipping to refunded/failed unexpectedly), and render the result as a styled terminal report (banner, spinner, colored table, summary).

## Design reasoning

- **Transient vs. permanent failures are modeled as distinct exception types** (`TransientGatewayException`) so the retry policy can never accidentally retry a non-retryable error.
- **Exponential backoff with jitter** avoids synchronized retry storms if this script were run concurrently across multiple workers/cron schedules.
- **Reconciliation has an explicit state-transition table** (`PaymentReconciler::SAFE_FORWARD_TRANSITIONS`) rather than a blind overwrite — the reasoning being that a payment status is financial state, and silently accepting any transition (e.g. captured → pending) could hide fraud/chargeback signals. Safe transitions auto-apply; unexpected ones are still applied (so local state stays truthful) but flagged as `needs review`.
- **Deterministic simulated gateway** (`SimulatedPaymentGatewayClient`) hashes the order id to pick a "remote" status, so the demo is reproducible without needing live API credentials, while still injecting a 40% chance of one transient failure on the first attempt so the retry path is exercised on every run.

## Files

- `script.php` — the CLI implementation.
- `run_output.txt` — raw captured terminal output (ANSI codes included) from the run below.

## CLI result

```
╔═══════════════════════════════════════════════════════════════════════╗
║  Payment Status Sync                                                  ║
║  Project #66 — reconciles local orders against the payment gateway  ║
╚═══════════════════════════════════════════════════════════════════════╝


▸ Fetching remote statuses
────────────────────────────────────────────────────────────
  ⠙ Fetching statuses from payment gateway…
  ✓ statuses received

▸ Reconciling
────────────────────────────────────────────────────────────

▸ Reconciliation report
────────────────────────────────────────────────────────────
┌──────────┬────────────┬──────────┬───────────────────────┐
│ Order    │ Previous   │ Remote   │ Outcome               │
├──────────┼────────────┼──────────┼───────────────────────┤
│ ORD-1001 │ pending    │ captured │ updated               │
│ ORD-1002 │ authorized │ failed   │ updated               │
│ ORD-1003 │ pending    │ captured │ updated               │
│ ORD-1004 │ captured   │ captured │ unchanged             │
│ ORD-1005 │ authorized │ captured │ updated               │
│ ORD-1006 │ pending    │ failed   │ updated               │
│ ORD-1007 │ captured   │ captured │ unchanged             │
│ ORD-1008 │ refunded   │ captured │ needs review          │
└──────────┴────────────┴──────────┴───────────────────────┘

Summary: 2 unchanged, 5 updated, 1 needs review
  ⚠ Review flagged orders before they hit downstream billing reports.
```

Run with:

```
php script.php
```

## Status

Marked complete in `Automation PHP and Laravel.docx` (item #66 highlighted red). Next up: **#67 — Inventory sync with supplier API**.
