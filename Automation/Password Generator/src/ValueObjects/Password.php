<?php

declare(strict_types=1);

namespace AegisGen\ValueObjects;

/**
 * Password — Immutable Value Object
 *
 * Architectural Reasoning:
 * -----------------------
 * A Value Object (VO) models a concept whose identity is defined entirely
 * by its value, not a database ID or reference. Two Password objects with
 * identical field values are semantically equal — they represent the same
 * outcome. The `readonly` modifier (PHP 8.1+) enforces this at the engine
 * level: no property can be reassigned after construction, making mutation
 * a compile-time error rather than a runtime bug.
 *
 * Security Posture:
 * -----------------
 * By centralising the secret in a single readonly property, we guarantee
 * there is exactly ONE copy of the plaintext in memory at any moment.
 * No intermediate mutable arrays, no string concatenation temporaries
 * escape this object. The caller `unset()`s the VO after output, and
 * PHP's reference-counting GC immediately reclaims the memory page —
 * critical in shared-server environments vulnerable to memory-dump attacks.
 *
 * #[\AllowDynamicProperties] is deliberately NOT declared, preventing any
 * runtime injection of additional properties that could shadow the readonly
 * fields or smuggle mutable state.
 */
readonly class Password
{
    /**
     * @param string $value            The raw generated secret (password / passphrase / key)
     * @param float  $entropyBits      Shannon entropy: L × log₂(R)
     * @param float  $generationTimeMs Wall-clock time to generate, in milliseconds
     * @param string $mode             Human-readable mode label (e.g. "Alphanumeric + Symbols")
     * @param int    $poolSize         Character pool size (R) used in entropy formula
     * @param int    $length           Logical length: char count for passwords, word count for diceware
     */
    public function __construct(
        public readonly string $value,
        public readonly float  $entropyBits,
        public readonly float  $generationTimeMs,
        public readonly string $mode,
        public readonly int    $poolSize,
        public readonly int    $length,
    ) {}

    /**
     * Structural equality — two VOs are equal iff all fields match.
     * (PHP readonly classes don't auto-generate __equals, so we do it.)
     */
    public function equals(self $other): bool
    {
        return $this->value            === $other->value
            && $this->entropyBits      === $other->entropyBits
            && $this->mode             === $other->mode
            && $this->poolSize         === $other->poolSize
            && $this->length           === $other->length;
    }

    /**
     * Redact-safe string representation — never accidentally leaks the
     * secret to logs or exception messages.
     */
    public function __toString(): string
    {
        return sprintf('[Password|mode=%s|bits=%.1f]', $this->mode, $this->entropyBits);
    }
}
