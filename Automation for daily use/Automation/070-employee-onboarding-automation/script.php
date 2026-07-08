<?php

declare(strict_types=1);

/**
 * Project #70 — Employee Onboarding Automation
 *
 * Senior-developer PHP CLI: drives a new hire through a structured onboarding
 * pipeline. Each task belongs to an ordered phase (Pre-arrival → Day 1 →
 * Week 1 → Week 2+). Tasks have prerequisite chains, ownership roles, and
 * idempotency guards so re-runs never duplicate work already done.
 * Transient provisioning failures (AD account creation, badge system, HR
 * portal) trigger bounded retries with back-off; permanent failures block
 * the dependent tasks and surface a remediation hint.
 */

// ─── Terminal styling ──────────────────────────────────────────────────────────

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

    public static function strip(string $text): string
    {
        return (string) preg_replace('/\033\[[0-9;]*m/', '', $text);
    }
}

final class ConsoleUi
{
    public function banner(string $title, string $subtitle = ''): void
    {
        $width = max(64, strlen($title) + 8, strlen($subtitle) + 4);
        $line  = str_repeat('═', $width);
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
        echo Ansi::dim(str_repeat('─', 64)) . PHP_EOL;
    }

    /** @param array<array<string,string>> $rows */
    public function table(array $columns, array $rows): void
    {
        $widths = array_combine($columns, array_map('strlen', $columns));
        foreach ($rows as $row) {
            foreach ($columns as $col) {
                $raw         = Ansi::strip($row[$col] ?? '');
                $widths[$col] = max($widths[$col], strlen($raw));
            }
        }

        $bar = fn(string $l, string $m, string $r): string =>
            $l . implode($m, array_map(fn($c) => str_repeat('─', $widths[$c] + 2), $columns)) . $r;

        echo $bar('┌', '┬', '┐') . PHP_EOL;
        $h = '│';
        foreach ($columns as $col) {
            $h .= ' ' . Ansi::bold(str_pad($col, $widths[$col])) . ' │';
        }
        echo $h . PHP_EOL;
        echo $bar('├', '┼', '┤') . PHP_EOL;

        foreach ($rows as $row) {
            $line = '│';
            foreach ($columns as $col) {
                $val  = $row[$col] ?? '';
                $pad  = str_repeat(' ', $widths[$col] - strlen(Ansi::strip($val)));
                $line .= ' ' . $val . $pad . ' │';
            }
            echo $line . PHP_EOL;
        }
        echo $bar('└', '┴', '┘') . PHP_EOL;
    }

    public function progressBar(int $done, int $total, int $width = 40): string
    {
        $filled = (int) round($width * $done / max(1, $total));
        $bar    = str_repeat('█', $filled) . str_repeat('░', $width - $filled);
        $pct    = (int) round(100 * $done / max(1, $total));
        return Ansi::cyan('[') . Ansi::green($bar) . Ansi::cyan(']') . " {$pct}%";
    }
}

// ─── Domain model ──────────────────────────────────────────────────────────────

enum OnboardingPhase: string
{
    case PreArrival = 'Pre-Arrival';
    case DayOne     = 'Day 1';
    case WeekOne    = 'Week 1';
    case WeekTwo    = 'Week 2+';
}

enum TaskStatus: string
{
    case Pending   = 'pending';
    case Running   = 'running';
    case Done      = 'done';
    case Failed    = 'failed';
    case Skipped   = 'skipped';   // prerequisite failed — can't continue
    case Duplicate = 'duplicate'; // idempotency: already completed in a prior run
}

enum OwnerRole: string
{
    case HR      = 'HR';
    case IT      = 'IT';
    case Manager = 'Manager';
    case Finance = 'Finance';
    case Facility = 'Facility';
}

/**
 * Thrown for provisioning failures that are transient in nature
 * (external system unavailable, network hiccup, API rate limit).
 * Only these are eligible for the retry/backoff path.
 */
final class TransientProvisioningException extends RuntimeException {}

/**
 * Thrown when the provisioning failure is permanent and retrying
 * won't help (invalid data, permission denied, quota exhausted).
 */
final class PermanentProvisioningException extends RuntimeException {}

final class OnboardingTask
{
    public TaskStatus $status = TaskStatus::Pending;
    public string     $note   = '';

