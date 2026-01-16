<?php

namespace App\Services;

class EfficiencyService
{
    /**
     * Calculate efficiency ratio.
     * Ratio = Estimated Time / Actual Time.
     * > 1.0 means faster than estimated (Good).
     * < 1.0 means slower than estimated.
     */
    public function calculateEfficiency(int $estimatedMinutes, int $actualMinutes): float
    {
        if ($actualMinutes <= 0) {
            // If actual time is 0, arguably efficiency is infinite, but practically we return 0 or 1 depending on business logic.
            return 0.0; 
        }
        return round($estimatedMinutes / $actualMinutes, 2);
    }
    
    /**
     * Get efficiency color class for UI.
     */
    public function getEfficiencyColor(float $efficiency): string
    {
        if ($efficiency >= 1.0) return 'text-success';
        if ($efficiency >= 0.8) return 'text-warning';
        return 'text-danger';
    }
}
