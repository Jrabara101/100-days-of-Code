<?php

/**
 * CsvManager.php
 * 
 * Handles all CSV file I/O operations:
 *   - Creating a new CSV with headers
 *   - Reading all records
 *   - Overwriting (replacing all content)
 *   - Appending new rows
 * 
 * All path operations are sandboxed to the /data directory.
 */
class CsvManager
{
    /** @var string  Absolute path to the data/ directory */
    private string $dataDir;

    /**
     * @param string $dataDir  The directory where CSV files are stored.
     *                         Defaults to <project>/data/
     */
    public function __construct(string $dataDir = '')
    {
        // Resolve data directory relative to the project root
        $this->dataDir = $dataDir !== ''
            ? rtrim($dataDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR
            : __DIR__ . '/../data/';

        $this->ensureDataDirExists();
    }

    // ─── Path Helpers ──────────────────────────────────────────────

    /**
     * Ensures the data directory exists, creating it if necessary.
     */
    private function ensureDataDirExists(): void
    {
        if (!is_dir($this->dataDir)) {
            mkdir($this->dataDir, 0777, true);
        }
    }

    /**
     * Returns the full absolute path for a given filename.
     * Automatically appends ".csv" if not already present.
     *
     * @param string $filename  Raw user-supplied filename
     * @return string           Absolute path to the CSV file
     */
    public function resolvePath(string $filename): string
    {
        $filename = trim($filename);

        // Append .csv extension if the user didn't include it
        if (!str_ends_with(strtolower($filename), '.csv')) {
            $filename .= '.csv';
        }

        return $this->dataDir . $filename;
    }

    /**
     * Returns true if the CSV file already exists on disk.
     *
     * @param string $filename
     * @return bool
     */
    public function fileExists(string $filename): bool
    {
        return file_exists($this->resolvePath($filename));
    }

    // ─── CSV Operations ────────────────────────────────────────────

    /**
     * Creates a new CSV file with the given headers as the first row.
     * Returns false and does NOT overwrite if the file already exists.
     *
     * @param string   $filename  Target filename (with or without .csv)
     * @param string[] $headers   Column header labels
     * @return bool               true on success, false if file already exists
     * @throws RuntimeException   If the file cannot be written
     */
    public function create(string $filename, array $headers): bool
    {
        $path = $this->resolvePath($filename);

        // Guard: refuse silent overwrite
        if (file_exists($path)) {
            return false;
        }

        $handle = fopen($path, 'w');
        if ($handle === false) {
            throw new RuntimeException("Cannot open file for writing: $path");
        }

        // Write the UTF-8 BOM so Excel opens it correctly
        fwrite($handle, "\xEF\xBB\xBF");

        // Write headers as the first CSV row
        fputcsv($handle, $headers);
        fclose($handle);

        return true;
    }

    /**
     * Reads all records from the CSV file.
     * Returns an associative structure with 'headers' and 'rows'.
     *
     * @param string $filename
     * @return array{headers: string[], rows: array[]}
     * @throws RuntimeException If file doesn't exist or cannot be read
     */
    public function read(string $filename): array
    {
        $path = $this->resolvePath($filename);

        if (!file_exists($path)) {
            throw new RuntimeException("File not found: " . basename($path));
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw new RuntimeException("Cannot open file for reading: $path");
        }

        // Strip the UTF-8 BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            // Not a BOM — rewind to start
            rewind($handle);
        }

        $headers = [];
        $rows    = [];

        // First line is always the headers row
        $headerLine = fgetcsv($handle);
        if ($headerLine !== false) {
            $headers = $headerLine;
        }

        // Remaining lines are data rows
        while (($row = fgetcsv($handle)) !== false) {
            // Skip blank/empty rows that some editors insert
            if ($row === [null]) {
                continue;
            }
            $rows[] = $row;
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'rows'    => $rows,
        ];
    }

    /**
     * Overwrites the entire CSV file (including headers) with new content.
     * The caller is responsible for confirming before calling this method.
     *
     * @param string   $filename  Target CSV filename
     * @param string[] $headers   New column headers
     * @param array[]  $rows      New data rows (each row is an indexed array)
     * @return bool               true on success
     * @throws RuntimeException   On write failure
     */
    public function overwrite(string $filename, array $headers, array $rows): bool
    {
        $path   = $this->resolvePath($filename);
        $handle = fopen($path, 'w');

        if ($handle === false) {
            throw new RuntimeException("Cannot open file for writing: $path");
        }

        // Re-write BOM so Excel displays correctly after overwrite
        fwrite($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $headers);

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        fclose($handle);
        return true;
    }

    /**
     * Appends one or more rows to an existing CSV file.
     * Does NOT alter the headers row.
     *
     * @param string  $filename  Target CSV filename
     * @param array[] $rows      Rows to append
     * @return bool              true on success
     * @throws RuntimeException  If file doesn't exist or can't be opened
     */
    public function append(string $filename, array $rows): bool
    {
        $path = $this->resolvePath($filename);

        if (!file_exists($path)) {
            throw new RuntimeException("File not found: " . basename($path));
        }

        // Open in append mode — does not truncate existing content
        $handle = fopen($path, 'a');
        if ($handle === false) {
            throw new RuntimeException("Cannot open file for appending: $path");
        }

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        fclose($handle);
        return true;
    }

    /**
     * Returns the base name of the resolved path (e.g. "employees.csv").
     *
     * @param string $filename
     * @return string
     */
    public function getBasename(string $filename): string
    {
        return basename($this->resolvePath($filename));
    }

    /**
     * Lists all .csv files currently stored in the data directory.
     *
     * @return string[]  Array of basenames (e.g. ["contacts.csv", "staff.csv"])
     */
    public function listFiles(): array
    {
        $files = glob($this->dataDir . '*.csv');
        if ($files === false) {
            return [];
        }
        return array_map('basename', $files);
    }
}
