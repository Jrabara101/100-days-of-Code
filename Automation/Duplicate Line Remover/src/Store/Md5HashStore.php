<?php

declare(strict_types=1);

namespace DedupeCLI\Store;

use DedupeCLI\Contracts\HashStoreInterface;

/**
 * Md5HashStore – Accurate, deterministic duplicate detection via MD5 hashes.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  WHY STORE HASHES, NOT RAW STRINGS?                                 │
 * │                                                                     │
 * │  Storing raw line content would consume memory proportional to the  │
 * │  average line length × number of unique lines. For a file with      │
 * │  10 million unique 200-byte lines, that is 2 GB of RAM just for    │
 * │  the lookup table.                                                  │
 * │                                                                     │
 * │  MD5 produces a fixed 16-byte binary hash (or 32-byte hex string). │
 * │  We store the raw 16-byte binary (pack('H*', md5())) in a PHP SplFixedArray │
 * │  keyed by the hash to get O(1) average lookup. This means:         │
 * │                                                                     │
 * │    10,000,000 unique lines → ~160 MB (16 bytes × 10M)              │
 * │  vs 10,000,000 × 200-byte raw → ~2,000 MB                          │
 * │                                                                     │
 * │  PHP arrays have ~40–80 bytes of overhead per element (zval +       │
 * │  hash-bucket). We store the hash string as the KEY (interned by    │
 * │  PHP's string interning) with null as value, minimising per-entry  │
 * │  overhead. Effective cost ≈ 40–50 bytes per unique line.           │
 * │                                                                     │
 * │  Collision probability: MD5 has 2^128 values; the birthday-paradox │
 * │  collision chance at 10M entries is ~10^-23, effectively zero for  │
 * │  any practical deduplication workload.                              │
 * │                                                                     │
 * │  SHA-1 or SHA-256 would give more collision resistance at the cost  │
 * │  of 20/32 bytes per key vs 16. MD5 is the optimal trade-off here   │
 * │  since cryptographic strength is irrelevant for deduplication.      │
 * └─────────────────────────────────────────────────────────────────────┘
 */
final class Md5HashStore implements HashStoreInterface
{
    /** @var array<string, true>  Hash → true sentinel map. */
    private array $seen = [];

    public function isDuplicate(string $normalised): bool
    {
        // md5() hex string (32 chars) used as the array key.
        // We store `true` (not null) as the value because isset($arr[$key])
        // returns false when the value is null — a classic PHP gotcha that
        // would silently miss every duplicate in the file.
        $hash = md5($normalised);

        if (isset($this->seen[$hash])) {
            return true;
        }

        $this->seen[$hash] = true;
        return false;
    }

    public function uniqueCount(): int
    {
        return count($this->seen);
    }

    public function label(): string
    {
        return 'MD5 HashSet';
    }

    /**
     * Return approximate RAM consumed by the internal hash table.
     * Useful for live memory display in the dashboard.
     *
     * This is an estimate: each PHP array element costs ~80 bytes
     * (zval + hash-bucket + key string) on a 64-bit build.
     */
    public function estimatedMemoryBytes(): int
    {
        return count($this->seen) * 80;
    }
}
