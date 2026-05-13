<?php

declare(strict_types=1);

namespace SearchLens;

interface SearchStrategyInterface
{
    /**
     * Check if a given line matches the search criteria.
     * Returns an array containing match details (e.g. matched substring) or null if no match.
     *
     * @param string $line
     * @return array{match: string, start: int, length: int}|null
     */
    public function matches(string $line): ?array;

    /**
     * Get the query being searched.
     */
    public function getQuery(): string;
}
