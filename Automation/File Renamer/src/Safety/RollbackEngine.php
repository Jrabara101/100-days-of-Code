<?php

declare(strict_types=1);

namespace Phlex\Safety;

use Phlex\CLI\Renderer;
use RuntimeException;

/**
 * Reads a session manifest JSON file and reverses all rename operations.
 * Entries are processed in reverse order so deeply nested renames
 * are undone last (LIFO).
 */
final class RollbackEngine
{
    public function __construct(
        private readonly Renderer $renderer,
        private readonly string   $sessionDir,
    ) {}

    /**
     * Execute the rollback.
     *
     * @param string|null $specificManifest Absolute path to a specific manifest file.
     *                                      If null, the most recent session manifest is used.
     */
    public function run(?string $specificManifest = null): void
    {
        $manifestPath = $specificManifest ?? $this->findLatestManifest();

        $this->renderer->renderRollbackHeader($manifestPath);

        $entries = $this->loadManifest($manifestPath);

        if (empty($entries)) {
            $this->renderer->renderError('Manifest is empty — nothing to roll back.');
            return;
        }

        // Process in reverse (LIFO)
        $reversed = array_reverse($entries);

        $reverted = 0;
        $errors   = 0;

        foreach ($reversed as $entry) {
            $from = $entry['to']   ?? null;  // the renamed file (current name)
            $to   = $entry['from'] ?? null;  // the original name

            if (!is_string($from) || !is_string($to)) {
                $errors++;
                continue;
            }

            try {
                if (!file_exists($from)) {
                    throw new RuntimeException("File not found (already moved?): {$from}");
                }

                if (file_exists($to)) {
                    throw new RuntimeException("Target already exists — cannot overwrite: {$to}");
                }

                if (!rename($from, $to)) {
                    throw new RuntimeException("rename() returned false.");
                }

                $this->renderer->logRollback(
                    basename($from),
                    basename($to),
                );
                $reverted++;
            } catch (\Throwable $e) {
                $this->renderer->logError(basename((string) $from), $e->getMessage());
                $errors++;
            }
        }

        // Stats
        $this->renderer->renderStats([
            'total'     => count($entries),
            'renamed'   => $reverted,
            'skipped'   => 0,
            'conflicts' => 0,
            'errors'    => $errors,
        ]);

        // Rename the manifest so it's not used again
        if (file_exists($manifestPath)) {
            $usedPath = $manifestPath . '.used';
            rename($manifestPath, $usedPath);
        }

        $this->renderer->renderFooter(false, false);
    }

    /**
     * Find the most recently created manifest file in the session directory.
     *
     * @throws RuntimeException if no manifests are found.
     */
    private function findLatestManifest(): string
    {
        if (!is_dir($this->sessionDir)) {
            throw new RuntimeException(
                "Sessions directory not found: {$this->sessionDir}\n" .
                "  Have you run a rename session yet?"
            );
        }

        $files = glob($this->sessionDir . DIRECTORY_SEPARATOR . 'manifest_*.json');

        if (empty($files)) {
            throw new RuntimeException(
                "No manifest files found in: {$this->sessionDir}\n" .
                "  Nothing to roll back."
            );
        }

        // Sort by filename (timestamp-based names sort chronologically)
        usort($files, static fn($a, $b) => strcmp($b, $a));

        return $files[0];
    }

    /**
     * Load and decode a manifest JSON file.
     *
     * @return list<array{from: string, to: string, ts: int}>
     * @throws RuntimeException on read or parse failure.
     */
    private function loadManifest(string $path): array
    {
        if (!file_exists($path)) {
            throw new RuntimeException("Manifest file not found: {$path}");
        }

        $json = file_get_contents($path);

        if ($json === false) {
            throw new RuntimeException("Cannot read manifest file: {$path}");
        }

        $data = json_decode($json, true);

        if (!is_array($data)) {
            throw new RuntimeException("Invalid manifest JSON in: {$path}");
        }

        return $data;
    }
}
