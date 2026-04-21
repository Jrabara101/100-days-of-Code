<?php

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       Bulk Email Template Generator - Entry Point           ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  A PHP CLI application for generating personalized emails   ║
 * ║  in bulk using templates and contact data from CSV/JSON.    ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * @author  Bulk Email Template Generator
 * @version 1.0.0
 * @license MIT
 */

// ─── Configuration ────────────────────────────────────────────────
define('BASE_PATH', __DIR__);

// Set error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', '1');

// UTF-8 support for Windows terminals
if (PHP_OS_FAMILY === 'Windows') {
    // Set console output to UTF-8
    exec('chcp 65001 > nul 2>&1');
}

// ─── Autoload Classes ─────────────────────────────────────────────
$classes = [
    'CLIUI',
    'FileManager',
    'Validator',
    'TemplateManager',
    'RecipientManager',
    'EmailGenerator',
    'App',
];

foreach ($classes as $class) {
    $file = BASE_PATH . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    } else {
        echo "Error: Missing class file: {$file}\n";
        exit(1);
    }
}

// ─── Run Application ─────────────────────────────────────────────
try {
    $app = new App(BASE_PATH);
    $app->run();
} catch (Exception $e) {
    echo "\n\033[91m  ✘ Fatal Error: " . $e->getMessage() . "\033[0m\n";
    echo "\033[90m  " . $e->getFile() . ':' . $e->getLine() . "\033[0m\n";
    exit(1);
}
