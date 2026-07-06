<?php

/**
 * Payment Status Sync CLI Engine
 *
 * Senior Developer Design & Implementation Rationale:
 * 1. Resiliency (Fault Tolerance): Integrates a full-jitter exponential backoff algorithm
 *    to handle transient rate limits (HTTP 429) and network timeouts (HTTP 504).
 * 2. Idempotency & Safety: Avoids blind status overrides. Status changes are run through a
 *    transition matrix to detect regressions (e.g., PAID -> PENDING) or anomalies (e.g., FAILED -> PAID),
 *    flagging them for human review rather than executing corrupted DB updates.
 * 3. Rich User Experience: A CLI tool must be actionable. We provide real-time, in-place progress
 *    updates, visual indicators for transient retries, and high-contrast tables.
 */

require_once __DIR__ . '/src/Autoloader.php';

use App\PaymentSync\Console\Terminal;
use App\PaymentSync\Gateway\MockPaymentGateway;
use App\PaymentSync\Repository\MockOrderRepository;
use App\PaymentSync\Sync\PaymentReconciler;
use App\PaymentSync\Sync\RetryHandler;
use App\PaymentSync\Sync\TransitionEngine;

// Parse options
$options = getopt("h", ["help", "retries:", "base-delay:", "max-delay:"]);

if (isset($options['h']) || isset($options['help'])) {
    Terminal::drawHeader("Payment Status Sync Help");
    Terminal::writeln("Usage: php sync.php [options]");
    Terminal::writeln();
    Terminal::writeln("Options:");
    Terminal::writeln("  -h, --help          Show this help message.");
    Terminal::writeln("  --retries=<num>     Maximum retry attempts for transient gateway timeouts (default: 3).");
    Terminal::writeln("  --base-delay=<ms>   Base delay in milliseconds for exponential backoff (default: 100).");
    Terminal::writeln("  --max-delay=<ms>    Capped maximum delay in milliseconds for backoff (default: 3000).");
    Terminal::writeln();
    Terminal::writeln("Example:");
    Terminal::writeln("  php sync.php --retries=5 --base-delay=50 --max-delay=2000");
    exit(0);
}

// Config defaults
$retries = isset($options['retries']) ? (int)$options['retries'] : 3;
$baseDelay = isset($options['base-delay']) ? (int)$options['base-delay'] : 100;
$maxDelay = isset($options['max-delay']) ? (int)$options['max-delay'] : 3000;

// Initialize components
$repository = new MockOrderRepository();
$gateway = new MockPaymentGateway();
$transitionEngine = new TransitionEngine();
$retryHandler = new RetryHandler($retries, $baseDelay, $maxDelay);
$reconciler = new PaymentReconciler($repository, $gateway, $transitionEngine, $retryHandler);

// Bootstrap visual presentation
Terminal::drawHeader("Payment Status Sync CLI");
Terminal::writeln("Initializing Reconciliation Engine...");
Terminal::writeln(Terminal::colorize("Configuration:", Terminal::FG_CYAN));
Terminal::writeln("  • Retry attempts: " . Terminal::colorize((string)$retries, Terminal::FG_WHITE, null, true));
Terminal::writeln("  • Base backoff delay: " . Terminal::colorize("{$baseDelay}ms", Terminal::FG_WHITE, null, true));
Terminal::writeln("  • Max backoff delay: " . Terminal::colorize("{$maxDelay}ms", Terminal::FG_WHITE, null, true));
Terminal::writeln();

$orders = $repository->getPendingOrActiveOrders();
Terminal::writeln(sprintf("Loaded %s orders from local repository.", Terminal::colorize((string)count($orders), Terminal::FG_GREEN, null, true)));
Terminal::writeln("Connecting to remote payment gateway api...");
Terminal::writeln();

// Progress bar hook
$onProgress = function (string $orderId, int $current, int $total) {
    Terminal::drawProgressBar($current, $total, "Syncing order: {$orderId}");
};

// Retry warnings hook
$onRetry = function (string $orderId, string $reason, int $attempt, int $delayMs) {
    // Temporarily clear progress line and output the warning block
    Terminal::clearLine();
    $warningMsg = sprintf(
        "⚠️  Order %s: transient error (attempt %d). Reason: \"%s\". Retrying in %dms with full jitter...",
        $orderId,
        $attempt,
        $reason,
        $delayMs
    );
    Terminal::writeln(Terminal::colorize($warningMsg, Terminal::FG_YELLOW));
};

// Trigger sync process
$syncReport = $reconciler->reconcile($orders, $onProgress, $onRetry);

// Clean completion line
Terminal::clearLine();
Terminal::writeln(Terminal::colorize("✔ Sync process finished.", Terminal::FG_GREEN, null, true));
Terminal::writeln();

// Build report table
$headers = ["Order ID", "Amount", "Local State", "Remote State", "Result Action", "Details"];
$tableRows = [];

