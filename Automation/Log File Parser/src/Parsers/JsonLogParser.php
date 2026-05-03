<?php

declare(strict_types=1);

namespace OmniLog\Parsers;

use OmniLog\Contracts\LogParserInterface;
use OmniLog\Enums\LogLevel;
use OmniLog\Models\LogEntry;

/**
 * JsonLogParser – Concrete Strategy for JSON-structured log files.
 *
 * Expects newline-delimited JSON (NDJSON), one object per line:
 *   {"timestamp":"2024-01-15T14:02:11Z","level":"ERROR","ip":"1.2.3.4",
 *    "method":"POST","endpoint":"/api","status":500,"message":"..."}
 *
 * Fault Tolerance:
 *   json_decode returns null for malformed JSON; this parser returns null
 *   in that case, letting the engine log it as a malformed-line skip.
 */
class JsonLogParser implements LogParserInterface
{
    public function parse(string $line): ?LogEntry
    {
        $line = rtrim($line);
        if ($line === '') {
            return null;
        }

        $data = json_decode($line, associative: true);

        if (!is_array($data)) {
            return null;
        }

        $timestamp = new \DateTimeImmutable();
        if (isset($data['timestamp'])) {
            try {
                $timestamp = new \DateTimeImmutable($data['timestamp']);
            } catch (\Throwable) {
                // keep default timestamp, don't crash
            }
        }

        $level = isset($data['level'])
            ? LogLevel::fromString($data['level'])
            : LogLevel::INFO;

        return new LogEntry(
            ip:         (string) ($data['ip']       ?? '0.0.0.0'),
            timestamp:  $timestamp,
            level:      $level,
            statusCode: (int)    ($data['status']   ?? 0),
            method:     (string) ($data['method']   ?? 'GET'),
            endpoint:   (string) ($data['endpoint'] ?? '/'),
            raw:        $line,
            message:    isset($data['message']) ? (string) $data['message'] : null,
            userAgent:  isset($data['user_agent']) ? (string) $data['user_agent'] : null,
        );
    }

    public function formatName(): string
    {
        return 'json';
    }

    public function canParse(string $sampleLine): bool
    {
        $data = json_decode(trim($sampleLine), associative: true);
        return is_array($data) && (isset($data['timestamp']) || isset($data['level']));
    }
}
