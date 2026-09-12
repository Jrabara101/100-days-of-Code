<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter;

use App\Models\NotificationProvider;
use Carbon\CarbonImmutable;

class CircuitBreakerManager
{
    private const FAILURE_THRESHOLD = 3;
    private const COOLING_PERIOD_SECONDS = 60;

    /**
     * Determines whether the gateway circuit allows traffic or is tripped.
     */
    public function canAttempt(string $providerCode): bool
    {
        $provider = NotificationProvider::where('code', $providerCode)->first();
        if (!$provider) {
            return false;
        }

        if ($provider->circuit_state === 'CLOSED') {
            return true;
        }

        if ($provider->circuit_state === 'OPEN') {
            $openedAt = CarbonImmutable::parse($provider->circuit_opened_at);
            if ($openedAt->addSeconds(self::COOLING_PERIOD_SECONDS)->isPast()) {
                // Transition to HALF_OPEN to test canary
                $provider->update([
                    'circuit_state' => 'HALF_OPEN',
                    'last_canary_probed_at' => now(),
                ]);
                return true;
            }
            return false; // Circuit still cooling down
        }

        // HALF_OPEN allows single canary probe
        return true;
    }

    public function recordSuccess(string $providerCode): void
    {
        $provider = NotificationProvider::where('code', $providerCode)->first();
        if (!$provider) {
            return;
        }

        if ($provider->circuit_state === 'HALF_OPEN') {
            $provider->update([
                'circuit_state' => 'CLOSED',
                'consecutive_failures' => 0,
                'circuit_opened_at' => null,
            ]);
        }
    }

    public function recordFailure(string $providerCode): void
    {
        $provider = NotificationProvider::where('code', $providerCode)->first();
        if (!$provider) {
            return;
        }

        $failures = $provider->consecutive_failures + 1;

        if ($failures >= self::FAILURE_THRESHOLD || $provider->circuit_state === 'HALF_OPEN') {
            $provider->update([
                'circuit_state' => 'OPEN',
                'consecutive_failures' => $failures,
                'circuit_opened_at' => now(),
            ]);
        } else {
            $provider->update([
                'consecutive_failures' => $failures,
            ]);
        }
    }
}
