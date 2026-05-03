<?php

declare(strict_types=1);

namespace DedupeCLI\UI;

/**
 * ProgressBar – Live, self-overwriting terminal progress bar.
 *
 * Uses carriage return (\r) to rewrite the SAME terminal line on each
 * update, producing a smooth animation without scrolling the output.
 * A throttle mechanism (updateInterval) limits redraws to every N lines,
 * preventing ANSI escape overhead from becoming the bottleneck on fast SSDs.
 *
 * Internally tracks a sliding window of lines-per-second by comparing
 * the current line count to the count from the previous tick, divided
 * by the elapsed wall-clock time between ticks.
 */
class ProgressBar
{
    private float $startTime;
    private float $lastTickTime;
    private int   $lastTickLines  = 0;
    private int   $barWidth       = 32;

    public function __construct(
        private readonly int $totalBytes,
        private readonly int $updateInterval = 1_000
    ) {
        $this->startTime    = microtime(true);
        $this->lastTickTime = $this->startTime;
    }

    /**
     * Conditionally redraw the bar (only every $updateInterval lines).
     * Called inside the tight processing loop for maximum performance.
     */
    public function tick(int $bytesRead, int $lineCount): void
    {
        if ($lineCount % $this->updateInterval !== 0) {
            return;
        }
        $this->render($bytesRead, $lineCount);
    }

    /**
     * Render (or re-render) the progress bar unconditionally.
     * Uses \r to overwrite the current terminal line.
     */
    public function render(int $bytesRead, int $lineCount): void
    {
        $now     = microtime(true);
        $elapsed = max(0.001, $now - $this->lastTickTime);

        $linesDelta  = $lineCount - $this->lastTickLines;
        $linesPerSec = (int) ($linesDelta / $elapsed);

        $this->lastTickLines = $lineCount;
        $this->lastTickTime  = $now;

        // ── Percentage & bar fill ────────────────────────────────────────────
        $percent = $this->totalBytes > 0
            ? min(100, (int) (($bytesRead / $this->totalBytes) * 100))
            : 0;

        $filled    = (int) (($percent / 100) * $this->barWidth);
        $empty     = $this->barWidth - $filled;
        $filledBar = Terminal::fg(139, 92, 246, str_repeat('█', $filled));
        $emptyBar  = Terminal::muted(str_repeat('░', $empty));

        // ── Labels ──────────────────────────────────────────────────────────
        $pctStr = Terminal::highlight(str_pad("{$percent}%", 4, ' ', STR_PAD_LEFT));
        $memMB  = round(memory_get_usage(true) / 1_048_576, 1);
        $memStr = Terminal::memColour($memMB);
        $lpsStr = Terminal::cyan(number_format($linesPerSec) . ' lines/sec');

        echo "\r  "
            . Terminal::muted('[')
            . $filledBar
            . $emptyBar
            . Terminal::muted(']')
            . " {$pctStr} | Memory: {$memStr} | {$lpsStr}"
            . '          '; // trailing spaces erase leftover characters
    }

    /**
     * Print the final 100% bar and move to a new line.
     * Call this after the processing loop completes.
     */
    public function finish(int $bytesRead, int $lineCount): void
    {
        // Force one last render showing 100%
        $this->lastTickLines = 0;
        $this->render($bytesRead, $lineCount);
        echo "\n";
    }
}
