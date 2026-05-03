<?php

declare(strict_types=1);

namespace Phlex\Safety;

use RuntimeException;

/**
 * Writes a per-session JSON manifest recording every rename operation.
 * This manifest powers the RollbackEngine.
 *
 * Manifest format (array of objects):
 * [
 *   { "from": "/abs/path/original.jpg", "to": "/abs/path/renamed.jpg", "ts": 1714521600 },
 *   ...
 * ]
 */
final class ManifestWriter
{
    private readonly string $manifestPath;

    /** @var list<array{from: string, to: string, ts: int}> */
    private array $entries = [];

    private bool $finalized = false;

    public function __construct(private readonly string $sessionDir)
    {
        if (!is_dir($sessionDir)) {
            if (!mkdir($sessionDir, 0755, true) && !is_dir($sessionDir)) {
                throw new RuntimeException("Cannot create sessions directory: {$sessionDir}");
            }
        }

        $timestamp          = date('Ymd_His');
        $this->manifestPath = $sessionDir . DIRECTORY_SEPARATOR . "manifest_{$timestamp}.json";
    }

    /**
     * Record a single successful rename.
     */
    public function record(string $fromPath, string $toPath): void
    {
        $this->entries[] = [
            'from' => $fromPath,
            'to'   => $toPath,
            'ts'   => time(),
        ];
    }

    /**
     * Write all recorded entries to the JSON manifest file.
     * Safe to call multiple times — will overwrite previous writes.
     */
    public function flush(): void
    {
        if (empty($this->entries)) {
            return;
        }

        $json = json_encode($this->entries, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($json === false) {
            throw new RuntimeException('Failed to encode manifest to JSON.');
        }

        if (file_put_contents($this->manifestPath, $json) === false) {
            throw new RuntimeException("Failed to write manifest: {$this->manifestPath}");
        }
    }

    /**
     * Finalize the manifest (flush + mark done).
     */
    public function finalize(): void
    {
        if ($this->finalized) {
            return;
        }

        $this->flush();
        $this->finalized = true;
    }

    public function getManifestPath(): string
    {
        return $this->manifestPath;
    }

    public function hasEntries(): bool
    {
        return !empty($this->entries);
    }

    public function count(): int
    {
        return count($this->entries);
    }
}
