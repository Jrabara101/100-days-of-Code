<?php

declare(strict_types=1);

namespace OmniLog\Parsers;

use OmniLog\Contracts\LogParserInterface;
use OmniLog\Enums\LogLevel;
use OmniLog\Models\LogEntry;

/**
 * NginxAccessLogParser – Concrete Strategy for Nginx Combined Log Format.
 *
 * Target format:
 *   IP - - [dd/Mon/YYYY:HH:MM:SS +ZZZZ] "METHOD /path HTTP/1.x" STATUS BYTES "referer" "agent"
 *
 * Named capture groups make the regex self-documenting and provide
 * IDE-navigable field names instead of positional $m[1], $m[2] etc.
 *
 * Fault Tolerance:
 *   preg_match failure returns null (not an exception). The calling loop
 *   increments a malformed-line counter and continues — the stream is
 *   never interrupted by a single bad line.
 */
class NginxAccessLogParser implements LogParserInterface
{
    private const PATTERN = '/^(?P<ip>\S+)\s+\S+\s+\S+\s+\[(?P<time>[^\]]+)\]\s+"(?P<method>[A-Z]+)\s+(?P<endpoint>\S+)\s+[^"]*"\s+(?P<status>\d{3})\s+(?P<bytes>\d+|-)(?:\s+"(?P<referer>[^"]*)")?(?:\s+"(?P<agent>[^"]*)")?/';

    public function parse(string $line): ?LogEntry
    {
        $line = rtrim($line);
        if ($line === '') {
            return null;
        }

        if (!preg_match(self::PATTERN, $line, $m)) {
            return null;
        }

        $timestamp = \DateTimeImmutable::createFromFormat('d/M/Y:H:i:s O', $m['time']);
        if ($timestamp === false) {
            $timestamp = new \DateTimeImmutable();
        }

        $statusCode = (int) $m['status'];

        return new LogEntry(
            ip:         $m['ip'],
            timestamp:  $timestamp,
            level:      $this->inferLevel($statusCode),
            statusCode: $statusCode,
            method:     $m['method'],
            endpoint:   $m['endpoint'],
            raw:        $line,
            message:    null,
            userAgent:  isset($m['agent']) && $m['agent'] !== '' ? $m['agent'] : null,
        );
    }

    /**
     * Infer log level from HTTP status code using a match expression.
     * 5xx → ERROR, 4xx → WARN, 3xx → NOTICE, 2xx → INFO.
     */
    private function inferLevel(int $statusCode): LogLevel
    {
        return match (true) {
            $statusCode >= 500 => LogLevel::ERROR,
            $statusCode >= 400 => LogLevel::WARN,
            $statusCode >= 300 => LogLevel::NOTICE,
            default            => LogLevel::INFO,
        };
    }

    public function formatName(): string
    {
        return 'nginx';
    }

    public function canParse(string $sampleLine): bool
    {
        return (bool) preg_match(self::PATTERN, $sampleLine);
    }
}
