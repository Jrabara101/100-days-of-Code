#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  DedupeCLI v1.2.0                                                        │
 * │  High-Efficiency Duplicate Line Eliminator                               │
 * │                                                                          │
 * │  Usage:                                                                  │
 * │    php dedupe.php --input=<path> [options]                               │
 * │                                                                          │
 * │  Options:                                                                │
 * │    --input=<path>          Source file to deduplicate (required)         │
 * │    --output=<path>         Destination file (default: auto-named)        │
 * │    --ignore-case           Case-insensitive line matching                │
 * │    --trim-whitespace       Trim spaces before comparing lines            │
 * │    --bloom                 Use Bloom filter backend (ultra-scale)        │
 * │    --bloom-capacity=<n>    Expected unique line count (default: 50M)     │
 * │    --bloom-error=<rate>    Bloom false-positive rate (default: 0.001)    │
 * │    --no-color              Disable ANSI colour output                    │
 * │    --help                  Show this help screen                         │
 * │                                                                          │
 * │  @requires PHP 8.2+                                                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

// ── PHP version guard ─────────────────────────────────────────────────────────
if (PHP_VERSION_ID < 80200) {
    fwrite(STDERR, "DedupeCLI requires PHP 8.2+. Current: " . PHP_VERSION . "\n");
    exit(1);
}

// ── PSR-4 manual autoloader (no Composer required) ────────────────────────────
spl_autoload_register(function (string $class): void {
    $prefix = 'DedupeCLI\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $file     = __DIR__ . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . $relative . '.php';
    if (is_file($file)) {
        require_once $file;
    }
});

use DedupeCLI\Config\DedupeConfig;
use DedupeCLI\Contracts\HashStoreInterface;
use DedupeCLI\Engine\DeduplicationEngine;
use DedupeCLI\Engine\FileStreamer;
use DedupeCLI\Store\BloomFilterStore;
use DedupeCLI\Store\Md5HashStore;
use DedupeCLI\UI\Dashboard;
use DedupeCLI\UI\Terminal;

// ── CLI argument parsing ──────────────────────────────────────────────────────
$opts = getopt('', [
    'input:',
    'output:',
    'ignore-case',
    'trim-whitespace',
    'bloom',
    'bloom-capacity:',
    'bloom-error:',
    'no-color',
    'help',
]);

// Handle --no-color early so all subsequent output respects it
if (isset($opts['no-color'])) {
    Terminal::disableColor();
}

// ── Help screen ───────────────────────────────────────────────────────────────
if (isset($opts['help']) || empty($opts)) {
    Dashboard::helpScreen();
    exit(0);
}

// ── Validate required --input ─────────────────────────────────────────────────
if (empty($opts['input'])) {
    fwrite(STDERR, Terminal::error('Error: --input is required. Run with --help for usage.') . "\n");
    exit(1);
}

$inputPath = (string) $opts['input'];

if (!is_file($inputPath)) {
    fwrite(STDERR, Terminal::error("Error: File not found: {$inputPath}") . "\n");
    exit(1);
}

// ── Derive output path if not supplied ────────────────────────────────────────
if (!empty($opts['output'])) {
    $outputPath = (string) $opts['output'];
} else {
    $info       = pathinfo($inputPath);
    $dir        = $info['dirname'];
    $name       = $info['filename'];
    $ext        = isset($info['extension']) ? '.' . $info['extension'] : '';
    $outputPath = $dir . DIRECTORY_SEPARATOR . $name . '_clean' . $ext;
}

// Prevent overwriting the source file
if (realpath($inputPath) === realpath($outputPath)) {
    fwrite(STDERR, Terminal::error('Error: --input and --output must not be the same file.') . "\n");
    exit(1);
}

// ── Build configuration ───────────────────────────────────────────────────────
$config = new DedupeConfig(
    inputPath:      $inputPath,
    outputPath:     $outputPath,
    ignoreCase:     isset($opts['ignore-case']),
    trimWhitespace: isset($opts['trim-whitespace']),
    useBloomFilter: isset($opts['bloom']),
    bloomErrorRate: isset($opts['bloom-error'])    ? (float) $opts['bloom-error']    : 0.001,
    bloomCapacity:  isset($opts['bloom-capacity']) ? (int)   $opts['bloom-capacity'] : 50_000_000,
    noColor:        isset($opts['no-color']),
);

// ── Select hash store (Dependency Inversion: engine depends on interface) ─────
/** @var HashStoreInterface $store */
$store = $config->useBloomFilter
    ? new BloomFilterStore($config->bloomCapacity, $config->bloomErrorRate)
    : new Md5HashStore();

// ── Initialise streamer ───────────────────────────────────────────────────────
try {
    $streamer = new FileStreamer($inputPath);
} catch (\InvalidArgumentException $e) {
    fwrite(STDERR, Terminal::error('Error: ' . $e->getMessage()) . "\n");
    exit(1);
}

// ── Initialise UI ─────────────────────────────────────────────────────────────
$dashboard = new Dashboard($config);

// ── Render opening dashboard ──────────────────────────────────────────────────
$dashboard->banner();
$dashboard->fileInfo($streamer->getFileSize());
$dashboard->sectionHeader('PROCESSING STREAM');
echo "\n";

// ── Set up progress bar ───────────────────────────────────────────────────────
use DedupeCLI\UI\ProgressBar;

$progressBar      = new ProgressBar($streamer->getFileSize(), $config->updateInterval);
$duplicatesPrinted = 0;
$maxLiveDupes      = 10;   // max duplicate events shown in live log section

// ── Wire up the engine ────────────────────────────────────────────────────────
$engine = new DeduplicationEngine($config, $streamer, $store);

$engine->onProgress(function (int $bytesRead, int $lineCount) use ($progressBar): void {
    $progressBar->tick($bytesRead, $lineCount);
});

$engine->onDuplicate(
    function (int $lineNumber, string $shortHash) use (
        $dashboard,
        &$duplicatesPrinted,
        $maxLiveDupes,
        $progressBar
    ): void {
        if ($duplicatesPrinted < $maxLiveDupes) {
            // Move to a new line before printing the event
            // so it appears below the current progress bar line
            $dashboard->printDuplicateEvent($lineNumber, $shortHash);
            $duplicatesPrinted++;

            // After printing, ensure the progress bar resets to a clean line
            // on the NEXT tick by clearing the progress line buffer
        }
    }
);

// ── Run ───────────────────────────────────────────────────────────────────────
try {
    $engine->run();
} catch (\RuntimeException $e) {
    echo "\n";
    fwrite(STDERR, Terminal::error('Fatal: ' . $e->getMessage()) . "\n");
    exit(1);
}

// ── Finish progress bar ───────────────────────────────────────────────────────
$progressBar->finish($streamer->getFileSize(), $engine->getTotalScanned());

// ── Render summary ────────────────────────────────────────────────────────────
$dashboard->summary($engine, $streamer->getFileSize());

exit(0);
