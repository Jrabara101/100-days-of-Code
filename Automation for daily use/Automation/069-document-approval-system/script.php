<?php

declare(strict_types=1);

/**
 * Project #69 — Document Approval System
 *
 * Senior-developer PHP CLI: manages a multi-stage document approval pipeline
 * with explicit state-machine transitions, reviewer quorum rules, escalation
 * on deadline breach, and a styled terminal report.
 */

// -----------------------------------------------------------------------
// Terminal styling layer
// -----------------------------------------------------------------------

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

    public static function stripAnsi(string $text): string
    {
        return (string) preg_replace('/\033\[[0-9;]*m/', '', $text);
    }
}

final class ConsoleUi
{
    public function banner(string $title, string $subtitle = ''): void
    {
        $width = max(66, strlen($title) + 8, strlen($subtitle) + 6);
        $line = str_repeat('═', $width);
        echo Ansi::cyan("╔{$line}╗") . PHP_EOL;
        echo Ansi::cyan('║') . '  ' . Ansi::bold(Ansi::magenta($title))
            . str_repeat(' ', $width - strlen($title) - 2) . Ansi::cyan('║') . PHP_EOL;
        if ($subtitle !== '') {
            echo Ansi::cyan('║') . '  ' . Ansi::dim($subtitle)
                . str_repeat(' ', $width - strlen($subtitle) - 2) . Ansi::cyan('║') . PHP_EOL;
        }
        echo Ansi::cyan("╚{$line}╝") . PHP_EOL . PHP_EOL;
    }

    public function section(string $label): void
    {
        echo PHP_EOL . Ansi::bold(Ansi::yellow("▸ {$label}")) . PHP_EOL;
        echo Ansi::dim(str_repeat('─', 62)) . PHP_EOL;
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
                $raw = Ansi::stripAnsi((string) ($row[$col] ?? ''));
                $widths[$col] = max($widths[$col], strlen($raw));
            }
        }

        $bar = function (string $l, string $m, string $r) use ($columns, $widths): string {
            $parts = array_map(fn ($c) => str_repeat('─', $widths[$c] + 2), $columns);
            return $l . implode($m, $parts) . $r;
        };

        echo $bar('┌', '┬', '┐') . PHP_EOL;
        $hdr = '│';
        foreach ($columns as $col) {
            $hdr .= ' ' . Ansi::bold(str_pad($col, $widths[$col])) . ' │';
        }
        echo $hdr . PHP_EOL;
        echo $bar('├', '┼', '┤') . PHP_EOL;

        foreach ($rows as $row) {
            $ln = '│';
            foreach ($columns as $col) {
                $val = (string) ($row[$col] ?? '');
                $pad = $widths[$col] - strlen(Ansi::stripAnsi($val));
                $ln .= ' ' . $val . str_repeat(' ', $pad) . ' │';
            }
            echo $ln . PHP_EOL;
        }
        echo $bar('└', '┴', '┘') . PHP_EOL;
    }

    public function info(string $msg): void
    {
        echo '  ' . Ansi::cyan('ℹ') . ' ' . $msg . PHP_EOL;
    }

    public function warn(string $msg): void
    {
        echo '  ' . Ansi::yellow('⚠') . ' ' . Ansi::yellow($msg) . PHP_EOL;
    }

    public function success(string $msg): void
    {
        echo '  ' . Ansi::green('✓') . ' ' . Ansi::green($msg) . PHP_EOL;
    }

    public function error(string $msg): void
    {
        echo '  ' . Ansi::red('✗') . ' ' . Ansi::red($msg) . PHP_EOL;
    }
}

// -----------------------------------------------------------------------
// Domain model
// -----------------------------------------------------------------------

/**
 * Explicit state machine for a document in the approval pipeline.
 *
 * Draft → InReview → (all stages approved) → Approved
 *                  → (any stage rejected)  → Rejected
 *                  → (deadline exceeded)   → Escalated
 *
 * The enum encodes every meaningful lifecycle state. Using an enum rather
 * than raw strings makes illegal states unrepresentable at the type level.
 */
