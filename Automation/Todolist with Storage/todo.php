<?php

/**
 * Todo CLI App
 * Production-ready mini project for PHP CLI
 */

declare(strict_types=1);

// Simple PSR-4 like Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'TodoApp\\';
    $base_dir = __DIR__ . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use TodoApp\App;
use TodoApp\Utils;

try {
    $app = new App();
    $app->run($argv);
} catch (\Throwable $e) {
    Utils::error("An unexpected error occurred: " . $e->getMessage());
    exit(1);
}
