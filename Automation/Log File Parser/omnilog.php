#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  OmniLog Analyzer v3.1.0                                             │
 * │  Enterprise-Grade PHP CLI Log Parser & Analyzer                      │
 * │                                                                      │
 * │  Usage:                                                              │
 * │    php omnilog.php --file=<path> [options]                           │
 * │                                                                      │
 * │  Options:                                                            │
 * │    --file=<path>         Path to the log file (required)             │
 * │    --format=nginx|json   Log format (auto-detected if omitted)       │
 * │    --level=ERROR,WARN    Comma-separated log levels to include       │
 * │    --since=<date>        Only entries on/after this date             │
 * │    --until=<date>        Only entries on/before this date            │
 * │    --grep=<pattern>      Filter by substring or regex pattern        │
 * │    --export=json|csv     Export results to file                      │
 * │    --top=<n>             Show top N IPs/endpoints (default: 10)      │
 * │    --no-color            Disable ANSI color output                   │
 * │    --help                Show this help message                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * @requires PHP 8.2+
 */

// ─── Require check ────────────────────────────────────────────────────────────
if (PHP_MAJOR_VERSION < 8 || (PHP_MAJOR_VERSION === 8 && PHP_MINOR_VERSION < 1)) {
    fwrite(STDERR, "OmniLog requires PHP 8.1 or higher. Current: " . PHP_VERSION . "\n");
    exit(1);
}

// ─── Autoloader (PSR-4 manual, no Composer needed) ───────────────────────────
spl_autoload_register(function (string $class): void {
    $base = __DIR__ . '/src/';
    $rel  = str_replace('OmniLog\\', '', $class);
    $path = $base . str_replace('\\', '/', $rel) . '.php';
    if (file_exists($path)) {
        require_once $path;
    }
});

use OmniLog\Contracts\LogParserInterface;
use OmniLog\Engine\Aggregator;
use OmniLog\Engine\FilterEngine;
use OmniLog\Engine\StreamReader;
use OmniLog\Enums\LogLevel;
use OmniLog\Export\Exporter;
use OmniLog\Parsers\JsonLogParser;
use OmniLog\Parsers\NginxAccessLogParser;
use OmniLog\UI\ProgressBar;
use OmniLog\UI\TableRenderer;
use OmniLog\UI\Terminal;

// ─── CLI argument parsing ─────────────────────────────────────────────────────

$opts = getopt('', [
    'file:',
    'format:',
    'level:',
    'since:',
    'until:',
    'grep:',
    'export:',
    'top:',
    'no-color',
    'help',
]);

if (isset($opts['no-color'])) {
    Terminal::disableColor();
}

if (isset($opts['help']) || empty($opts)) {
    printHelp();
    exit(0);
}

if (empty($opts['file'])) {
    fwrite(STDERR, Terminal::error('Error: --file is required. Run with --help for usage.') . "\n");
    exit(1);
}

$filePath  = $opts['file'];
$topN      = (int) ($opts['top'] ?? 10);
$exportFmt = $opts['export'] ?? null;

// ─── Build filter engine ──────────────────────────────────────────────────────

$filter = new FilterEngine();

if (!empty($opts['level'])) {
    $rawLevels = array_map('trim', explode(',', $opts['level']));
    $levels    = array_map(fn(string $l) => LogLevel::fromString($l), $rawLevels);
    $filter->withLevels($levels);
}
if (!empty($opts['since'])) {
    $filter->withSince($opts['since']);
}
if (!empty($opts['until'])) {
    $filter->withUntil($opts['until']);
}
if (!empty($opts['grep'])) {
    $filter->withGrep($opts['grep']);
}

// ─── Resolve parser (Strategy) ───────────────────────────────────────────────

/** @var LogParserInterface[] $availableParsers */
$availableParsers = [
    new NginxAccessLogParser(),
    new JsonLogParser(),
];

$parser = resolveParser($availableParsers, $opts['format'] ?? null, $filePath);

if ($parser === null) {
    fwrite(STDERR, Terminal::error("Error: Could not detect log format. Use --format=nginx or --format=json.") . "\n");
    exit(1);
}

// ─── Stream reader ────────────────────────────────────────────────────────────

try {
    $reader = new StreamReader($filePath);
} catch (\InvalidArgumentException $e) {
    fwrite(STDERR, Terminal::error("Error: " . $e->getMessage()) . "\n");
    exit(1);
}

// ─── Dashboard header ─────────────────────────────────────────────────────────

Terminal::banner();
Terminal::fileInfo($filePath, $reader->getFileSize(), $filter->describe());
Terminal::sectionHeader('PARSING STREAM');
echo "\n";

// ─── Main parsing pipeline ────────────────────────────────────────────────────

