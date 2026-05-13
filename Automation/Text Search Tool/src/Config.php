<?php

declare(strict_types=1);

namespace SearchLens;

readonly class Config
{
    public function __construct(
        public string $targetDirectory,
        public string $query,
        public bool $isRegex,
        public bool $ignoreCase,
        public bool $matchWord,
        public int $contextLines,
        public array $ignoredPaths = ['vendor', 'node_modules', '.git']
    ) {}
}
