<?php

declare(strict_types=1);

/**
 * Inventory Sync CLI Engine
 */

require_once __DIR__ . '/src/Autoloader.php';

use App\InventorySync\Console\Terminal;
use App\InventorySync\Gateway\SimulatedSupplierApiClient;
use App\InventorySync\Gateway\Exception\TransientSupplierException;
use App\InventorySync\Gateway\Exception\UnknownSkuException;
use App\InventorySync\Repository\MockProductRepository;
use App\InventorySync\Sync\InventoryReconciler;
use App\InventorySync\Sync\RetryHandler;
use App\InventorySync\Model\SyncOutcome;

// Parse options
$options = getopt("h", ["help", "retries:", "base-delay:", "max-delay:"]);

if (isset($options['h']) || isset($options['help'])) {
    Terminal::drawHeader("Inventory Sync Help");
    Terminal::writeln("Usage: php script.php [options]");
    Terminal::writeln();
    Terminal::writeln("Options:");
    Terminal::writeln("  -h, --help          Show this help message.");
    Terminal::writeln("  --retries=<num>     Maximum retry attempts for transient supplier failures (default: 3).");
    Terminal::writeln("  --base-delay=<ms>   Base delay in milliseconds for exponential backoff (default: 150).");
    Terminal::writeln("  --max-delay=<ms>    Capped maximum delay in milliseconds for backoff (default: 3000).");
    Terminal::writeln();
    Terminal::writeln("Example:");
    Terminal::writeln("  php script.php --retries=5 --base-delay=100 --max-delay=2000");
    exit(0);
}

// Config defaults
$retries = isset($options['retries']) ? (int)$options['retries'] : 3;
$baseDelay = isset($options['base-delay']) ? (int)$options['base-delay'] : 150;
$maxDelay = isset($options['max-delay']) ? (int)$options['max-delay'] : 3000;

// Initialize components
$repository = new MockProductRepository();
$client = new SimulatedSupplierApiClient();
$retryHandler = new RetryHandler($retries, $baseDelay, $maxDelay);
$reconciler = new InventoryReconciler($repository);

// Bootstrap visual presentation
Terminal::drawHeader(
    "Inventory Sync — Supplier API",
    "Project #67 — reconciles local stock levels against supplier feed"
);

$products = $repository->getAll();
$skus = array_map(fn ($p) => $p->sku, $products);

Terminal::drawSection("Fetching supplier stock feed");

try {
    $supplierFeed = $retryHandler->execute(
        function () use ($client, $skus) {
            return $client->fetchStock($skus);
        },
        function (string $reason, int $attempt, int $delayMs) {
            Terminal::clearLine();
            $warn = sprintf(
                "✗ %s — backing off %dms",
                $reason,
                $delayMs
            );
            Terminal::writeln("    " . Terminal::colorize($warn, Terminal::FG_RED));
            // Show new spinner step on the next retry
            Terminal::spinnerStep("Polling supplier stock feed…", $attempt + 1, 3);
        }
    );
} catch (TransientSupplierException $e) {
    Terminal::writeln();
    Terminal::drawBanner(
        "SYNC ABORTED",
        "Supplier API is currently unavailable: " . $e->getMessage(),
        Terminal::FG_RED,
        Terminal::FG_RED
    );
    exit(1);
}

Terminal::writeln("  " . Terminal::colorize("✓ Feed received for " . count($supplierFeed) . " SKUs", Terminal::FG_GREEN));

Terminal::drawSection("Reconciling stock levels");

$results = [];
foreach ($products as $product) {
    if (!isset($supplierFeed[$product->sku])) {
        throw new UnknownSkuException("SKU {$product->sku} not found in supplier feed");
    }
    $results[] = $reconciler->reconcile($product, $supplierFeed[$product->sku]);
}

Terminal::drawSection("Sync report");

$headers = ["SKU", "Name", "Prev Qty", "New Qty", "Delta", "Cost", "Outcome", "Note"];
$tableRows = [];

foreach ($results as $res) {
    $deltaVal = $res->newQty - $res->previousQty;
    $deltaFmt = match (true) {
        $deltaVal > 0 => Terminal::colorize("+{$deltaVal}", Terminal::FG_GREEN),
        $deltaVal < 0 => Terminal::colorize("{$deltaVal}", Terminal::FG_RED),
        default       => Terminal::colorize("—", Terminal::COLOR_DIM),
    };

    $outcomeFmt = match ($res->outcome) {
        SyncOutcome::Unchanged    => Terminal::colorize("unchanged", Terminal::COLOR_DIM),
        SyncOutcome::Restocked    => Terminal::colorize("restocked", Terminal::FG_GREEN),
        SyncOutcome::Reduced      => Terminal::colorize("reduced", Terminal::FG_YELLOW),
        SyncOutcome::BelowReorder => Terminal::colorize("⚠ below reorder", Terminal::FG_RED),
        SyncOutcome::PriceDrift   => Terminal::colorize("price drift", Terminal::FG_MAGENTA),
        SyncOutcome::Conflict     => Terminal::colorize("stale feed", Terminal::FG_RED),
    };

    $tableRows[] = [
        $res->product->sku,
        $res->product->name,
        (string)$res->previousQty,
        (string)$res->newQty,
        $deltaFmt,
        "$" . number_format($res->supplierCost, 2),
        $outcomeFmt,
        $res->note
    ];
}

$alignments = ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left'];
Terminal::drawTable($headers, $tableRows, $alignments);
Terminal::writeln();

// Counters & summary calculation
$counts = array_fill_keys(array_column(SyncOutcome::cases(), 'value'), 0);
$totalUpdated = 0;
foreach ($results as $r) {
    $counts[$r->outcome->value]++;
    if ($r->outcome !== SyncOutcome::Unchanged) {
        $totalUpdated++;
    }
}

Terminal::write(Terminal::colorize("Summary: ", Terminal::COLOR_BOLD));
Terminal::write(Terminal::colorize($counts['unchanged'] . ' unchanged', Terminal::COLOR_DIM) . ', ');
Terminal::write(Terminal::colorize($counts['restocked'] . ' restocked', Terminal::FG_GREEN) . ', ');
Terminal::write(Terminal::colorize($counts['reduced'] . ' reduced', Terminal::FG_YELLOW) . ', ');
Terminal::write(Terminal::colorize($counts['below_reorder'] . ' below reorder', Terminal::FG_RED) . ', ');
Terminal::write(Terminal::colorize($counts['price_drift'] . ' price drift', Terminal::FG_MAGENTA) . ', ');
Terminal::writeln(Terminal::colorize($counts['conflict'] . ' stale-feed conflict', Terminal::FG_RED));

if ($counts['below_reorder'] > 0) {
    Terminal::writeln("  " . Terminal::colorize("⚠ Qty falls below reorder point even after receiving new stock — raise PO immediately.", Terminal::FG_YELLOW));
}
if ($counts['conflict'] > 0) {
    Terminal::writeln("  " . Terminal::colorize("⚠ Stale-feed conflicts require manual review — do not overwrite.", Terminal::FG_YELLOW));
}
if ($counts['price_drift'] > 0) {
    Terminal::writeln("  " . Terminal::colorize("⚠ Price drift detected — update pricing rules and margin checks.", Terminal::FG_MAGENTA));
}

Terminal::writeln();
Terminal::writeln(Terminal::colorize("Sync completed at " . date('Y-m-d H:i:s') . " — {$totalUpdated}/" . count($products) . " products updated.", Terminal::COLOR_DIM));
Terminal::writeln();
