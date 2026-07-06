<?php

namespace App\PaymentSync\Sync;

use App\PaymentSync\Gateway\Exception\GatewayTimeoutException;
use App\PaymentSync\Gateway\Exception\RateLimitExceededException;

class RetryHandler
{
    private int $maxRetries;
    private int $baseDelayMs;
    private int $maxDelayMs;

    public function __construct(int $maxRetries = 3, int $baseDelayMs = 100, int $maxDelayMs = 3000)
    {
        $this->maxRetries = $maxRetries;
        $this->baseDelayMs = $baseDelayMs;
        $this->maxDelayMs = $maxDelayMs;
    }

    /**
     * Execute a task with exponential backoff and Full Jitter.
     *
     * @template T
     * @param callable(): T $action
     * @param ?callable(string $reason, int $attempt, int $delayMs): void $onRetry
     * @return T
     * @throws \Exception If retries are exhausted or a non-retryable exception is thrown.
     */
    public function execute(callable $action, ?callable $onRetry = null): mixed
    {
        $attempt = 0;

        while (true) {
            try {
                return $action();
            } catch (GatewayTimeoutException | RateLimitExceededException $e) {
                $attempt++;

                if ($attempt > $this->maxRetries) {
                    throw $e;
                }

                // Calculate exponential delay: delay = base * (2^(attempt - 1))
                $delay = $this->baseDelayMs * (2 ** ($attempt - 1));
                $cappedDelay = min($this->maxDelayMs, $delay);

                // Full Jitter: random_int(0, cappedDelay)
                $jitterDelayMs = random_int(0, $cappedDelay);

                if ($onRetry !== null) {
                    $onRetry($e->getMessage(), $attempt, $jitterDelayMs);
                }

                // Sleep (convert ms to microseconds)
                usleep($jitterDelayMs * 1000);
            }
        }
    }
}
