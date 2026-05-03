<?php

declare(strict_types=1);

namespace Phlex\Core;

use InvalidArgumentException;

/**
 * Parses CLI arguments and holds all runtime configuration.
 * Uses PHP 8 Constructor Property Promotion throughout.
 */
final class Config
{
    public readonly string  $target;
    public readonly string  $pattern;
    public readonly bool    $dryRun;
    public readonly bool    $rollback;
    public readonly bool    $recursive;
    public readonly bool    $verbose;
    public readonly ?string $rollbackFile;

    private function __construct(
        string  $target,
        string  $pattern,
        bool    $dryRun,
        bool    $rollback,
        bool    $recursive,
        bool    $verbose,
        ?string $rollbackFile,
    ) {
        $this->target       = $target;
        $this->pattern      = $pattern;
        $this->dryRun       = $dryRun;
        $this->rollback     = $rollback;
        $this->recursive    = $recursive;
        $this->verbose      = $verbose;
        $this->rollbackFile = $rollbackFile;
    }

    /**
     * Build a Config instance from raw $argv.
     *
     * @param list<string> $argv
     */
    public static function fromArgv(array $argv): self
    {
        $opts = getopt(
            'hvr',
            [
                'target:',
                'pattern:',
                'dry-run',
                'rollback',
                'rollback-file:',
                'recursive',
                'verbose',
                'help',
            ],
            $rest
        );

        if (isset($opts['help']) || isset($opts['h'])) {
            self::printHelp();
            exit(0);
        }

        $rollback = isset($opts['rollback']);

        // target & pattern not required for rollback-only mode
        if (!$rollback) {
            if (!isset($opts['target'])) {
                throw new InvalidArgumentException(
                    "Missing required option: --target=<directory>"
                );
            }
            if (!isset($opts['pattern'])) {
                throw new InvalidArgumentException(
                    "Missing required option: --pattern=<pattern>\n" .
                    "  Example: --pattern=\"{YYYY}-{MM}-{DD}_{OriginalName}.{ext}\""
                );
            }
        }

        return new self(
            target:       $opts['target'] ?? '',
            pattern:      $opts['pattern'] ?? '',
            dryRun:       isset($opts['dry-run']),
            rollback:     $rollback,
            recursive:    isset($opts['recursive']) || isset($opts['r']),
            verbose:      isset($opts['verbose']) || isset($opts['v']),
            rollbackFile: $opts['rollback-file'] ?? null,
        );
    }

    private static function printHelp(): void
    {
        $help = <<<'HELP'

  PhlexRename v2.0.4  — Senior-Level PHP CLI File Renamer

  USAGE:
    php phlex.php --target=<dir> --pattern=<pattern> [OPTIONS]
    php phlex.php --rollback [--rollback-file=<manifest.json>]

  REQUIRED (for rename):
    --target=<dir>         Target directory to scan
    --pattern=<pattern>    Rename pattern with dynamic tokens

  PATTERN TOKENS:
    {YYYY}                 4-digit year  (from EXIF if image, else file mtime)
    {YY}                   2-digit year
    {MM}                   2-digit month
    {DD}                   2-digit day
    {HH}                   Hour (24h)
    {ii}                   Minutes
    {ss}                   Seconds
    {OriginalName}         Original filename without extension
    {ext}                  File extension (lowercase)
    {index}                Incrementing counter (padded to 4 digits)
    {artist}               ID3 Artist tag (audio files)
    {album}                ID3 Album tag  (audio files)
    {title}                ID3 Title tag  (audio files)
    {res}                  Image resolution (e.g. 1920x1080)
    {camera}               Camera model from EXIF

  OPTIONS:
    --dry-run              Simulate renames — no files are changed
    --recursive, -r        Scan subdirectories recursively
    --rollback             Revert the most recent session (or use --rollback-file)
    --rollback-file=<f>    Path to a specific manifest JSON to roll back
    --verbose, -v          Print all file paths (including unchanged)
    --help, -h             Show this help message

  EXAMPLES:
    php phlex.php --target=./photos --pattern="{YYYY}-{MM}-{DD}_{OriginalName}.{ext}" --dry-run
    php phlex.php --target=./music  --pattern="{artist} - {title}.{ext}" --recursive
    php phlex.php --rollback

HELP;
        echo $help;
    }
}
