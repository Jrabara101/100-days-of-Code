<?php

declare(strict_types=1);

namespace PromoForge\UI;

class CliProgressRenderer
{
    private int $barWidth = 30;

    public function renderHeader(string $campaignName, string $format, int $batchSize, string $exportPath): void
    {
        echo AnsiStyle::format("PromoForge v3.1.0  [Engine: PHP 8.2 | CSPRNG: Active]\n", AnsiStyle::BOLD, AnsiStyle::CYAN);
        echo str_repeat('=', 70) . "\n";
        echo AnsiStyle::format("[ CAMPAIGN CONFIGURATION ]\n", AnsiStyle::BOLD, AnsiStyle::YELLOW);
        echo "Format      : " . AnsiStyle::format($format, AnsiStyle::WHITE) . "\n";
        echo "Pool        : Base32 (Ambiguous chars removed)\n";
        echo "Batch Size  : " . number_format($batchSize) . " codes\n";
        echo "Export      : " . AnsiStyle::format($exportPath, AnsiStyle::DIM) . "\n\n";
        echo AnsiStyle::format("[ GENERATION IN PROGRESS ]\n", AnsiStyle::BOLD, AnsiStyle::YELLOW);
    }

    public function renderProgress(int $current, int $total, float $startTime, int $collisions): void
    {
        $percent = $current / $total;
        $filledBlocks = (int) round($percent * $this->barWidth);
        $emptyBlocks = $this->barWidth - $filledBlocks;

        $bar = str_repeat('█', $filledBlocks) . str_repeat('░', $emptyBlocks);
        $percentStr = str_pad((string) round($percent * 100), 3, ' ', STR_PAD_LEFT);
        
        $elapsed = microtime(true) - $startTime;
        $speed = $elapsed > 0 ? (int) ($current / $elapsed) : 0;

        $formattedCurrent = number_format($current);
        $formattedTotal = number_format($total);
        $formattedSpeed = number_format($speed);
        $formattedCollisions = number_format($collisions);

        // \r returns cursor to beginning of line, allowing rewrite
        echo "\r[" . AnsiStyle::format($bar, AnsiStyle::GREEN) . "] {$percentStr}% | {$formattedCurrent} / {$formattedTotal} ";
        echo "\n\033[1A"; // Move cursor up one line to keep printing on the same two lines
        
        // Ensure we clear the rest of the second line
        $speedLine = "Speed: {$formattedSpeed} codes/sec | Collisions Prevented: {$formattedCollisions}";
        echo "\n\r" . str_pad($speedLine, 70, ' ');
        echo "\033[1A"; // Move back up again
        
        if ($current === $total) {
            echo "\n\n"; // Finalize progress bar area
        }
    }

    public function renderSummary(array $samples, int $total, string $fileSize, float $executionTime, string $peakMemory): void
    {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo AnsiStyle::format("[ SAMPLE OUTPUT ]\n", AnsiStyle::BOLD, AnsiStyle::YELLOW);
        foreach ($samples as $sample) {
            echo "> " . AnsiStyle::format($sample, AnsiStyle::CYAN) . "\n";
        }

        echo "\n" . str_repeat('-', 70) . "\n";
        echo AnsiStyle::format("[ CAMPAIGN SUMMARY ]\n", AnsiStyle::BOLD, AnsiStyle::YELLOW);
        echo "Total Generated : " . number_format($total) . "\n";
        echo "Uniqueness      : 100.00% Guaranteed\n";
        echo "Checksum Logic  : Modulo 31 Custom Hash\n";
        echo "File Size       : {$fileSize}\n\n";

        echo str_repeat('=', 70) . "\n";
        
        $execStr = number_format($executionTime, 1);
        echo "⏱ Execution Time: {$execStr}s | Peak RAM: {$peakMemory}\n";
        echo AnsiStyle::format("[SUCCESS] Batch securely written to disk.\n", AnsiStyle::BOLD, AnsiStyle::GREEN);
    }
}
