<?php

declare(strict_types=1);

namespace Phlex\Core;

use Phlex\CLI\Renderer;
use Phlex\Parser\PatternParser;
use Phlex\Renamers\RenamerFactory;
use Phlex\Safety\ManifestWriter;
use Phlex\Safety\RollbackEngine;
use Phlex\Security\PathSanitizer;
use SplFileInfo;
use Throwable;

/**
 * Main application orchestrator.
 * Wires together all components and drives the rename pipeline.
 */
final class Application
{
    private Renderer       $renderer;
    private PatternParser  $parser;
    private ManifestWriter $manifest;
    private PathSanitizer  $sanitizer;

    /** @var array{total: int, renamed: int, skipped: int, conflicts: int, errors: int} */
    private array $stats = [
        'total'     => 0,
        'renamed'   => 0,
        'skipped'   => 0,
        'conflicts' => 0,
        'errors'    => 0,
    ];

    public function __construct(private readonly Config $config)
    {
        $this->renderer = new Renderer();
        $this->parser   = new PatternParser();
    }

    /**
     * Main entry point. Dispatches to rollback or rename pipeline.
     */
    public function run(): int
    {
        try {
            if ($this->config->rollback) {
                return $this->runRollback();
            }

            return $this->runRename();
        } catch (Throwable $e) {
            $this->renderer->renderError($e->getMessage());
            return 1;
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Rollback pipeline
    // ────────────────────────────────────────────────────────────────────────

    private function runRollback(): int
    {
        $sessionsDir = $this->resolveSessionsDir();
        $engine      = new RollbackEngine($this->renderer, $sessionsDir);
        $engine->run($this->config->rollbackFile);
        return 0;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Rename pipeline
    // ────────────────────────────────────────────────────────────────────────

    private function runRename(): int
    {
        // ── Security: validate target path ───────────────────────────────────
        $this->sanitizer = new PathSanitizer($this->config->target);
        $rootDir         = $this->sanitizer->getRoot();

        // ── Manifest ─────────────────────────────────────────────────────────
        $sessionsDir    = $this->resolveSessionsDir();
        $this->manifest = new ManifestWriter($sessionsDir);

        // ── Header ───────────────────────────────────────────────────────────
        $this->renderer->renderHeader(
            $rootDir,
            $this->config->pattern,
            $this->config->dryRun,
        );

        // ── Scanner ──────────────────────────────────────────────────────────
        $scanner = new FileScanner($rootDir, $this->config->recursive);
        $scanner->skipExtensions(['json']); // Never rename our own manifests

        // Count total for progress bar (second pass is cheap via generator reset)
        $total = $scanner->count();

        // ── Factory ──────────────────────────────────────────────────────────
        $factory = new RenamerFactory($this->parser, $this->config->pattern);

        // ── Pre-validation pass ───────────────────────────────────────────────
        // Ensures the target directory is writable before touching any files.
        if (!is_writable($rootDir)) {
            throw new \RuntimeException("Target directory is not writable: {$rootDir}");
        }

        // ── Log header ───────────────────────────────────────────────────────
        $this->renderer->renderLogHeader();

        // ── Main rename loop ─────────────────────────────────────────────────
        $index = 0;

        foreach ($scanner->scan() as $file) {
            $index++;
            $this->stats['total']++;

            // Progress bar (overwrites line)
            $this->renderer->renderProgress($index, $total, $file->getFilename());

            $this->processFile($file, $index, $factory, $rootDir);

            // Flush manifest incrementally every 100 files (resilience)
            if ($index % 100 === 0) {
                $this->manifest->flush();
            }
        }

        // Clear progress bar line
        $this->renderer->clearProgress();

        // ── Finalize manifest ─────────────────────────────────────────────────
        if (!$this->config->dryRun) {
            $this->manifest->finalize();
        }

        // ── Stats & footer ────────────────────────────────────────────────────
        $this->renderer->renderStats($this->stats);
        $this->renderer->renderFooter(
            $this->config->dryRun,
            !$this->config->dryRun && $this->manifest->hasEntries(),
        );

        return $this->stats['errors'] > 0 ? 1 : 0;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Per-file processing  (atomic: failure of one never corrupts others)
    // ────────────────────────────────────────────────────────────────────────

    private function processFile(
        SplFileInfo    $file,
        int            $index,
        RenamerFactory $factory,
        string         $rootDir,
    ): void {
        try {
            // ── Build new name ────────────────────────────────────────────
            $strategy = $factory->make($file);
            $newName  = $strategy->buildNewName($file, $index);

            // Skip if name didn't change
            if ($newName === $file->getFilename()) {
                $this->stats['skipped']++;
                if ($this->config->verbose) {
                    $this->renderer->logSkip($file->getFilename(), 'no change');
                }
                return;
            }

            // ── Build target path ─────────────────────────────────────────
            $targetPath = $file->getPath() . DIRECTORY_SEPARATOR . $newName;

            // ── Security check on target ──────────────────────────────────
            $this->sanitizer->validate($targetPath);

            // ── Collision prevention ──────────────────────────────────────
            $hadCollision = false;

            if (file_exists($targetPath)) {
                $targetPath   = $this->resolveCollision($targetPath);
                $newName      = basename($targetPath);
                $hadCollision = true;
                $this->stats['conflicts']++;
            }

            // ── Dry run — print and return ─────────────────────────────────
            if ($this->config->dryRun) {
                if ($hadCollision) {
                    $this->renderer->logConflict($file->getFilename(), $newName);
                } else {
                    $this->renderer->logDryRun($file->getFilename(), $newName);
                }
                return;
            }

            // ── Actual rename ─────────────────────────────────────────────
            if (!rename($file->getPathname(), $targetPath)) {
                throw new \RuntimeException("rename() call failed.");
            }

            // ── Record in manifest ────────────────────────────────────────
            $this->manifest->record($file->getPathname(), $targetPath);
            $this->stats['renamed']++;

            if ($hadCollision) {
                $this->renderer->logConflict($file->getFilename(), $newName);
            } else {
                $this->renderer->logSuccess($file->getFilename(), $newName);
            }
        } catch (Throwable $e) {
            $this->stats['errors']++;
            $this->renderer->logError(
                $file->getFilename(),
                $e->getMessage(),
            );
            // Atomic: log and continue — do NOT rethrow
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Collision resolution
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Append incrementing numeric suffix until a free filename is found.
     * E.g.: photo.jpg → photo_1.jpg → photo_2.jpg …
     */
    private function resolveCollision(string $path): string
    {
        $dir  = dirname($path);
        $ext  = pathinfo($path, PATHINFO_EXTENSION);
        $base = pathinfo($path, PATHINFO_FILENAME);

        $i = 1;
        do {
            $candidate = $dir . DIRECTORY_SEPARATOR . "{$base}_{$i}" . ($ext ? ".{$ext}" : '');
            $i++;
        } while (file_exists($candidate) && $i < 10_000);

        return $candidate;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private function resolveSessionsDir(): string
    {
        // Sessions dir lives next to phlex.php entry point
        return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'sessions';
    }
}
