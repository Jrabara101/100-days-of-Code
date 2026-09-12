<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Dto;

readonly class OutboxAuditReceipt
{
    public function __construct(
        public string $recipientName,
        public string $channelTrail,
        public string $status,
        public int $latencyMs,
        public bool $fallbackOccurred,
        public bool $circuitTripped,
        public ?string $logDetail = null
    ) {}
}
