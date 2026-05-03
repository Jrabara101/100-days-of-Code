<?php

declare(strict_types=1);

namespace DedupeCLI\Engine;

use DedupeCLI\Config\DedupeConfig;
use DedupeCLI\Contracts\HashStoreInterface;

/**
 * DeduplicationEngine – Core stream processing pipeline.
 *
 * Responsibilities:
 *   1. Pull raw lines from the FileStreamer generator (one at a time).
 *   2. Normalise each line using the active DedupeConfig rules.
 *   3. Ask the HashStoreInterface whether the normalised form is a duplicate.
 *   4. Write unique lines to the output file handle.
 *   5. Collect metrics and fire callbacks for live UI updates.
 *
 * SOLID adherence:
 *   – Single Responsibility: this class ONLY orchestrates the pipeline.
 *     It does not know how hashing works (HashStoreInterface) or how lines
 *     are read (FileStreamer) or how the UI renders (callbacks).
 *   – Open/Closed: new storage backends or normalisation rules can be added
 *     without modifying this class.
 *   – Liskov: any HashStoreInterface implementation can be swapped in.
 *   – Interface Segregation: the engine depends on the minimal interface,
 *     not on concrete store methods like estimatedMemoryBytes().
 *   – Dependency Inversion: engine depends on abstractions, not concretions.
 */
class DeduplicationEngine
{
    // ── Metrics ────────────────────────────────────────────────────────────────

    private int   $totalScanned     = 0;
    private int   $duplicatesFound  = 0;
    private int   $uniqueWritten    = 0;
    private int   $bytesRead        = 0;
    private float $startTime        = 0.0;
    private float $endTime          = 0.0;

    /**
     * Most recent duplicate events for the live detection log (capped at 50).
     *
     * @var array<int, array{lineNumber: int, hash: string, time: string}>
     */
    private array $recentDuplicates = [];

    /** @var callable|null  fn(int $lineNumber, string $shortHash): void */
    private mixed $onDuplicate = null;

    /** @var callable|null  fn(int $bytesRead, int $lineCount): void */
    private mixed $onProgress  = null;

    public function __construct(
        private readonly DedupeConfig      $config,
        private readonly FileStreamer       $streamer,
        private readonly HashStoreInterface $store
    ) {}

    // ── Callback registration ──────────────────────────────────────────────────

    /**
     * Register a callback fired each time a duplicate is detected.
     * Signature: fn(int $lineNumber, string $shortHash): void
     */
    public function onDuplicate(callable $cb): static
    {
        $this->onDuplicate = $cb;
        return $this;
    }

    /**
     * Register a callback fired periodically during streaming for progress updates.
     * Signature: fn(int $bytesRead, int $lineCount): void
     */
    public function onProgress(callable $cb): static
    {
        $this->onProgress = $cb;
        return $this;
    }

    // ── Main processing pipeline ───────────────────────────────────────────────

    /**
     * Run the full deduplication pipeline.
     *
     * Opens the output file, streams every line from the source,
     * and writes only unique lines to the destination.
     *
     * @throws \RuntimeException If the output file cannot be opened for writing.
     */
    public function run(): void
    {
        $outHandle = fopen($this->config->outputPath, 'w');
        if ($outHandle === false) {
            throw new \RuntimeException(
                "Cannot open output file for writing: {$this->config->outputPath}"
            );
        }

        $this->startTime = microtime(true);

        try {
            foreach ($this->streamer->stream() as $chunk) {
                ['raw' => $raw, 'bytesRead' => $bytesRead, 'lineNumber' => $lineNumber] = $chunk;

                $this->totalScanned++;
                $this->bytesRead = $bytesRead;

                $normalised = $this->config->normalise($raw);

                if ($this->store->isDuplicate($normalised)) {
                    $this->duplicatesFound++;

                    // Generate a short display hash (first 7 chars of hex MD5)
                    $shortHash = substr(md5($normalised), 0, 7);

                    $event = [
                        'lineNumber' => $lineNumber,
                        'hash'       => $shortHash,
                        'time'       => date('H:i:s'),
                    ];

                    // Keep a rolling window of the 50 most recent duplicates
                    if (count($this->recentDuplicates) >= 50) {
                        array_shift($this->recentDuplicates);
                    }
                    $this->recentDuplicates[] = $event;

                    if ($this->onDuplicate !== null) {
                        ($this->onDuplicate)($lineNumber, $shortHash);
                    }
                } else {
                    // Unique line: write to output preserving original order
                    fwrite($outHandle, $raw . PHP_EOL);
                    $this->uniqueWritten++;
                }

                // Fire progress callback (throttled by the caller's ProgressBar)
                if ($this->onProgress !== null) {
                    ($this->onProgress)($bytesRead, $this->totalScanned);
                }
            }
        } finally {
            fclose($outHandle);
        }

        $this->endTime = microtime(true);
    }

    // ── Metric accessors ───────────────────────────────────────────────────────

    public function getTotalScanned(): int    { return $this->totalScanned;    }
    public function getDuplicatesFound(): int { return $this->duplicatesFound;  }
    public function getUniqueWritten(): int   { return $this->uniqueWritten;   }
    public function getBytesRead(): int       { return $this->bytesRead;       }

    public function getElapsedSeconds(): float
    {
        return max(0.001, $this->endTime - $this->startTime);
    }

    public function getLinesPerSecond(): int
    {
        return (int) ($this->totalScanned / $this->getElapsedSeconds());
    }

    public function getPeakMemoryMB(): float
    {
        return round(memory_get_peak_usage(true) / 1_048_576, 1);
    }

    /**
     * @return array<int, array{lineNumber: int, hash: string, time: string}>
     */
    public function getRecentDuplicates(): array
    {
        return $this->recentDuplicates;
    }

    /**
     * Human-readable elapsed time string (e.g. "1m 45s" or "32s").
     */
    public function getFormattedElapsed(): string
    {
        $secs = (int) $this->getElapsedSeconds();
        if ($secs < 60) {
            return "{$secs}s";
        }
        $m = intdiv($secs, 60);
        $s = $secs % 60;
        return "{$m}m {$s}s";
    }
}
