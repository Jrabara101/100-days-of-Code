<?php

declare(strict_types=1);

namespace DedupeCLI\Config;

/**
 * DedupeConfig – Immutable value object representing a single run's configuration.
 *
 * PHP 8.2 readonly class: all properties are implicitly readonly, meaning
 * they can only be assigned once (in the constructor). This eliminates an
 * entire category of bugs where configuration is mutated mid-run.
 *
 * Constructor property promotion keeps the declaration DRY: the `public
 * readonly` prefix on each constructor parameter simultaneously declares the
 * property, sets its visibility, and assigns the value.
 */
readonly class DedupeConfig
{
    public function __construct(
        /** Absolute path to the source file to deduplicate. */
        public string  $inputPath,

        /** Absolute path where the clean output will be written. */
        public string  $outputPath,

        /**
         * When true, lines are lowercased before hashing.
         * "Hello" and "hello" will be treated as duplicates.
         */
        public bool    $ignoreCase       = false,

        /**
         * When true, leading/trailing whitespace is stripped before hashing.
         * "  foo  " and "foo" will be treated as duplicates.
         */
        public bool    $trimWhitespace   = false,

        /**
         * Use the Bloom filter backend instead of the MD5 hash-set.
         * Recommended for files > 1 GB where even 40-byte hashes can
         * accumulate to several GB of RAM for very large unique-line counts.
         */
        public bool    $useBloomFilter   = false,

        /**
         * Bloom filter false-positive probability (0.0–1.0).
         * Lower = larger bit array, fewer false positives.
         * Default 0.001 = 0.1% false-positive rate.
         */
        public float   $bloomErrorRate   = 0.001,

        /**
         * Expected number of unique lines (used to size the Bloom filter).
         * Over-estimate rather than under-estimate to keep false-positive
         * rate within the configured bloomErrorRate.
         */
        public int     $bloomCapacity    = 50_000_000,

        /** Disable ANSI colour output (for piped/redirected terminals). */
        public bool    $noColor          = false,

        /** How often (in lines) the progress bar is refreshed. */
        public int     $updateInterval   = 1_000,
    ) {}

    /**
     * Normalise a raw line according to the active matching rules.
     * This is the canonical transformation applied before hashing.
     *
     * Keeping it here (on the config object) means the engine never needs
     * to know about the individual flags; it just calls $config->normalise().
     */
    public function normalise(string $line): string
    {
        if ($this->trimWhitespace) {
            $line = trim($line);
        }
        if ($this->ignoreCase) {
            $line = strtolower($line);
        }
        return $line;
    }

    /**
     * Build a human-readable summary of the active rules for the dashboard.
     *
     * @return array<string, string>  key = label, value = "ON" | "OFF"
     */
    public function rulesDisplay(): array
    {
        return [
            'Trim Whitespace' => $this->trimWhitespace ? 'ON' : 'OFF',
            'Ignore Case'     => $this->ignoreCase     ? 'ON' : 'OFF',
            'Bloom Filter'    => $this->useBloomFilter  ? 'ON' : 'OFF',
        ];
    }
}
