<?php

declare(strict_types=1);

namespace VaultCLI\Enums;

/**
 * TransactionType – PHP 8.1 backed Enum.
 *
 * Architectural note: Using a backed string Enum guarantees only two
 * valid states exist across the entire system.  The value stored in
 * SQLite is the string literal so that raw SQL queries remain legible
 * without joining a lookup table.
 */
enum TransactionType: string
{
    case INCOME  = 'income';
    case EXPENSE = 'expense';

    public function label(): string
    {
        return match($this) {
            self::INCOME  => 'Income',
            self::EXPENSE => 'Expense',
        };
    }

    public function sign(): string
    {
        return match($this) {
            self::INCOME  => '+',
            self::EXPENSE => '-',
        };
    }
}