$aggregator   = new Aggregator();
$progressBar  = new ProgressBar($reader->getFileSize());
$malformed    = 0;
$liveBuffer   = [];   // stores last 10 threat events for live display
$threatCount  = 0;
$startTime    = microtime(true);

// Buffer to track live threat events (last 10 matching entries)
$liveEvents   = [];
$maxLiveShow  = 10;

foreach ($reader->stream() as $chunk) {
    ['line' => $line, 'bytesRead' => $bytesRead, 'lineNumber' => $lineNumber] = $chunk;

    // ── Parse line ──────────────────────────────────────────────
    try {
        $entry = $parser->parse($line);
    } catch (\Throwable) {
        $entry = null;
    }

    if ($entry === null) {
        if (trim($line) !== '') {
            $malformed++;
        }
        $progressBar->tick($bytesRead, $lineNumber);
        continue;
    }

    // ── Apply filters ────────────────────────────────────────────
    if (!$filter->passes($entry)) {
        $progressBar->tick($bytesRead, $lineNumber);
        continue;
    }

    // ── Aggregate ────────────────────────────────────────────────
    $aggregator->ingest($entry);

    // ── Collect live events (errors/critical only) ───────────────
    if ($entry->level->isError()) {
        $threatCount++;
        if (count($liveEvents) < $maxLiveShow) {
            $liveEvents[] = $entry;
        }
    }

    $progressBar->tick($bytesRead, $lineNumber);
}

$progressBar->finish($reader->getFileSize(), $reader->getTotalLines());

// ─── Live Threat Detection section ───────────────────────────────────────────

if (!empty($liveEvents)) {
    Terminal::sectionHeader('LIVE THREAT DETECTION');
    echo "\n";

    foreach ($liveEvents as $event) {
        $time   = $event->timestamp->format('H:i:s');
        $level  = Terminal::levelTag($event->level->value);
        $ip     = Terminal::highlight(str_pad($event->ip, 16));
        $msg    = $event->message
            ?? "{$event->method} {$event->endpoint} → HTTP {$event->statusCode}";
        $msgStr = Terminal::white($msg);

        echo "  " . Terminal::muted("[{$time}]") . " {$level} {$ip} - {$msgStr}\n";
    }

    if ($threatCount > $maxLiveShow) {
        $remaining = $threatCount - $maxLiveShow;
        echo "  " . Terminal::muted("... and {$remaining} more threat events (use --export to see all)\n");
    }
}

// ─── Analysis Summary ─────────────────────────────────────────────────────────

$elapsedSec = round(microtime(true) - $startTime, 2);
$memMB      = round(memory_get_peak_usage(true) / 1024 / 1024, 1);

Terminal::sectionHeader('ANALYSIS SUMMARY');
echo "\n";

// ── Top IPs table ─────────────────────────────────────────────────────────────
$topIps = $aggregator->getTopIps($topN);

if (!empty($topIps)) {
    $label = "Top {$topN} Offending IPs";
    echo "  " . Terminal::accent($label) . ":\n\n";

    $ipRows = array_map(fn(array $r) => [
        $r['ip'],
        Terminal::formatNumber($r['count']),
        'HTTP ' . $r['status'],
    ], $topIps);

    TableRenderer::render(
        headers: ['IP Address', 'Request Count', 'Last Status'],
        rows:    $ipRows,
        aligns:  ['L', 'R', 'L'],
    );
    echo "\n";
}

// ── Status code distribution ──────────────────────────────────────────────────
$buckets = $aggregator->getStatusBuckets();
echo "  " . Terminal::accent('HTTP Status Distribution') . ":\n\n";
TableRenderer::render(
    headers: ['Bucket', 'Count', 'Bar'],
    rows:    array_map(fn($b, $c) => [
        $b,
        Terminal::formatNumber($c),
        buildMiniBar($c, array_sum($buckets)),
    ], array_keys($buckets), $buckets),
    aligns: ['L', 'R', 'L'],
);
echo "\n";

// ── Top endpoints ─────────────────────────────────────────────────────────────
$topEndpoints = $aggregator->getTopEndpoints(5);
if (!empty($topEndpoints)) {
    echo "  " . Terminal::accent('Top 5 Endpoints') . ":\n\n";
    $epRows = array_map(
        fn(string $ep, int $c) => [$ep, Terminal::formatNumber($c)],
        array_keys($topEndpoints),
        $topEndpoints
    );
    TableRenderer::render(
        headers: ['Endpoint', 'Hits'],
        rows:    $epRows,
        aligns:  ['L', 'R'],
    );
    echo "\n";
}

