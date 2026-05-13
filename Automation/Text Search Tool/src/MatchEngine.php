<?php

declare(strict_types=1);

namespace SearchLens;

use SplFileInfo;

readonly class MatchEngine
{
    public function __construct(
        private SearchStrategyInterface $strategy,
        private Config $config
    ) {}

    /**
     * @param SplFileInfo $file
     * @return array{file: string, matches: array<int, array{line: int, content: string, start: int, length: int, before: array, after: array}>}
     */
    public function processFile(SplFileInfo $file): ?array
    {
        $handle = @fopen($file->getPathname(), 'r');
        if (!$handle) {
            return null;
        }

        $contextBuffer = new ContextBuffer($this->config->contextLines);
        $matches = [];
        $lineNumber = 1;
        $contextAfterCount = 0;
        $currentMatchRef = null;

        while (($line = fgets($handle)) !== false) {
            // Remove trailing newlines for cleaner processing, but keep original for context
            $cleanLine = rtrim($line, "\r\n");

            // Collect "after" context lines for the previous match
            if ($contextAfterCount > 0 && $currentMatchRef !== null) {
                $matches[count($matches) - 1]['after'][] = [
                    'line_number' => $lineNumber,
                    'content' => $cleanLine
                ];
                $contextAfterCount--;
            }

            // Quick check (early exit) for ExactMatch
            if ($this->strategy instanceof ExactMatchStrategy) {
                $query = $this->strategy->getQuery();
                if ($query !== '' && strpos($this->config->ignoreCase ? strtolower($cleanLine) : $cleanLine, $this->config->ignoreCase ? strtolower($query[0]) : $query[0]) === false) {
                    // Character not found, skip regex/strpos completely
                    $contextBuffer->add($lineNumber, $cleanLine);
                    $lineNumber++;
                    continue;
                }
            }

            $matchResult = $this->strategy->matches($cleanLine);

            if ($matchResult !== null) {
                // Found a match
                $matches[] = [
                    'line' => $lineNumber,
                    'content' => $cleanLine,
                    'start' => $matchResult['start'],
                    'length' => $matchResult['length'],
                    'before' => $contextBuffer->getLines(),
                    'after' => []
                ];
                
                $currentMatchRef = true;
                $contextAfterCount = $this->config->contextLines;
                
                // We clear the buffer so subsequent matches don't overlap previous context awkwardly,
                // or we could keep it. Clearing is safer for visual clarity.
                $contextBuffer->clear();
            } else {
                // If we are still collecting 'after' lines, we might not want to clear/add to buffer yet,
                // but if we are not, add to buffer for future 'before' contexts.
                if ($contextAfterCount === 0) {
                    $contextBuffer->add($lineNumber, $cleanLine);
                }
            }

            $lineNumber++;
        }

        fclose($handle);

        if (empty($matches)) {
            return null;
        }

        return [
            'file' => clone $file,
            'matches' => $matches
        ];
    }
}
