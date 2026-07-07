# Project #68 — Multi-Role Approval Workflow

## Prompt used

> Create a PHP Command CLI with advanced senior developer prompt to generate more visual
> styling layout and more reasoning logic behind the code, for using PHP — applied to
> project: **Multi-Role Approval Workflow**.

---

## Design reasoning

### State machine with terminal guards
Approval workflows are state machines: Pending → InReview → {Approved | Rejected}. The
engine enforces this explicitly rather than letting callers mutate the struct freely. A
`WorkflowClosedException` stops any write to a terminal workflow — this is the critical
guard for webhook idempotency (a delivery retry must not double-count a decision).

### Delegation via step injection, not re-assignment
When a step is delegated, a new step is spliced immediately after the current position
with the delegate's name. This preserves the original approver's record (decision =
`delegated`) in the audit trail and lets the audit log show the full chain of custody.
Simple re-assignment would lose the original approver's identity.

### Self-approval conflict detection
The check `strtolower($actorName) === strtolower($req->submittedBy)` runs before any
state mutation. It is case-insensitive because email addresses in real systems are
case-insensitive and users sometimes submit as `Alice@co.com` but their token carries
`alice@co.com`. Strict equality would miss this.

### Duplicate decision guard
Once a step's `$decision` field is non-null, a second call throws
`DuplicateDecisionException`. The test simulates a webhook re-delivery scenario by
pre-marking the step's decision field directly (as a persistence layer would after the
first delivery), then calling the engine again. This exercises exactly the guard a
real event-driven system needs.

### Reflection-based private mutation
`WorkflowRequest` exposes no public setters, keeping its state coherent. The engine uses
`ReflectionProperty` to mutate private fields, which is the PHP equivalent of a
package-internal accessor — appropriate for a same-package engine driving the domain
object. In a production codebase these would live in the same namespace/package boundary.

### Audit log as an append-only list
The audit log is never edited — only appended. This matches how compliance audit trails
work: every decision event is immutable once recorded, even if the workflow later changes
state. The log and the step array can diverge (e.g. step shows `delegated`, log shows the
full sequence), giving two complementary views.

---

## Files

| File | Description |
|------|-------------|
| `script.php` | Self-contained PHP 8 CLI implementing the multi-role approval engine |
| `run_output.txt` | Full ANSI terminal output from `php script.php` |
| `prompt.md` | This file |

---

## CLI output

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  Multi-Role Approval Workflow                                             ║
║  Project #68 — state-machine driven, rule-enforced approval pipeline     ║
╚═══════════════════════════════════════════════════════════════════════════╝


▸ Scenario A — Happy Path: Budget Request (3 steps)
────────────────────────────────────────────────────────────────
  ℹ Workflow WF-2001 'Q3 Marketing Budget Increase' started → step 1/3
  ℹ Step approved → advancing to step 2/3 (Finance Director)
  ℹ Step approved → advancing to step 3/3 (CEO)

▸ Workflow: WF-2001 — Q3 Marketing Budget Increase
────────────────────────────────────────────────────────────────
  Submitted by: alice@company.com   at 2026-07-06 22:49:49
  Final status: approved

┌───┬──────────────────┬──────────────┬──────────┬─────────────────────┬───────────────────────────────────┐
│ # │ Role             │ Approver     │ Decision │ Decided At          │ Note                              │
├───┼──────────────────┼──────────────┼──────────┼─────────────────────┼───────────────────────────────────┤
│ 1 │ Line Manager     │ Bob Martinez │ approved │ 2026-07-07 00:49:49 │ Verified headcount justification. │
│ 2 │ Finance Director │ Clara Singh  │ approved │ 2026-07-07 00:49:49 │ Budget within quarterly envelope. │
│ 3 │ CEO              │ David Park   │ approved │ 2026-07-07 00:49:49 │ Aligns with strategic priorities. │
└───┴──────────────────┴──────────────┴──────────┴─────────────────────┴───────────────────────────────────┘

