<?php

declare(strict_types=1);

namespace DailyQuote\Storage;

use DailyQuote\Config\Config;
use DailyQuote\Exceptions\StorageException;

/**
 * QuoteStorage — Persists and retrieves quotes from a local JSON file.
 *
 * Quote record structure:
 * {
 *   "id":         "sha256-fingerprint (first 12 chars)",
 *   "text":       "quote body",
 *   "author":     "author name",
 *   "source":     "api-hostname",
 *   "fetched_at": "2026-04-22T09:15:00+08:00",
 *   "saved_at":   "2026-04-22T09:15:02+08:00"
 * }
 */
final class QuoteStorage
{
    private string $filePath;
    private int    $historyLimit;

    public function __construct(Config $config)
    {
        $this->filePath     = $config->storagePath();
        $this->historyLimit = $config->int('QUOTE_HISTORY_LIMIT', 100);
    }

    /**
     * Save a quote to history.
     *
     * @param  array $quote  Normalized quote array (text, author, source, fetched_at).
     * @return bool          True if saved, false if duplicate was detected.
     * @throws StorageException
     */
    public function save(array $quote): bool
    {
        $history = $this->load();
        $id      = $this->fingerprint($quote['text'], $quote['author']);

        // Duplicate check
        foreach ($history as $existing) {
            if (($existing['id'] ?? '') === $id) {
                return false; // already saved
            }
        }

        // Prepend so newest comes first
        array_unshift($history, [
            'id'         => $id,
            'text'       => $quote['text'],
            'author'     => $quote['author'],
            'source'     => $quote['source'] ?? 'unknown',
            'fetched_at' => $quote['fetched_at'] ?? date(DATE_ATOM),
            'saved_at'   => date(DATE_ATOM),
        ]);

        // Enforce history cap
        if (count($history) > $this->historyLimit) {
            $history = array_slice($history, 0, $this->historyLimit);
        }

        $this->persist($history);

        return true;
    }

    /**
     * Load all saved quotes (newest first).
     *
     * @return array<int, array>
     * @throws StorageException
     */
    public function load(): array
    {
        if (!file_exists($this->filePath)) {
            return [];
        }

        $raw = file_get_contents($this->filePath);

        if ($raw === false) {
            throw new StorageException("Cannot read storage file: {$this->filePath}");
        }

        if (trim($raw) === '') {
            return [];
        }

        try {
            $data = json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new StorageException("Corrupt storage file: {$e->getMessage()}");
        }

        return is_array($data) ? $data : [];
    }

    /**
     * Return one random quote from history, or null if history is empty.
     *
     * @throws StorageException
     */
    public function random(): ?array
    {
        $history = $this->load();

        if (empty($history)) {
            return null;
        }

        return $history[array_rand($history)];
    }

    /** Total number of saved quotes. */
    public function count(): int
    {
        return count($this->load());
    }

    // ── Private ──────────────────────────────────────────────────────────────

    /**
     * Write the history array back to disk as formatted JSON.
     *
     * @throws StorageException
     */
    private function persist(array $history): void
    {
        $dir = dirname($this->filePath);

        if (!is_dir($dir) && !mkdir($dir, 0755, recursive: true)) {
            throw new StorageException("Cannot create storage directory: {$dir}");
        }

        $json = json_encode($history, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            throw new StorageException('JSON encoding failed: ' . json_last_error_msg());
        }

        if (file_put_contents($this->filePath, $json) === false) {
            throw new StorageException("Cannot write to storage file: {$this->filePath}");
        }
    }

    /**
     * Generate a deterministic 12-char fingerprint for duplicate detection.
     * Uses the normalized (lowercased, whitespace-trimmed) text + author.
     */
    private function fingerprint(string $text, string $author): string
    {
        $key = strtolower(trim($text)) . '|' . strtolower(trim($author));
        return substr(hash('sha256', $key), 0, 12);
    }
}
