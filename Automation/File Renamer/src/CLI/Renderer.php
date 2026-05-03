<?php

declare(strict_types=1);

namespace Phlex\CLI;

/**
 * Component-based ANSI CLI Renderer.
 * Handles header, progress bar, log rows, stats table, and footer.
 * All output goes to STDOUT via echo/print.
 */
final class Renderer
{
    private const WIDTH = 70;

    private float $startTime;

    public function __construct()
    {
        $this->startTime = microtime(true);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Header
    // ────────────────────────────────────────────────────────────────────────

    public function renderHeader(string $target, string $pattern, bool $dryRun): void
    {
        $version = Colors::fromPalette(Colors::BRAND_CYAN, 'PhlexRename v2.0.4');
        $env     = $dryRun
            ? Colors::badge(Colors::BRAND_ORANGE, [15, 15, 15], 'DRY RUN')
            : Colors::badge(Colors::BRAND_GREEN,  [15, 15, 15], 'LIVE');

        echo "\n";
        echo "  {$version}  {$env}\n";
        echo Colors::muted($this->line('─')) . "\n";
        echo '  ' . Colors::muted('Target  : ') . Colors::white($target)  . "\n";
        echo '  ' . Colors::muted('Pattern : ') . Colors::highlight($pattern) . "\n";
        echo Colors::muted($this->line('─')) . "\n\n";

        echo Colors::bold(Colors::fromPalette(Colors::BRAND_BLUE, '  PROCESSING QUEUE')) . "\n\n";
    }

    // ────────────────────────────────────────────────────────────────────────
    // Progress Bar
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Renders a single-line progress bar that overwrites itself (carriage return).
     */
    public function renderProgress(int $current, int $total, string $filename): void
    {
        $barWidth  = 30;
        $pct       = $total > 0 ? (int) round(($current / $total) * 100) : 0;
        $filled    = $total > 0 ? (int) round(($current / $total) * $barWidth) : 0;
        $empty     = $barWidth - $filled;

        $bar  = Colors::fromPalette(Colors::BRAND_CYAN, str_repeat('█', $filled));
        $bar .= Colors::muted(str_repeat('░', $empty));

        $pctLabel = str_pad("{$pct}%", 4, ' ', STR_PAD_LEFT);
        $pctColor = Colors::fromPalette(Colors::BRAND_YELLOW, $pctLabel);

        // Trim filename to fixed width
        $name = mb_strlen($filename) > 24
            ? '…' . mb_substr($filename, -23)
            : str_pad($filename, 24);

        $nameColor = Colors::muted($name);

        // \r returns cursor to line start — no newline, so it overwrites
        echo "\r  [{$bar}] {$pctColor} | {$nameColor}   ";
    }

    /**
     * Call after all files are processed to clear the progress line.
     */
    public function clearProgress(): void
    {
        echo "\r" . str_repeat(' ', self::WIDTH) . "\r";
    }

    // ────────────────────────────────────────────────────────────────────────
    // Log Rows
    // ────────────────────────────────────────────────────────────────────────

    public function renderLogHeader(): void
    {
        echo "\n" . Colors::bold(Colors::fromPalette(Colors::BRAND_BLUE, '  LOGS')) . "\n";
    }

    public function logSuccess(string $from, string $to): void
    {
        $tag = Colors::badge(Colors::BRAND_GREEN, [15, 15, 15], 'SUCCESS');
        echo "  {$tag} " . Colors::muted($from) . ' → ' . Colors::success($to) . "\n";
    }

    public function logConflict(string $from, string $to): void
    {
        $tag = Colors::badge(Colors::BRAND_ORANGE, [15, 15, 15], 'CONFLICT');
        echo "  {$tag} " . Colors::muted($from) . ' → ' . Colors::warning($to) . " (collision resolved)\n";
    }

    public function logError(string $from, string $reason): void
    {
        $tag = Colors::badge(Colors::BRAND_RED, [255, 255, 255], ' ERROR  ');
        echo "  {$tag} " . Colors::muted($from) . ' — ' . Colors::error($reason) . "\n";
    }

    public function logDryRun(string $from, string $to): void
    {
        $tag = Colors::badge(Colors::BRAND_PURPLE, [255, 255, 255], 'DRY-RUN');
        echo "  {$tag} " . Colors::muted($from) . ' → ' . Colors::highlight($to) . "\n";
    }

    public function logSkip(string $from, string $reason): void
    {
        $tag = Colors::badge(Colors::BRAND_DIM, Colors::BRAND_GRAY, ' SKIP  ');
        echo "  {$tag} " . Colors::muted($from) . Colors::dim(" ({$reason})") . "\n";
    }

    // ────────────────────────────────────────────────────────────────────────
    // Stats Table
    // ────────────────────────────────────────────────────────────────────────

    /**
     * @param array{
     *   total: int,
     *   renamed: int,
     *   skipped: int,
     *   conflicts: int,
     *   errors: int
     * } $stats
     */
    public function renderStats(array $stats): void
    {
        $elapsed = round(microtime(true) - $this->startTime, 2);

        echo "\n" . Colors::muted($this->line('─')) . "\n";
        echo Colors::bold(Colors::fromPalette(Colors::BRAND_BLUE, '  STATS')) . "\n";

        $rows = [
            ['Total Scanned',   (string) $stats['total'],     Colors::BRAND_WHITE],
            ['Renamed',         (string) $stats['renamed'],   Colors::BRAND_GREEN],
            ['Skipped',         (string) $stats['skipped'],   Colors::BRAND_GRAY],
            ['Conflicts Fixed', (string) $stats['conflicts'], Colors::BRAND_ORANGE],
            ['Errors',          (string) $stats['errors'],    $stats['errors'] > 0 ? Colors::BRAND_RED : Colors::BRAND_GRAY],
            ['Time Elapsed',    "{$elapsed}s",                Colors::BRAND_CYAN],
        ];

        foreach ($rows as [$label, $value, $color]) {
            $paddedLabel = str_pad("  - {$label}", 26, ' ');
            echo Colors::muted($paddedLabel) . ': '
               . Colors::fromPalette($color, $value) . "\n";
        }

        echo Colors::muted($this->line('═')) . "\n";
    }

    // ────────────────────────────────────────────────────────────────────────
    // Footer
    // ────────────────────────────────────────────────────────────────────────

    public function renderFooter(bool $dryRun, bool $hasManifest): void
    {
        if ($dryRun) {
            echo "\n  " . Colors::fromPalette(Colors::BRAND_YELLOW, '⚡ DRY RUN complete — no files were changed.')
               . "\n  " . Colors::muted("Run without --dry-run to apply changes.") . "\n\n";
            return;
        }

        $done = Colors::fromPalette(Colors::BRAND_GREEN, '✔ DONE!');
        echo "\n  {$done}";

        if ($hasManifest) {
            echo "  " . Colors::muted("Type ") . Colors::highlight("php phlex.php --rollback")
               . Colors::muted(" to revert all changes.");
        }

        echo "\n\n";
    }

    public function renderRollbackHeader(string $manifestFile): void
    {
        $label = Colors::fromPalette(Colors::BRAND_ORANGE, 'PhlexRename v2.0.4');
        $badge = Colors::badge(Colors::BRAND_ORANGE, [15, 15, 15], 'ROLLBACK');

        echo "\n  {$label}  {$badge}\n";
        echo Colors::muted($this->line('─')) . "\n";
        echo '  ' . Colors::muted('Manifest: ') . Colors::white($manifestFile) . "\n";
        echo Colors::muted($this->line('─')) . "\n\n";
    }

    public function logRollback(string $from, string $to): void
    {
        $tag = Colors::badge(Colors::BRAND_CYAN, [15, 15, 15], 'REVERT');
        echo "  {$tag} " . Colors::muted($from) . ' ← ' . Colors::info($to) . "\n";
    }

    public function renderError(string $message): void
    {
        $tag = Colors::badge(Colors::BRAND_RED, [255, 255, 255], ' ERROR ');
        echo "\n  {$tag} " . Colors::error($message) . "\n\n";
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private function line(string $char): string
    {
        return str_repeat($char, self::WIDTH);
    }
}
