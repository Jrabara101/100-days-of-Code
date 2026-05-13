<?php

declare(strict_types=1);

namespace AegisGen\Security;

/**
 * EntropyCalculator — Cryptographic Strength Analysis Engine
 *
 * Architectural Reasoning:
 * -----------------------
 * Entropy quantification transforms an abstract "is this password strong?"
 * question into a concrete mathematical answer measured in bits. Every
 * method here is pure (no side effects, deterministic given inputs),
 * making this class trivially unit-testable and safely composable.
 *
 * The Shannon entropy formula used is:
 *   E = L × log₂(R)
 * Where:
 *   L = length of the password / word count for diceware
 *   R = size of the symbol pool (character set or wordlist size)
 *
 * For Diceware specifically, R = 7776 (EFF large wordlist, 6^5), giving
 * ≈12.92 bits per word — 5 words yields ~64.6 bits, 6 words ~77.5 bits.
 */
class EntropyCalculator
{
    // GPU-farm MD5 cracking baseline: ~350 billion hashes/second
    // Source: Hive Systems 2024 Password Table (RTX 4090 × 8)
    private const CRACKS_PER_SECOND = 350_000_000_000;

    // Seconds in a year (365.25 days)
    private const SECONDS_PER_YEAR = 31_557_600;

    // Strength thresholds in bits
    private const THRESHOLD_WEAK     = 40;
    private const THRESHOLD_MODERATE = 60;
    private const THRESHOLD_STRONG   = 100;
    private const THRESHOLD_MILITARY = 128;

    // Bar display: 128+ bits fills all 20 blocks
    private const BAR_MAX_BITS  = 128;
    private const BAR_LENGTH    = 20;

    /**
     * Calculate Shannon entropy.
     *
     * @param  int   $length   Character or word count
     * @param  int   $poolSize Symbol pool or wordlist size
     * @return float           Entropy in bits
     */
    public function calculate(int $length, int $poolSize): float
    {
        if ($poolSize <= 1 || $length <= 0) {
            return 0.0;
        }

        return $length * log($poolSize, 2);
    }

    /**
     * Estimate GPU-farm MD5 brute-force cracking time as a human-readable
     * scientific notation string.
     *
     * The keyspace is 2^bits. At CRACKS_PER_SECOND, expected time to find
     * the password is keyspace / (2 × rate) in seconds (birthday paradox
     * adjustment: expected halfway through the space).
     *
     * @param  float  $bits
     * @return string  e.g. "2.1 × 10^24 years" or "< 1 second"
     */
    public function crackingTime(float $bits): string
    {
        if ($bits <= 0) {
            return '< 1 second';
        }

        // log₁₀(years) = (bits × log₁₀(2)) − log₁₀(2 × rate × seconds_per_year)
        $log10Years = ($bits * log10(2))
            - log10(2 * self::CRACKS_PER_SECOND * self::SECONDS_PER_YEAR);

        if ($log10Years < 0) {
            // Sub-year — express in seconds
            $seconds = (2 ** $bits) / (2 * self::CRACKS_PER_SECOND);
            if ($seconds < 1) {
                return '< 1 second';
            }
            return sprintf('%.1f seconds', $seconds);
        }

        $exponent  = (int) floor($log10Years);
        $mantissa  = 10 ** ($log10Years - $exponent);

        return sprintf('%.1f × 10^%d years', $mantissa, $exponent);
    }

    /**
     * Return a strength label based on entropy bits.
     */
    public function strengthLabel(float $bits): string
    {
        return match (true) {
            $bits < self::THRESHOLD_WEAK     => 'VERY WEAK',
            $bits < self::THRESHOLD_MODERATE => 'WEAK',
            $bits < self::THRESHOLD_STRONG   => 'MODERATE',
            $bits < self::THRESHOLD_MILITARY => 'STRONG',
            default                          => 'MILITARY GRADE',
        };
    }

    /**
     * Generate a 20-character block bar scaled to BAR_MAX_BITS.
     * Returns the raw bar string (coloring is handled by AnsiStyle).
     *
     * @param  float  $bits
     * @return string  e.g. "████████████░░░░░░░░"
     */
    public function strengthBar(float $bits): string
    {
        $filled  = (int) min(
            self::BAR_LENGTH,
            round(($bits / self::BAR_MAX_BITS) * self::BAR_LENGTH)
        );
        $empty   = self::BAR_LENGTH - $filled;

        return str_repeat('█', $filled) . str_repeat('░', $empty);
    }

    /**
     * Raw strength tier as an integer (0–4) for color selection.
     *
     * 0 = very weak  (red)
     * 1 = weak       (red)
     * 2 = moderate   (yellow)
     * 3 = strong     (green)
     * 4 = military   (cyan)
     */
    public function strengthTier(float $bits): int
    {
        return match (true) {
            $bits < self::THRESHOLD_WEAK     => 0,
            $bits < self::THRESHOLD_MODERATE => 1,
            $bits < self::THRESHOLD_STRONG   => 2,
            $bits < self::THRESHOLD_MILITARY => 3,
            default                          => 4,
        };
    }
}
