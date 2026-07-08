<?php

namespace App\InventorySync\Sync;

use App\InventorySync\Gateway\Exception\TransientSupplierException;

class RetryHandler
{
    public function __construct(
        private readonly int $maxRetries = 3,
        private readonly int $baseDelayMs = 150,
        private readonly int $maxDelayMs = 3000
    ) {}

    /**
     * Execute supplier client fetching with exponential backoff retry.
     *
     * @template T
     * @param callable(): T $action
     * @param ?callable(string $reason, int $attempt, int $delayMs): void $onRetry
     * @return T
     */
    public function execute(callable $action, ?callable $onRetry = null): mixed
    {
        $attempt = 0;
        while (true) {
            try {
                return $action();
            } catch (TransientSupplierException $e) {
                $attempt++;
                if ($attempt > $this->maxRetries) {
                    throw $e;
                }

                // Exponential backoff
                $delay = $this->baseDelayMs * (2 ** ($attempt - 1));
                $cappedDelay = min($this->maxDelayMs, $delay);

                // Add small jitter
                $jitterDelayMs = $cappedDelay + random_int(0, 75);

                if ($onRetry !== null) {
                    $onRetry($e->getMessage(), $attempt, $jitterDelayMs);
                }

                usleep($jitterDelayMs * 1000);
            }
        }
    }
}
