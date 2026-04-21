<?php

/**
 * FileValidator.php
 *
 * Handles all file-related validation:
 * - Existence checks
 * - Extension checks
 * - Readability / writability checks
 * - Empty file detection
 */

class FileValidator
{
    // ─────────────────────────────────────────
    //   Allowed Extensions
    // ─────────────────────────────────────────

    private const ALLOWED_EXTENSIONS = ['csv', 'json'];

    // ─────────────────────────────────────────
    //   Input File Validation
    // ─────────────────────────────────────────

    /**
     * Validate that a file exists and is readable.
     * Returns [ 'valid' => bool, 'error' => string ]
     */
    public static function validateInputFile(string $path, string $expectedExtension): array
    {
        // Check if path is provided
        if (empty(trim($path))) {
            return ['valid' => false, 'error' => 'File path cannot be empty.'];
        }

        // Check if file exists
        if (!file_exists($path)) {
            return ['valid' => false, 'error' => "File not found: \"$path\""];
        }

        // Check if it is actually a file (not a directory)
        if (!is_file($path)) {
            return ['valid' => false, 'error' => "The path \"$path\" is not a valid file."];
        }

        // Check readability
        if (!is_readable($path)) {
            return ['valid' => false, 'error' => "File is not readable (check permissions): \"$path\""];
        }

        // Check file extension
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if ($ext !== strtolower($expectedExtension)) {
            return [
                'valid' => false,
                'error' => "Expected a .$expectedExtension file but got .$ext. Please provide the correct file type.",
            ];
        }

        // Check if file is empty
        if (filesize($path) === 0) {
            return ['valid' => false, 'error' => "The file is empty: \"$path\""];
        }

        return ['valid' => true, 'error' => ''];
    }

    // ─────────────────────────────────────────
    //   Output File Validation
    // ─────────────────────────────────────────

    /**
     * Validate an output file path.
     * Returns [ 'valid' => bool, 'exists' => bool, 'error' => string ]
     */
    public static function validateOutputFile(string $path, string $expectedExtension): array
    {
        if (empty(trim($path))) {
            return ['valid' => false, 'exists' => false, 'error' => 'Output file path cannot be empty.'];
        }

        // Check extension
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if ($ext !== strtolower($expectedExtension)) {
            return [
                'valid'  => false,
                'exists' => false,
                'error'  => "Output file must have a .$expectedExtension extension. Got: \".$ext\"",
            ];
        }

        // Check if directory is writable
        $dir = dirname($path);
        if ($dir !== '' && !is_dir($dir)) {
            return [
                'valid'  => false,
                'exists' => false,
                'error'  => "Output directory does not exist: \"$dir\"",
            ];
        }

        if ($dir !== '' && !is_writable($dir)) {
            return [
                'valid'  => false,
                'exists' => false,
                'error'  => "Output directory is not writable (check permissions): \"$dir\"",
            ];
        }

        // File already exists?
        $exists = file_exists($path);

        return ['valid' => true, 'exists' => $exists, 'error' => ''];
    }

    // ─────────────────────────────────────────
    //   Extension Helper
    // ─────────────────────────────────────────

    /**
     * Get the lowercase extension from a file path
     */
    public static function getExtension(string $path): string
    {
        return strtolower(pathinfo($path, PATHINFO_EXTENSION));
    }

    /**
     * Get just the filename (basename) from a path
     */
    public static function getBasename(string $path): string
    {
        return basename($path);
    }

    /**
     * Human-readable file size
     */
    public static function humanFileSize(string $path): string
    {
        $bytes = filesize($path);
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1024 * 1024) return round($bytes / 1024, 2) . ' KB';
        return round($bytes / (1024 * 1024), 2) . ' MB';
    }
}
