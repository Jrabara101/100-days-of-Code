<?php

namespace App\PaymentSync\Gateway;

interface PaymentGatewayInterface
{
    /**
     * Fetch status of a transaction from the remote payment gateway.
     *
     * @param string $transactionId
     * @return string One of PaymentStatus constants.
     *
     * @throws \App\PaymentSync\Gateway\Exception\GatewayException On generic errors.
     * @throws \App\PaymentSync\Gateway\Exception\GatewayTimeoutException On transient connection errors.
     * @throws \App\PaymentSync\Gateway\Exception\RateLimitExceededException On HTTP 429 rate limit errors.
     * @throws \App\PaymentSync\Gateway\Exception\OrderNotFoundException If order does not exist remotely.
     */
    public function fetchStatus(string $transactionId): string;
}
