<?php

declare(strict_types=1);

namespace ChronoVault\Storage;

use ChronoVault\Domain\JournalEntry;
use ChronoVault\Domain\JournalEntryDraft;

/**
 * JournalRepositoryInterface — The contract all storage implementations must satisfy.
 *
 * By programming to this interface, the rest of the application never knows
 * whether it's talking to a raw SQLite store or an encrypted decorator.
 * This is the foundation of the Decorator Pattern used in this project.
 */
interface JournalRepositoryInterface
{
    /**
     * Persists a new journal entry and returns it as a finalized DTO.
     */
    public function save(JournalEntryDraft $draft): JournalEntry;

    /**
     * Retrieves a single entry by its numeric ID.
     * Returns null if not found.
     */
    public function findById(int $id): ?JournalEntry;

    /**
     * Returns the N most recent entries, ordered by date descending.
     */
    public function findRecent(int $limit = 10): array;

    /**
     * Returns all entries for analytics and streak calculation.
     * Entries are returned in ascending date order.
     */
    public function findAll(): array;

    /**
     * Returns entries within a date range (inclusive).
     * Dates are in 'Y-m-d' format.
     *
     * @return JournalEntry[]
     */
    public function findByDateRange(string $from, string $to): array;

    /**
     * Returns the total word count across all entries.
     */
    public function totalWordCount(): int;

    /**
     * Returns the total number of entries stored.
     */
    public function count(): int;
}
