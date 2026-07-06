<?php

declare(strict_types=1);

/**
 * Project #66 — Payment Status Sync from API
 *
 * Senior-developer PHP CLI: reconciles local order payment statuses against
 * a remote payment gateway, with retry/backoff for transient failures and
 * a styled terminal report.
 */

// ----------------------------------------------------------------------
// Terminal styling layer
// ----------------------------------------------------------------------

final class Ansi
{
    private static bool $enabled = true;

    public static function disable(): void
    {
        self::$enabled = false;
    }

    public static function paint(string $text, string $code): string
    {
        if (!self::$enabled) {
            return $text;
        }
        return "\033[{$code}m{$text}\033[0m";
    }

    public static function bold(string $t): string { return self::paint($t, '1'); }
    public static function dim(string $t): string { return self::paint($t, '2'); }
    public static function green(string $t): string { return self::paint($t, '32'); }
    public static function red(string $t): string { return self::paint($t, '31'); }
    public static function yellow(string $t): string { return self::paint($t, '33'); }
    public static function cyan(string $t): string { return self::paint($t, '36'); }
    public static function magenta(string $t): string { return self::paint($t, '35'); }
}

final class ConsoleUi
{
    public function banner(string $title, string $subtitle = ''): void
    {
        $width = max(60, strlen($title) + 8, strlen($subtitle) + 4);
        $line = str_repeat('═', $width);
        echo Ansi::cyan("╔{$line}╗") . PHP_EOL;
        echo Ansi::cyan('║') . '  ' . Ansi::bold(Ansi::magenta($title)) . str_pad('', $width - strlen($title) - 2) . Ansi::cyan('║') . PHP_EOL;
        if ($subtitle !== '') {
            echo Ansi::cyan('║') . '  ' . Ansi::dim($subtitle) . str_pad('', $width - strlen($subtitle) - 2) . Ansi::cyan('║') . PHP_EOL;
        }
        echo Ansi::cyan("╚{$line}╝") . PHP_EOL . PHP_EOL;
    }

    public function section(string $label): void
    {
        echo PHP_EOL . Ansi::bold(Ansi::yellow("▸ {$label}")) . PHP_EOL;
        echo Ansi::dim(str_repeat('─', 60)) . PHP_EOL;
    }

    public function spinnerStep(string $label, int $attempt, int $maxAttempts): void
    {
        $frame = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴'][$attempt % 6];
        $tag = $attempt === 1 ? '' : Ansi::dim(" (retry {$attempt}/{$maxAttempts})");
        echo "  {$frame} {$label}{$tag}" . PHP_EOL;
    }

    /**
     * @param array<int, array<string, string>> $rows
     * @param array<int, string> $columns
     */
    public function table(array $columns, array $rows): void
    {
        $widths = [];
        foreach ($columns as $col) {
            $widths[$col] = strlen($col);
        }
        foreach ($rows as $row) {
            foreach ($columns as $col) {
                $widths[$col] = max($widths[$col], strlen((string) ($row[$col] ?? '')));
            }
        }

        $renderLine = function (string $left, string $mid, string $right) use ($columns, $widths): string {
            $parts = array_map(fn ($c) => str_repeat('─', $widths[$c] + 2), $columns);
            return $left . implode($mid, $parts) . $right;
        };

        echo $renderLine('┌', '┬', '┐') . PHP_EOL;
        $header = '│';
        foreach ($columns as $col) {
            $header .= ' ' . Ansi::bold(str_pad($col, $widths[$col])) . ' │';
        }
        echo $header . PHP_EOL;
        echo $renderLine('├', '┼', '┤') . PHP_EOL;

        foreach ($rows as $row) {
            $line = '│';
            foreach ($columns as $col) {
                $value = (string) ($row[$col] ?? '');
                $pad = str_repeat(' ', $widths[$col] - strlen($this->stripAnsi($value)));
                $line .= ' ' . $value . $pad . ' │';
            }
            echo $line . PHP_EOL;
        }
        echo $renderLine('└', '┴', '┘') . PHP_EOL;
    }

