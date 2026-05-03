<?php

declare(strict_types=1);

namespace OmniLog\Enums;

/**
 * LogLevel – Backed enum representing log severity levels.
 *
 * PHP 8.1+ feature: string-backed enums allow clean mapping from
 * raw log strings to typed, comparable values without magic constants.
 */
enum LogLevel: string
{
    case DEBUG     = 'DEBUG';
    case INFO      = 'INFO';
    case NOTICE    = 'NOTICE';
    case WARN      = 'WARN';
    case ERROR     = 'ERROR';
    case CRITICAL  = 'CRITICAL';
    case ALERT     = 'ALERT';
    case EMERGENCY = 'EMERGENCY';

    /**
     * Parse a raw string into a LogLevel, case-insensitively.
     * Uses a match expression (PHP 8.0) for exhaustive, strict dispatch.
     */
    public static function fromString(string $value): self
    {
        return match (strtoupper(trim($value))) {
            'DEBUG'             => self::DEBUG,
            'INFO'              => self::INFO,
            'NOTICE'            => self::NOTICE,
            'WARN', 'WARNING'   => self::WARN,
            'ERROR'             => self::ERROR,
            'CRITICAL'          => self::CRITICAL,
            'ALERT'             => self::ALERT,
            'EMERGENCY'         => self::EMERGENCY,
            default             => self::INFO,
        };
    }

    /**
     * Numeric severity — useful for range comparisons (e.g., >= ERROR).
     */
    public function severity(): int
    {
        return match ($this) {
            self::DEBUG     => 1,
            self::INFO      => 2,
            self::NOTICE    => 3,
            self::WARN      => 4,
            self::ERROR     => 5,
            self::CRITICAL  => 6,
            self::ALERT     => 7,
            self::EMERGENCY => 8,
        };
    }

    public function isError(): bool
    {
        return $this->severity() >= self::ERROR->severity();
    }

    public function label(): string
    {
        return match ($this) {
            self::DEBUG     => 'DEBUG',
            self::INFO      => 'INFO',
            self::NOTICE    => 'NOTICE',
            self::WARN      => 'WARN',
            self::ERROR     => 'ERROR',
            self::CRITICAL  => 'CRITICAL',
            self::ALERT     => 'ALERT',
            self::EMERGENCY => 'EMERGENCY',
        };
    }
}
