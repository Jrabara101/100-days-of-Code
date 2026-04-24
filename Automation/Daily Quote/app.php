<?php

/**
 * Daily Quote Fetcher — CLI Application Entry Point
 *
 * This is the main entry point for the Daily Quote Fetcher CLI application.
 * It bootstraps the application, registers all commands, and runs the Symfony
 * Console Application.
 *
 * Usage:
 *   php app.php                  — default: fetch and display a quote
 *   php app.php quote:fetch      — fetch and display a quote
 *   php app.php quote:save       — fetch and save a quote to history
 *   php app.php quote:history    — browse saved quote history
 *   php app.php quote:random     — display a random quote from history
 *
 * @author  Daily Quote CLI
 * @version 2.0.0
 * @license MIT
 */

declare(strict_types=1);

// ── Guard: CLI-only execution ─────────────────────────────────────────────────
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('This application must be run from the command line.' . PHP_EOL);
}

// ── Autoloader ────────────────────────────────────────────────────────────────
$autoloader = __DIR__ . '/vendor/autoload.php';

if (!file_exists($autoloader)) {
    fwrite(STDERR, implode(PHP_EOL, [
        '',
        '  [ERROR] Composer dependencies not installed.',
        '  Run: composer install',
        '',
    ]) . PHP_EOL);
    exit(1);
}

require_once $autoloader;

// ── Bootstrap application ─────────────────────────────────────────────────────
use DailyQuote\App\Application;

try {
    $app = new Application(__DIR__);
    exit($app->run());
} catch (\Throwable $e) {
    fwrite(STDERR, implode(PHP_EOL, [
        '',
        '  [FATAL ERROR] ' . $e->getMessage(),
        '  File: ' . $e->getFile() . ':' . $e->getLine(),
        '',
    ]) . PHP_EOL);
    exit(1);
}
