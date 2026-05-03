<?php

/**
 * PhlexRename v2.0.4 — CLI Entry Point
 *
 * Usage:
 *   php phlex.php --target=<dir> --pattern="<pattern>" [--dry-run] [--recursive]
 *   php phlex.php --rollback [--rollback-file=<path>]
 *   php phlex.php --help
 */

declare(strict_types=1);

// ── Minimum PHP version guard ────────────────────────────────────────────────
if (PHP_VERSION_ID < 80100) {
    fwrite(STDERR, "\e[31mERROR: PhlexRename requires PHP 8.1 or higher. Current: " . PHP_VERSION . "\e[0m\n");
    exit(1);
}

// ── Autoloader ───────────────────────────────────────────────────────────────
$autoloader = __DIR__ . '/vendor/autoload.php';

if (!file_exists($autoloader)) {
    fwrite(STDERR, implode("\n", [
        '',
        "\e[38;2;255;82;82m  ERROR: Composer autoloader not found.\e[0m",
        "\e[38;2;120;144;156m  Please run:  composer install\e[0m",
        '',
    ]));
    exit(1);
}

require_once $autoloader;

// ── Bootstrap ────────────────────────────────────────────────────────────────
use Phlex\Core\Application;
use Phlex\Core\Config;

try {
    $config = Config::fromArgv($argv);
    $app    = new Application($config);
    $exit   = $app->run();
    exit($exit);
} catch (InvalidArgumentException $e) {
    fwrite(STDERR, implode("\n", [
        '',
        "\e[38;2;255;82;82m  ERROR: " . $e->getMessage() . "\e[0m",
        "\e[38;2;120;144;156m  Run:  php phlex.php --help  for usage information.\e[0m",
        '',
    ]));
    exit(1);
} catch (Throwable $e) {
    fwrite(STDERR, implode("\n", [
        '',
        "\e[38;2;255;82;82m  FATAL: " . $e->getMessage() . "\e[0m",
        "\e[38;2;120;144;156m  " . $e->getFile() . ':' . $e->getLine() . "\e[0m",
        '',
    ]));
    exit(1);
}