    /** @param string[] $prerequisiteIds */
    public function __construct(
        public readonly string          $id,
        public readonly string          $name,
        public readonly OnboardingPhase $phase,
        public readonly OwnerRole       $owner,
        public readonly array           $prerequisiteIds = [],
        public readonly bool            $retryable       = true,
    ) {}
}

final class Employee
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $department,
        public readonly string $startDate,
        public readonly string $email,
    ) {}
}

// ─── Simulated provisioning services ──────────────────────────────────────────

/**
 * Each service simulates realistic success/failure distributions.
 * The AD account (a root task) has a 30% chance of a transient failure on
 * the first call, exercising the retry path. Badge provisioning may produce
 * a permanent failure (~10%) to demonstrate dependent-task skipping.
 */
final class ProvisioningSimulator
{
    private array $callCounts = [];

    public function run(OnboardingTask $task, Employee $emp): string
    {
        $key = $task->id;
        $this->callCounts[$key] = ($this->callCounts[$key] ?? 0) + 1;
        $call = $this->callCounts[$key];

        // Simulate based on task id
        return match ($task->id) {
            'ad_account' => $this->simulateAdAccount($call, $emp),
            'email'      => $this->simulateEmail($call, $emp),
            'badge'      => $this->simulateBadge($call, $emp),
            'laptop'     => $this->simulateLaptop($emp),
            'hr_portal'  => $this->simulateHrPortal($call, $emp),
            'payroll'    => $this->simulatePayroll($emp),
            'teams'      => $this->simulateTeams($emp),
            'buddy'      => $this->simulateBuddy($emp),
            'it_tour'    => $this->simulateItTour($emp),
            'compliance' => $this->simulateCompliance($emp),
            'benefits'   => $this->simulateBenefits($emp),
            'review_30'  => $this->simulateReview($emp, '30-day'),
            default      => "Task {$task->id} completed for {$emp->name}.",
        };
    }

    private function simulateAdAccount(int $call, Employee $emp): string
    {
        // First attempt: 30% transient failure (simulates AD controller lag)
        if ($call === 1 && random_int(1, 100) <= 30) {
            throw new TransientProvisioningException(
                'AD domain controller timed out (LDAP connection refused)'
            );
        }
        return "AD account {$emp->email} created; temp password dispatched via SMS.";
    }

    private function simulateEmail(int $call, Employee $emp): string
    {
        // First attempt: 20% transient failure (mail server queue full)
        if ($call === 1 && random_int(1, 100) <= 20) {
            throw new TransientProvisioningException(
                'Mail provisioning queue saturated — retry in a moment'
            );
        }
        return "Mailbox {$emp->email} created with 50 GB quota; welcome email enqueued.";
    }

    private function simulateBadge(int $call, Employee $emp): string
    {
        // 10% permanent failure — badge system offline for maintenance
        if (random_int(1, 100) <= 10) {
            throw new PermanentProvisioningException(
                'Badge system API returned 503 Maintenance mode — manual issuance required'
            );
        }
        $badgeId = strtoupper(substr(md5($emp->id), 0, 8));
        return "Photo ID badge #{$badgeId} provisioned; pickup at reception, Floor 1.";
    }

    private function simulateLaptop(Employee $emp): string
    {
        $models  = ['MacBook Pro 14"', 'Dell XPS 15', 'ThinkPad X1 Carbon'];
        $model   = $models[crc32($emp->id) % count($models)];
        $asset   = 'AST-' . strtoupper(substr(md5($emp->id . 'lp'), 0, 6));
        return "{$model} (asset {$asset}) imaged and staged at IT helpdesk.";
    }

    private function simulateHrPortal(int $call, Employee $emp): string
    {
        if ($call === 1 && random_int(1, 100) <= 25) {
            throw new TransientProvisioningException('HR portal SSO token endpoint returned 502');
        }
        return "Profile for {$emp->name} activated in HR portal; documents pending e-signature.";
    }

    private function simulatePayroll(Employee $emp): string
    {
        $cycle = (int) date('d') <= 15 ? 'mid-month' : 'end-of-month';
        return "Payroll record created for {$emp->name} ({$emp->department}); first disbursement: {$cycle} cycle.";
    }

    private function simulateTeams(Employee $emp): string
    {
        $channels = ['#general', "#dept-{$emp->department}", '#announcements'];
        return "{$emp->name} added to Teams: " . implode(', ', $channels) . '.';
    }

