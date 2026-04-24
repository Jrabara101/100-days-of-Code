<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Console\Application;
use App\Console\Style;

try {
    $app = new Application(__DIR__);
    $app->run($argv);
} catch (\Exception $e) {
    Style::error("Application Error: " . $e->getMessage());
    exit(1);
}