enum DocumentStatus: string
{
    case Draft     = 'Draft';
    case InReview  = 'In Review';
    case Approved  = 'Approved';
    case Rejected  = 'Rejected';
    case Escalated = 'Escalated';
}

enum ReviewDecision: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Pending  = 'pending';
}

final class ReviewStage
{
    /** @param list<string> $reviewers */
    public function __construct(
        public readonly string $name,
        public readonly array  $reviewers,
        public readonly int    $quorum,        // minimum approvals required
        public readonly int    $deadlineHours,
    ) {}
}

final class ReviewVote
{
    public function __construct(
        public readonly string         $reviewer,
        public readonly ReviewDecision $decision,
        public readonly string         $comment,
        public readonly \DateTimeImmutable $votedAt,
    ) {}
}

final class Document
{
    public DocumentStatus $status = DocumentStatus::Draft;

    /** @var list<ReviewStage> */
    public array $stages = [];

    /** @var array<string, list<ReviewVote>> keyed by stage name */
    public array $votes = [];

    /** @var array<string, string> stage → escalation note */
    public array $escalations = [];

    public function __construct(
        public readonly string $id,
        public readonly string $title,
        public readonly string $type,
        public readonly string $author,
        public readonly \DateTimeImmutable $submittedAt,
    ) {}
}

/**
 * Thrown when someone tries to push a document through an invalid
 * transition (e.g. approving a draft, or voting on an already-closed doc).
 * Kept separate from generic RuntimeException so callers can distinguish
 * a workflow violation from an infrastructure error.
 */
final class WorkflowViolationException extends RuntimeException {}

// -----------------------------------------------------------------------
// Core workflow engine
// -----------------------------------------------------------------------

/**
 * The engine enforces the state machine and quorum rules.
 *
 * Key design decisions:
 *  1. State transitions are validated explicitly — no "anything goes" setter.
 *  2. Quorum is evaluated after every vote, not just at the end, so a stage
 *     closes as soon as it's mathematically settled (approval quorum met OR
 *     one rejection blocks the whole document — fail-fast rejection policy).
 *  3. Escalation is checked before each vote batch so a stale document
 *     cannot receive new votes after its deadline has passed.
 */
final class ApprovalWorkflowEngine
{
    public function submitForReview(Document $doc): void
    {
        if ($doc->status !== DocumentStatus::Draft) {
            throw new WorkflowViolationException(
                "Cannot submit '{$doc->id}': status is {$doc->status->value}, expected Draft."
            );
        }
        if (empty($doc->stages)) {
            throw new WorkflowViolationException("Document '{$doc->id}' has no review stages configured.");
        }

        $doc->status = DocumentStatus::InReview;
        foreach ($doc->stages as $stage) {
            $doc->votes[$stage->name] = [];
        }
    }

    public function castVote(
        Document       $doc,
        string         $stageName,
        string         $reviewer,
        ReviewDecision $decision,
        string         $comment,
        \DateTimeImmutable $now,
    ): void {
        if ($doc->status !== DocumentStatus::InReview) {
            throw new WorkflowViolationException(
                "Cannot vote on '{$doc->id}': document is not in review (status: {$doc->status->value})."
            );
        }

        $stage = $this->findStage($doc, $stageName);

        // Deadline check — escalate before recording vote
        $elapsed = ($now->getTimestamp() - $doc->submittedAt->getTimestamp()) / 3600;
        if ($elapsed > $stage->deadlineHours) {
            $doc->status = DocumentStatus::Escalated;
            $doc->escalations[$stageName] = sprintf(
                'Deadline of %dh breached (%.1fh elapsed). Escalated for manager review.',
                $stage->deadlineHours,
                $elapsed
            );
            return;
        }

        if (!in_array($reviewer, $stage->reviewers, true)) {
            throw new WorkflowViolationException(
                "'{$reviewer}' is not an authorized reviewer for stage '{$stageName}'."
            );
        }

        // Prevent double-voting
        foreach ($doc->votes[$stageName] as $v) {
            if ($v->reviewer === $reviewer) {
                throw new WorkflowViolationException(
                    "'{$reviewer}' has already voted on stage '{$stageName}' of '{$doc->id}'."
                );
            }
        }

        $doc->votes[$stageName][] = new ReviewVote($reviewer, $decision, $comment, $now);

        // Settle after every vote
        $this->settleDocument($doc);
    }

