<?php

declare(strict_types=1);

namespace DedupeCLI\Contracts;

/**
 * HashStoreInterface – Contract for all deduplication lookup backends.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  WHY AN INTERFACE?  (SOLID: Dependency Inversion Principle)         │
 * │                                                                     │
 * │  The DeduplicationEngine depends on THIS contract, not on any       │
 * │  concrete store. This means we can swap the storage mechanism       │
 * │  (MD5 hash set → Bloom filter → Redis → SQLite) without touching    │
 * │  a single line of the engine code.                                  │
 * │                                                                     │
 * │  Md5HashStore    → 100% accurate, ~40 bytes per unique line         │
 * │  BloomFilterStore → probabilistic, ~1.2 bytes per unique line       │
 * │    (may produce rare false-positive "duplicate" hits, tunable)      │
 * └─────────────────────────────────────────────────────────────────────┘
 */
interface HashStoreInterface
{
    /**
     * Check whether this normalised line content has been seen before.
     * If not yet seen, record it and return false.
     * If already seen, return true (= duplicate, skip this line).
     *
     * @param string $normalised The canonicalised line (after trim/lower rules).
     */
    public function isDuplicate(string $normalised): bool;

    /**
     * Return the total number of unique fingerprints currently stored.
     */
    public function uniqueCount(): int;

    /**
     * Human-readable label for UI display (e.g. "MD5 HashSet", "Bloom Filter").
     */
    public function label(): string;
}
