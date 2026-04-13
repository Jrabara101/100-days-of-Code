<?php

/**
 * Premium PHP CLI Notes App
 * Author: Antigravity Code Assistant
 */

declare(strict_types=1);

// 1. Simple Autoloader (PSR-4 style for non-composer project)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/app/';

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

use App\Repositories\JsonStorage;
use App\Repositories\NoteRepository;
use App\Services\NoteService;
use App\UI\CliRenderer;
use App\Core\CommandRouter;
use App\Helpers\Color;

// 2. Initialize Components
try {
    $storagePath = __DIR__ . '/storage/notes.json';
    
    $jsonStorage = new JsonStorage($storagePath);
    $noteRepository = new NoteRepository($jsonStorage);
    $noteService = new NoteService($noteRepository);
    $cliRenderer = new CliRenderer();
    
    $router = new CommandRouter($noteService, $cliRenderer);

    // 3. Start Execution
    $router->run($argv);

} catch (Throwable $e) {
    echo "\033[31m[CRITICAL ERROR]\033[0m " . $e->getMessage() . PHP_EOL;
    echo "Trace: " . $e->getTraceAsString() . PHP_EOL;
    exit(1);
}