    /**
     * After each vote, check whether the document can be settled.
     *
     * Fail-fast rejection: one rejection immediately closes the document.
     * This is intentional — in document approval workflows, a single
     * stakeholder rejection typically blocks legal/financial sign-off and
     * needs rework, not a majority override.
     *
     * Quorum approval: a stage passes when it accumulates enough approvals.
     * Only when ALL stages pass does the document move to Approved.
     */
    private function settleDocument(Document $doc): void
    {
        foreach ($doc->stages as $stage) {
            $stageVotes = $doc->votes[$stage->name] ?? [];

            $approvals  = count(array_filter($stageVotes, fn ($v) => $v->decision === ReviewDecision::Approved));
            $rejections = count(array_filter($stageVotes, fn ($v) => $v->decision === ReviewDecision::Rejected));

            if ($rejections > 0) {
                $doc->status = DocumentStatus::Rejected;
                return;
            }

            if ($approvals < $stage->quorum) {
                // This stage is still open; document stays InReview
                return;
            }
        }

        // All stages have met quorum and no rejections
        $doc->status = DocumentStatus::Approved;
    }

    private function findStage(Document $doc, string $name): ReviewStage
    {
        foreach ($doc->stages as $s) {
            if ($s->name === $name) {
                return $s;
            }
        }
        throw new WorkflowViolationException("Stage '{$name}' not found on document.");
    }

    // ---- Query helpers ----

    /** @return array{string, ReviewDecision} stage outcome summary */
    public function stageOutcomes(Document $doc): array
    {
        $out = [];
        foreach ($doc->stages as $stage) {
            $votes     = $doc->votes[$stage->name] ?? [];
            $approvals = count(array_filter($votes, fn ($v) => $v->decision === ReviewDecision::Approved));
            $rejected  = count(array_filter($votes, fn ($v) => $v->decision === ReviewDecision::Rejected));

            if (isset($doc->escalations[$stage->name])) {
                $out[$stage->name] = 'escalated';
            } elseif ($rejected > 0) {
                $out[$stage->name] = 'rejected';
            } elseif ($approvals >= $stage->quorum) {
                $out[$stage->name] = 'approved';
            } else {
                $out[$stage->name] = 'pending';
            }
        }
        return $out;
    }
}

// -----------------------------------------------------------------------
// Simulated scenario builder
// -----------------------------------------------------------------------

/**
 * Builds a realistic set of documents with varied outcomes:
 *  - One fully approved (all stages pass quorum)
 *  - One rejected (single veto from Legal)
 *  - One still in review (quorum not yet met)
 *  - One escalated (past its deadline)
 *
 * Using deterministic fake data keeps the demo reproducible without a DB.
 */
