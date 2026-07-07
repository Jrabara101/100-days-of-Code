<?php

declare(strict_types=1);

/**
 * Project #67 — Inventory Sync with Supplier API
 *
 * Senior-developer PHP CLI: reconciles local product inventory levels against
 * a supplier's live stock feed, with deduplication, conflict detection, and
 * a styled terminal report showing what changed and what needs human review.
 */

// ----------------------------------------------------------------------
// Terminal styling layer
// ----------------------------------------------------------------------

final class Ansi
{
    private static bool $enabled = true;

    public static function disable(): void { self::$enabled = false; }

    public static function paint(string $text, string $code): string
    {
        if (!self::$enabled) {
            return $text;
        }
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
}

final class ConsoleUi
{
    public function banner(string $title, string $subtitle = ''): void
    {
        $width = max(62, strlen($title) + 8, strlen($subtitle) + 4);
        $line  = str_repeat('═', $width);
        echo Ansi::cyan("╔{$line}╗") . PHP_EOL;
        echo Ansi::cyan('║') . '  ' . Ansi::bold(Ansi::magenta($title))
            . str_pad('', $width - strlen($title) - 2) . Ansi::cyan('║') . PHP_EOL;
        if ($subtitle !== '') {
            echo Ansi::cyan('║') . '  ' . Ansi::dim($subtitle)
                . str_pad('', $width - strlen($subtitle) - 2) . Ansi::cyan('║') . PHP_EOL;
        }
        echo Ansi::cyan("╚{$line}╝") . PHP_EOL . PHP_EOL;
    }

    public function section(string $label): void
    {
        echo PHP_EOL . Ansi::bold(Ansi::yellow("▸ {$label}")) . PHP_EOL;
        echo Ansi::dim(str_repeat('─', 62)) . PHP_EOL;
    }

    public function spinnerStep(string $label, int $attempt, int $max): void
    {
        $frame = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴'][$attempt % 6];
        $tag   = $attempt === 1 ? '' : Ansi::dim(" (retry {$attempt}/{$max})");
        echo "  {$frame} {$label}{$tag}" . PHP_EOL;
    }

    /** @param array<int, array<string,string>> $rows */
    public function table(array $columns, array $rows): void
    {
        $widths = [];
        foreach ($columns as $col) {
            $widths[$col] = strlen($col);
        }
        foreach ($rows as $row) {
            foreach ($columns as $col) {
                $widths[$col] = max($widths[$col], strlen($this->strip($row[$col] ?? '')));
            }
        }

        $line = function (string $l, string $m, string $r) use ($columns, $widths): string {
            return $l . implode($m, array_map(fn ($c) => str_repeat('─', $widths[$c] + 2), $columns)) . $r;
        };

        echo $line('┌', '┬', '┐') . PHP_EOL;
        $hdr = '│';
        foreach ($columns as $col) {
            $hdr .= ' ' . Ansi::bold(str_pad($col, $widths[$col])) . ' │';
        }
        echo $hdr . PHP_EOL;
        echo $line('├', '┼', '┤') . PHP_EOL;

        foreach ($rows as $row) {
            $ln = '│';
            foreach ($columns as $col) {
                $v   = (string) ($row[$col] ?? '');
                $pad = str_repeat(' ', $widths[$col] - strlen($this->strip($v)));
                $ln .= ' ' . $v . $pad . ' │';
            }
            echo $ln . PHP_EOL;
        }
        echo $line('└', '┴', '┘') . PHP_EOL;
    }

