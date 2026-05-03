<?php

declare(strict_types=1);

namespace OmniLog\UI;

/**
 * ProgressBar – Live terminal progress bar renderer.
 *
 * Uses carriage return (\r) to overwrite the same terminal line,
 * creating an animated effect without scrolling the terminal.
 *
 * Update frequency is throttled to every $updateEvery lines to avoid
 * the overhead of ANSI escape processing on every single line.
 */
class ProgressBar
{
    private float $startTime;
    private float $lastTick;
    private int   $lastLineCount = 0;
    private int   $barWidth      = 36;
    private int   $updateEvery   = 500;

    public function __construct(
        private readonly int $totalBytes
    ) {
        $this->startTime = microtime(true);
        $this->lastTick  = $this->startTime;
    }

    /**
     * Render or update the progress bar.
     * Only redraws every $updateEvery lines for performance.
     */
    public function tick(int $bytesRead, int $lineCount): void
    {
        if ($lineCount % $this->updateEvery !== 0) {
            return;
        }
        $this->render($bytesRead, $lineCount);
    }

    /**
     * Force a full render regardless of tick interval.
     * Called by tick() internally and directly for the final frame.
     */
    public function render(int $bytesRead, int $lineCount): void
    {
        $now     = microtime(true);
        $elapsed = max(0.001, $now - $this->lastTick);

        $linesDelta   = $lineCount - $this->lastLineCount;
        $linesPerSec  = (int) ($linesDelta / $elapsed);

        $this->lastLineCount = $lineCount;
        $this->lastTick      = $now;

        // Percentage and bar fill
        $percent = $this->totalBytes > 0
            ? min(100, (int) (($bytesRead / $this->totalBytes) * 100))
            : 0;

        $filled = (int) (($percent / 100) * $this->barWidth);
        $empty  = $this->barWidth - $filled;

        $filledBar = Terminal::fg(80, 225, 105, str_repeat('█', $filled));
        $emptyBar  = Terminal::muted(str_repeat('░', $empty));

        $pctLabel   = Terminal::highlight(str_pad("{$percent}%", 4, ' ', STR_PAD_LEFT));
        $byteLabel  = Terminal::cyan(Terminal::formatBytes($bytesRead) . ' Processed');
        $lpsLabel   = Terminal::muted(Terminal::formatNumber($linesPerSec) . ' lines/sec');
        $lineLabel  = Terminal::muted(Terminal::formatNumber($lineCount) . ' lines');

        echo "\r  "
            . Terminal::accent('[')
            . $filledBar
            . $emptyBar
            . Terminal::accent(']')
            . " {$pctLabel} | {$byteLabel} | {$lpsLabel} | {$lineLabel}"
            . '    '; // trailing spaces erase leftover characters
    }

    /**
     * Print the final state of the bar and a completion message.
     */
    public function finish(int $bytesRead, int $lineCount): void
    {
        // Force a 100% render
        $this->lastLineCount = 0;
        $this->render($bytesRead, $lineCount);
        echo "\n";

        $totalSec = round(microtime(true) - $this->startTime, 2);
        echo "  " . Terminal::success('✔ Stream complete')
            . Terminal::muted(" — {$lineCount} lines in {$totalSec}s") . "\n";
    }
}
