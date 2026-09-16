<?php

declare(strict_types=1);

namespace App\Integrations\DTOs;

readonly class ActionResult
{
    /**
     * @param array<string, mixed> $output
     * @param array<string> $logs
     */
    public function __construct(
        public bool $successful,
        public array $output = [],
        public float $durationSeconds = 0.0,
        public ?string $errorMessage = null,
        public array $logs = [],
    ) {
    }

    public static function success(array $output = [], float $duration = 0.0, array $logs = []): self
    {
        return new self(
            successful: true,
            output: $output,
            durationSeconds: $duration,
            errorMessage: null,
            logs: $logs,
        );
    }

    public static function failure(string $errorMessage, float $duration = 0.0, array $logs = []): self
    {
        return new self(
            successful: false,
            output: [],
            durationSeconds: $duration,
            errorMessage: $errorMessage,
            logs: $logs,
        );
    }
}
