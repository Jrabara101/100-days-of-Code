<?php

declare(strict_types=1);

// Load vendor dependencies
require __DIR__ . '/../vendor/autoload.php';

// Register project-level PSR-4 autoloader with highest precedence
spl_autoload_register(function (string $class): void {
    $prefixes = [
        'App\\' => __DIR__ . '/../app/',
        'Database\\Seeders\\' => __DIR__ . '/../database/seeders/',
        'Database\\Factories\\' => __DIR__ . '/../database/factories/',
    ];

    foreach ($prefixes as $prefix => $baseDir) {
        $len = strlen($prefix);
        if (strncmp($prefix, $class, $len) === 0) {
            $relativeClass = substr($class, $len);
            $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

            if (file_exists($file)) {
                require_once $file;
                return;
            }
        }
    }
}, true, true);
