<?php

declare(strict_types=1);

namespace OmniLog\Models;

use OmniLog\Enums\LogLevel;

/**
 * LogEntry – Immutable Data Transfer Object for a single parsed log line.
 *
 * PHP 8.2 feature: readonly classes make every property implicitly readonly,
 * guaranteeing immutability without per-property annotations.
 * Constructor property promotion (PHP 8.0) eliminates boilerplate assignments.
 */
readonly class LogEntry
{
    public function __construct(
        public string             $ip,
        public \DateTimeImmutable $timestamp,
        public LogLevel           $level,
        public int                $statusCode,
        public string             $method,
        public string             $endpoint,
        public string             $raw,
        public ?string            $message   = null,
        public ?string            $userAgent = null,
    ) {}

    public function toArray(): array
    {
        return [
            'ip'          => $this->ip,
            'timestamp'   => $this->timestamp->format(\DateTimeInterface::ATOM),
            'level'       => $this->level->value,
            'status_code' => $this->statusCode,
            'method'      => $this->method,
            'endpoint'    => $this->endpoint,
            'message'     => $this->message,
        ];
    }
}
