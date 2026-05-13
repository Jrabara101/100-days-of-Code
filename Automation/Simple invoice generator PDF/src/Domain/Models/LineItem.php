<?php

declare(strict_types=1);

namespace InvioCLI\Domain\Models;

readonly class LineItem
{
    public function __construct(
        public string $description,
        public int $quantity,
        public int $unitPriceCents
    ) {
    }

    public function getTotalCents(): int
    {
        return $this->quantity * $this->unitPriceCents;
    }
}
