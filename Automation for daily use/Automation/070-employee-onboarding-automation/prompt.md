# Project #70 — Employee Onboarding Automation

**Date:** 2026-07-08
**Source list:** `Automation for daily use/Automation/Automation PHP and Laravel.docx` — Medium Projects (61–80)

## Senior prompt used

> Create a PHP Command CLI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. for using PHP — applied to: **"Employee onboarding automation"**. Build a CLI that drives a new hire through a structured multi-phase onboarding pipeline (Pre-Arrival → Day 1 → Week 1 → Week 2+) where tasks have prerequisite chains, ownership roles (IT / HR / Finance / Facility / Manager), transient-vs-permanent failure distinction with exponential back-off retries for transient ones, dependent-task skipping when prerequisites fail, idempotency guards so re-runs skip already-completed steps, and a styled terminal report showing progress bar, phase/owner/status table, and remediation hints for any failed or blocked tasks.

## Design reasoning

- **Task DAG with prerequisite enforcement** — rather than running tasks sequentially and hoping for the best, each task declares which other task IDs it depends on. Before execution the engine checks whether any prerequisite has status `failed` or `skipped`, and if so marks the dependent task `skipped` with an explanatory note. This prevents provisioning work in a degraded state (e.g. creating an email mailbox before the AD account exists would leave an orphaned mailbox with no login).

- **Transient vs. permanent failures are separate exception types** (`TransientProvisioningException` vs. `PermanentProvisioningException`). Transient errors (AD controller timeout, mail queue saturation, HR portal SSO 502) get up to 3 retries with `100 ms × 2^attempt + jitter` back-off. Permanent errors (badge system in maintenance mode) are recorded immediately without retrying — retrying a 503-maintenance response would only waste time and create noise in logs.

- **Idempotency registry** — before executing any task the engine checks an `alreadyDoneIds` set (in production: a database row with `(employee_id, task_id, status)`). Tasks already in the set are marked `duplicate` and skipped. This means re-running the pipeline after a partial failure picks up exactly where it left off rather than re-provisioning resources (which could create duplicate mailboxes, re-send welcome emails, etc.).

- **Phase-ordered execution** — tasks are partitioned into phases (`PreArrival`, `DayOne`, `WeekOne`, `WeekTwo`) and the engine iterates phases in order. Within a phase, tasks that have no blocking prerequisites run even if a sibling task in the same phase failed (e.g. a badge failure doesn't stop laptop imaging). This matches real HR ops where different owners (IT, Facility, Finance) work in parallel within a phase.

- **Remediation section in the report** — after the table, failed and skipped tasks are listed with their recorded note (the exception message plus owner role). This surfaces the exact API error and which human team needs to act, rather than leaving a generic "some tasks failed" message.

## Files

- `script.php` — the CLI implementation.
- `run_output.txt` — raw captured terminal output (ANSI codes included) from the run below.

## CLI result

```
╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
║  Employee Onboarding Automation                                                                   ║
║  Project #70 — multi-phase task pipeline with prerequisite DAG, retry/backoff, and idempotency  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝


▸ New Hire Details
────────────────────────────────────────────────────────────────
  Name:       Alexandra Torres
  Employee ID:  EMP-9476
  Department:  engineering
  Start Date:  2026-07-11
  Email:       a.torres@company.internal

▸ Phase: Pre-Arrival
────────────────────────────────────────────────────────────────
  ⠿ [IT] Create Active Directory account …
    ✓ AD account a.torres@company.internal created; temp password dispatched via SMS.
  ⠿ [IT] Provision corporate email mailbox …
    ✓ Mailbox a.torres@company.internal created with 50 GB quota; welcome email enqueued.
  ⠿ [Facility] Issue physical access badge …
    ✓ Photo ID badge #EB8CDE4A provisioned; pickup at reception, Floor 1.
  ⠿ [IT] Prepare and image laptop …
    ✓ ThinkPad X1 Carbon (asset AST-C7E851) imaged and staged at IT helpdesk.
  ⠿ [HR] Activate HR portal profile …
    ✓ Profile for Alexandra Torres activated in HR portal; documents pending e-signature.
  ⠿ [Finance] Add employee to payroll system …
    ✓ Payroll record created for Alexandra Torres (engineering); first disbursement: mid-month cycle.

▸ Phase: Day 1
────────────────────────────────────────────────────────────────
  ⠿ [IT] Add to Teams channels & groups …
    ✓ Alexandra Torres added to Teams: #general, #dept-engineering, #announcements.
  ⠿ [HR] Assign onboarding buddy / mentor …
    ✓ Buddy programme: Marcus Obi assigned as onboarding mentor for Alexandra Torres.
  ⠿ [IT] Schedule IT orientation session …
    ✓ IT orientation scheduled for Alexandra Torres — 10:00 AM, Day 1 (Conference Room B).

▸ Phase: Week 1
────────────────────────────────────────────────────────────────
  ⠿ [HR] Assign mandatory compliance training …
    ✓ GDPR, AML, and Code of Conduct e-learning assigned; deadline: 2026-07-11 + 5 days.
  ⠿ [HR] Open benefits enrolment window …
    ✓ Benefits enrolment window opened for Alexandra Torres; 30-day election deadline active.

▸ Phase: Week 2+
────────────────────────────────────────────────────────────────
  ⠿ [Manager] Schedule 30-day manager check-in …
    ✓ 30-day check-in with Alexandra Torres and manager scheduled in calendar.

▸ Onboarding Report
────────────────────────────────────────────────────────────────
┌─────────────┬──────────┬──────────────────────────────────────┬──────────┐
│ Phase       │ Owner    │ Task                                 │ Status   │
├─────────────┼──────────┼──────────────────────────────────────┼──────────┤
│ Pre-Arrival │ IT       │ Create Active Directory account      │ ✓ done   │
│ Pre-Arrival │ IT       │ Provision corporate email mailbox    │ ✓ done   │
│ Pre-Arrival │ Facility │ Issue physical access badge          │ ✓ done   │
│ Pre-Arrival │ IT       │ Prepare and image laptop             │ ✓ done   │
│ Pre-Arrival │ HR       │ Activate HR portal profile           │ ✓ done   │
│ Pre-Arrival │ Finance  │ Add employee to payroll system       │ ✓ done   │
│ Day 1       │ IT       │ Add to Teams channels & groups       │ ✓ done   │
│ Day 1       │ HR       │ Assign onboarding buddy / mentor     │ ✓ done   │
│ Day 1       │ IT       │ Schedule IT orientation session      │ ✓ done   │
│ Week 1      │ HR       │ Assign mandatory compliance training │ ✓ done   │
│ Week 1      │ HR       │ Open benefits enrolment window       │ ✓ done   │
│ Week 2+     │ Manager  │ Schedule 30-day manager check-in    │ ✓ done   │
└─────────────┴──────────┴──────────────────────────────────────┴──────────┘

  Progress: [████████████████████████████████████████] 100%

Summary: 12 completed · 0 duplicate · 0 skipped · 0 failed

  ✓ Onboarding pipeline complete. Welcome aboard, Alexandra Torres!
```

Run with:

```
php script.php
```

## Status

Marked complete in `Automation PHP and Laravel.docx` (item #70 highlighted red). Next up: **#71 — Offboarding checklist system**.
