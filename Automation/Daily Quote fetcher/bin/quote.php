#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Daily Quote Fetcher — CLI Entry Point
 *
 * Usage:
 *   php bin/quote.php [options]
 *
 * Options:
 *   --save          Save quote to text file
 *   --json          Save quote as JSON
 *   --html          Generate premium HTML page
 *   --verbose       Enable verbose output
 *   --api-url=URL   Override API endpoint
 *   --help          Show help
 *   --version       Show version
 */

use DailyQuote\App\Application;

// ── Bootstrap ──────────────────────────────────────────────────────────────
$rootDir    = dirname(__DIR__);
$autoloader = $rootDir . '/vendor/autoload.php';

if (! file_exists($autoloader)) {
    fwrite(STDERR, "\n  [ERROR] Composer dependencies not installed.\n");
    fwrite(STDERR, "  Run: composer install\n\n");
    exit(2);
}

require_once $autoloader;

// ── Load .env ──────────────────────────────────────────────────────────────
$dotenv = Dotenv\Dotenv::createImmutable($rootDir);

try {
    $dotenv->load();
    $dotenv->required([
        'QUOTE_API_URL',
        'STORAGE_DIR',
        'LOG_DIR',
        'OUTPUT_DIR',
    ]);
} catch (\Dotenv\Exception\InvalidPathException $e) {
    fwrite(STDERR, "\n  [ERROR] Missing .env file — copy .env.example to .env\n\n");
    exit(2);
} catch (\Dotenv\Exception\ValidationException $e) {
    fwrite(STDERR, "\n  [ERROR] Invalid .env: " . $e->getMessage() . "\n\n");
    exit(2);
}

// ── Set Timezone ───────────────────────────────────────────────────────────
date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'UTC');

// ── Run Application ────────────────────────────────────────────────────────
try {
    $app  = new Application($rootDir);
    $code = $app->run($argv ?? []);
    exit($code);
} catch (\Throwable $e) {
    fwrite(STDERR, "\n  [FATAL] " . $e->getMessage() . "\n");
    fwrite(STDERR, "  File : " . $e->getFile() . ':' . $e->getLine() . "\n\n");
    exit(3);
}
