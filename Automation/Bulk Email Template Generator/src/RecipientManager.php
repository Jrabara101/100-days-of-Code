<?php

/**
 * RecipientManager - Manages recipient/contact data
 * 
 * Handles importing, validating, and storing recipient
 * data from CSV and JSON files.
 */
class RecipientManager
{
    /** @var FileManager File manager instance */
    private FileManager $fileManager;

    /** @var array Currently loaded recipients */
    private array $recipients = [];

    /** @var string|null Source file path */
    private ?string $sourceFile = null;

    /** @var array Last validation report */
    private array $lastReport = [];

    public function __construct(FileManager $fileManager)
    {
        $this->fileManager = $fileManager;
    }

    /**
     * Import recipients from a CSV file
     *
     * @param string $filePath Path to the CSV file
     * @return array Imported recipients
     */
    public function importFromCsv(string $filePath): array
    {
        $this->recipients = $this->fileManager->readCsv($filePath);
        $this->sourceFile = $filePath;
        return $this->recipients;
    }

    /**
     * Import recipients from a JSON file
     *
     * @param string $filePath Path to the JSON file
     * @return array Imported recipients
     */
    public function importFromJson(string $filePath): array
    {
        $this->recipients = $this->fileManager->readJsonRecipients($filePath);
        $this->sourceFile = $filePath;
        return $this->recipients;
    }

    /**
     * Import from a file, auto-detecting format by extension
     *
     * @param string $filePath Path to the file
     * @return array Imported recipients
     */
    public function importFromFile(string $filePath): array
    {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        switch ($ext) {
            case 'csv':
                return $this->importFromCsv($filePath);
            case 'json':
                return $this->importFromJson($filePath);
            default:
                throw new RuntimeException("Unsupported file format '.{$ext}'. Use .csv or .json files.");
        }
    }

    /**
     * Validate loaded recipients against required placeholders
     *
     * @param array $placeholders Required placeholder fields
     * @return array Validation report
     */
    public function validate(array $placeholders = []): array
    {
        $this->lastReport = Validator::validateRecipients($this->recipients, $placeholders);
        return $this->lastReport;
    }

    /**
     * Get all loaded recipients
     */
    public function getRecipients(): array
    {
        return $this->recipients;
    }

    /**
     * Get valid recipients from the last validation
     */
    public function getValidRecipients(): array
    {
        return $this->lastReport['valid'] ?? $this->recipients;
    }

    /**
     * Get a specific recipient by index (1-based)
     */
    public function getByIndex(int $index): ?array
    {
        $idx = $index - 1;
        return $this->recipients[$idx] ?? null;
    }

    /**
     * Get the count of loaded recipients
     */
    public function count(): int
    {
        return count($this->recipients);
    }

    /**
     * Check if any recipients are loaded
     */
    public function hasRecipients(): bool
    {
        return !empty($this->recipients);
    }

    /**
     * Get the source file path
     */
    public function getSourceFile(): ?string
    {
        return $this->sourceFile;
    }

    /**
     * Get available fields from loaded recipients
     */
    public function getAvailableFields(): array
    {
        if (empty($this->recipients)) {
            return [];
        }
        return array_keys($this->recipients[0]);
    }

    /**
     * Get the last validation report
     */
    public function getLastReport(): array
    {
        return $this->lastReport;
    }

    /**
     * Clear loaded recipients
     */
    public function clear(): void
    {
        $this->recipients = [];
        $this->sourceFile = null;
        $this->lastReport = [];
    }
}
