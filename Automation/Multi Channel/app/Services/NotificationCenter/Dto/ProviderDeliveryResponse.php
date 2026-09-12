<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Dto;

readonly class ProviderDeliveryResponse
{
    public function __construct(
        public bool $success,
        public int $latencyMs,
        public ?string $receiptId = null,
        public ?string $errorMessage = null,
        public bool $networkTimeout = false
    ) {}
}