function buildScenario(ApprovalWorkflowEngine $engine): array
{
    $t0 = new \DateTimeImmutable('2026-07-07 09:00:00');

    // ---- Document 1: Vendor Contract — will be fully approved ----
    $d1 = new Document('DOC-2001', 'Vendor Contract v3.2', 'Contract', 'Alice Moore', $t0);
    $d1->stages = [
        new ReviewStage('Legal',   ['carol.tan', 'bob.lee'],   quorum: 1, deadlineHours: 48),
        new ReviewStage('Finance', ['david.kim', 'eve.santos'], quorum: 2, deadlineHours: 72),
    ];
    $engine->submitForReview($d1);
    $engine->castVote($d1, 'Legal',   'carol.tan',  ReviewDecision::Approved, 'Clauses look clean.', $t0->modify('+2 hours'));
    $engine->castVote($d1, 'Finance', 'david.kim',  ReviewDecision::Approved, 'Budget aligned.',    $t0->modify('+5 hours'));
    $engine->castVote($d1, 'Finance', 'eve.santos', ReviewDecision::Approved, 'P&L impact acceptable.', $t0->modify('+6 hours'));

    // ---- Document 2: Policy Update — rejected by Legal ----
    $d2 = new Document('DOC-2002', 'Remote Work Policy Update', 'Policy', 'Frank Yuen', $t0);
    $d2->stages = [
        new ReviewStage('HR',    ['grace.li'],              quorum: 1, deadlineHours: 24),
        new ReviewStage('Legal', ['carol.tan', 'bob.lee'],  quorum: 1, deadlineHours: 48),
    ];
    $engine->submitForReview($d2);
    $engine->castVote($d2, 'HR',    'grace.li',  ReviewDecision::Approved, 'Policy language is fair.',     $t0->modify('+1 hour'));
    $engine->castVote($d2, 'Legal', 'bob.lee',   ReviewDecision::Rejected, 'Conflicts with labour code §7.', $t0->modify('+3 hours'));

    // ---- Document 3: Budget Proposal — awaiting quorum ----
    $d3 = new Document('DOC-2003', 'Q3 Marketing Budget', 'Budget', 'Heidi Park', $t0);
    $d3->stages = [
        new ReviewStage('Finance', ['david.kim', 'eve.santos', 'ivan.wu'], quorum: 2, deadlineHours: 96),
    ];
    $engine->submitForReview($d3);
    $engine->castVote($d3, 'Finance', 'david.kim', ReviewDecision::Approved, 'ROI looks solid.', $t0->modify('+4 hours'));
    // Only 1 of 2 required votes — still pending

    // ---- Document 4: NDA — escalated (deadline breached) ----
    $d4 = new Document('DOC-2004', 'Mutual NDA — Acme Corp', 'NDA', 'Janet Rose', $t0->modify('-100 hours'));
    $d4->stages = [
        new ReviewStage('Legal', ['carol.tan'], quorum: 1, deadlineHours: 48),
    ];
    $engine->submitForReview($d4);
    // Vote arrives 100 hours later — well past 48h deadline
    $engine->castVote($d4, 'Legal', 'carol.tan', ReviewDecision::Approved, 'Approved.',
        $t0->modify('-100 hours')->modify('+100 hours')
    );

    return [$d1, $d2, $d3, $d4];
}

// -----------------------------------------------------------------------
// Report rendering
// -----------------------------------------------------------------------

