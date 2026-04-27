<?php

declare(strict_types=1);

/**
 * ─────────────────────────────────────────────────────────────────
 *  URL STATUS CHECKER — Entry Point (CLI)
 * ─────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   php checker.php <url>
 *   php checker.php --file=urls.txt
 *   php checker.php --file=urls.txt --timeout=10 --retries=2
 *   php checker.php --help
 *
 * Options:
 *   --file=<path>     Path to a text file with one URL per line
 *   --timeout=<int>   Request timeout in seconds (default: 10)
 *   --retries=<int>   Number of retry attempts on failure (default: 1)
 *   --no-log          Do not save results to log file
 *   --no-csv          Do not export results to CSV
 *   --help            Show this help message
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Guard: Must be run from CLI ─────────────────────────────────────────────

if (php_sapi_name() !== 'cli') {
    die("This tool must be run from the command line (CLI)." . PHP_EOL);
}

// ─── Autoload App Classes ────────────────────────────────────────────────────

spl_autoload_register(function (string $class): void {
    // Namespace prefix: App\ClassName → app/ClassName.php
    $prefix = 'App\\';
    if (str_starts_with($class, $prefix)) {
        $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
        $file     = __DIR__ . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . $relative . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
});

use App\UrlChecker;
use App\ConsoleStyle as CS;
use App\FileLogger;
use App\CsvExporter;

// ─── Default Configuration ───────────────────────────────────────────────────

$config = [
    'timeout'  => 10,
    'retries'  => 1,
    'use_log'  => true,
    'use_csv'  => true,
    'file'     => null,
    'url'      => null,
];

// ─── Parse CLI Arguments ─────────────────────────────────────────────────────

$args = array_slice($argv, 1); // Remove script name

if (empty($args)) {
    showHelp();
    exit(0);
}

foreach ($args as $arg) {
    if ($arg === '--help' || $arg === '-h') {
        showHelp();
        exit(0);
    } elseif (str_starts_with($arg, '--file=')) {
        $config['file'] = substr($arg, 7);
    } elseif (str_starts_with($arg, '--timeout=')) {
        $val = (int)substr($arg, 10);
        $config['timeout'] = $val > 0 ? $val : 10;
    } elseif (str_starts_with($arg, '--retries=')) {
        $val = (int)substr($arg, 10);
        $config['retries'] = $val >= 0 ? $val : 1;
    } elseif ($arg === '--no-log') {
        $config['use_log'] = false;
    } elseif ($arg === '--no-csv') {
        $config['use_csv'] = false;
    } elseif (!str_starts_with($arg, '--')) {
        // Treat bare argument as a single URL
        $config['url'] = $arg;
    }
}

// ─── Validate: At least one input source ─────────────────────────────────────

if ($config['file'] === null && $config['url'] === null) {
    CS::error("No URL or file specified.");
    CS::info("Run:  php checker.php --help");
    exit(1);
}

// ─── Bootstrap Services ──────────────────────────────────────────────────────

$storageBase = __DIR__ . DIRECTORY_SEPARATOR . 'storage';
$logger      = new FileLogger($storageBase . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'url-checks.log');
$exporter    = new CsvExporter($storageBase . DIRECTORY_SEPARATOR . 'exports');
$checker     = new UrlChecker(
    timeout: $config['timeout'],
    retries: $config['retries'] > 0 ? $config['retries'] : 1
);

// ─── Print Banner ─────────────────────────────────────────────────────────────

CS::banner();

// ─── Load URLs ────────────────────────────────────────────────────────────────

$urls = [];

if ($config['file'] !== null) {
    // Resolve relative file paths against the script directory
    $filePath = file_exists($config['file'])
        ? $config['file']
        : __DIR__ . DIRECTORY_SEPARATOR . $config['file'];

    try {
        $urls = $checker->loadUrlsFromFile($filePath);
        CS::info("Loaded " . count($urls) . " URL(s) from: " . CS::color($filePath, CS::BRIGHT_WHITE));
    } catch (\RuntimeException $e) {
        CS::error($e->getMessage());
        exit(1);
    }
} elseif ($config['url'] !== null) {
    $urls = [$config['url']];
}

if (empty($urls)) {
    CS::warning("No URLs to check. The file may be empty or contain only comments.");
    exit(0);
}

// ─── Config Summary Box ───────────────────────────────────────────────────────

CS::box([
    " Configuration",
    "  URLs     : " . count($urls),
    "  Timeout  : " . $config['timeout'] . " seconds",
    "  Retries  : " . $config['retries'],
    "  Logging  : " . ($config['use_log'] ? 'Enabled' : 'Disabled'),
    "  CSV      : " . ($config['use_csv'] ? 'Enabled' : 'Disabled'),
], CS::CYAN);

// ─── Write Log Session Header ────────────────────────────────────────────────

if ($config['use_log']) {
    $logger->writeSessionHeader(count($urls), $config['timeout'], $config['retries']);
}

// ─── Run Checks ───────────────────────────────────────────────────────────────

CS::sectionTitle("Checking URLs");
CS::blank();

$results = [];
$total   = count($urls);

$results = $checker->checkAll($urls, function (int $current, int $total, array $result) use (&$results, $config, $logger): void {
    // Show live progress bar
    CS::progress($current, $total, $result['url']);
});

CS::clearProgress();
CS::blank();

// ─── Results Table ────────────────────────────────────────────────────────────

CS::sectionTitle("Results");
CS::blank();

// Table columns: #, URL, Code, Meaning, Category, Time, Redirected
$headers = ['#', 'URL', 'Code', 'Status Meaning', 'Category', 'Time (ms)', 'Redirected'];
$widths  = [3, 36, 4, 24, 16, 9, 10];

// Build color-coded rows
$rows = [];
foreach ($results as $i => $r) {
    $categoryColor = match ($r['category']) {
        'Online'           => CS::BRIGHT_GREEN,
        'Redirecting'      => CS::BRIGHT_YELLOW,
        'Client Error'     => CS::BRIGHT_RED,
        'Server Error'     => CS::BRIGHT_RED,
        'Invalid URL'      => CS::MAGENTA,
        'Timeout / Failed' => CS::RED,
        default            => CS::WHITE,
    };

    $codeColor = match (true) {
        $r['status_code'] !== null && $r['status_code'] >= 200 && $r['status_code'] < 300 => CS::BRIGHT_GREEN,
        $r['status_code'] !== null && $r['status_code'] >= 300 && $r['status_code'] < 400 => CS::BRIGHT_YELLOW,
        $r['status_code'] !== null && $r['status_code'] >= 400                            => CS::BRIGHT_RED,
        default => CS::GRAY,
    };

    $rows[] = [
        [(string)($i + 1),                                          CS::GRAY],
        [CS::truncate($r['url'], 35),                               CS::WHITE],
        [$r['status_code'] !== null ? (string)$r['status_code'] : '-', $codeColor],
        [CS::truncate($r['status_meaning'], 23),                    CS::WHITE],
        [$r['category'],                                            $categoryColor],
        [$r['response_time_ms'] !== null ? number_format($r['response_time_ms'], 1) : '-', CS::GRAY],
        [$r['redirected'] ? 'Yes (' . $r['redirect_count'] . 'x)' : 'No', $r['redirected'] ? CS::BRIGHT_YELLOW : CS::GRAY],
    ];

    // Log each result
    if ($config['use_log']) {
        $logger->logResult($r);
    }
}

CS::table($headers, $widths, $rows);

// ─── Per-Result Detail View ───────────────────────────────────────────────────

$hasRedirects = array_filter($results, fn($r) => $r['redirected']);
$hasErrors    = array_filter($results, fn($r) => $r['error'] !== null);

if (!empty($hasRedirects)) {
    CS::sectionTitle("Redirect Details");
    CS::blank();
    foreach ($results as $r) {
        if (!$r['redirected']) continue;
        CS::line(CS::color('  ⇢ ', CS::BRIGHT_YELLOW) . CS::color(CS::truncate($r['url'], 60), CS::WHITE));
        CS::line(CS::color('    → Final URL: ', CS::GRAY) . CS::color((string)$r['final_url'], CS::BRIGHT_CYAN));
        CS::line(CS::color('    → Redirects: ', CS::GRAY) . CS::color((string)$r['redirect_count'] . 'x', CS::YELLOW));
        CS::blank();
    }
}

if (!empty($hasErrors)) {
    CS::sectionTitle("Errors & Failures");
    CS::blank();
    foreach ($results as $r) {
        if ($r['error'] === null) continue;
        CS::line(CS::color('  ✖ ', CS::BRIGHT_RED) . CS::color(CS::truncate($r['url'], 60), CS::WHITE));
        CS::line(CS::color('    Reason: ', CS::GRAY) . CS::color($r['error'], CS::RED));
        CS::blank();
    }
}

// ─── Summary Dashboard ────────────────────────────────────────────────────────

$summary = UrlChecker::summarize($results);

if ($config['use_log']) {
    $logger->writeSummary($summary);
}

CS::dashboard([
    ['label' => 'Total',         'value' => $summary['total'],    'color' => CS::BRIGHT_WHITE],
    ['label' => 'Online',        'value' => $summary['online'],   'color' => CS::BRIGHT_GREEN],
    ['label' => 'Redirecting',   'value' => $summary['redirect'], 'color' => CS::BRIGHT_YELLOW],
    ['label' => 'Client Error',  'value' => $summary['client'],   'color' => CS::BRIGHT_RED],
    ['label' => 'Server Error',  'value' => $summary['server'],   'color' => CS::RED],
    ['label' => 'Invalid URL',   'value' => $summary['invalid'],  'color' => CS::MAGENTA],
    ['label' => 'Failed/Timeout','value' => $summary['failed'],   'color' => CS::GRAY],
    ['label' => 'Avg Time (ms)', 'value' => $summary['avg_time'], 'color' => CS::CYAN],
]);

// ─── Export CSV ───────────────────────────────────────────────────────────────

if ($config['use_csv']) {
    try {
        $csvPath = $exporter->export($results);
        CS::blank();
        CS::success("CSV exported → " . CS::color($csvPath, CS::BRIGHT_WHITE));
    } catch (\RuntimeException $e) {
        CS::warning("CSV export failed: " . $e->getMessage());
    }
}

// ─── Log File Notice ─────────────────────────────────────────────────────────

if ($config['use_log']) {
    CS::success("Log saved   → " . CS::color($logger->getPath(), CS::BRIGHT_WHITE));
}

// ─── Done ─────────────────────────────────────────────────────────────────────

CS::blank();
CS::line(CS::color('  ✔ Done! All checks completed at ' . date('H:i:s') . '.', CS::BRIGHT_GREEN));
CS::blank();

// ═════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Print the CLI help screen.
 */
