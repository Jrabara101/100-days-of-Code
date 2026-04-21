<?php

/**
 * Converter.php
 *
 * Core conversion logic:
 * - CSV  → JSON
 * - JSON → CSV
 *
 * Each method returns an array:
 *   [ 'success' => bool, 'error' => string, 'count' => int ]
 */

class Converter
{
    // ─────────────────────────────────────────
    //   CSV → JSON
    // ─────────────────────────────────────────

    /**
     * Parse a CSV file into an array of associative arrays.
     * The first row is treated as the header.
     *
     * Returns [ 'success' => bool, 'data' => array, 'error' => string ]
     */
    public static function parseCsv(string $inputPath): array
    {
        $handle = fopen($inputPath, 'r');

        if ($handle === false) {
            return ['success' => false, 'data' => [], 'error' => "Could not open file: \"$inputPath\""];
        }

        $rows    = [];
        $headers = null;
        $line    = 0;

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $line++;

            // Skip completely empty lines
            if ($row === [null]) {
                continue;
            }

            if ($headers === null) {
                // First non-empty row = headers
                $headers = array_map('trim', $row);
                continue;
            }

            // Validate column count matches header
            if (count($row) !== count($headers)) {
                fclose($handle);
                return [
                    'success' => false,
                    'data'    => [],
                    'error'   => "Row $line has " . count($row) . " columns but header has " . count($headers) . ". Invalid CSV format.",
                ];
            }

            $rows[] = array_combine($headers, array_map('trim', $row));
        }

        fclose($handle);

        if ($headers === null) {
            return ['success' => false, 'data' => [], 'error' => 'CSV file appears to have no data or headers.'];
        }

        if (empty($rows)) {
            return ['success' => false, 'data' => [], 'error' => 'CSV file has headers but no data rows.'];
        }

        return ['success' => true, 'data' => $rows, 'error' => ''];
    }

    /**
     * Convert CSV data array to JSON and write to output file.
     *
     * Returns [ 'success' => bool, 'count' => int, 'error' => string ]
     */
    public static function csvToJson(string $inputPath, string $outputPath): array
    {
        // Parse CSV first
        $parsed = self::parseCsv($inputPath);
        if (!$parsed['success']) {
            return ['success' => false, 'count' => 0, 'error' => $parsed['error']];
        }

        $data = $parsed['data'];

        // Encode to pretty JSON
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            return ['success' => false, 'count' => 0, 'error' => 'Failed to encode data to JSON: ' . json_last_error_msg()];
        }

        // Write to output
        $written = file_put_contents($outputPath, $json);

        if ($written === false) {
            return ['success' => false, 'count' => 0, 'error' => "Failed to write output file: \"$outputPath\" (check permissions)"];
        }

        return ['success' => true, 'count' => count($data), 'error' => '', 'data' => $data];
    }

    // ─────────────────────────────────────────
    //   JSON → CSV
    // ─────────────────────────────────────────

    /**
     * Parse a JSON file into an array of associative arrays.
     *
     * Returns [ 'success' => bool, 'data' => array, 'error' => string ]
     */
    public static function parseJson(string $inputPath): array
    {
        $content = file_get_contents($inputPath);

        if ($content === false) {
            return ['success' => false, 'data' => [], 'error' => "Could not read file: \"$inputPath\""];
        }

        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'data'    => [],
                'error'   => 'Invalid JSON format: ' . json_last_error_msg(),
            ];
        }

        if (!is_array($data)) {
            return [
                'success' => false,
                'data'    => [],
                'error'   => 'JSON root must be an array of objects. Got: ' . gettype($data),
            ];
        }

        if (empty($data)) {
            return ['success' => false, 'data' => [], 'error' => 'JSON file contains an empty array. Nothing to convert.'];
        }

        // Validate each item is an associative array (object)
        foreach ($data as $index => $item) {
            if (!is_array($item) || array_keys($item) === range(0, count($item) - 1)) {
                return [
                    'success' => false,
                    'data'    => [],
                    'error'   => "Item at index $index is not a JSON object. Each element must be a key-value object.",
                ];
            }
        }

        return ['success' => true, 'data' => $data, 'error' => ''];
    }

    /**
     * Convert JSON data array to CSV and write to output file.
     *
     * Returns [ 'success' => bool, 'count' => int, 'error' => string ]
     */
    public static function jsonToCsv(string $inputPath, string $outputPath): array
    {
        // Parse JSON first
        $parsed = self::parseJson($inputPath);
        if (!$parsed['success']) {
            return ['success' => false, 'count' => 0, 'error' => $parsed['error']];
        }

        $data = $parsed['data'];

        // Collect all unique headers from all objects (handles inconsistent keys)
        $headers = [];
        foreach ($data as $row) {
            foreach (array_keys($row) as $key) {
                if (!in_array($key, $headers, true)) {
                    $headers[] = $key;
                }
            }
        }

        $handle = fopen($outputPath, 'w');
        if ($handle === false) {
            return ['success' => false, 'count' => 0, 'error' => "Could not create output file: \"$outputPath\""];
        }

        // Write BOM for Excel UTF-8 compatibility
        fwrite($handle, "\xEF\xBB\xBF");

        // Write headers
        fputcsv($handle, $headers);

        // Write rows — fill missing keys with empty string
        foreach ($data as $row) {
            $csvRow = [];
            foreach ($headers as $h) {
                $val = isset($row[$h]) ? $row[$h] : '';
                // Flatten nested arrays/objects to JSON string
                $csvRow[] = is_array($val) ? json_encode($val) : $val;
            }
            fputcsv($handle, $csvRow);
        }

        fclose($handle);

        return ['success' => true, 'count' => count($data), 'error' => '', 'data' => $data];
    }
}