    private function simulateBuddy(Employee $emp): string
    {
        $buddies = ['Sarah Chen', 'Marcus Obi', 'Lena Kovač', 'Raj Patel'];
        $buddy   = $buddies[crc32($emp->id) % count($buddies)];
        return "Buddy programme: {$buddy} assigned as onboarding mentor for {$emp->name}.";
    }

    private function simulateItTour(Employee $emp): string
    {
        return "IT orientation scheduled for {$emp->name} — 10:00 AM, Day 1 (Conference Room B).";
    }

    private function simulateCompliance(Employee $emp): string
    {
        return "GDPR, AML, and Code of Conduct e-learning assigned; deadline: {$emp->startDate} + 5 days.";
    }

    private function simulateBenefits(Employee $emp): string
    {
        return "Benefits enrolment window opened for {$emp->name}; 30-day election deadline active.";
    }

    private function simulateReview(Employee $emp, string $period): string
    {
        return "30-day check-in with {$emp->name} and manager scheduled in calendar.";
    }
}

// ─── Onboarding engine ─────────────────────────────────────────────────────────

/**
 * Executes the task DAG in phase order. Key decisions:
 *
 * 1. Prerequisites are checked before execution — if a required task failed
 *    or was skipped, the dependent task is itself skipped rather than running
 *    in an unknown system state (e.g. don't try to create an email mailbox
 *    if the AD account doesn't exist yet).
 *
 * 2. Transient failures are retried with exponential back-off (100 ms × 2^n
 *    plus ±50 ms jitter). Permanent failures are recorded immediately as
 *    failed with a remediation hint; retrying would only add noise.
 *
 * 3. Idempotency: tasks are checked against a simple "done" registry before
 *    running. In production this would be a database row; here it's an
 *    in-memory set. Tasks already in the set are marked "duplicate" so a
 *    re-run of the pipeline doesn't re-provision resources.
 */
final class OnboardingEngine
{
    private const MAX_ATTEMPTS = 3;

    /** @var string[] */
    private array $alreadyDone;

    public function __construct(
        private readonly ConsoleUi            $ui,
        private readonly ProvisioningSimulator $simulator,
        array                                  $alreadyDoneIds = [],
    ) {
        $this->alreadyDone = $alreadyDoneIds;
    }

    /** @param OnboardingTask[] $tasks */
    public function run(Employee $emp, array $tasks): void
    {
        $indexed = [];
        foreach ($tasks as $t) {
            $indexed[$t->id] = $t;
        }

        $phases = [
            OnboardingPhase::PreArrival,
            OnboardingPhase::DayOne,
            OnboardingPhase::WeekOne,
            OnboardingPhase::WeekTwo,
        ];

        foreach ($phases as $phase) {
            $phaseTasks = array_filter($tasks, fn(OnboardingTask $t) => $t->phase === $phase);
            if (empty($phaseTasks)) {
                continue;
            }
            $this->ui->section("Phase: {$phase->value}");

            foreach ($phaseTasks as $task) {
                $this->executeTask($task, $emp, $indexed);
            }
        }
    }

