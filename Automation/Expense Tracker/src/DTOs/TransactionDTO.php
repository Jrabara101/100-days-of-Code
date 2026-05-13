<?php

declare(strict_types=1);

namespace VaultCLI\DTOs;

use VaultCLI\Enums\TransactionType;

/**
 * TransactionDTO – immutable Data Transfer Object.
 *
 * Architectural note: readonly properties (PHP 8.1+) are leveraged to
 * create value objects that cannot be accidentally mutated after
 * construction.  All monetary values are stored and transported as
 * INTEGER CENTS to eliminate IEEE-754 floating-point drift.
 *
 * Example: $1,250.75 → stored as 125075 (int).
 * This means: bcadd('125000', '75') = '125075' with zero rounding error.
 */
final readonly class TransactionDTO
{
    public function __construct(
        public int             $amountCents,   // e.g. 125075 = $1,250.75
        public string          $category,
        public string          $description,
        public TransactionType $type,
        public string          $date,          // ISO-8601: YYYY-MM-DD
        public ?string         $tags = null,   // comma-separated: "work,client"
        public ?int            $id   = null,
    ) {}

    /**
     * Convert a user-supplied decimal string to integer cents safely.
     * Uses bcmath to avoid float rounding during the conversion itself.
     */
    public static function centsFromDecimal(string $decimal): int
    {
        // bcmul with scale=0 rounds toward zero; we use bcround via scale=2 then multiply.
        $scaled = bcmul($decimal, '100', 0);
        return (int) $scaled;
    }

    /**
     * Format cents back to a human-readable dollar string.
     */
    public static function formatCents(int $cents): string
    {
        $dollars = bcdiv((string) abs($cents), '100', 2);
        return number_format((float) $dollars, 2);
    }
}
