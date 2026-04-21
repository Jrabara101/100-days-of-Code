<?php

/**
 * FileManager - Handles all file system operations
 * 
 * Responsible for reading/writing JSON files, CSV files,
 * and managing the data/exports directories.
 */
class FileManager
{
    /** @var string Base path of the application */
    private string $basePath;

    public function __construct(string $basePath)
    {
        $this->basePath = rtrim($basePath, DIRECTORY_SEPARATOR);
        $this->ensureDirectories();
    }

    /**
     * Ensure required directories exist
     */
    private function ensureDirectories(): void
    {
        $dirs = ['data', 'imports', 'exports'];
        foreach ($dirs as $dir) {
            $path = $this->basePath . DIRECTORY_SEPARATOR . $dir;
            if (!is_dir($path)) {
                mkdir($path, 0755, true);
            }
        }
    }

    /**
     * Get the full path for a file relative to base
     */
    public function getPath(string $relativePath): string
    {
        return $this->basePath . DIRECTORY_SEPARATOR . $relativePath;
    }

    /**
     * Read a JSON file and return decoded data
     *
     * @param string $relativePath Path relative to base directory
     * @return array Decoded JSON data
     */
    public function readJson(string $relativePath): array
    {
        $path = $this->getPath($relativePath);

        if (!file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);

        if ($content === false || $content === '') {
            return [];
        }

        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException("Failed to parse JSON file: {$path} - " . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Write data to a JSON file
     *
     * @param string $relativePath Path relative to base directory
     * @param array $data Data to write
     */
    public function writeJson(string $relativePath, array $data): void
    {
        $path = $this->getPath($relativePath);
        $dir = dirname($path);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        if ($json === false) {
            throw new RuntimeException("Failed to encode data to JSON: " . json_last_error_msg());
        }

        if (file_put_contents($path, $json) === false) {
            throw new RuntimeException("Failed to write to file: {$path}");
        }
    }

    /**
     * Read a CSV file and return an array of associative arrays
     *
     * @param string $filePath Absolute or relative path
     * @return array Array of associative arrays
     */
    public function readCsv(string $filePath): array
    {
        // If relative, make absolute
        if (!$this->isAbsolutePath($filePath)) {
            $filePath = $this->getPath($filePath);
        }

        if (!file_exists($filePath)) {
            throw new RuntimeException("CSV file not found: {$filePath}");
        }

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            throw new RuntimeException("Cannot open CSV file: {$filePath}");
        }

        $headers = fgetcsv($handle);
        if ($headers === false) {
            fclose($handle);
            throw new RuntimeException("CSV file is empty or has invalid headers.");
        }

        // Clean headers (trim whitespace, lowercase)
        $headers = array_map(function ($h) {
            return strtolower(trim($h));
        }, $headers);

        $data = [];
        $lineNum = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $lineNum++;
            if (count($row) !== count($headers)) {
                // Skip malformed rows but keep track
                continue;
            }
            $data[] = array_combine($headers, array_map('trim', $row));
        }

        fclose($handle);
        return $data;
    }

    /**
     * Read a JSON recipient file
     *
     * @param string $filePath Absolute or relative path
     * @return array Array of recipient data
     */
    public function readJsonRecipients(string $filePath): array
    {
        if (!$this->isAbsolutePath($filePath)) {
            $filePath = $this->getPath($filePath);
        }

        if (!file_exists($filePath)) {
            throw new RuntimeException("JSON file not found: {$filePath}");
        }

        $content = file_get_contents($filePath);
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException("Invalid JSON file: " . json_last_error_msg());
        }

        if (!is_array($data)) {
            throw new RuntimeException("JSON file must contain an array of recipient objects.");
        }

        // Normalize keys to lowercase
        return array_map(function ($item) {
            return array_change_key_case($item, CASE_LOWER);
        }, $data);
    }

    /**
     * Write content to a file (for exports)
     *
     * @param string $relativePath Path relative to base
     * @param string $content Content to write
     * @return string Full path of written file
     */
    public function writeFile(string $relativePath, string $content): string
    {
        $path = $this->getPath($relativePath);
        $dir = dirname($path);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if (file_put_contents($path, $content) === false) {
            throw new RuntimeException("Failed to write file: {$path}");
        }

        return $path;
    }

    /**
     * Write CSV data to a file
     *
     * @param string $relativePath Path relative to base
     * @param array $headers CSV headers
     * @param array $rows Array of associative arrays
     * @return string Full path of written file
     */
    public function writeCsv(string $relativePath, array $headers, array $rows): string
    {
        $path = $this->getPath($relativePath);
        $dir = dirname($path);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $handle = fopen($path, 'w');
        if ($handle === false) {
            throw new RuntimeException("Cannot create CSV file: {$path}");
        }

        fputcsv($handle, $headers);

        foreach ($rows as $row) {
            $csvRow = [];
            foreach ($headers as $h) {
                $csvRow[] = $row[$h] ?? '';
            }
            fputcsv($handle, $csvRow);
        }

        fclose($handle);
        return $path;
    }

    /**
     * Check if a file exists
     */
    public function fileExists(string $relativePath): bool
    {
        return file_exists($this->getPath($relativePath));
    }

    /**
     * Check if the given path is absolute
     */
    private function isAbsolutePath(string $path): bool
    {
        // Windows absolute paths: C:\... or \\...
        if (PHP_OS_FAMILY === 'Windows') {
            return preg_match('/^[a-zA-Z]:\\\\/', $path) || strpos($path, '\\\\') === 0;
        }
        // Unix absolute paths: /...
        return strpos($path, '/') === 0;
    }

    /**
     * Get the base path
     */
    public function getBasePath(): string
    {
        return $this->basePath;
    }

    /**
     * Delete a file
     */
    public function deleteFile(string $relativePath): bool
    {
        $path = $this->getPath($relativePath);
        if (file_exists($path)) {
            return unlink($path);
        }
        return false;
    }

    /**
     * List files in a directory with optional extension filter
     */
    public function listFiles(string $relativeDir, string $extension = ''): array
    {
        $path = $this->getPath($relativeDir);
        if (!is_dir($path)) {
            return [];
        }

        $files = [];
        $items = scandir($path);

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            if ($extension !== '' && !str_ends_with(strtolower($item), strtolower($extension))) continue;
            $files[] = $item;
        }

        return $files;
    }
}
