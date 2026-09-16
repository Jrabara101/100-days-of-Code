<?php

declare(strict_types=1);

namespace App\DTOs;

use JsonSerializable;

/**
 * Immutable Data Transfer Object representing the workflow state and payload.
 * Strictly adheres to PHP 8.2+ readonly class standards.
 */
readonly class WorkflowPayload implements JsonSerializable
{
    public function __construct(
        public array $data = [],
        public array $meta = [],
    ) {
    }

    /**
     * Create a new instance from an associative array.
     */
    public static function fromArray(array $data, array $meta = []): self
    {
        if (array_key_exists('data', $data) && is_array($data['data'])) {
            $meta = $data['_meta'] ?? $meta;
            $data = $data['data'];
        }

        return new self($data, $meta);
    }

    /**
     * Create a new instance from a JSON string.
     */
    public static function fromJson(string $json): self
    {
        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        $data = $decoded['data'] ?? $decoded;
        $meta = $decoded['_meta'] ?? [];

        return new self(is_array($data) ? $data : ['value' => $data], is_array($meta) ? $meta : []);
    }

    /**
     * Return a new instance with mutated data key-value pair, preserving immutability.
     */
    public function with(string|array $keyOrValues, mixed $value = null): self
    {
        $clonedData = $this->data;

        if (is_array($keyOrValues)) {
            $clonedData = array_replace_recursive($clonedData, $keyOrValues);
        } else {
            data_set($clonedData, $keyOrValues, $value);
        }

        return new self($clonedData, $this->meta);
    }

    /**
     * Return a new instance with added metadata.
     */
    public function withMeta(string $key, mixed $value): self
    {
        $clonedMeta = $this->meta;
        $clonedMeta[$key] = $value;

        return new self($this->data, $clonedMeta);
    }

    /**
     * Retrieve a nested value from the payload using dot notation.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return data_get($this->data, $key, $default);
    }

    /**
     * Check if a key exists in the payload.
     */
    public function has(string $key): bool
    {
        return data_get($this->data, $key) !== null;
    }

    /**
     * Get byte size of the JSON representation.
     */
    public function getByteSize(): int
    {
        return strlen($this->toJson());
    }

    /**
     * Return human readable formatted size (e.g. 14.2 KB (JSON)).
     */
    public function getFormattedSize(): string
    {
        $bytes = $this->getByteSize();

        if ($bytes >= 1048576) {
            return sprintf('%.1f MB (JSON)', $bytes / 1048576);
        }

        if ($bytes >= 1024) {
            return sprintf('%.1f KB (JSON)', $bytes / 1024);
        }

        return sprintf('%d B (JSON)', $bytes);
    }

    public function toArray(): array
    {
        return [
            'data' => $this->data,
            '_meta' => $this->meta,
        ];
    }

    public function toJson(int $flags = JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT): string
    {
        return json_encode($this->jsonSerialize(), $flags | JSON_THROW_ON_ERROR);
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
