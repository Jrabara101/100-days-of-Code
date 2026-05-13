<?php

declare(strict_types=1);

namespace InvioCLI\Domain\Enums;

enum Currency: string
{
    case USD = 'USD';
    case EUR = 'EUR';
    case GBP = 'GBP';
    case PHP = 'PHP';

    public function getSymbol(): string
    {
        return match ($this) {
            self::USD => '$',
            self::EUR => '€',
            self::GBP => '£',
            self::PHP => '₱',
        };
    }
}
