<?php

declare(strict_types=1);

namespace OmniLog\Contracts;

use OmniLog\Models\LogEntry;

/**
 * LogParserInterface – Strategy Pattern contract for log format parsers.
 *
 * SOLID / Open-Closed Principle:
 *   Adding a new log format (e.g., ApacheLogParser, SyslogParser) requires
 *   ZERO changes to existing engine code. The engine only depends on this
 *   interface, never on concrete implementations.
 *
 * Dependency Inversion:
 *   High-level modules (StreamReader pipeline, FilterEngine) depend on this
 *   abstraction, not on Nginx or JSON specifics.
 */
interface LogParserInterface
{
    /**
     * Parse a single raw log line into a typed LogEntry.
     *
     * Returns null for:
     *   - Empty lines
     *   - Lines that don't match this format's pattern
     *   - Malformed lines where required fields are missing
     *
     * Callers must treat null as a graceful skip, never as a fatal error.
     */
    public function parse(string $line): ?LogEntry;

    /**
     * Human-readable format name (e.g., 'nginx', 'json').
     * Used for CLI --format flag matching.
     */
    public function formatName(): string;

    /**
     * Auto-detection probe: returns true if the given sample line
     * appears to match this parser's expected format.
     * Used when --format is not explicitly provided.
     */
    public function canParse(string $sampleLine): bool;
}
