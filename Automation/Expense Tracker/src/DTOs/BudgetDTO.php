<?php

declare(strict_types=1);

namespace VaultCLI\DTOs;

/**
 * BudgetDTO – immutable value object for category budget entries.
 */
final readonly class BudgetDTO
{
    public function __construct(
        public string $category,
        public int    $limitCents,    // monthly limit in integer cents
        public ?int   $id = null,
    ) {}
}