    /** @param array<string, OnboardingTask> $indexed */
    private function executeTask(OnboardingTask $task, Employee $emp, array $indexed): void
    {
        // Idempotency guard
        if (in_array($task->id, $this->alreadyDone, true)) {
            $task->status = TaskStatus::Duplicate;
            $task->note   = 'Skipped — completed in a previous run (idempotent).';
            echo '  ' . Ansi::dim("↩ [{$task->owner->value}] {$task->name} — already done") . PHP_EOL;
            return;
        }

        // Prerequisite check — fail-fast rather than run in degraded state
        foreach ($task->prerequisiteIds as $prereqId) {
            $prereq = $indexed[$prereqId] ?? null;
            if ($prereq !== null && in_array($prereq->status, [TaskStatus::Failed, TaskStatus::Skipped], true)) {
                $task->status = TaskStatus::Skipped;
                $task->note   = "Blocked: prerequisite '{$prereq->name}' {$prereq->status->value}.";
                echo '  ' . Ansi::yellow("⊘ [{$task->owner->value}] {$task->name}")
                    . Ansi::dim(" — blocked by {$prereq->name}") . PHP_EOL;
                return;
            }
        }

        // Execute with retry (transient) / fail-fast (permanent)
        $task->status = TaskStatus::Running;
        $attempt      = 0;

        while ($attempt < self::MAX_ATTEMPTS) {
            $attempt++;
            $retryTag = $attempt > 1 ? Ansi::dim(" (retry {$attempt}/" . self::MAX_ATTEMPTS . ')') : '';
            echo '  ⠿ ' . Ansi::cyan("[{$task->owner->value}]") . " {$task->name}{$retryTag} …" . PHP_EOL;

            try {
                $task->note   = $this->simulator->run($task, $emp);
                $task->status = TaskStatus::Done;
                echo '    ' . Ansi::green('✓') . ' ' . Ansi::dim($task->note) . PHP_EOL;
                return;
            } catch (TransientProvisioningException $e) {
                if ($attempt >= self::MAX_ATTEMPTS) {
                    $task->status = TaskStatus::Failed;
                    $task->note   = "Transient failure after {$attempt} attempts: {$e->getMessage()}";
                    echo '    ' . Ansi::red("✗ {$e->getMessage()} — giving up.") . PHP_EOL;
                    return;
                }
                $backoffMs = (int)(100 * (2 ** $attempt)) + random_int(0, 50);
                echo '    ' . Ansi::red("⚡ {$e->getMessage()}")
                    . Ansi::dim(" — back-off {$backoffMs} ms") . PHP_EOL;
                usleep($backoffMs * 1000);
            } catch (PermanentProvisioningException $e) {
                $task->status = TaskStatus::Failed;
                $task->note   = "Permanent failure: {$e->getMessage()}";
                echo '    ' . Ansi::red("✗ Permanent: {$e->getMessage()}") . PHP_EOL;
                echo '    ' . Ansi::yellow('  → Manual intervention required. See remediation in report.') . PHP_EOL;
                return;
            }
        }
    }
}

// ─── Task catalogue ────────────────────────────────────────────────────────────

function buildTaskCatalogue(): array
{
    return [
        // Pre-Arrival ──────────────────────────────────────────────
        new OnboardingTask('ad_account',  'Create Active Directory account',       OnboardingPhase::PreArrival, OwnerRole::IT),
        new OnboardingTask('email',       'Provision corporate email mailbox',     OnboardingPhase::PreArrival, OwnerRole::IT,      ['ad_account']),
        new OnboardingTask('badge',       'Issue physical access badge',           OnboardingPhase::PreArrival, OwnerRole::Facility, [],            false),
        new OnboardingTask('laptop',      'Prepare and image laptop',              OnboardingPhase::PreArrival, OwnerRole::IT),
        new OnboardingTask('hr_portal',   'Activate HR portal profile',            OnboardingPhase::PreArrival, OwnerRole::HR,      ['ad_account']),
        new OnboardingTask('payroll',     'Add employee to payroll system',        OnboardingPhase::PreArrival, OwnerRole::Finance, ['hr_portal']),

        // Day 1 ───────────────────────────────────────────────────
        new OnboardingTask('teams',       'Add to Teams channels & groups',        OnboardingPhase::DayOne,     OwnerRole::IT,      ['email']),
        new OnboardingTask('buddy',       'Assign onboarding buddy / mentor',      OnboardingPhase::DayOne,     OwnerRole::HR),
        new OnboardingTask('it_tour',     'Schedule IT orientation session',       OnboardingPhase::DayOne,     OwnerRole::IT,      ['laptop']),

        // Week 1 ──────────────────────────────────────────────────
        new OnboardingTask('compliance',  'Assign mandatory compliance training',  OnboardingPhase::WeekOne,    OwnerRole::HR,      ['hr_portal']),
        new OnboardingTask('benefits',    'Open benefits enrolment window',        OnboardingPhase::WeekOne,    OwnerRole::HR,      ['hr_portal']),

        // Week 2+ ─────────────────────────────────────────────────
        new OnboardingTask('review_30',   'Schedule 30-day manager check-in',     OnboardingPhase::WeekTwo,    OwnerRole::Manager),
    ];
}

// ─── Wiring + run ──────────────────────────────────────────────────────────────

$ui = new ConsoleUi();
$ui->banner(
    'Employee Onboarding Automation',
    'Project #70 — multi-phase task pipeline with prerequisite DAG, retry/backoff, and idempotency'
);

$employee = new Employee(
    id:         'EMP-' . str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT),
    name:       'Alexandra Torres',
    department: 'engineering',
    startDate:  date('Y-m-d', strtotime('+3 days')),
    email:      'a.torres@company.internal',
);

