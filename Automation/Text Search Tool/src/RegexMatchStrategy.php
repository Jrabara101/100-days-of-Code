<?php

declare(strict_types=1);

namespace SearchLens;

readonly class RegexMatchStrategy implements SearchStrategyInterface
{
    private string $pattern;

    public function __construct(
        private string $query,
        private bool $ignoreCase
    ) {
        $modifiers = $this->ignoreCase ? 'i' : '';
        // Assuming user passes raw regex without delimiters if they don't include them, 
        // but let's safely wrap it. If it already has delimiters, preg_match handles it, 
        // but we'll normalize it by wrapping in arbitrary delimiters like ~
        // We'll trust the user's regex or wrap it safely.
        
        // Simple heuristic: if query doesn't start with a typical delimiter, wrap it
        if (!preg_match('/^[\/~#@]/', $this->query)) {
            $this->pattern = '~' . str_replace('~', '\~', $this->query) . '~' . $modifiers;
        } else {
            $this->pattern = $this->query . $modifiers;
        }
    }

    public function matches(string $line): ?array
    {
        if (preg_match($this->pattern, $line, $matches, PREG_OFFSET_CAPTURE)) {
            // matches[0][0] is the matched string, matches[0][1] is the offset
            return [
                'match' => $matches[0][0],
                'start' => $matches[0][1],
                'length' => strlen($matches[0][0])
            ];
        }

        return null;
    }

    public function getQuery(): string
    {
        return $this->query;
    }
}
