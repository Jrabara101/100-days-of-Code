# Project #69 — Document Approval System

**Date:** 2026-07-07
**Source list:** `Automation for daily use/Automation/Automation PHP and Laravel.docx` — Medium Projects (61–80)

## Senior prompt used

> Create a PHP Command CLI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. for using PHP — applied to: **"Document approval system"**. Build a CLI that models a multi-stage document approval pipeline: explicit state-machine transitions (Draft → In Review → Approved / Rejected / Escalated), per-stage reviewer quorum rules, fail-fast veto (one rejection blocks the document), deadline-based escalation, and a styled terminal report showing a pipeline summary table plus per-document drill-down with every vote's decision and comment.

## Design reasoning

- **Explicit state machine via enum** — `DocumentStatus` is a PHP-backed enum rather than a string constant. The engine validates every transition; an invalid one throws `WorkflowViolationException`, making illegal states unreachable rather than relying on caller discipline.
- **Fail-fast rejection** — one veto immediately closes the document as `Rejected`. In document approval workflows (contracts, policies, NDAs) a single dissenting stakeholder typically represents a legal or financial blocker that can't be overridden by a majority; the fix is rework, not a re-vote. This is encoded as a named policy in `settleDocument()` rather than buried in a conditional.
- **Quorum-based approval** — each stage has a configurable minimum-approvals count, allowing asymmetric trust (e.g. Legal needs 1/2 reviewers but Finance needs 2/3). Quorum is checked after every vote so the stage closes the moment it's mathematically settled, avoiding unnecessary waits.
- **Deadline escalation at vote-time** — escalation is computed when a vote arrives, not as a separate scheduled job. This mirrors how a real system would work: the workflow engine checks elapsed time on each incoming event and gates further transitions. A document past its deadline enters `Escalated` and accepts no further votes.
- **Double-vote guard** — the engine rejects a second vote from the same reviewer on the same stage, preventing a reviewer from overriding their own earlier decision.
- **Deterministic scenario** — `buildScenario()` produces four documents covering all four non-Draft terminal states in one run (Approved, Rejected, In Review, Escalated), making the demo fully reproducible with no external dependencies.

## Files

- `script.php` — the CLI implementation.
- `run_output.txt` — raw captured terminal output (ANSI codes included) from the run below.

## CLI result

```
╔═════════════════════════════════════════════════════════════════════════════════════╗
║  Document Approval System                                                           ║
║  Project #69 — multi-stage approval pipeline with quorum, veto, and escalation    ║
╚═════════════════════════════════════════════════════════════════════════════════════╝


▸ Running approval pipeline…
──────────────────────────────────────────────────────────────
  ℹ Submitting documents and casting votes…
  ✓ Pipeline simulation complete.

▸ Document Pipeline Summary
──────────────────────────────────────────────────────────────
┌──────────┬───────────────────────────┬──────────┬───────────┬───────────────────┐
│ ID       │ Title                     │ Type     │ Status    │ Stages            │
├──────────┼───────────────────────────┼──────────┼───────────┼───────────────────┤
│ DOC-2001 │ Vendor Contract v3.2      │ Contract │ Approved  │ Legal → Finance   │
│ DOC-2002 │ Remote Work Policy Update │ Policy   │ Rejected  │ HR → Legal        │
│ DOC-2003 │ Q3 Marketing Budget       │ Budget   │ In Review │ Finance           │
│ DOC-2004 │ Mutual NDA — Acme Corp    │ NDA      │ Escalated │ Legal             │
└──────────┴───────────────────────────┴──────────┴───────────┴───────────────────┘

▸ Detail: DOC-2001 — Vendor Contract v3.2
──────────────────────────────────────────────────────────────
  Author: Alice Moore  |  Submitted: 2026-07-07 09:00

  Stage: Legal  (quorum: 1/2, deadline: 48h)
    ✓ carol.tan  [Approved] 11:00  "Clauses look clean."

  Stage: Finance  (quorum: 2/2, deadline: 72h)
    ✓ david.kim   [Approved] 14:00  "Budget aligned."
    ✓ eve.santos  [Approved] 15:00  "P&L impact acceptable."

▸ Detail: DOC-2002 — Remote Work Policy Update
──────────────────────────────────────────────────────────────
  Author: Frank Yuen  |  Submitted: 2026-07-07 09:00

  Stage: HR  (quorum: 1/1, deadline: 24h)
    ✓ grace.li  [Approved] 10:00  "Policy language is fair."

  Stage: Legal  (quorum: 1/2, deadline: 48h)
    ✗ bob.lee  [Rejected] 12:00  "Conflicts with labour code §7."

▸ Detail: DOC-2003 — Q3 Marketing Budget
──────────────────────────────────────────────────────────────
  Author: Heidi Park  |  Submitted: 2026-07-07 09:00

  Stage: Finance  (quorum: 2/3, deadline: 96h)
    ✓ david.kim  [Approved] 13:00  "ROI looks solid."

▸ Detail: DOC-2004 — Mutual NDA — Acme Corp
──────────────────────────────────────────────────────────────
  Author: Janet Rose  |  Submitted: 2026-07-03 05:00

  Stage: Legal  (quorum: 1/1, deadline: 48h)
  ⚠ Deadline of 48h breached (100.0h elapsed). Escalated for manager review.

▸ Pipeline Statistics
──────────────────────────────────────────────────────────────

  Total documents: 4  |  Approved: 1  |  Rejected: 1  |  In Review: 1  |  Escalated: 1
  ⚠ Escalated documents require manager intervention — check escalation notes above.
  ⚠ Rejected documents must be revised and resubmitted by their authors.
  ✓ Approved documents are cleared for execution / archival.
```

Run with:

```
php script.php
```

## Status

Marked complete in `Automation PHP and Laravel.docx` (item #69 highlighted red). Next up: **#70 — Employee onboarding automation**.
