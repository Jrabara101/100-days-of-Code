<?php

/**
 * ConversionWorkflow.php
 *
 * Orchestrates each conversion workflow step:
 * - Prompt for input file with validation loop
 * - Show file summary
 * - Prompt for output file with validation loop
 * - Show data preview
 * - Execute conversion
 * - Show result summary
 */

require_once __DIR__ . '/Converter.php';
require_once __DIR__ . '/helpers/CliRenderer.php';
require_once __DIR__ . '/helpers/FileValidator.php';

class ConversionWorkflow
{
    // ─────────────────────────────────────────
    //   CSV → JSON Workflow
    // ─────────────────────────────────────────

    public static function runCsvToJson(): void
    {
        CliRenderer::clearScreen();
        CliRenderer::sectionTitle('CSV → JSON Conversion');

        // ── Step 1: Input file ──────────────────
        $inputPath = self::promptInputFile('csv');

        // ── Step 2: Parse & preview ─────────────
        CliRenderer::loading('Reading file...', 700);
        CliRenderer::step('Reading file...');

        $parsed = Converter::parseCsv($inputPath);
        if (!$parsed['success']) {
            CliRenderer::error('Failed to parse CSV: ' . $parsed['error']);
            CliRenderer::newLine();
            return;
        }

        // File info summary
        CliRenderer::summaryBox('File Summary', [
            'File Name' => FileValidator::getBasename($inputPath),
            'File Type' => 'CSV',
            'File Size' => FileValidator::humanFileSize($inputPath),
            'Rows Found' => count($parsed['data']) . ' data row(s)',
            'Columns'    => count(array_keys($parsed['data'][0])) . ' column(s)',
        ]);

        // Data preview
        CliRenderer::info('Here is a preview of the first rows:');
        CliRenderer::newLine();
        CliRenderer::previewTable($parsed['data'], 3);
        CliRenderer::newLine();

        // ── Step 3: Output file ─────────────────
        $outputPath = self::promptOutputFile('json');

        // ── Step 4: Convert ──────────────────────
        CliRenderer::loading('Converting data...', 900);
        CliRenderer::step('Converting CSV to JSON...');

        $result = Converter::csvToJson($inputPath, $outputPath);

        if (!$result['success']) {
            CliRenderer::newLine();
            CliRenderer::error('Conversion failed: ' . $result['error']);
            CliRenderer::newLine();
            return;
        }

        // ── Step 5: Success ──────────────────────
        CliRenderer::newLine();
        CliRenderer::success('Conversion complete!');
        CliRenderer::summaryBox('Conversion Summary', [
            'Source File'    => FileValidator::getBasename($inputPath),
            'Output File'    => FileValidator::getBasename($outputPath),
            'Output Path'    => realpath($outputPath) ?: $outputPath,
            'Records Saved'  => $result['count'] . ' item(s)',
            'Output Format'  => 'JSON (Pretty Printed)',
        ]);
    }

    // ─────────────────────────────────────────
    //   JSON → CSV Workflow
    // ─────────────────────────────────────────

    public static function runJsonToCsv(): void
    {
        CliRenderer::clearScreen();
        CliRenderer::sectionTitle('JSON → CSV Conversion');

        // ── Step 1: Input file ──────────────────
        $inputPath = self::promptInputFile('json');

        // ── Step 2: Parse & preview ─────────────
        CliRenderer::loading('Reading file...', 700);
        CliRenderer::step('Reading file...');

        $parsed = Converter::parseJson($inputPath);
        if (!$parsed['success']) {
            CliRenderer::error('Failed to parse JSON: ' . $parsed['error']);
            CliRenderer::newLine();
            return;
        }

        $headers = array_keys($parsed['data'][0]);

        // File info summary
        CliRenderer::summaryBox('File Summary', [
            'File Name'    => FileValidator::getBasename($inputPath),
            'File Type'    => 'JSON',
            'File Size'    => FileValidator::humanFileSize($inputPath),
            'Items Found'  => count($parsed['data']) . ' object(s)',
            'Fields/Keys'  => count($headers) . ' field(s)',
        ]);

        // Data preview
        CliRenderer::info('Here is a preview of the first items:');
        CliRenderer::newLine();
        CliRenderer::previewTable($parsed['data'], 3);
        CliRenderer::newLine();

        // ── Step 3: Output file ─────────────────
        $outputPath = self::promptOutputFile('csv');

        // ── Step 4: Convert ──────────────────────
        CliRenderer::loading('Converting data...', 900);
        CliRenderer::step('Converting JSON to CSV...');

        $result = Converter::jsonToCsv($inputPath, $outputPath);

        if (!$result['success']) {
            CliRenderer::newLine();
            CliRenderer::error('Conversion failed: ' . $result['error']);
            CliRenderer::newLine();
            return;
        }

        // ── Step 5: Success ──────────────────────
        CliRenderer::newLine();
        CliRenderer::success('Conversion complete!');
        CliRenderer::summaryBox('Conversion Summary', [
            'Source File'   => FileValidator::getBasename($inputPath),
            'Output File'   => FileValidator::getBasename($outputPath),
            'Output Path'   => realpath($outputPath) ?: $outputPath,
            'Records Saved' => $result['count'] . ' row(s)',
            'Output Format' => 'CSV (UTF-8 with BOM)',
        ]);
    }

    // ─────────────────────────────────────────
    //   Helper: Validated Input File Prompt
    // ─────────────────────────────────────────

    /**
     * Keep prompting until a valid input file is provided
     */
    private static function promptInputFile(string $extension): string
    {
        CliRenderer::info("Please enter the path to your .$extension file.");
        CliRenderer::info("Example: samples/data.$extension");
        CliRenderer::newLine();

        while (true) {
            $path = CliRenderer::prompt("Input file path (.$extension)");
            // Normalize backslashes on Windows
            $path = str_replace('\\', '/', $path);

            $validation = FileValidator::validateInputFile($path, $extension);

            if ($validation['valid']) {
                CliRenderer::success("File found: $path");
                CliRenderer::newLine();
                return $path;
            }

            CliRenderer::error($validation['error']);
            CliRenderer::warning('Please try again.');
            CliRenderer::newLine();
        }
    }

    // ─────────────────────────────────────────
    //   Helper: Validated Output File Prompt
    // ─────────────────────────────────────────

    /**
     * Keep prompting until a valid output file path is provided.
     * Asks for overwrite confirmation if file already exists.
     */
    private static function promptOutputFile(string $extension): string
    {
        CliRenderer::info("Where should the .$extension output file be saved?");
        CliRenderer::info("Example: output/result.$extension");
        CliRenderer::newLine();

        while (true) {
            $path = CliRenderer::prompt("Output file path (.$extension)");
            $path = str_replace('\\', '/', $path);

            $validation = FileValidator::validateOutputFile($path, $extension);

            if (!$validation['valid']) {
                CliRenderer::error($validation['error']);
                CliRenderer::warning('Please try again.');
                CliRenderer::newLine();
                continue;
            }

            // File already exists — ask for overwrite confirmation
            if ($validation['exists']) {
                CliRenderer::warning("A file already exists at: $path");
                $overwrite = CliRenderer::confirm('Do you want to overwrite it?', false);
                if (!$overwrite) {
                    CliRenderer::info('Please choose a different output path.');
                    CliRenderer::newLine();
                    continue;
                }
            }

            return $path;
        }
    }
}
