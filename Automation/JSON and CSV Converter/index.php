<?php

/**
 * ┌─────────────────────────────────────────────────────────┐
 * │        Automation CLI PHP — CSV & JSON Converter        │
 * │                                                         │
 * │  Entry point: index.php                                 │
 * │  Compatible: PHP 8.0+                                   │
 * │  Usage: php index.php                                   │
 * └─────────────────────────────────────────────────────────┘
 *
 * This file bootstraps the application:
 * 1. Loads all required source files
 * 2. Validates the runtime environment
 * 3. Runs the main interactive menu loop
 */

declare(strict_types=1);

// ── Enforce CLI-only execution ───────────────────────────────
if (PHP_SAPI !== 'cli') {
    die("This script must be run from the command line.\nUsage: php index.php\n");
}

// ── PHP Version Guard ────────────────────────────────────────
if (PHP_VERSION_ID < 80000) {
    die("PHP 8.0 or higher is required. You are running PHP " . PHP_VERSION . "\n");
}

// ── Autoload Source Files ────────────────────────────────────
require_once __DIR__ . '/src/helpers/CliRenderer.php';
require_once __DIR__ . '/src/helpers/FileValidator.php';
require_once __DIR__ . '/src/Converter.php';
require_once __DIR__ . '/src/ConversionWorkflow.php';

// ── Helper: Goodbye Screen ───────────────────────────────────
function showGoodbye(): void
{
    CliRenderer::clearScreen();
    CliRenderer::newLine(2);
    CliRenderer::separator('═', 60, CliRenderer::CYAN);
    echo CliRenderer::BOLD . CliRenderer::CYAN;
    echo str_pad('  Thank you for using CSV ↔ JSON Converter!', 60) . PHP_EOL;
    echo CliRenderer::RESET;
    CliRenderer::separator('═', 60, CliRenderer::CYAN);
    CliRenderer::newLine();
    CliRenderer::info('Built with ❤ using pure PHP 8. Goodbye!');
    CliRenderer::newLine(2);
}

// ── Main Application Loop ────────────────────────────────────
function main(): void
{
    while (true) {
        // Show banner on each main menu visit
        CliRenderer::banner();

        // Display the main menu
        $choice = CliRenderer::menu(
            '  MAIN MENU — SELECT AN OPTION  ',
            [
                1 => 'Convert CSV  →  JSON',
                2 => 'Convert JSON →  CSV',
                3 => 'Exit',
            ]
        );

        // ── Handle choice ────────────────────────────────────
        switch ($choice) {
            case 1:
                // Run CSV → JSON workflow
                ConversionWorkflow::runCsvToJson();
                break;

            case 2:
                // Run JSON → CSV workflow
                ConversionWorkflow::runJsonToCsv();
                break;

            case 3:
                // Exit the application gracefully
                showGoodbye();
                exit(0);
        }

        // ── After conversion: ask to continue ────────────────
        CliRenderer::separator('─', 60);
        $again = CliRenderer::confirm('Would you like to perform another conversion?', true);

        if (!$again) {
            showGoodbye();
            exit(0);
        }

        // Loop back to main menu
    }
}

// ── Entry point ──────────────────────────────────────────────
main();
