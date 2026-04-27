<?php

declare(strict_types=1);

namespace CurrencyConverter;

/**
 * HistoryService — Persists and retrieves conversion history.
 *
 * History is stored as a JSON file on disk. Each entry records the full
 * conversion result plus a sequential ID for easy display.
 */
final class HistoryService
{
    /** Maximum history entries kept on disk. */
    private const MAX_ENTRIES = 100;

    private string $filePath;

    public function __construct(string $storageDir)
    {
        // Ensure the storage directory exists
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, recursive: true);
        }

        $this->filePath = rtrim($storageDir, DIRECTORY_SEPARATOR)
            . DIRECTORY_SEPARATOR . 'history.json';
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Append a conversion result to the history file.
     *
     * @param array $result  The result array returned by CurrencyConverter::convert().
     *
     * @throws \RuntimeException if the file cannot be written.
     */
    public function save(array $result): void
    {
        $entries = $this->load();

        // Assign next sequential ID
        $nextId = empty($entries) ? 1 : (end($entries)['id'] + 1);

        $entries[] = [
            'id'           => $nextId,
            'from'         => $result['from'],
            'to'           => $result['to'],
            'amount'       => $result['amount'],
            'converted'    => $result['converted'],
            'rate'         => $result['rate'],
            'date'         => $result['date'],
            'converted_at' => $result['converted_at'],
        ];

        // Trim to max entries (keep newest)
        if (count($entries) > self::MAX_ENTRIES) {
            $entries = array_slice($entries, -self::MAX_ENTRIES);
        }

        $this->write($entries);
    }

    /**
     * Return all history entries, newest first.
     *
     * @return array<int, array>
     */
    public function all(): array
    {
        return array_reverse($this->load());
    }

    /**
     * Return the last $limit entries.
     *
     * @return array<int, array>
     */
    public function recent(int $limit = 10): array
    {
        return array_slice($this->all(), 0, $limit);
    }

    /**
     * Return true if history has at least one entry.
     */
    public function hasEntries(): bool
    {
        return !empty($this->load());
    }

    /**
     * Delete all history entries.
     *
     * @throws \RuntimeException if the file cannot be written.
     */
    public function clear(): void
    {
        $this->write([]);
    }

    /**
     * Return the path to the JSON file (for display purposes).
     */
    public function filePath(): string
    {
        return $this->filePath;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Read and decode the JSON file. Returns [] if it doesn't exist yet.
     *
     * @return array<int, array>
     *
     * @throws \RuntimeException on JSON decode errors.
     */
    private function load(): array
    {
        if (!file_exists($this->filePath)) {
            return [];
        }

        $json = file_get_contents($this->filePath);

        if ($json === false || $json === '') {
            return [];
        }

        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Corrupted file — start fresh
            return [];
        }

        return is_array($data) ? $data : [];
    }

    /**
     * Encode and write $entries to the JSON file atomically.
     *
     * @throws \RuntimeException if the write fails.
     */
    private function write(array $entries): void
    {
        $json = json_encode(
            $entries,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        );

        $result = file_put_contents($this->filePath, $json, LOCK_EX);

        if ($result === false) {
            throw new \RuntimeException(
                "Failed to write history file: {$this->filePath}"
            );
        }
    }
}