    private function strip(string $t): string
    {
        return (string) preg_replace('/\033\[[0-9;]*m/', '', $t);
    }
}

// ----------------------------------------------------------------------
// Domain model
// ----------------------------------------------------------------------

final class LocalProduct
{
    public function __construct(
        public readonly string $sku,
        public readonly string $name,
        public int             $quantityOnHand,
        public int             $reorderPoint,     // trigger a restock flag below this
        public ?string         $lastSyncedAt,     // ISO-8601 or null if never synced
    ) {}
}

final class SupplierRecord
{
    public function __construct(
        public readonly string $sku,
        public readonly int    $availableQty,
        public readonly float  $unitCost,         // used to detect price drift
        public readonly string $asOf,             // supplier's "as-of" timestamp
    ) {}
}

/**
 * Thrown when the supplier feed is transiently unavailable (5xx, timeout).
 * Kept distinct from validation/business errors so the retry wrapper never
 * retries a schema parse failure or a 404 (product unknown to supplier).
 */
final class TransientSupplierException extends RuntimeException {}

/**
 * Thrown when the supplier returns data for a SKU that cannot be matched
 * to anything in our catalogue — a non-retryable, operator-action required.
 */
final class UnknownSkuException extends RuntimeException {}

// ----------------------------------------------------------------------
// Sync outcome types
// ----------------------------------------------------------------------

enum SyncOutcome: string
{
    case Unchanged     = 'unchanged';
    case Restocked     = 'restocked';
    case Reduced       = 'reduced';
    case BelowReorder  = 'below_reorder';
    case PriceDrift    = 'price_drift';
    case Conflict      = 'conflict';      // supplier qty older than last sync — stale feed
}

final class SyncResult
{
    public function __construct(
        public readonly LocalProduct  $product,
        public readonly int           $previousQty,
        public readonly int           $newQty,
        public readonly float         $supplierCost,
        public readonly SyncOutcome   $outcome,
        public readonly string        $note,
    ) {}
}

// ----------------------------------------------------------------------
// Supplier API client (simulated)
// ----------------------------------------------------------------------

interface SupplierApiClient
{
    /** @return array<string, SupplierRecord> keyed by SKU */
    public function fetchStock(array $skus): array;
}

/**
 * Simulates a real supplier REST API. Injects:
 *   - A 40% chance of one transient failure on the first attempt (exercises retry)
 *   - Deterministic stock/cost values so repeated runs are stable
 *   - An occasional "stale" feed timestamp to exercise conflict detection
 */
final class SimulatedSupplierApiClient implements SupplierApiClient
{
    private int $callCount = 0;

    public function fetchStock(array $skus): array
    {
        $this->callCount++;

        if ($this->callCount === 1 && random_int(1, 100) <= 40) {
            throw new TransientSupplierException('Supplier API returned 503 Service Unavailable (simulated)');
        }

        $records = [];
        foreach ($skus as $sku) {
            $seed        = crc32($sku);
            $baseQty     = abs($seed % 200);
            $unitCost    = round(5.0 + (abs($seed) % 9500) / 100, 2);
            // Occasionally simulate a stale feed (supplier's as-of is 3 days ago)
            $isStale     = ($seed % 7 === 0);
            $asOf        = $isStale
                ? date('Y-m-d\TH:i:s\Z', strtotime('-3 days'))
                : date('Y-m-d\TH:i:s\Z');

            $records[$sku] = new SupplierRecord($sku, $baseQty, $unitCost, $asOf);
        }
        return $records;
    }
}

// ----------------------------------------------------------------------
// Retry wrapper
// ----------------------------------------------------------------------

final class RetryingSupplierClient implements SupplierApiClient
{
    public function __construct(
        private readonly SupplierApiClient $inner,
        private readonly ConsoleUi         $ui,
        private readonly int               $maxAttempts = 3,
    ) {}

    public function fetchStock(array $skus): array
    {
        $attempt = 0;
        while (true) {
            $attempt++;
            $this->ui->spinnerStep('Polling supplier stock feed…', $attempt, $this->maxAttempts);
            try {
                return $this->inner->fetchStock($skus);
            } catch (TransientSupplierException $e) {
                if ($attempt >= $this->maxAttempts) {
                    throw $e;
                }
                $backoffMs = (int) (150 * (2 ** $attempt)) + random_int(0, 75);
                echo '    ' . Ansi::red("✗ {$e->getMessage()}")
                    . Ansi::dim(" — backing off {$backoffMs}ms") . PHP_EOL;
                usleep($backoffMs * 1000);
            }
        }
    }
}

// ----------------------------------------------------------------------
// Reconciliation engine
// ----------------------------------------------------------------------

/**
 * The core reasoning:
 *
 *  1. Conflict detection first — if the supplier's feed timestamp is older
 *     than our last successful sync we refuse to blindly overwrite, because
 *     we may already have fresher data (e.g. from a more recent manual count).
 *     Flagging it as Conflict lets an operator decide.
 *
 *  2. Quantity delta is applied if the feed is fresh. A positive delta is a
 *     restock; a negative delta is a reduction (drawdown at the supplier's
 *     warehouse, meaning our replenishment lead time just got longer).
 *
 *  3. Below-reorder-point takes priority over plain Restocked / Reduced
 *     because even after a restock the new level might still be too low —
 *     e.g. supplier delivered partial order. This surfaces that case.
 *
 *  4. Price drift is layered on top: a >10% change in unit cost is noteworthy
 *     even if the stock level didn't change, because it affects margin.
 *
 * These rules are deliberately additive (not mutually exclusive) so a single
 * product can have, say, Reduced + PriceDrift in the same run. We pick the
 * most severe outcome for the table but store the full note.
 */
final class InventoryReconciler
{
    private const PRICE_DRIFT_THRESHOLD = 0.10;  // 10 %

