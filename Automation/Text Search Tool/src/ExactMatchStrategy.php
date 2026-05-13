<?php

declare(strict_types=1);

namespace SearchLens;

readonly class ExactMatchStrategy implements SearchStrategyInterface
{
    public function __construct(
        private string $query,
        private bool $ignoreCase,
        private bool $matchWord
    ) {}

    public function matches(string $line): ?array
    {
        $searchLine = $this->ignoreCase ? strtolower($line) : $line;
        $searchQuery = $this->ignoreCase ? strtolower($this->query) : $this->query;

        $pos = strpos($searchLine, $searchQuery);
        if ($pos === false) {
            return null;
        }

        // Handle exact word matching
        if ($this->matchWord) {
            $len = strlen($searchQuery);
            $before = $pos > 0 ? $searchLine[$pos - 1] : ' ';
            $after = ($pos + $len < strlen($searchLine)) ? $searchLine[$pos + $len] : ' ';

            // If characters around it are alphanumeric or underscore, it's not a standalone word
            if (preg_match('/[\w]/', $before) || preg_match('/[\w]/', $after)) {
                return null;
            }
        }

        return [
            'match' => substr($line, $pos, strlen($this->query)),
            'start' => $pos,
            'length' => strlen($this->query)
        ];
    }

    public function getQuery(): string
    {
        return $this->query;
    }
}