    private function stripAnsi(string $text): string
    {
        return (string) preg_replace('/\033\[[0-9;]*m/', '', $text);
    }
}

// ----------------------------------------------------------------------
// Domain
// ----------------------------------------------------------------------

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Authorized = 'authorized';
    case Captured = 'captured';
    case Failed = 'failed';
    case Refunded = 'refunded';
}

final class Order
{
    public function __construct(
        public readonly string $id,
        public PaymentStatus $status,
    ) {
    }
}

/**
 * Thrown for failures we consider transient (network blip, 5xx, timeout).
 * Kept distinct from permanent failures so the retry policy only ever
 * retries the class of error that retrying can actually fix.
 */
final class TransientGatewayException extends RuntimeException
{
}

interface PaymentGatewayClient
{
    /** @return array<string, PaymentStatus> keyed by order id */
    public function fetchStatuses(array $orderIds): array;
}

/**
 * Stands in for a real HTTP client (e.g. Guzzle) hitting a payment
 * provider's API. Simulates realistic conditions — occasional transient
 * failures and status drift — so the reconciliation/retry logic has
 * something real to react to without requiring live credentials.
 */
final class SimulatedPaymentGatewayClient implements PaymentGatewayClient
{
    private int $callCount = 0;

    public function fetchStatuses(array $orderIds): array
    {
        $this->callCount++;

        // Simulate an occasional transient gateway hiccup on the first
        // attempt only, so the retry/backoff path is exercised on every run.
        if ($this->callCount === 1 && random_int(1, 100) <= 40) {
            throw new TransientGatewayException('Gateway timeout (simulated 504)');
        }

        $remote = [];
        foreach ($orderIds as $id) {
            $remote[$id] = $this->driftedStatusFor($id);
        }
        return $remote;
    }

    private function driftedStatusFor(string $orderId): PaymentStatus
    {
        // Deterministic "randomness" per order id keeps re-runs reproducible.
        $seed = crc32($orderId);
        $roll = $seed % 100;

        return match (true) {
            $roll < 55 => PaymentStatus::Captured,
            $roll < 75 => PaymentStatus::Authorized,
            $roll < 90 => PaymentStatus::Failed,
            default => PaymentStatus::Refunded,
        };
    }
}

/**
 * Retries only transient failures, with exponential backoff + jitter so a
 * flaky gateway under load doesn't get hammered by synchronized retries
 * across multiple cron workers.
 */
final class RetryingGatewayClient implements PaymentGatewayClient
{
    public function __construct(
        private readonly PaymentGatewayClient $inner,
        private readonly ConsoleUi $ui,
        private readonly int $maxAttempts = 3,
    ) {
    }

    public function fetchStatuses(array $orderIds): array
    {
        $attempt = 0;
        while (true) {
            $attempt++;
            $this->ui->spinnerStep('Fetching statuses from payment gateway…', $attempt, $this->maxAttempts);
            try {
                return $this->inner->fetchStatuses($orderIds);
            } catch (TransientGatewayException $e) {
                if ($attempt >= $this->maxAttempts) {
                    throw $e;
                }
                $backoffMs = (int) (100 * (2 ** $attempt)) + random_int(0, 50);
                echo '    ' . Ansi::red("✗ {$e->getMessage()}") . Ansi::dim(" — backing off {$backoffMs}ms") . PHP_EOL;
                usleep($backoffMs * 1000);
            }
        }
    }
}

enum ReconciliationOutcome: string
{
    case Unchanged = 'unchanged';
    case Updated = 'updated';
    case AttentionNeeded = 'attention';
}

final class ReconciliationResult
{
    public function __construct(
        public readonly Order $order,
        public readonly PaymentStatus $previousStatus,
        public readonly PaymentStatus $newStatus,
        public readonly ReconciliationOutcome $outcome,
    ) {
    }
}

/**
 * Core reasoning lives here: what counts as a safe automatic transition
 * vs. one that needs a human to look at it. A payment moving forward
 * (pending -> authorized -> captured) is auto-applied. A capture flipping
 * to "failed" or "refunded" after the fact is a red flag for chargeback/
 * fraud review, so it's flagged rather than silently overwritten.
 */