function renderReport(array $documents, ApprovalWorkflowEngine $engine, ConsoleUi $ui): void
{
    $ui->section('Document Pipeline Summary');

    $summaryRows = [];
    foreach ($documents as $doc) {
        $statusLabel = match ($doc->status) {
            DocumentStatus::Approved  => Ansi::green($doc->status->value),
            DocumentStatus::Rejected  => Ansi::red($doc->status->value),
            DocumentStatus::Escalated => Ansi::yellow($doc->status->value),
            DocumentStatus::InReview  => Ansi::cyan($doc->status->value),
            DocumentStatus::Draft     => Ansi::dim($doc->status->value),
        };

        $outcomes = $engine->stageOutcomes($doc);
        $stageStr = implode(' → ', array_map(function ($stage, $outcome) {
            return match ($outcome) {
                'approved'  => Ansi::green($stage),
                'rejected'  => Ansi::red($stage),
                'escalated' => Ansi::yellow($stage),
                default     => Ansi::dim($stage),
            };
        }, array_keys($outcomes), array_values($outcomes)));

        $summaryRows[] = [
            'ID'     => $doc->id,
            'Title'  => substr($doc->title, 0, 28),
            'Type'   => $doc->type,
            'Status' => $statusLabel,
            'Stages' => $stageStr,
        ];
    }

    $ui->table(['ID', 'Title', 'Type', 'Status', 'Stages'], $summaryRows);

    // ---- Per-document drill-down ----
    foreach ($documents as $doc) {
        $ui->section("Detail: {$doc->id} — {$doc->title}");
        echo '  ' . Ansi::dim('Author:') . " {$doc->author}  |  "
            . Ansi::dim('Submitted:') . ' ' . $doc->submittedAt->format('Y-m-d H:i') . PHP_EOL;

        foreach ($doc->stages as $stage) {
            echo PHP_EOL;
            echo '  ' . Ansi::bold(Ansi::blue("Stage: {$stage->name}"))
                . Ansi::dim("  (quorum: {$stage->quorum}/{" . count($stage->reviewers) . "}, deadline: {$stage->deadlineHours}h)") . PHP_EOL;

            if (isset($doc->escalations[$stage->name])) {
                $ui->warn($doc->escalations[$stage->name]);
                continue;
            }

            $votes = $doc->votes[$stage->name] ?? [];
            if (empty($votes)) {
                echo '    ' . Ansi::dim('No votes yet.') . PHP_EOL;
                continue;
            }

            foreach ($votes as $vote) {
                $icon   = $vote->decision === ReviewDecision::Approved ? Ansi::green('✓') : Ansi::red('✗');
                $label  = $vote->decision === ReviewDecision::Approved ? Ansi::green('Approved') : Ansi::red('Rejected');
                $time   = Ansi::dim($vote->votedAt->format('H:i'));
                $comment = Ansi::dim("\"{$vote->comment}\"");
                echo "    {$icon} {$vote->reviewer}  [{$label}] {$time}  {$comment}" . PHP_EOL;
            }
        }
    }
}

// -----------------------------------------------------------------------
// Statistics
// -----------------------------------------------------------------------

function renderStats(array $documents, ConsoleUi $ui): void
{
    $ui->section('Pipeline Statistics');

    $counts = [
        DocumentStatus::Approved->value  => 0,
        DocumentStatus::Rejected->value  => 0,
        DocumentStatus::Escalated->value => 0,
        DocumentStatus::InReview->value  => 0,
    ];
    foreach ($documents as $doc) {
        $counts[$doc->status->value] = ($counts[$doc->status->value] ?? 0) + 1;
    }

    $total = count($documents);
    echo PHP_EOL;
    printf(
        "  Total documents: %d  |  %s  |  %s  |  %s  |  %s\n",
        $total,
        Ansi::green("Approved: {$counts[DocumentStatus::Approved->value]}"),
        Ansi::red("Rejected: {$counts[DocumentStatus::Rejected->value]}"),
        Ansi::cyan("In Review: {$counts[DocumentStatus::InReview->value]}"),
        Ansi::yellow("Escalated: {$counts[DocumentStatus::Escalated->value]}"),
    );

    if ($counts[DocumentStatus::Escalated->value] > 0) {
        $ui->warn('Escalated documents require manager intervention — check escalation notes above.');
    }
    if ($counts[DocumentStatus::Rejected->value] > 0) {
        $ui->warn('Rejected documents must be revised and resubmitted by their authors.');
    }
    if ($counts[DocumentStatus::Approved->value] > 0) {
        $ui->success("Approved documents are cleared for execution / archival.");
    }
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

$ui     = new ConsoleUi();
$engine = new ApprovalWorkflowEngine();

$ui->banner(
    'Document Approval System',
    'Project #69 — multi-stage approval pipeline with quorum, veto, and escalation'
);

$ui->section('Running approval pipeline…');
$ui->info('Submitting documents and casting votes…');

try {
    $documents = buildScenario($engine);
    $ui->success('Pipeline simulation complete.');
} catch (WorkflowViolationException $e) {
    $ui->error("Workflow error: {$e->getMessage()}");
    exit(1);
}

renderReport($documents, $engine, $ui);
renderStats($documents, $ui);

echo PHP_EOL;
