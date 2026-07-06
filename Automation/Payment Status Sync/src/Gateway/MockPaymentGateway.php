<?php

namespace App\PaymentSync\Gateway;

use App\PaymentSync\Gateway\Exception\GatewayTimeoutException;
use App\PaymentSync\Gateway\Exception\RateLimitExceededException;
use App\PaymentSync\Gateway\Exception\OrderNotFoundException;
use App\PaymentSync\Model\PaymentStatus;

class MockPaymentGateway implements PaymentGatewayInterface
{
    /**
     * Map of order IDs to remote status.
     *
     * @var array<string, string>
     */
    private array $remoteStates = [
        'TX-1001' => PaymentStatus::PAID,
        'TX-1002' => PaymentStatus::AUTHORIZED,
        'TX-1003' => PaymentStatus::FAILED,
        'TX-1004' => PaymentStatus::EXPIRED,
        'TX-1005' => PaymentStatus::PAID,
        'TX-1006' => PaymentStatus::PENDING,
        'TX-1007' => PaymentStatus::FAILED,
        'TX-1008' => PaymentStatus::PAID,
        'TX-1009' => PaymentStatus::PAID,
        'TX-1010' => PaymentStatus::PAID,
        // TX-1011 will trigger OrderNotFoundException
    ];

    /**
     * Track call count per transaction ID to simulate transient failures.
     *
     * @var array<string, int>
     */
    private array $callCounts = [];

    public function fetchStatus(string $transactionId): string
    {
        // Initialize call count
        if (!isset($this->callCounts[$transactionId])) {
            $this->callCounts[$transactionId] = 0;
        }
        $this->callCounts[$transactionId]++;

        $attempt = $this->callCounts[$transactionId];

        // Simulate behavior for transient errors
        if ($transactionId === 'TX-1009') {
            if ($attempt === 1) {
                throw new GatewayTimeoutException("Connection timed out contacting gateway API (Attempt 1).");
            }
            if ($attempt === 2) {
                throw new RateLimitExceededException("HTTP 429: Rate limit exceeded. Please back off (Attempt 2).");
            }
            // Attempt 3 will succeed
        }

        // Simulate permanent transient failure (always times out)
        if ($transactionId === 'TX-1010') {
            throw new GatewayTimeoutException("Connection timed out (Attempt {$attempt}). Gateway unresponsive.");
        }

        // Simulate order not found on remote gateway
        if ($transactionId === 'TX-1011') {
            throw new OrderNotFoundException("Order TX-1011 was not found in remote gateway system.");
        }

        // Return remote status if exists, else OrderNotFoundException
        if (isset($this->remoteStates[$transactionId])) {
            return $this->remoteStates[$transactionId];
        }

        throw new OrderNotFoundException("Order {$transactionId} was not found on the remote payment gateway.");
    }
}
