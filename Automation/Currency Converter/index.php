<?php

declare(strict_types=1);

/**
 * index.php — PHP CLI Currency Converter Entry Point
 *
 * This is the only file you need to run. It boots the application,
 * ensures we are in a CLI context, and hands control to Application.
 *
 * Usage:
 *   php index.php
 *
 * Requirements:
 *   - PHP 8.0 or higher
 *   - Composer dependencies installed (composer install)
 *   - Internet connection for live exchange rates
 *
 * @author  PHP Currency Converter CLI
 * @version 1.0.0
 * @license MIT
 */

// ── Guard: CLI-only execution ─────────────────────────────────────────────────
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('This application must be run from the command line.' . PHP_EOL);
}

// ── Minimum PHP version check ─────────────────────────────────────────────────
if (PHP_VERSION_ID < 80000) {
    fwrite(STDERR, PHP_EOL
        . '  [ERROR] PHP 8.0+ is required. You are running PHP ' . PHP_VERSION . PHP_EOL
        . PHP_EOL);
    exit(1);
}

// ── Autoloader ────────────────────────────────────────────────────────────────
$autoloader = __DIR__ . '/vendor/autoload.php';

if (!file_exists($autoloader)) {
    fwrite(STDERR, implode(PHP_EOL, [
        '',
        '  [ERROR] Composer dependencies are not installed.',
        '  Please run:  composer install',
        '  Then retry:  php index.php',
        '',
    ]) . PHP_EOL);
    exit(1);
}

require_once $autoloader;

// ── Bootstrap & Run ───────────────────────────────────────────────────────────
use CurrencyConverter\Application;

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
