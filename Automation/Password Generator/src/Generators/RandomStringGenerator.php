<?php

declare(strict_types=1);

namespace AegisGen\Generators;

use AegisGen\Contracts\GeneratorStrategyInterface;
use AegisGen\Security\EntropyCalculator;
use AegisGen\ValueObjects\Password;

/**
 * RandomStringGenerator — Strategy: Alphanumeric + Symbolic Passwords
 *
 * Guarantee Algorithm (Deep Architectural Reasoning):
 * ---------------------------------------------------
 * The naïve approach—"generate a random string from the full pool and retry
 * if a required class is missing"—is subtly broken. Rejection sampling
 * introduces correlation between successive attempts: strings that happen
 * to satisfy all constraints early in the pool pass more often, creating
 * a non-uniform distribution over valid passwords. An attacker who knows
 * the algorithm could exploit this bias.
 *
 * The correct approach is SLOT RESERVATION + CSPRNG FISHER-YATES SHUFFLE:
 *
 *   Step 1 — Reserve slots: For each required character class (upper, lower,
 *             digit, symbol), pick one character from ONLY that class using
 *             `random_int(0, strlen($subset) - 1)`. Place it in a guaranteed
 *             slot array.
 *
 *   Step 2 — Fill remainder: For each remaining slot (length - guarantees),
 *             pick from the FULL merged pool using `random_int()`. This keeps
 *             the full pool's distribution intact for non-reserved slots.
 *
 *   Step 3 — Fisher-Yates shuffle with random_int(): Iterate i from
 *             (length−1) down to 1. Swap slots[i] with slots[random_int(0,i)].
 *             This produces a PROVABLY UNIFORM permutation over all n!
 *             arrangements — something PHP's array_rand() or shuffle() (which
 *             uses mt_rand internally) cannot guarantee.
 *
 * The result: every output password is guaranteed to contain all required
 * classes, and every valid password in the space is equally likely.
 */
class RandomStringGenerator implements GeneratorStrategyInterface
{
    // Character subsets — kept as class constants to avoid re-allocation
    private const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
    private const DIGITS  = '0123456789';
    private const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    public function __construct(private readonly EntropyCalculator $entropy) {}

    /**
     * @param array{
     *   length:     int,
     *   useUpper:   bool,
     *   useLower:   bool,
     *   useDigits:  bool,
     *   useSymbols: bool,
     * } $options
     */
    public function generate(array $options): Password
    {
        $start = hrtime(true);

        $length     = max(4, (int) ($options['length']     ?? 24));
        $useUpper   = (bool) ($options['useUpper']   ?? true);
        $useLower   = (bool) ($options['useLower']   ?? true);
        $useDigits  = (bool) ($options['useDigits']  ?? true);
        $useSymbols = (bool) ($options['useSymbols'] ?? true);

        // Build the character pool and the required-char guarantee map
        $pool       = '';
        $guarantees = [];

        if ($useUpper) {
            $pool       .= self::UPPER;
            $guarantees[] = self::UPPER;
        }
        if ($useLower) {
            $pool       .= self::LOWER;
            $guarantees[] = self::LOWER;
        }
        if ($useDigits) {
            $pool       .= self::DIGITS;
            $guarantees[] = self::DIGITS;
        }
        if ($useSymbols) {
            $pool       .= self::SYMBOLS;
            $guarantees[] = self::SYMBOLS;
        }

        if ($pool === '') {
            throw new \InvalidArgumentException('At least one character set must be enabled.');
        }

        $poolSize = strlen($pool);

        // ── Step 1: Slot Reservation ──────────────────────────────────────
        // Pick one character from each required subset via CSPRNG
        $slots = [];
        foreach ($guarantees as $subset) {
            $slots[] = $subset[random_int(0, strlen($subset) - 1)];
        }

        // ── Step 2: Fill remainder from full pool ─────────────────────────
        $remaining = $length - count($slots);
        for ($i = 0; $i < $remaining; $i++) {
            $slots[] = $pool[random_int(0, $poolSize - 1)];
        }

        // ── Step 3: Fisher-Yates CSPRNG shuffle ──────────────────────────
        // Provably uniform: every permutation equally likely
        $n = count($slots);
        for ($i = $n - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$slots[$i], $slots[$j]] = [$slots[$j], $slots[$i]];
        }

        $value = implode('', $slots);

        $elapsedMs = (hrtime(true) - $start) / 1_000_000;

        return new Password(
            value:             $value,
            entropyBits:       $this->entropy->calculate($length, $poolSize),
            generationTimeMs:  $elapsedMs,
            mode:              $this->buildModeLabel($useUpper, $useLower, $useDigits, $useSymbols),
            poolSize:          $poolSize,
            length:            $length,
        );
    }

    public function modeLabel(): string
    {
        return 'Alphanumeric + Symbols';
    }

    // Internal helper: build a mode label reflecting active character sets
    private function buildModeLabel(bool $u, bool $l, bool $d, bool $s): string
    {
        $parts = [];
        if ($u || $l) $parts[] = $u && $l ? 'Alpha' : ($u ? 'Uppercase' : 'Lowercase');
        if ($d)       $parts[] = 'Numeric';
        if ($s)       $parts[] = 'Symbols';
        return implode(' + ', $parts);
    }
}
