<?php

namespace App\Utils;

class Validator
{
    /**
     * Validates and normalizes the city name for Philippine locations.
     */
    public static function sanitizeLocation(string $location): string
    {
        $location = trim($location);
        
        // Remove potentially dangerous characters, keep basic letters, spaces, hyphens
        $location = preg_replace('/[^a-zA-Z\s\-ñÑ]/', '', $location);
        
        return $location;
    }

    /**
     * Basic check if the location is empty.
     */
    public static function validateLocation(string $location): bool
    {
        return !empty(trim($location));
    }
}
