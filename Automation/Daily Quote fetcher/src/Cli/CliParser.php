<?php

declare(strict_types=1);

namespace DailyQuote\Cli;

use DailyQuote\Exception\CliException;

/**
 * Parses raw $argv into a typed CliOptions value object.
 */
final class CliParser
{
    private const VALID_FLAGS = ['--save', '--json', '--html', '--verbose', '--help', '--version'];

    /** @param list<string> $argv */
    public function __construct(private readonly array $argv) {}

    /**
     * Parse $argv and return a CliOptions instance.
     *
     * @throws CliException on unrecognised flags
     */
    public function parse(): CliOptions
    {
        // Strip the script name (argv[0])
        $args = array_slice($this->argv, 1);

        $save    = false;
        $json    = false;
        $html    = false;
        $verbose = false;
        $help    = false;
        $version = false;
        $apiUrl  = null;

        foreach ($args as $arg) {
            match (true) {
                $arg === '--save'               => $save    = true,
                $arg === '--json'               => $json    = true,
                $arg === '--html'               => $html    = true,
                $arg === '--verbose'            => $verbose = true,
                $arg === '--help'               => $help    = true,
                $arg === '--version'            => $version = true,
                str_starts_with($arg, '--api-url=') => $apiUrl = substr($arg, 10),
                default => throw new CliException(
                    "Unknown option: {$arg}" . PHP_EOL .
                    "Run with --help to see available options."
                ),
            };
        }

        return new CliOptions(
            save:    $save,
            json:    $json,
            html:    $html,
            verbose: $verbose,
            help:    $help,
            version: $version,
            apiUrl:  $apiUrl,
        );
    }
}