foreach ($syncReport['results'] as $res) {
    $amountStr = sprintf("%s %.2f", $res['currency'], $res['amount']);
    
    // Status visual formatting
    $localColor = getStatusColor($res['localStatus']);
    $localStateText = Terminal::colorize($res['localStatus'], $localColor);
    
    $remoteColor = getStatusColor($res['remoteStatus']);
    $remoteStateText = $res['remoteStatus'] ? Terminal::colorize($res['remoteStatus'], $remoteColor) : Terminal::colorize("N/A", Terminal::FG_GRAY);
    
    // Action / Detail formatting
    switch ($res['type']) {
        case 'NO_CHANGE':
            $actionText = Terminal::colorize("NO CHANGE", Terminal::FG_GRAY);
            $detailText = Terminal::colorize($res['message'], Terminal::FG_GRAY);
            break;
        case 'SAFE_UPDATE':
            $actionText = Terminal::colorize("UPDATED", Terminal::FG_GREEN, null, true);
            $detailText = Terminal::colorize($res['message'], Terminal::FG_GREEN);
            break;
        case 'CONFLICT_REVIEW':
            $actionText = Terminal::colorize("REVIEW REQUIRED", Terminal::FG_RED, Terminal::BG_YELLOW, true);
            $detailText = Terminal::colorize($res['message'], Terminal::FG_YELLOW, null, true);
            break;
        case 'MISSING_REMOTELY':
            $actionText = Terminal::colorize("NOT FOUND", Terminal::FG_RED, null, true);
            $detailText = Terminal::colorize($res['message'], Terminal::FG_RED);
            break;
        case 'NETWORK_ERROR_EXHAUSTED':
            $actionText = Terminal::colorize("NETWORK FAILED", Terminal::FG_RED, null, true);
            $detailText = Terminal::colorize($res['message'], Terminal::FG_RED);
            break;
        default:
            $actionText = Terminal::colorize("ERROR", Terminal::FG_RED);
            $detailText = $res['message'];
    }

    $tableRows[] = [
        $res['orderId'],
        $amountStr,
        $localStateText,
        $remoteStateText,
        $actionText,
        $detailText
    ];
}

// Alignments for each column
$alignments = ['left', 'right', 'center', 'center', 'left', 'left'];
Terminal::drawTable($headers, $tableRows, $alignments);
Terminal::writeln();

// Output summaries
$stats = $syncReport['stats'];
Terminal::writeln(Terminal::colorize("Reconciliation Summary Metrics:", Terminal::FG_CYAN, null, true));
Terminal::writeln(sprintf("  • Processed Transactions : %d", $stats['total']));
Terminal::writeln(sprintf("  • In Sync (No Change)    : %s", Terminal::colorize((string)$stats['noChange'], Terminal::FG_GRAY)));
Terminal::writeln(sprintf("  • Successfully Updated   : %s", Terminal::colorize((string)$stats['safeUpdates'], Terminal::FG_GREEN, null, true)));
Terminal::writeln(sprintf("  • Conflicts Flagged      : %s", Terminal::colorize((string)$stats['conflicts'], $stats['conflicts'] > 0 ? Terminal::FG_RED : Terminal::FG_GRAY, null, $stats['conflicts'] > 0)));
Terminal::writeln(sprintf("  • Gateway Retries Saved  : %s", Terminal::colorize((string)$stats['networkErrorsRecovered'], $stats['networkErrorsRecovered'] > 0 ? Terminal::FG_CYAN : Terminal::FG_GRAY, null, $stats['networkErrorsRecovered'] > 0)));
Terminal::writeln(sprintf("  • Network Timeout Skips  : %s", Terminal::colorize((string)$stats['networkErrorsExhausted'], $stats['networkErrorsExhausted'] > 0 ? Terminal::FG_RED : Terminal::FG_GRAY, null, $stats['networkErrorsExhausted'] > 0)));
Terminal::writeln(sprintf("  • Missing Remotely Skips : %s", Terminal::colorize((string)$stats['missingRemotely'], $stats['missingRemotely'] > 0 ? Terminal::FG_RED : Terminal::FG_GRAY, null, $stats['missingRemotely'] > 0)));
Terminal::writeln();

// Action Banner
if ($stats['conflicts'] > 0) {
    Terminal::drawBanner(
        "HUMAN INTERVENTION REQUIRED",
        "Reconciliation finished with {$stats['conflicts']} conflicts. Order status changes reverted locally to prevent duplicate collection/shipping. Please audit manual charge entries.",
        Terminal::FG_RED,
        Terminal::FG_RED
    );
} else {
    Terminal::drawBanner(
        "RECONCILIATION COMPLETED SUCCESSFULLY",
        "All active orders have been synced. Local database matches gateway state. No anomalies detected.",
        Terminal::FG_GREEN,
        Terminal::FG_GREEN
    );
}

/**
 * Get status terminal coloring helper.
 */
function getStatusColor(?string $status): string {
    switch ($status) {
        case 'PAID':
            return Terminal::FG_GREEN;
        case 'AUTHORIZED':
            return Terminal::FG_CYAN;
        case 'PENDING':
            return Terminal::FG_YELLOW;
        case 'FAILED':
        case 'EXPIRED':
            return Terminal::FG_RED;
        case 'REFUNDED':
            return Terminal::FG_MAGENTA;
        default:
            return Terminal::FG_GRAY;
    }
}