    /** @var array<string, float> $knownCosts  sku -> last recorded unit cost */
    public function __construct(private readonly array $knownCosts = []) {}

    public function reconcile(LocalProduct $product, SupplierRecord $supplier): SyncResult
    {
        $previousQty = $product->quantityOnHand;
        $notes       = [];

        // 1. Stale-feed conflict guard
        if ($product->lastSyncedAt !== null) {
            $lastSync    = strtotime($product->lastSyncedAt);
            $supplierAsOf = strtotime($supplier->asOf);
            if ($supplierAsOf !== false && $lastSync !== false && $supplierAsOf < $lastSync) {
                return new SyncResult(
                    $product, $previousQty, $previousQty,
                    $supplier->unitCost,
                    SyncOutcome::Conflict,
                    "Supplier feed ({$supplier->asOf}) is older than last sync ({$product->lastSyncedAt})"
                );
            }
        }

        // 2. Apply quantity update
        $product->quantityOnHand = $supplier->availableQty;
        $delta  = $supplier->availableQty - $previousQty;

        // 3. Price drift check
        $prevCost   = $this->knownCosts[$product->sku] ?? null;
        $priceDrift = false;
        if ($prevCost !== null && $prevCost > 0.0) {
            $driftPct = abs($supplier->unitCost - $prevCost) / $prevCost;
            if ($driftPct >= self::PRICE_DRIFT_THRESHOLD) {
                $priceDrift = true;
                $sign       = $supplier->unitCost > $prevCost ? '+' : '-';
                $notes[]    = sprintf('Price drift %s%.1f%%', $sign, $driftPct * 100);
            }
        }

        // 4. Pick primary outcome
        if ($delta === 0 && !$priceDrift) {
            $outcome = SyncOutcome::Unchanged;
            $notes[] = 'No change';
        } elseif ($supplier->availableQty < $product->reorderPoint) {
            $outcome = SyncOutcome::BelowReorder;
            $notes[] = "Qty {$supplier->availableQty} < reorder point {$product->reorderPoint}";
        } elseif ($delta > 0) {
            $outcome = SyncOutcome::Restocked;
            $notes[] = "Qty +{$delta}";
        } elseif ($delta < 0) {
            $outcome = SyncOutcome::Reduced;
            $notes[] = "Qty {$delta}";
        } else {
            $outcome = SyncOutcome::PriceDrift;
        }

        return new SyncResult(
            $product, $previousQty, $supplier->availableQty,
            $supplier->unitCost,
            $outcome,
            implode('; ', $notes)
        );
    }
}

// ----------------------------------------------------------------------
// Wiring + run
// ----------------------------------------------------------------------

$ui = new ConsoleUi();
$ui->banner(
    'Inventory Sync — Supplier API',
    'Project #67 — reconciles local stock levels against supplier feed'
);

// Local catalogue with realistic states:
//   some products healthy, some already near reorder, one never synced
$products = [
    new LocalProduct('SKU-A001', 'Wireless Keyboard',   82,  50,  '2026-07-06T08:00:00Z'),
    new LocalProduct('SKU-A002', 'USB-C Hub (7-port)',  14,  20,  '2026-07-06T08:00:00Z'),
    new LocalProduct('SKU-A003', 'Mechanical Mouse',    55,  30,  '2026-07-01T12:00:00Z'),
    new LocalProduct('SKU-A004', 'Monitor Stand',        7,  10,  '2026-07-06T08:00:00Z'),
    new LocalProduct('SKU-A005', 'Laptop Cooling Pad', 130,  40,  null),
    new LocalProduct('SKU-A006', 'Webcam 1080p',        43,  25,  '2026-07-06T08:00:00Z'),
    new LocalProduct('SKU-A007', 'HDMI 2.1 Cable (2m)',200,  80,  '2026-07-06T08:00:00Z'),
    new LocalProduct('SKU-A008', 'Desk Lamp LED',       18,  15,  '2026-07-06T08:00:00Z'),
    new LocalProduct('SKU-A009', 'Ergonomic Chair Mat',  9,  12,  '2026-07-05T10:00:00Z'),
    new LocalProduct('SKU-A010', 'Portable SSD 1TB',   60,  20,  '2026-07-06T08:00:00Z'),
];

// Last known unit costs (would come from our DB; hardcoded here for demo)
$knownCosts = [
    'SKU-A001' => 45.99,
    'SKU-A002' => 28.50,
    'SKU-A003' => 35.00,
    'SKU-A004' => 22.00,
    'SKU-A005' => 18.75,
    'SKU-A006' => 72.00,
    'SKU-A007' => 12.99,
    'SKU-A008' => 31.00,
    'SKU-A009' => 55.00,
    'SKU-A010' => 89.99,
];

$skus = array_map(fn (LocalProduct $p) => $p->sku, $products);

// ── Fetch ──────────────────────────────────────────────────────────────
$ui->section('Fetching supplier stock feed');
$client = new RetryingSupplierClient(new SimulatedSupplierApiClient(), $ui);

try {
    $supplierFeed = $client->fetchStock($skus);
} catch (TransientSupplierException $e) {
    echo PHP_EOL . Ansi::red(Ansi::bold("  Sync aborted — supplier unavailable: {$e->getMessage()}")) . PHP_EOL;
    exit(1);
}
echo '  ' . Ansi::green('✓ Feed received for ' . count($supplierFeed) . ' SKUs') . PHP_EOL;

// ── Reconcile ──────────────────────────────────────────────────────────
$ui->section('Reconciling stock levels');
$reconciler = new InventoryReconciler($knownCosts);
$results    = [];

foreach ($products as $product) {
    $record = $supplierFeed[$product->sku]
        ?? throw new UnknownSkuException("SKU {$product->sku} not found in supplier feed");
    $results[] = $reconciler->reconcile($product, $record);
}

// ── Build table rows ───────────────────────────────────────────────────
$rows = array_map(function (SyncResult $r) {
    $deltaStr = $r->newQty - $r->previousQty;
    $deltaFmt = match (true) {
        $deltaStr > 0 => Ansi::green("+{$deltaStr}"),
        $deltaStr < 0 => Ansi::red("{$deltaStr}"),
        default       => Ansi::dim('—'),
    };

    $outcomeFmt = match ($r->outcome) {
        SyncOutcome::Unchanged    => Ansi::dim('unchanged'),
        SyncOutcome::Restocked    => Ansi::green('restocked'),
        SyncOutcome::Reduced      => Ansi::yellow('reduced'),
        SyncOutcome::BelowReorder => Ansi::red('⚠ below reorder'),
        SyncOutcome::PriceDrift   => Ansi::magenta('price drift'),
        SyncOutcome::Conflict     => Ansi::red('stale feed'),
    };

    return [
        'SKU'       => $r->product->sku,
        'Name'      => $r->product->name,
        'Prev Qty'  => (string) $r->previousQty,
        'New Qty'   => (string) $r->newQty,
        'Delta'     => $deltaFmt,
        'Cost'      => '$' . number_format($r->supplierCost, 2),
        'Outcome'   => $outcomeFmt,
        'Note'      => $r->note,
    ];
}, $results);

$ui->section('Sync report');
$ui->table(['SKU', 'Name', 'Prev Qty', 'New Qty', 'Delta', 'Cost', 'Outcome', 'Note'], $rows);

// ── Counters ────────────────────────────────────────────────────────────
$counts = array_fill_keys(array_column(SyncOutcome::cases(), 'value'), 0);
$totalUpdated = 0;
foreach ($results as $r) {
    $counts[$r->outcome->value]++;
    if ($r->outcome !== SyncOutcome::Unchanged) {
        $totalUpdated++;
    }
}

echo PHP_EOL;
echo Ansi::bold('Summary: ');
echo Ansi::dim($counts['unchanged'] . ' unchanged') . ', ';
echo Ansi::green($counts['restocked'] . ' restocked') . ', ';
echo Ansi::yellow($counts['reduced'] . ' reduced') . ', ';
echo Ansi::red($counts['below_reorder'] . ' below reorder') . ', ';
echo Ansi::magenta($counts['price_drift'] . ' price drift') . ', ';
echo Ansi::red($counts['conflict'] . ' stale-feed conflict') . PHP_EOL;

if ($counts['below_reorder'] > 0) {
    echo Ansi::yellow('  ⚠ Place restock orders for SKUs flagged below reorder point.') . PHP_EOL;
}
if ($counts['conflict'] > 0) {
    echo Ansi::yellow('  ⚠ Stale-feed conflicts require manual review — do not overwrite.') . PHP_EOL;
}
if ($counts['price_drift'] > 0) {
    echo Ansi::magenta('  ⚠ Price drift detected — update pricing rules and margin checks.') . PHP_EOL;
}

echo PHP_EOL . Ansi::dim("Sync completed at " . date('Y-m-d H:i:s') . " — {$totalUpdated}/" . count($products) . " products updated.") . PHP_EOL;
