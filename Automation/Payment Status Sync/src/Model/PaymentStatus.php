<?php

namespace App\PaymentSync\Model;

class PaymentStatus
{
    public const PENDING = 'PENDING';
    public const AUTHORIZED = 'AUTHORIZED';
    public const PAID = 'PAID';
    public const FAILED = 'FAILED';
    public const REFUNDED = 'REFUNDED';
    public const EXPIRED = 'EXPIRED';

    /**
     * Get list of all valid statuses.
     *
     * @return array<string>
     */
    public static function all(): array
    {
        return [
            self::PENDING,
            self::AUTHORIZED,
            self::PAID,
            self::FAILED,
            self::REFUNDED,
            self::EXPIRED,
        ];
    }

    /**
     * Check if a status is valid.
     */
    public static function isValid(string $status): bool
    {
        return in_array($status, self::all(), true);
    }
}
