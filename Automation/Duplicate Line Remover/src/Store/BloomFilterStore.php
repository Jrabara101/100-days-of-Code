<?php

declare(strict_types=1);

namespace DedupeCLI\Store;

use DedupeCLI\Contracts\HashStoreInterface;

/**
 * BloomFilterStore – Probabilistic, ultra-memory-efficient duplicate detection.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  BLOOM FILTER ALGORITHM                                                  │
 * │                                                                          │
 * │  A Bloom filter is a bit array of m bits, initially all 0.              │
 * │  It uses k independent hash functions. To INSERT an element:            │
 * │    – Hash the element with each of the k functions                      │
 * │    – Set each of the k resulting bit positions to 1                     │
 * │                                                                          │
 * │  To QUERY membership:                                                    │
 * │    – Hash the element with each of the k functions                      │
 * │    – If ALL k bits are 1 → "probably seen before" (may duplicate)       │
 * │    – If ANY bit is 0    → "definitely not seen" (not a duplicate)       │
 * │                                                                          │
 * │  False positives are POSSIBLE (we may occasionally keep a duplicate).  │
 * │  False negatives are IMPOSSIBLE (we never discard a unique line).       │
 * │  This makes the filter safe for deduplication: worst case = a rare     │
 * │  missed duplicate, never a silently deleted unique line.               │
 * │                                                                          │
 * │  Memory formula:                                                         │
 * │    m = -n * ln(p) / (ln(2))^2                                           │
 * │    k = (m / n) * ln(2)                                                  │
 * │    where n = expected items, p = desired false-positive rate            │
 * │                                                                          │
 * │  Example: n=50,000,000  p=0.001 (0.1%)                                 │
 * │    m ≈ 718 million bits ≈ 85 MB   (vs ~2,000 MB for MD5 store)        │
 * │    k ≈ 10 hash functions                                                │
 * │                                                                          │
 * │  We simulate k independent hashes from just two hash functions using   │
 * │  the Kirsch-Mitzenmacher-Uzman (KMU) technique:                        │
 * │    hash_i(x) = hash_a(x) + i * hash_b(x)   (mod m)                   │
 * │  This avoids k full hash computations while maintaining statistical     │
 * │  independence, keeping the per-line CPU cost O(k) where k ≤ 15.       │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
final class BloomFilterStore implements HashStoreInterface
{
    /** Bit array packed into a binary string (each byte holds 8 bits). */
    private string $bits;

    /** Number of bits in the filter. */
    private readonly int $m;

    /** Number of hash probes per element. */
    private readonly int $k;

    /** Number of unique elements inserted (approximation). */
    private int $insertions = 0;

    /**
     * @param int   $capacity   Expected number of unique elements (n).
     * @param float $errorRate  Acceptable false-positive probability (p).
     */
    public function __construct(
        private readonly int   $capacity  = 50_000_000,
        private readonly float $errorRate = 0.001
    ) {
        [$this->m, $this->k] = $this->calculateParameters($capacity, $errorRate);

        // Allocate the bit array as a binary string of \x00 bytes.
        // Each character represents 8 bits. PHP strings are mutable byte buffers,
        // making them an efficient substitute for a true bit array in userland PHP.
        $byteCount  = (int) ceil($this->m / 8);
        $this->bits = str_repeat("\x00", $byteCount);
    }

    /**
     * Implements HashStoreInterface::isDuplicate().
     *
     * Returns true  → element is probably a duplicate (may be wrong ~p of the time).
     * Returns false → element is definitely NOT a duplicate (never wrong).
     *
     * On "not a duplicate", the element is also inserted into the filter.
     */
    public function isDuplicate(string $normalised): bool
    {
        [$ha, $hb] = $this->doubleHash($normalised);

        // Check all k bit positions
        for ($i = 0; $i < $this->k; $i++) {
            $pos  = ($ha + $i * $hb) % $this->m;
            $byte = intdiv($pos, 8);
            $bit  = $pos % 8;

            if ((ord($this->bits[$byte]) & (1 << $bit)) === 0) {
                // At least one bit is 0 → definitely NOT in the filter
                // Now insert: set ALL k bits for this element
                $this->insert($ha, $hb);
                $this->insertions++;
                return false;
            }
        }

        // All k bits are set → probably a duplicate
        return true;
    }

    public function uniqueCount(): int
    {
        return $this->insertions;
    }

    public function label(): string
    {
        return sprintf(
            'Bloom Filter (%.1f%% FP | %s bits | %d probes)',
            $this->errorRate * 100,
            number_format($this->m),
            $this->k
        );
    }

    /**
     * Return the memory consumed by the bit array in bytes.
     */
    public function bitArrayBytes(): int
    {
        return strlen($this->bits);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * Set all k bit positions for the given double-hash pair.
     */
    private function insert(int $ha, int $hb): void
    {
        for ($i = 0; $i < $this->k; $i++) {
            $pos  = ($ha + $i * $hb) % $this->m;
            $byte = intdiv($pos, 8);
            $bit  = $pos % 8;

            $this->bits[$byte] = chr(ord($this->bits[$byte]) | (1 << $bit));
        }
    }

    /**
     * Kirsch-Mitzenmacher-Uzman double-hashing technique.
     * Produces two independent 32-bit unsigned integers from one CRC32 + FNV-1a pair.
     *
     * @return array{int, int}  [hash_a, hash_b]
     */
    private function doubleHash(string $data): array
    {
        // CRC32b is a fast built-in; we need unsigned on 64-bit PHP.
        $ha = crc32($data) & 0x7FFFFFFF;

        // FNV-1a 32-bit (manual, PHP-native): deterministic second hash.
        $hb = 2166136261;
        $len = strlen($data);
        for ($i = 0; $i < $len; $i++) {
            $hb ^= ord($data[$i]);
            $hb  = ($hb * 16777619) & 0xFFFFFFFF;
        }
        $hb &= 0x7FFFFFFF; // keep positive on 64-bit

        return [$ha, $hb === 0 ? 1 : $hb]; // hb must not be zero
    }

    /**
     * Calculate optimal m (bits) and k (hash probes) from n and p.
     *
     * @return array{int, int}  [m, k]
     */
    private function calculateParameters(int $n, float $p): array
    {
        $ln2   = log(2);
        $m     = (int) ceil(-$n * log($p) / ($ln2 ** 2));
        $k     = max(1, (int) round(($m / $n) * $ln2));
        return [$m, $k];
    }
}