final class PaymentReconciler
{
    private const SAFE_FORWARD_TRANSITIONS = [
        'pending' => ['authorized', 'captured', 'failed'],
        'authorized' => ['captured', 'failed'],
        'captured' => ['refunded'],
        'failed' => [],
        'refunded' => [],
    ];

    public function reconcile(Order $order, PaymentStatus $remoteStatus): ReconciliationResult
    {
        $previous = $order->status;

        if ($previous === $remoteStatus) {
            return new ReconciliationResult($order, $previous, $remoteStatus, ReconciliationOutcome::Unchanged);
        }

        $allowed = self::SAFE_FORWARD_TRANSITIONS[$previous->value] ?? [];
        $isSafe = in_array($remoteStatus->value, $allowed, true);

        if ($isSafe) {
            $order->status = $remoteStatus;
            return new ReconciliationResult($order, $previous, $remoteStatus, ReconciliationOutcome::Updated);
        }

        // Unexpected/backward transition (e.g. captured -> pending): apply
        // the value locally so downstream state stays correct, but surface
        // it distinctly so an operator can audit *why* it happened.
        $order->status = $remoteStatus;
        return new ReconciliationResult($order, $previous, $remoteStatus, ReconciliationOutcome::AttentionNeeded);
    }
}

// ----------------------------------------------------------------------
// Wiring + run
// ----------------------------------------------------------------------

$ui = new ConsoleUi();
$ui->banner('Payment Status Sync', 'Project #66 — reconciles local orders against the payment gateway');

$orders = [
    new Order('ORD-1001', PaymentStatus::Pending),
    new Order('ORD-1002', PaymentStatus::Authorized),
    new Order('ORD-1003', PaymentStatus::Pending),
    new Order('ORD-1004', PaymentStatus::Captured),
    new Order('ORD-1005', PaymentStatus::Authorized),
    new Order('ORD-1006', PaymentStatus::Pending),
    new Order('ORD-1007', PaymentStatus::Captured),
    new Order('ORD-1008', PaymentStatus::Refunded),
];

$ui->section('Fetching remote statuses');
$client = new RetryingGatewayClient(new SimulatedPaymentGatewayClient(), $ui);

try {
    $remoteStatuses = $client->fetchStatuses(array_map(fn (Order $o) => $o->id, $orders));
} catch (TransientGatewayException $e) {
    echo PHP_EOL . Ansi::red(Ansi::bold("  Sync aborted: {$e->getMessage()}")) . PHP_EOL;
    exit(1);
}
echo '  ' . Ansi::green('✓ statuses received') . PHP_EOL;

$ui->section('Reconciling');
$reconciler = new PaymentReconciler();
$results = [];
foreach ($orders as $order) {
    $results[] = $reconciler->reconcile($order, $remoteStatuses[$order->id]);
}

$rows = array_map(function (ReconciliationResult $r) {
    $badge = match ($r->outcome) {
        ReconciliationOutcome::Unchanged => Ansi::dim('unchanged'),
        ReconciliationOutcome::Updated => Ansi::green('updated'),
        ReconciliationOutcome::AttentionNeeded => Ansi::red('needs review'),
    };
    return [
        'Order' => $r->order->id,
        'Previous' => $r->previousStatus->value,
        'Remote' => $r->newStatus->value,
        'Outcome' => $badge,
    ];
}, $results);

$ui->section('Reconciliation report');
$ui->table(['Order', 'Previous', 'Remote', 'Outcome'], $rows);

$counts = ['unchanged' => 0, 'updated' => 0, 'attention' => 0];
foreach ($results as $r) {
    $counts[$r->outcome->value]++;
}

echo PHP_EOL;
echo Ansi::bold('Summary: ')
    . Ansi::dim("{$counts['unchanged']} unchanged") . ', '
    . Ansi::green("{$counts['updated']} updated") . ', '
    . Ansi::red("{$counts['attention']} needs review") . PHP_EOL;

if ($counts['attention'] > 0) {
    echo Ansi::yellow('  ⚠ Review flagged orders before they hit downstream billing reports.') . PHP_EOL;
}
