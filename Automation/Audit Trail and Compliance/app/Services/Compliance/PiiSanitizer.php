<?php

declare(strict_types=1);

namespace App\Services\Compliance;

class PiiSanitizer
{
    private const BLACKLISTED_KEYS = [
        'password',
        'password_confirmation',
        'secret',
        'token',
        'api_key',
        'authorization',
        'credit_card',
        'card_number',
        'cvv',
        'ssn',
        'tax_id',
    ];

    /**
     * Recursively sanitizes structured arrays, masking blacklisted keys and sensitive values.
     */
    public static function sanitize(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $normalizedKey = strtolower((string) $key);

            if (self::isBlacklistedKey($normalizedKey)) {
                $sanitized[$key] = '[REDACTED_CONFIDENTIAL]';
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = self::sanitize($value);
            } elseif (is_string($value)) {
                $sanitized[$key] = self::maskSensitivePatterns($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    private static function isBlacklistedKey(string $key): bool
    {
        foreach (self::BLACKLISTED_KEYS as $pattern) {
            if (str_contains($key, $pattern)) {
                return true;
            }
        }
        return false;
    }

    private static function maskSensitivePatterns(string $input): string
    {
        // Mask 16-digit credit cards: 4111-XXXX-XXXX-1111
        $ccMasked = preg_replace('/\b(\d{4})[ -]?\d{4}[ -]?\d{4}[ -]?(\d{4})\b/', '$1-XXXX-XXXX-$2', $input);

        // Mask SSN: XXX-XX-1234
        return preg_replace('/\b\d{3}-\d{2}-(\d{4})\b/', 'XXX-XX-$1', (string) $ccMasked);
    }
}
