<?php

declare(strict_types=1);

namespace PromoForge\Validation;

class ChecksumEngine
{
    // Base32 character set excluding ambiguous chars (0, O, 1, I, l)
    // Removed visually similar characters for maximum legibility.
    public const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    /**
     * Calculates a Modulo 31 checksum character for the given input string.
     *
     * @param string $input The string to calculate the checksum for (excluding dashes).
     * @return string A single checksum character.
     */
    public static function calculate(string $input): string
    {
        $input = str_replace('-', '', strtoupper($input));
        $sum = 0;
        $length = strlen($input);
        
        // Weight each character by its position (1-indexed) to prevent anagram collisions.
        for ($i = 0; $i < $length; $i++) {
            $char = $input[$i];
            $value = strpos(self::CHARSET, $char);
            
            if ($value === false) {
                // If character is not in CHARSET, skip or assign 0.
                $value = 0;
            }
            
            $weight = $i + 1;
            $sum += ($value * $weight);
        }

        $remainder = $sum % 31;
        
        return self::CHARSET[$remainder];
    }

    /**
     * Verifies if a given code (which includes a checksum character) is mathematically valid.
     */
    public static function verify(string $code): bool
    {
        $code = strtoupper($code);
        
        // Assume the last character is the checksum.
        $actualChecksum = substr($code, -1);
        $baseString = substr($code, 0, -1);
        
        // If the code format ended with '-[C]', we might have a trailing dash now. 
        // Let's strip trailing dashes.
        $baseString = rtrim($baseString, '-');

        $expectedChecksum = self::calculate($baseString);

        return hash_equals($expectedChecksum, $actualChecksum); // Timing-attack safe comparison
    }
}
