<?php

// Strictly require PHP 8+ feature set (although no major 8+ specific features are uniquely used, it's a modern standard)
if (version_compare(PHP_VERSION, '8.0.0', '<')) {
    echo "This application requires PHP 8.0 or higher.\n";
    exit(1);
}

require_once __DIR__ . '/src/App.php';

// Define the absolute path to the data store
$dataPath = __DIR__ . '/data/submissions.json';

// Boot Application
try {
    $app = new App($dataPath);
    $app->run();
} catch (Exception $e) {
    echo "\n\033[31m[CRITICAL ERROR]\033[0m Application crashed.\n";
    echo "Message: " . $e->getMessage() . "\n";
    exit(1);
}