function showHelp(): void
{
    CS::banner();

    CS::sectionTitle("Usage");
    CS::blank();
    CS::line(CS::color("  php checker.php <url>", CS::BRIGHT_WHITE));
    CS::line(CS::color("  php checker.php --file=urls.txt", CS::BRIGHT_WHITE));
    CS::line(CS::color("  php checker.php --file=urls.txt --timeout=10 --retries=2", CS::BRIGHT_WHITE));
    CS::blank();

    CS::sectionTitle("Options");
    CS::blank();
    $opts = [
        ['--file=<path>',    'Text file with one URL per line'],
        ['--timeout=<int>',  'Request timeout in seconds (default: 10)'],
        ['--retries=<int>',  'Retry attempts on failure (default: 1)'],
        ['--no-log',         'Disable log file output'],
        ['--no-csv',         'Disable CSV export'],
        ['--help',           'Show this help message'],
    ];
    foreach ($opts as [$opt, $desc]) {
        CS::line('  ' . CS::color(str_pad($opt, 22), CS::BRIGHT_CYAN) . CS::color($desc, CS::WHITE));
    }
    CS::blank();

    CS::sectionTitle("Status Categories");
    CS::blank();
    $cats = [
        [CS::BRIGHT_GREEN,  'Online',           '2xx — The URL is reachable and responding normally'],
        [CS::BRIGHT_YELLOW, 'Redirecting',      '3xx — The URL redirects to another location'],
        [CS::BRIGHT_RED,    'Client Error',     '4xx — Client-side error (404, 403, etc.)'],
        [CS::RED,           'Server Error',     '5xx — Server-side error (500, 503, etc.)'],
        [CS::MAGENTA,       'Invalid URL',      'URL is malformed or has no http/https scheme'],
        [CS::GRAY,          'Timeout / Failed', 'Request timed out or connection could not be made'],
    ];
    foreach ($cats as [$color, $cat, $desc]) {
        CS::line('  ' . CS::color('● ', $color) . CS::color(str_pad($cat, 18), CS::BOLD . $color) . CS::color($desc, CS::GRAY));
    }
    CS::blank();

    CS::sectionTitle("Examples");
    CS::blank();
    CS::line('  ' . CS::color('# Check a single URL:', CS::GRAY));
    CS::line('  ' . CS::color('php checker.php https://google.com', CS::BRIGHT_WHITE));
    CS::blank();
    CS::line('  ' . CS::color('# Check from file with 10s timeout and 2 retries:', CS::GRAY));
    CS::line('  ' . CS::color('php checker.php --file=urls.txt --timeout=10 --retries=2', CS::BRIGHT_WHITE));
    CS::blank();
    CS::line('  ' . CS::color('# Check from file, no CSV output:', CS::GRAY));
    CS::line('  ' . CS::color('php checker.php --file=urls.txt --no-csv', CS::BRIGHT_WHITE));
    CS::blank();
}
