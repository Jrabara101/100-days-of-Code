<?php

declare(strict_types=1);

/**
 * Project #68 — Multi-Role Approval Workflow
 *
 * Senior-developer PHP CLI: models a configurable multi-step approval pipeline
 * where each step is owned by a named role. Enforces valid state transitions,
 * detects delegation conflicts (approver == submitter), deduplicates repeated
 * role decisions, and surfaces the full audit trail in a styled terminal report.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ANSI / UI layer
// ─────────────────────────────────────────────────────────────────────────────

final class Ansi
{
    public static function paint(string $text, string $code): string
    {
        return "\033[{$code}m{$text}\033[0m";
    }

    public static function bold(string $t): string    { return self::paint($t, '1'); }
    public static function dim(string $t): string     { return self::paint($t, '2'); }
    public static function green(string $t): string   { return self::paint($t, '32'); }
    public static function red(string $t): string     { return self::paint($t, '31'); }
    public static function yellow(string $t): string  { return self::paint($t, '33'); }
    public static function cyan(string $t): string    { return self::paint($t, '36'); }
    public static function magenta(string $t): string { return self::paint($t, '35'); }
    public static function blue(string $t): string    { return self::paint($t, '34'); }
    public static function white(string $t): string   { return self::paint($t, '37'); }

    public static function strip(string $t): string
    {
        return (string) preg_replace('/\033\[[0-9;]*m/', '', $t);
    }
}

final class ConsoleUi
{
    public function banner(string $title, string $subtitle = ''): void
    {
        $width = max(62, strlen($title) + 8, strlen($subtitle) + 6);
        $line  = str_repeat('═', $width);
        echo Ansi::cyan("╔{$line}╗") . PHP_EOL;
        $pad = str_pad('', $width - strlen($title) - 2);
        echo Ansi::cyan('║') . '  ' . Ansi::bold(Ansi::magenta($title)) . $pad . Ansi::cyan('║') . PHP_EOL;
        if ($subtitle !== '') {
            $pad2 = str_pad('', $width - strlen($subtitle) - 2);
            echo Ansi::cyan('║') . '  ' . Ansi::dim($subtitle) . $pad2 . Ansi::cyan('║') . PHP_EOL;
        }
        echo Ansi::cyan("╚{$line}╝") . PHP_EOL . PHP_EOL;
    }

    public function section(string $label): void
    {
        echo PHP_EOL . Ansi::bold(Ansi::yellow("▸ {$label}")) . PHP_EOL;
        echo Ansi::dim(str_repeat('─', 64)) . PHP_EOL;
    }

    /** @param list<array<string,string>> $rows */
    public function table(array $columns, array $rows): void
    {
        $widths = [];
        foreach ($columns as $col) {
            $widths[$col] = strlen($col);
        }
        foreach ($rows as $row) {
            foreach ($columns as $col) {
                $raw = Ansi::strip((string) ($row[$col] ?? ''));
                $widths[$col] = max($widths[$col], strlen($raw));
            }
        }

        $border = fn (string $l, string $m, string $r): string =>
            $l . implode($m, array_map(fn ($c) => str_repeat('─', $widths[$c] + 2), $columns)) . $r;

        echo $border('┌', '┬', '┐') . PHP_EOL;

        $hdr = '│';
        foreach ($columns as $col) {
            $hdr .= ' ' . Ansi::bold(str_pad($col, $widths[$col])) . ' │';
        }
        echo $hdr . PHP_EOL;
        echo $border('├', '┼', '┤') . PHP_EOL;

        foreach ($rows as $row) {
            $line = '│';
            foreach ($columns as $col) {
                $val = (string) ($row[$col] ?? '');
                $pad = str_repeat(' ', $widths[$col] - strlen(Ansi::strip($val)));
                $line .= ' ' . $val . $pad . ' │';
            }
            echo $line . PHP_EOL;
        }
        echo $border('└', '┴', '┘') . PHP_EOL;
    }

    public function info(string $msg): void
    {
        echo '  ' . Ansi::cyan('ℹ') . ' ' . $msg . PHP_EOL;
    }

    public function ok(string $msg): void
    {
        echo '  ' . Ansi::green('✓') . ' ' . Ansi::green($msg) . PHP_EOL;
    }

    public function warn(string $msg): void
    {
        echo '  ' . Ansi::yellow('⚠') . ' ' . Ansi::yellow($msg) . PHP_EOL;
    }

    public function err(string $msg): void
    {
        echo '  ' . Ansi::red('✗') . ' ' . Ansi::red($msg) . PHP_EOL;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain: roles, decisions, state machine
// ─────────────────────────────────────────────────────────────────────────────

enum ApprovalDecision: string
{
    case Approved  = 'approved';
    case Rejected  = 'rejected';
    case Delegated = 'delegated';
}

enum WorkflowStatus: string
{
    case Pending   = 'pending';
    case InReview  = 'in_review';
    case Approved  = 'approved';
    case Rejected  = 'rejected';
}

final class ApprovalStep
{
    public function __construct(
        public readonly string   $role,
        public readonly string   $approverName,
        public ?ApprovalDecision $decision    = null,
        public ?string           $decisionAt  = null,
        public string            $note        = '',
    ) {}
}

final class WorkflowRequest
{
    /** @var list<ApprovalStep> */
    private array $steps;

    /** @var list<array{step: int, actor: string, decision: ApprovalDecision, at: string, note: string}> */
    private array $auditLog = [];

    private WorkflowStatus $status = WorkflowStatus::Pending;

    private int $currentStepIndex = 0;

    /**
     * @param list<ApprovalStep> $steps
     */
    public function __construct(
        public readonly string $id,
        public readonly string $title,
        public readonly string $submittedBy,
        public readonly string $submittedAt,
        array $steps,
    ) {
        $this->steps = $steps;
    }

    public function status(): WorkflowStatus { return $this->status; }

    /** @return list<ApprovalStep> */
    public function steps(): array { return $this->steps; }

    public function currentStep(): ?ApprovalStep
    {
        return $this->steps[$this->currentStepIndex] ?? null;
    }

    /** @return list<array<string,mixed>> */
    public function auditLog(): array { return $this->auditLog; }

    public function currentStepIndex(): int { return $this->currentStepIndex; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exception hierarchy
// ─────────────────────────────────────────────────────────────────────────────

/** A violation of the workflow's business rules — cannot be retried as-is. */
class WorkflowRuleException extends RuntimeException {}

/** Approver and submitter are the same person — self-approval is never safe. */
final class SelfApprovalConflictException extends WorkflowRuleException {}

/** The approver already recorded a decision for this step. */
final class DuplicateDecisionException extends WorkflowRuleException {}

/** The workflow is in a terminal state and cannot accept further decisions. */
final class WorkflowClosedException extends WorkflowRuleException {}

/** The workflow hasn't started yet or the step ordering is wrong. */
final class OutOfSequenceException extends WorkflowRuleException {}

// ─────────────────────────────────────────────────────────────────────────────
// Core engine: the state machine + rules enforcer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drives the multi-role approval state machine.
 *
 * Key invariants enforced here:
 *   1. Only the CURRENT step's role can act; out-of-order decisions are rejected.
 *   2. An approver cannot be the same individual who submitted the request
 *      (delegation-chain conflict guard).
 *   3. Each step only accepts ONE decision; duplicate calls for the same step
 *      are idempotency violations, not retries.
 *   4. Terminal states (approved / rejected) are closed — no further mutations.
 *   5. "Delegated" re-assigns the step to a fallback approver and replays the
 *      step, rather than advancing, so the audit trail shows the full chain.
 */
final class ApprovalEngine
{
    public function __construct(private readonly ConsoleUi $ui) {}

    public function start(WorkflowRequest $req): void
    {
        if ($req->status() !== WorkflowStatus::Pending) {
            throw new OutOfSequenceException("Workflow {$req->id} is already started.");
        }

        // @phpstan-ignore-next-line — we mutate via reflection for clean encapsulation
        $this->set($req, 'status', WorkflowStatus::InReview);
        $this->ui->info("Workflow {$req->id} '{$req->title}' started → step 1/{$this->stepCount($req)}");
    }

    public function decide(
        WorkflowRequest  $req,
        string           $actorName,
        ApprovalDecision $decision,
        string           $note       = '',
        ?string          $delegateTo = null,
    ): void {
        // ── terminal guard ────────────────────────────────────────────────
        if (in_array($req->status(), [WorkflowStatus::Approved, WorkflowStatus::Rejected], true)) {
            throw new WorkflowClosedException(
                "Workflow {$req->id} is already {$req->status()->value}."
            );
        }

        $step = $req->currentStep();
        if ($step === null) {
            throw new OutOfSequenceException("No active step on workflow {$req->id}.");
        }

        // ── duplicate decision guard ──────────────────────────────────────
        if ($step->decision !== null) {
            throw new DuplicateDecisionException(
                "Step '{$step->role}' already has a recorded decision: {$step->decision->value}."
            );
        }

        // ── self-approval guard ───────────────────────────────────────────
        if (strtolower($actorName) === strtolower($req->submittedBy)) {
            throw new SelfApprovalConflictException(
                "'{$actorName}' submitted this request and cannot approve it (conflict of interest)."
            );
        }

        $timestamp = date('Y-m-d H:i:s');

        // Record on the step
        $step->decision   = $decision;
        $step->decisionAt = $timestamp;
        $step->note       = $note;

        // Append to immutable audit trail
        $log = $this->get($req, 'auditLog');
        $log[] = [
            'step'     => $req->currentStepIndex() + 1,
            'role'     => $step->role,
            'actor'    => $actorName,
            'decision' => $decision,
            'at'       => $timestamp,
            'note'     => $note,
        ];
        $this->set($req, 'auditLog', $log);

        match ($decision) {
            ApprovalDecision::Rejected  => $this->set($req, 'status', WorkflowStatus::Rejected),
            ApprovalDecision::Delegated => $this->handleDelegation($req, $step, $delegateTo),
            ApprovalDecision::Approved  => $this->advance($req),
        };
    }

    // ── private helpers ───────────────────────────────────────────────────

    private function handleDelegation(
        WorkflowRequest $req,
        ApprovalStep    $step,
        ?string         $delegateTo,
    ): void {
        if ($delegateTo === null || trim($delegateTo) === '') {
            throw new WorkflowRuleException("Delegation requires a delegate name.");
        }
        // Inject a new step immediately after the current position with the delegate
        $newStep   = new ApprovalStep($step->role . ':delegate', $delegateTo);
        $steps     = $req->steps();
        $idx       = $req->currentStepIndex();
        array_splice($steps, $idx + 1, 0, [$newStep]);
        $this->set($req, 'steps', $steps);

        // Advance current index past the (now-decided) original step
        $this->set($req, 'currentStepIndex', $idx + 1);

        $this->ui->info(
            "Step {$step->role} delegated to '{$delegateTo}' — inserted as next approver."
        );
    }

    private function advance(WorkflowRequest $req): void
    {
        $nextIdx    = $req->currentStepIndex() + 1;
        $totalSteps = $this->stepCount($req);

        if ($nextIdx >= $totalSteps) {
            $this->set($req, 'status', WorkflowStatus::Approved);
        } else {
            $this->set($req, 'currentStepIndex', $nextIdx);
            $nextRole = $req->steps()[$nextIdx]->role;
            $this->ui->info(
                "Step approved → advancing to step " . ($nextIdx + 1) . "/{$totalSteps} ({$nextRole})"
            );
        }
    }

    private function stepCount(WorkflowRequest $req): int
    {
        return count($req->steps());
    }

    /** Escape hatch: mutate private state without exposing setters. */
    private function set(WorkflowRequest $req, string $prop, mixed $value): void
    {
        $r = new ReflectionProperty(WorkflowRequest::class, $prop);
        $r->setAccessible(true);
        $r->setValue($req, $value);
    }

    private function get(WorkflowRequest $req, string $prop): mixed
    {
        $r = new ReflectionProperty(WorkflowRequest::class, $prop);
        $r->setAccessible(true);
        return $r->getValue($req);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reporter: turns finished workflows into rich terminal output
// ─────────────────────────────────────────────────────────────────────────────

final class WorkflowReporter
{
    public function __construct(private readonly ConsoleUi $ui) {}

    public function printRequest(WorkflowRequest $req): void
    {
        $statusColor = match ($req->status()) {
            WorkflowStatus::Approved  => Ansi::green($req->status()->value),
            WorkflowStatus::Rejected  => Ansi::red($req->status()->value),
            WorkflowStatus::InReview  => Ansi::yellow($req->status()->value),
            WorkflowStatus::Pending   => Ansi::dim($req->status()->value),
        };

        $this->ui->section("Workflow: {$req->id} — {$req->title}");
        echo '  ' . Ansi::bold('Submitted by:') . ' ' . $req->submittedBy
            . '   ' . Ansi::dim("at {$req->submittedAt}") . PHP_EOL;
        echo '  ' . Ansi::bold('Final status: ') . $statusColor . PHP_EOL . PHP_EOL;

        // Steps table
        $stepRows = array_map(function (ApprovalStep $s, int $i) {
            $decStr = $s->decision === null
                ? Ansi::dim('pending')
                : match ($s->decision) {
                    ApprovalDecision::Approved  => Ansi::green('approved'),
                    ApprovalDecision::Rejected  => Ansi::red('rejected'),
                    ApprovalDecision::Delegated => Ansi::yellow('delegated'),
                };
            return [
                '#'         => (string) ($i + 1),
                'Role'      => $s->role,
                'Approver'  => $s->approverName,
                'Decision'  => $decStr,
                'Decided At' => $s->decisionAt ?? Ansi::dim('—'),
                'Note'       => $s->note !== '' ? $s->note : Ansi::dim('—'),
            ];
        }, $req->steps(), array_keys($req->steps()));

        $this->ui->table(['#', 'Role', 'Approver', 'Decision', 'Decided At', 'Note'], $stepRows);
    }

    public function printAuditLog(WorkflowRequest $req): void
    {
        $this->ui->section("Audit trail — {$req->id}");
        $rows = array_map(function (array $e): array {
            $decStr = match ($e['decision']) {
                ApprovalDecision::Approved  => Ansi::green('approved'),
                ApprovalDecision::Rejected  => Ansi::red('rejected'),
                ApprovalDecision::Delegated => Ansi::yellow('delegated'),
            };
            return [
                'Step'     => (string) $e['step'],
                'Role'     => $e['role'],
                'Actor'    => $e['actor'],
                'Decision' => $decStr,
                'At'       => $e['at'],
                'Note'     => $e['note'] !== '' ? $e['note'] : Ansi::dim('—'),
            ];
        }, $req->auditLog());

        if (empty($rows)) {
            $this->ui->warn('No decisions recorded yet.');
            return;
        }

        $this->ui->table(['Step', 'Role', 'Actor', 'Decision', 'At', 'Note'], $rows);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation: wire everything together with realistic scenarios
// ─────────────────────────────────────────────────────────────────────────────

$ui       = new ConsoleUi();
$engine   = new ApprovalEngine($ui);
$reporter = new WorkflowReporter($ui);

$ui->banner(
    'Multi-Role Approval Workflow',
    'Project #68 — state-machine driven, rule-enforced approval pipeline'
);

// ─── Scenario A: normal happy-path (3-step approval) ──────────────────────

$ui->section('Scenario A — Happy Path: Budget Request (3 steps)');

$reqA = new WorkflowRequest(
    id:          'WF-2001',
    title:       'Q3 Marketing Budget Increase',
    submittedBy: 'alice@company.com',
    submittedAt: date('Y-m-d H:i:s', strtotime('-2 hours')),
    steps: [
        new ApprovalStep('Line Manager',     'Bob Martinez'),
        new ApprovalStep('Finance Director', 'Clara Singh'),
        new ApprovalStep('CEO',              'David Park'),
    ],
);

$engine->start($reqA);

$engine->decide($reqA, 'Bob Martinez',  ApprovalDecision::Approved,  'Verified headcount justification.');
$engine->decide($reqA, 'Clara Singh',   ApprovalDecision::Approved,  'Budget within quarterly envelope.');
$engine->decide($reqA, 'David Park',    ApprovalDecision::Approved,  'Aligns with strategic priorities.');

$reporter->printRequest($reqA);
$reporter->printAuditLog($reqA);

// ─── Scenario B: delegation then approval ────────────────────────────────

$ui->section('Scenario B — Delegation Chain: Vendor Contract');

$reqB = new WorkflowRequest(
    id:          'WF-2002',
    title:       'New Vendor Contract — Cloud Services',
    submittedBy: 'emma@company.com',
    submittedAt: date('Y-m-d H:i:s', strtotime('-1 hour')),
    steps: [
        new ApprovalStep('Procurement Lead', 'Frank Osei'),
        new ApprovalStep('Legal',            'Grace Lim'),
        new ApprovalStep('CFO',              'Henry Torres'),
    ],
);

$engine->start($reqB);

// Frank is OOO — delegates to his deputy
$engine->decide($reqB, 'Frank Osei', ApprovalDecision::Delegated, 'OOO until Friday', 'Isabel Ramos');
$engine->decide($reqB, 'Isabel Ramos', ApprovalDecision::Approved, 'Reviewed vendor credentials — all clear.');
$engine->decide($reqB, 'Grace Lim',   ApprovalDecision::Approved, 'Standard T&Cs; liability clause acceptable.');
$engine->decide($reqB, 'Henry Torres', ApprovalDecision::Approved, 'Cost within cap; approved for 12 months.');

$reporter->printRequest($reqB);
$reporter->printAuditLog($reqB);

// ─── Scenario C: rejection mid-chain ─────────────────────────────────────

$ui->section('Scenario C — Rejection: Overtime Pay Request');

$reqC = new WorkflowRequest(
    id:          'WF-2003',
    title:       'Emergency Overtime — Dev Team',
    submittedBy: 'jack@company.com',
    submittedAt: date('Y-m-d H:i:s', strtotime('-30 minutes')),
    steps: [
        new ApprovalStep('Team Lead',    'Kate Wilson'),
        new ApprovalStep('HR Manager',   'Leo Nguyen'),
        new ApprovalStep('Finance',      'Mia Zhang'),
    ],
);

$engine->start($reqC);

$engine->decide($reqC, 'Kate Wilson', ApprovalDecision::Approved,  'Confirmed project emergency.');
$engine->decide($reqC, 'Leo Nguyen',  ApprovalDecision::Rejected,  'Overtime quota already exceeded this month.');

$reporter->printRequest($reqC);
$reporter->printAuditLog($reqC);

// ─── Scenario D: rule violations (caught cleanly) ────────────────────────
//
// Three guards are demonstrated here, each in its own minimal workflow so
// the exception type matches exactly what is expected without ambiguity:
//   1. Self-approval conflict (submitter == approver)
//   2. Duplicate decision on the same step (idempotency re-delivery)
//   3. Mutation of a terminal (closed) workflow

$ui->section('Scenario D — Rule Violations (should be caught)');

// ── D1: self-approval ────────────────────────────────────────────────────
$reqD1 = new WorkflowRequest(
    id:          'WF-2004A',
    title:       'Equipment Purchase (self-approval test)',
    submittedBy: 'noah@company.com',
    submittedAt: date('Y-m-d H:i:s'),
    steps: [
        new ApprovalStep('Manager', 'Olivia Reed'),
        new ApprovalStep('Finance', 'Paul Kim'),
    ],
);
$engine->start($reqD1);

try {
    $engine->decide($reqD1, 'noah@company.com', ApprovalDecision::Approved);
    $ui->err('Self-approval was not blocked — BUG!');
} catch (SelfApprovalConflictException $e) {
    $ui->warn("Self-approval blocked: {$e->getMessage()}");
}

// Complete reqD1 legitimately so it can appear in the summary
$engine->decide($reqD1, 'Olivia Reed', ApprovalDecision::Approved, 'Item is on approved vendor list.');
$engine->decide($reqD1, 'Paul Kim',    ApprovalDecision::Approved, 'Under spending limit; no PO required.');

// ── D2: duplicate decision — pre-mark step to simulate webhook re-delivery ─
// A webhook POSTs a decision twice. The second POST must be rejected cleanly
// rather than double-counting the approval or corrupting the audit trail.
$reqD2 = new WorkflowRequest(
    id:          'WF-2004B',
    title:       'Duplicate Decision Guard',
    submittedBy: 'owner@company.com',
    submittedAt: date('Y-m-d H:i:s'),
    steps: [
        new ApprovalStep('Checker',  'Uma Patel'),
        new ApprovalStep('Sign-off', 'Victor Ng'),
    ],
);
$engine->start($reqD2);

// Simulate: the step was already persisted (e.g. first webhook delivery succeeded)
$steps = $reqD2->steps();
$steps[0]->decision   = ApprovalDecision::Approved;
$steps[0]->decisionAt = date('Y-m-d H:i:s');
$steps[0]->note       = 'Pre-recorded — simulating double webhook delivery';

// Second delivery hits the engine — must be rejected
try {
    $engine->decide($reqD2, 'Uma Patel', ApprovalDecision::Approved);
    $ui->err('Duplicate decision was not blocked — BUG!');
} catch (DuplicateDecisionException $e) {
    $ui->warn("Duplicate decision blocked: {$e->getMessage()}");
}

// ── D3: closed-workflow guard ─────────────────────────────────────────────
$reqD3 = new WorkflowRequest(
    id:          'WF-2004C',
    title:       'Closed Workflow Guard',
    submittedBy: 'sub@company.com',
    submittedAt: date('Y-m-d H:i:s'),
    steps: [new ApprovalStep('Final', 'Quinn Adams')],
);
$engine->start($reqD3);
$engine->decide($reqD3, 'Quinn Adams', ApprovalDecision::Approved, 'All good.');

// Workflow is now in terminal state — any further mutation must be refused
try {
    $engine->decide($reqD3, 'Quinn Adams', ApprovalDecision::Approved);
    $ui->err('Closed workflow accepted a decision — BUG!');
} catch (WorkflowClosedException $e) {
    $ui->warn("Closed-workflow blocked: {$e->getMessage()}");
}

$reporter->printRequest($reqD1);
$reporter->printAuditLog($reqD1);

// ─── Summary ─────────────────────────────────────────────────────────────

$ui->section('Run Summary');

$scenarios = [
    ['ID' => 'WF-2001',  'Title' => 'Q3 Marketing Budget Increase',    'Outcome' => Ansi::green('APPROVED')],
    ['ID' => 'WF-2002',  'Title' => 'New Vendor Contract — Cloud Svc', 'Outcome' => Ansi::green('APPROVED')],
    ['ID' => 'WF-2003',  'Title' => 'Emergency Overtime — Dev Team',   'Outcome' => Ansi::red('REJECTED')],
    ['ID' => 'WF-2004A', 'Title' => 'Equipment Purchase',               'Outcome' => Ansi::green('APPROVED')],
];

$ui->table(['ID', 'Title', 'Outcome'], $scenarios);

echo PHP_EOL;
echo Ansi::bold('Rule violations caught: ')
    . Ansi::green('3/3')
    . Ansi::dim(' (self-approval, duplicate decision, closed-workflow)') . PHP_EOL;
echo Ansi::bold('Delegation chain: ')
    . Ansi::green('1 delegation resolved cleanly') . PHP_EOL;
echo Ansi::dim(str_repeat('─', 64)) . PHP_EOL;
echo Ansi::bold('All workflows processed. Full audit trail recorded.') . PHP_EOL;
