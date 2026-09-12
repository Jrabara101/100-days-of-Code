<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Dto;

readonly class IngestedEventDto
{
    public function __construct(
        public string $eventType,
        public string $priority, // P0, P1, P2, P3
        public string $referenceId,
        public string $title,
        public string $message,
        public array $context = []
    ) {}
}
