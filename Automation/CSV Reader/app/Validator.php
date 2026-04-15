<?php

/**
 * Validator.php
 * 
 * Provides static validation methods used throughout the application.
 * Each method returns true on success, or an error message string on failure.
 */
class Validator
{
    // ─── General Input Validators ──────────────────────────────────

    /**
     * Validates that a CSV filename is safe to use.
     *  - Must not be empty
     *  - Must not contain path traversal characters (/ \ ..)
     *  - Gets .csv extension appended automatically if missing
     *
     * @param string $name  The raw filename input
     * @return true|string  true on success, error message on failure
     */
    public static function validateFilename(string $name)
    {
        $name = trim($name);

        if ($name === '') {
            return 'Filename cannot be empty.';
        }

        // Prevent directory traversal or system paths
        if (preg_match('/[\/\\\\]/', $name) || strpos($name, '..') !== false) {
            return 'Filename must not contain path separators or "..".';
        }

        // Only allow safe filename characters
        if (!preg_match('/^[a-zA-Z0-9_\-. ]+$/', $name)) {
            return 'Filename may only contain letters, numbers, spaces, hyphens, underscores, or dots.';
        }

        return true;
    }

    /**
     * Validates that a header name is not empty and contains no commas.
     *
     * @param string $header
     * @return true|string
     */
    public static function validateHeader(string $header)
    {
        $header = trim($header);
        if ($header === '') {
            return 'Column header cannot be empty.';
        }
        if (strpos($header, ',') !== false) {
            return 'Column header must not contain commas.';
        }
        return true;
    }

    /**
     * Validates the number of columns the user wants to create.
     *  - Must be a positive integer
     *  - Reasonable upper bound of 20 columns
     *
     * @param string $input
     * @return true|string
     */
    public static function validateColumnCount(string $input)
    {
        $input = trim($input);
        if (!ctype_digit($input) || (int)$input < 1) {
            return 'Number of columns must be a positive integer (e.g. 3).';
        }
        if ((int)$input > 20) {
            return 'Maximum 20 columns allowed per CSV file.';
        }
        return true;
    }

    /**
     * Validates that a cell value is a non-empty string.
     * Commas in values are allowed — the CsvManager will handle quoting.
     *
     * @param string $value
     * @return true|string
     */
    public static function validateCellValue(string $value)
    {
        if (trim($value) === '') {
            return 'Cell value cannot be empty. Enter at least one character.';
        }
        return true;
    }

    /**
     * Validates the number of rows to add (used in append/overwrite).
     *
     * @param string $input
     * @return true|string
     */
    public static function validateRowCount(string $input)
    {
        $input = trim($input);
        if (!ctype_digit($input) || (int)$input < 1) {
            return 'Number of rows must be a positive integer (e.g. 2).';
        }
        if ((int)$input > 100) {
            return 'Maximum 100 rows can be added at once.';
        }
        return true;
    }
}