// ── Final stats line ──────────────────────────────────────────────────────────
echo "  " . Terminal::line() . "\n";
echo "  " . Terminal::muted('Total Entries Matched : ') . Terminal::highlight(Terminal::formatNumber($aggregator->getTotalEntries())) . "\n";
echo "  " . Terminal::muted('Total Errors Found    : ') . Terminal::error(Terminal::formatNumber($aggregator->getErrorEntries())) . "\n";
echo "  " . Terminal::muted('Malformed Lines       : ') . Terminal::warn((string) $malformed) . "\n";
echo "  " . Terminal::muted('Execution Time        : ') . Terminal::cyan("{$elapsedSec} seconds") . "\n";
echo "  " . Terminal::muted('Peak Memory Usage     : ') . Terminal::cyan("{$memMB} MB") . "\n";
echo "  " . Terminal::line() . "\n\n";

// ─── Export ───────────────────────────────────────────────────────────────────

if ($exportFmt !== null) {
    try {
        $exporter   = new Exporter();
        $exportPath = $exporter->export($aggregator->toArray(), $exportFmt, dirname($filePath));
        echo "  " . Terminal::success('✔ Export saved → ') . Terminal::highlight($exportPath) . "\n\n";
    } catch (\Throwable $e) {
        echo "  " . Terminal::error('✘ Export failed: ' . $e->getMessage()) . "\n\n";
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveParser(array $parsers, ?string $format, string $filePath): ?LogParserInterface
{
    // Explicit format flag
    if ($format !== null) {
        foreach ($parsers as $p) {
            if ($p->formatName() === strtolower($format)) {
                return $p;
            }
        }
        return null;
    }

    // Auto-detect: read first non-empty line
    $file = new \SplFileObject($filePath, 'r');
    $sample = '';
    while (!$file->eof() && $sample === '') {
        $sample = trim((string) $file->fgets());
    }
    unset($file);

    foreach ($parsers as $p) {
        if ($p->canParse($sample)) {
            return $p;
        }
    }

    return null;
}

function buildMiniBar(int $value, int $total, int $width = 20): string
{
    if ($total === 0) return str_repeat('░', $width);
    $filled = (int) (($value / $total) * $width);
    $empty  = $width - $filled;
    return Terminal::fg(80, 225, 105, str_repeat('█', $filled))
         . Terminal::muted(str_repeat('░', $empty));
}

function printHelp(): void
{
    Terminal::banner();
    echo Terminal::accent("  USAGE") . "\n";
    echo Terminal::muted("  ─────────────────────────────────────────────────────────────\n");
    echo "  " . Terminal::highlight("php omnilog.php") . Terminal::cyan(" --file=<path>") . Terminal::muted(" [options]\n\n");

    echo Terminal::accent("  OPTIONS") . "\n";
    echo Terminal::muted("  ─────────────────────────────────────────────────────────────\n");

    $opts = [
        ['--file=<path>',       'required',  'Path to log file'],
        ['--format=nginx|json', 'optional',  'Log format (auto-detected if omitted)'],
        ['--level=ERR,WARN',    'optional',  'Comma-separated log levels to filter'],
        ['--since=<date>',      'optional',  'Only entries on/after date (ISO 8601)'],
        ['--until=<date>',      'optional',  'Only entries on/before date'],
        ['--grep=<pattern>',    'optional',  'Filter by text substring or /regex/'],
        ['--export=json|csv',   'optional',  'Export results to timestamped file'],
        ['--top=<n>',           'optional',  'Show top N IPs/endpoints (default: 10)'],
        ['--no-color',          'optional',  'Disable ANSI color output'],
        ['--help',              'optional',  'Show this help screen'],
    ];

    foreach ($opts as [$flag, $req, $desc]) {
        $flagStr = Terminal::cyan(str_pad($flag, 24));
        $reqStr  = $req === 'required'
            ? Terminal::error('[required]')
            : Terminal::muted('[optional]');
        echo "  {$flagStr} {$reqStr}  {$desc}\n";
    }

    echo "\n" . Terminal::accent("  EXAMPLES") . "\n";
    echo Terminal::muted("  ─────────────────────────────────────────────────────────────\n");
    echo "  " . Terminal::muted("# Parse Nginx log, filter errors since 2024-01-01\n");
    echo "  " . Terminal::highlight("php omnilog.php") . " --file=logs/sample_nginx.log --format=nginx --level=ERROR,CRITICAL --since=2024-01-01\n\n";
    echo "  " . Terminal::muted("# Parse JSON log with regex search, export to JSON\n");
    echo "  " . Terminal::highlight("php omnilog.php") . " --file=logs/app.json --format=json --grep=\"database timeout\" --export=json\n\n";
    echo "  " . Terminal::muted("# Show top 20 IPs from any auto-detected log\n");
    echo "  " . Terminal::highlight("php omnilog.php") . " --file=/var/log/access.log --top=20\n\n";
}