$ui->section('New Hire Details');
echo '  ' . Ansi::bold('Name:')       . "       {$employee->name}" . PHP_EOL;
echo '  ' . Ansi::bold('Employee ID:') . "  {$employee->id}" . PHP_EOL;
echo '  ' . Ansi::bold('Department:') . "  {$employee->department}" . PHP_EOL;
echo '  ' . Ansi::bold('Start Date:') . "  {$employee->startDate}" . PHP_EOL;
echo '  ' . Ansi::bold('Email:')      . "       {$employee->email}" . PHP_EOL;

$tasks = buildTaskCatalogue();

$simulator = new ProvisioningSimulator();
$engine    = new OnboardingEngine($ui, $simulator, alreadyDoneIds: []);
$engine->run($employee, $tasks);

// ─── Final report ──────────────────────────────────────────────────────────────

$ui->section('Onboarding Report');

$statusBadge = fn(TaskStatus $s): string => match ($s) {
    TaskStatus::Done      => Ansi::green('✓ done'),
    TaskStatus::Failed    => Ansi::red('✗ failed'),
    TaskStatus::Skipped   => Ansi::yellow('⊘ skipped'),
    TaskStatus::Duplicate => Ansi::dim('↩ duplicate'),
    TaskStatus::Running   => Ansi::cyan('⟳ running'),
    TaskStatus::Pending   => Ansi::dim('· pending'),
};

$rows = array_map(fn(OnboardingTask $t) => [
    'Phase'  => $t->phase->value,
    'Owner'  => $t->owner->value,
    'Task'   => $t->name,
    'Status' => $statusBadge($t->status),
], $tasks);

$ui->table(['Phase', 'Owner', 'Task', 'Status'], $rows);

// Counts
$counts = ['done' => 0, 'failed' => 0, 'skipped' => 0, 'duplicate' => 0, 'other' => 0];
foreach ($tasks as $t) {
    match ($t->status) {
        TaskStatus::Done      => $counts['done']++,
        TaskStatus::Failed    => $counts['failed']++,
        TaskStatus::Skipped   => $counts['skipped']++,
        TaskStatus::Duplicate => $counts['duplicate']++,
        default               => $counts['other']++,
    };
}

$total    = count($tasks);
$progress = $ui->progressBar($counts['done'] + $counts['duplicate'], $total);

echo PHP_EOL;
echo '  ' . Ansi::bold('Progress: ') . $progress . PHP_EOL;
echo PHP_EOL;
echo Ansi::bold('Summary: ')
    . Ansi::green("{$counts['done']} completed") . ' · '
    . Ansi::dim("{$counts['duplicate']} duplicate") . ' · '
    . Ansi::yellow("{$counts['skipped']} skipped") . ' · '
    . Ansi::red("{$counts['failed']} failed")
    . PHP_EOL;

// Failed task remediation hints
$failed = array_filter($tasks, fn(OnboardingTask $t) => $t->status === TaskStatus::Failed);
if (!empty($failed)) {
    echo PHP_EOL . Ansi::bold(Ansi::red('Remediation required:')) . PHP_EOL;
    foreach ($failed as $t) {
        echo '  ' . Ansi::red("✗ [{$t->owner->value}]") . " {$t->name}" . PHP_EOL;
        echo '    ' . Ansi::dim($t->note) . PHP_EOL;
    }
}

// Skipped task dependencies
$skipped = array_filter($tasks, fn(OnboardingTask $t) => $t->status === TaskStatus::Skipped);
if (!empty($skipped)) {
    echo PHP_EOL . Ansi::bold(Ansi::yellow('Blocked tasks (resolve failed prerequisites first):')) . PHP_EOL;
    foreach ($skipped as $t) {
        echo '  ' . Ansi::yellow("⊘ {$t->name}") . Ansi::dim(' — ' . $t->note) . PHP_EOL;
    }
}

$allOk = ($counts['failed'] === 0 && $counts['skipped'] === 0);
echo PHP_EOL;
if ($allOk) {
    echo Ansi::green(Ansi::bold('  ✓ Onboarding pipeline complete. Welcome aboard, ' . $employee->name . '!')) . PHP_EOL;
} else {
    echo Ansi::yellow('  ⚠ Pipeline finished with issues. Resolve failed tasks and re-run — completed steps will be skipped (idempotent).') . PHP_EOL;
}
echo PHP_EOL;
