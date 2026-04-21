<?php

declare(strict_types=1);

namespace DailyQuote\Storage;

use DailyQuote\Exception\DuplicateQuoteException;
use DailyQuote\Exception\StorageException;
use DailyQuote\Model\Quote;
use DailyQuote\Service\Logger;

/**
 * StorageHandler — persists quotes to text and JSON, with duplicate prevention.
 */
final class StorageHandler
{
    private readonly string $outputDir;

    public function __construct(
        private readonly string $rootDir,
        private readonly Logger $logger,
    ) {
        $this->outputDir = $rootDir . DIRECTORY_SEPARATOR .
            str_replace('/', DIRECTORY_SEPARATOR, $_ENV['OUTPUT_DIR'] ?? 'storage/output');
    }

    // ── Directory bootstrap ────────────────────────────────────────────────

    /**
     * Ensure all required storage directories exist.
     *
     * @throws StorageException
     */
    public function ensureDirectories(): void
    {
        $dirs = [
            $this->outputDir,
            $this->rootDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $_ENV['LOG_DIR'] ?? 'storage/logs'),
            $this->rootDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $_ENV['HTML_OUTPUT_DIR'] ?? 'storage/html'),
        ];

        foreach ($dirs as $dir) {
            if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
                throw new StorageException("Cannot create directory: {$dir}");
            }
        }
    }

    // ── Persistence ────────────────────────────────────────────────────────

    /**
     * Save quote to a dated .txt file.
     *
     * @return string Absolute path of saved file
     * @throws DuplicateQuoteException if today's file already exists
     * @throws StorageException on write failure
     */
    public function saveText(Quote $quote): string
    {
        $filename = 'quote-' . $quote->fetchedAt->format('Y-m-d') . '.txt';
        $path     = $this->outputDir . DIRECTORY_SEPARATOR . $filename;

        $this->assertNotDuplicate($path, 'text');

        $written = file_put_contents($path, $quote->toText(), LOCK_EX);

        if ($written === false) {
            throw new StorageException("Failed to write text file: {$path}");
        }

        $this->logger->info('Text file written', ['path' => $path, 'bytes' => $written]);

        return $path;
    }

    /**
     * Save quote to a dated .json file.
     *
     * @return string Absolute path of saved file
     * @throws DuplicateQuoteException if today's file already exists
     * @throws StorageException on write failure
     */
    public function saveJson(Quote $quote): string
    {
        $filename = 'quote-' . $quote->fetchedAt->format('Y-m-d') . '.json';
        $path     = $this->outputDir . DIRECTORY_SEPARATOR . $filename;

        $this->assertNotDuplicate($path, 'JSON');

        $payload = [
            'meta' => [
                'generator' => 'DailyQuoteFetcher/1.0',
                'generated' => date(\DateTimeInterface::ATOM),
                'schema'    => '1.0',
            ],
            'quote' => $quote->toArray(),
        ];

        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            throw new StorageException('JSON encoding failed: ' . json_last_error_msg());
        }

        $written = file_put_contents($path, $json, LOCK_EX);

        if ($written === false) {
            throw new StorageException("Failed to write JSON file: {$path}");
        }

        $this->logger->info('JSON file written', ['path' => $path, 'bytes' => $written]);

        return $path;
    }

    // ── Private ────────────────────────────────────────────────────────────

    /**
     * @throws DuplicateQuoteException
     */
    private function assertNotDuplicate(string $path, string $type): void
    {
        if (file_exists($path)) {
            throw new DuplicateQuoteException(
                "Today's {$type} quote already saved — skipping to prevent duplicates."
            );
        }
    }
}
