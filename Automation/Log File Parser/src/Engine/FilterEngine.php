<?php

declare(strict_types=1);

namespace OmniLog\Engine;

use OmniLog\Enums\LogLevel;
use OmniLog\Models\LogEntry;

/**
 * FilterEngine – Chainable predicate pipeline for log entry filtering.
 *
 * Each filter is a separate predicate. Entries must pass ALL active
 * predicates. Short-circuit evaluation means failing a cheap predicate
 * (e.g., level check) skips the more expensive regex check entirely.
 *
 * Fluent interface allows readable configuration:
 *   $filter->withLevels([LogLevel::ERROR])->withSince('2024-01-01')->withGrep('/timeout/i');
 */
class FilterEngine
{
    /** @var LogLevel[] */
    private array               $levels      = [];
    private ?\DateTimeImmutable $since       = null;
    private ?\DateTimeImmutable $until       = null;
    private ?string             $grepPattern = null;

    /**
     * @param LogLevel[] $levels
     */
    public function withLevels(array $levels): static
    {
        $this->levels = $levels;
        return $this;
    }

    public function withSince(string $since): static
    {
        try {
            $this->since = new \DateTimeImmutable($since);
        } catch (\Throwable $e) {
            throw new \InvalidArgumentException("Invalid --since date: '{$since}'. Use ISO 8601 format (e.g. 2024-01-01).");
        }
        return $this;
    }

    public function withUntil(string $until): static
    {
        try {
            $this->until = new \DateTimeImmutable($until);
        } catch (\Throwable $e) {
            throw new \InvalidArgumentException("Invalid --until date: '{$until}'. Use ISO 8601 format (e.g. 2024-12-31).");
        }
        return $this;
    }

    public function withGrep(string $pattern): static
    {
        // Wrap bare patterns in delimiters if needed
        if (!str_starts_with($pattern, '/') && !str_starts_with($pattern, '#')) {
            $pattern = '/' . preg_quote($pattern, '/') . '/i';
        }
        $this->grepPattern = $pattern;
        return $this;
    }

    /**
     * Run all active predicates against a LogEntry.
     * Returns false immediately on the first failing predicate (short-circuit).
     */
    public function passes(LogEntry $entry): bool
    {
        // 1. Level filter — O(1) array_search
        if (!empty($this->levels) && !in_array($entry->level, $this->levels, strict: true)) {
            return false;
        }

        // 2. Date range — O(1) datetime comparison
        if ($this->since !== null && $entry->timestamp < $this->since) {
            return false;
        }
        if ($this->until !== null && $entry->timestamp > $this->until) {
            return false;
        }

        // 3. Regex grep — most expensive, evaluated last
        if ($this->grepPattern !== null && !preg_match($this->grepPattern, $entry->raw)) {
            return false;
        }

        return true;
    }

    public function hasActiveFilters(): bool
    {
        return !empty($this->levels)
            || $this->since       !== null
            || $this->until       !== null
            || $this->grepPattern !== null;
    }

    /** Human-readable summary of active filters for the dashboard header. */
    public function describe(): array
    {
        $parts = [];

        if (!empty($this->levels)) {
            $names  = array_map(fn(LogLevel $l) => $l->value, $this->levels);
            $parts[] = 'Level [' . implode(', ', $names) . ']';
        }
        if ($this->since !== null) {
            $parts[] = 'Since [' . $this->since->format('Y-m-d') . ']';
        }
        if ($this->until !== null) {
            $parts[] = 'Until [' . $this->until->format('Y-m-d') . ']';
        }
        if ($this->grepPattern !== null) {
            $parts[] = 'Grep [' . $this->grepPattern . ']';
        }

        return $parts;
    }
}
