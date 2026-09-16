<?php

declare(strict_types=1);

namespace App\Integrations\DTOs;

readonly class InterpolationTrace
{
    public function __construct(
        public string $token,
        public mixed $resolvedValue,
        public ?string $targetKey = null,
        public bool $fallbackUsed = false,
    ) {
    }

    public function formattedValue(): string
    {
        if ($this->resolvedValue === null) {
            return 'null';
        }
        if (is_bool($this->resolvedValue)) {
            return $this->resolvedValue ? 'true' : 'false';
        }
        if (is_array($this->resolvedValue)) {
            return json_encode($this->resolvedValue, JSON_UNESCAPED_SLASHES);
        }
        return '"' . (string) $this->resolvedValue . '"';
    }
}