▸ Audit trail — WF-2001
────────────────────────────────────────────────────────────────
┌──────┬──────────────────┬──────────────┬──────────┬─────────────────────┬───────────────────────────────────┐
│ Step │ Role             │ Actor        │ Decision │ At                  │ Note                              │
├──────┼──────────────────┼──────────────┼──────────┼─────────────────────┼───────────────────────────────────┤
│ 1    │ Line Manager     │ Bob Martinez │ approved │ 2026-07-07 00:49:49 │ Verified headcount justification. │
│ 2    │ Finance Director │ Clara Singh  │ approved │ 2026-07-07 00:49:49 │ Budget within quarterly envelope. │
│ 3    │ CEO              │ David Park   │ approved │ 2026-07-07 00:49:49 │ Aligns with strategic priorities. │
└──────┴──────────────────┴──────────────┴──────────┴─────────────────────┴───────────────────────────────────┘

▸ Scenario B — Delegation Chain: Vendor Contract
────────────────────────────────────────────────────────────────
  ℹ Workflow WF-2002 'New Vendor Contract — Cloud Services' started → step 1/3
  ℹ Step Procurement Lead delegated to 'Isabel Ramos' — inserted as next approver.
  ℹ Step approved → advancing to step 3/4 (Legal)
  ℹ Step approved → advancing to step 4/4 (CFO)

▸ Workflow: WF-2002 — New Vendor Contract — Cloud Services
────────────────────────────────────────────────────────────────
  Submitted by: emma@company.com   at 2026-07-06 23:49:49
  Final status: approved

┌───┬───────────────────────────┬──────────────┬───────────┬─────────────────────┬─────────────────────────────────────────────┐
│ # │ Role                      │ Approver     │ Decision  │ Decided At          │ Note                                        │
├───┼───────────────────────────┼──────────────┼───────────┼─────────────────────┼─────────────────────────────────────────────┤
│ 1 │ Procurement Lead          │ Frank Osei   │ delegated │ 2026-07-07 00:49:49 │ OOO until Friday                            │
│ 2 │ Procurement Lead:delegate │ Isabel Ramos │ approved  │ 2026-07-07 00:49:49 │ Reviewed vendor credentials — all clear.    │
│ 3 │ Legal                     │ Grace Lim    │ approved  │ 2026-07-07 00:49:49 │ Standard T&Cs; liability clause acceptable. │
│ 4 │ CFO                       │ Henry Torres │ approved  │ 2026-07-07 00:49:49 │ Cost within cap; approved for 12 months.    │
└───┴───────────────────────────┴──────────────┴───────────┴─────────────────────┴─────────────────────────────────────────────┘

▸ Scenario C — Rejection: Overtime Pay Request
────────────────────────────────────────────────────────────────
  ℹ Workflow WF-2003 'Emergency Overtime — Dev Team' started → step 1/3
  ℹ Step approved → advancing to step 2/3 (HR Manager)

  Final status: rejected

▸ Scenario D — Rule Violations (should be caught)
────────────────────────────────────────────────────────────────
  ℹ Workflow WF-2004A 'Equipment Purchase (self-approval test)' started → step 1/2
  ⚠ Self-approval blocked: 'noah@company.com' submitted this request and cannot approve it (conflict of interest).
  ℹ Step approved → advancing to step 2/2 (Finance)
  ℹ Workflow WF-2004B 'Duplicate Decision Guard' started → step 1/2
  ⚠ Duplicate decision blocked: Step 'Checker' already has a recorded decision: approved.
  ℹ Workflow WF-2004C 'Closed Workflow Guard' started → step 1/1
  ⚠ Closed-workflow blocked: Workflow WF-2004C is already approved.

▸ Run Summary
────────────────────────────────────────────────────────────────
┌──────────┬───────────────────────────────────┬──────────┐
│ ID       │ Title                             │ Outcome  │
├──────────┼───────────────────────────────────┼──────────┤
│ WF-2001  │ Q3 Marketing Budget Increase      │ APPROVED │
│ WF-2002  │ New Vendor Contract — Cloud Svc   │ APPROVED │
│ WF-2003  │ Emergency Overtime — Dev Team     │ REJECTED │
│ WF-2004A │ Equipment Purchase                │ APPROVED │
└──────────┴───────────────────────────────────┴──────────┘

Rule violations caught: 3/3 (self-approval, duplicate decision, closed-workflow)
Delegation chain: 1 delegation resolved cleanly
────────────────────────────────────────────────────────────────
All workflows processed. Full audit trail recorded.
```
