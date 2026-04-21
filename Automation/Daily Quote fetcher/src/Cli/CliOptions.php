<?php

declare(strict_types=1);

namespace DailyQuote\Cli;

/**
 * Parsed CLI options value object.
 */
final class CliOptions
{
    public function __construct(
        public readonly bool        $save    = false,
        public readonly bool        $json    = false,
        public readonly bool        $html    = false,
        public readonly bool        $verbose = false,
        public readonly bool        $help    = false,
        public readonly bool        $version = false,
        public readonly string|null $apiUrl  = null,
    ) {}
}
