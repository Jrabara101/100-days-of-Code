<?php

declare(strict_types=1);

namespace App\Integrations\DTOs;

use ArrayAccess;

/**
 * Encapsulates the mapped input parameters, context from earlier steps,
 * and execution metadata passed to an Action Strategy.
 *
 * @implements ArrayAccess<string, mixed>
 */
readonly class Payload implements ArrayAccess
{
    /**
     * @param array<string, mixed> $data The interpolated, action-ready inputs
     * @param array<string, mixed> $context The full workflow execution context (trigger + prior step outputs)
     * @param array<string, mixed> $rawTemplate The original un-interpolated template
     */
    public function __construct(
        public array $data = [],
        public array $context = [],
        public array $rawTemplate = [],
        public ?string $workflowId = null,
        public ?int $stepOrder = null,
    ) {
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return data_get($this->data, $key, $default);
    }

    public function all(): array
    {
        return $this->data;
    }

    public function offsetExists(mixed $offset): bool
    {
        return isset($this->data[$offset]);
    }

    public function offsetGet(mixed $offset): mixed
    {
        return $this->data[$offset] ?? null;
    }

    public function offsetSet(mixed $offset, mixed $value): void
    {
        // Read-only DTO
    }

    public function offsetUnset(mixed $offset): void
    {
        // Read-only DTO
    }
}
