<?php

declare(strict_types=1);

namespace SearchLens;

class CliRenderer
{
    private const COLOR_RESET = "\e[0m";
    private const COLOR_GREEN = "\e[32m";
    private const COLOR_RED_BG = "\e[41m\e[97m"; // Red background, bright white text
    private const COLOR_YELLOW = "\e[33m";
    private const COLOR_CYAN = "\e[36m";
    private const COLOR_GRAY = "\e[90m";

    public function renderHeader(Config $config): void
    {
        $mode = $config->isRegex ? 'Regex Search' : 'Exact Search';
        $filters = implode(', ', $config->ignoredPaths);

        echo "SearchLens v2.0.1  [Engine: PHP " . PHP_VERSION . " | Mode: $mode]\n";
        echo str_repeat("=", 70) . "\n";
        echo "Target      : {$config->targetDirectory}\n";
        echo "Query       : {$config->query}\n";
        echo "Filters     : Ignored: [$filters]\n\n";
    }

    public function renderProgress(int $scanned): void
    {
        // Simple carriage return to overwrite line
        // Using a static bar for now to avoid complex terminal manipulation
        // In a real TTY we would calculate percentage, but we don't know total files easily
        // Output something similar to the requested plaintext layout
        echo "\r[SCANNING IN PROGRESS] \e[32m" . number_format($scanned) . " files scanned\e[0m  ";
    }

    public function renderMatchesHeader(): void
    {
        echo "\n\n" . str_repeat("=", 70) . "\n";
        echo "MATCHES FOUND\n";
        echo str_repeat("-", 70) . "\n";
    }

    public function renderFileMatches(array $fileMatchResult): void
    {
        $file = $fileMatchResult['file']->getPathname();
        echo "📄 " . self::COLOR_CYAN . $file . self::COLOR_RESET . "\n";

        foreach ($fileMatchResult['matches'] as $match) {
            // Print Before context
            foreach ($match['before'] as $bLine) {
                printf(self::COLOR_GRAY . "  %4d | %s" . self::COLOR_RESET . "\n", $bLine['line_number'], $bLine['content']);
            }

            // Print Matched line with highlight
            $content = $match['content'];
            $start = $match['start'];
            $length = $match['length'];
            
            $before = substr($content, 0, $start);
            $highlighted = substr($content, $start, $length);
            $after = substr($content, $start + $length);

            printf(self::COLOR_YELLOW . "> %4d | " . self::COLOR_RESET . "%s%s%s%s%s\n", 
                $match['line'], 
                $before, 
                self::COLOR_RED_BG, 
                $highlighted, 
                self::COLOR_RESET, 
                $after
            );

            // Print After context
            foreach ($match['after'] as $aLine) {
                printf(self::COLOR_GRAY . "  %4d | %s" . self::COLOR_RESET . "\n", $aLine['line_number'], $aLine['content']);
            }
            
            echo "\n";
        }
    }

    public function renderSummary(int $totalScanned, int $filesWithMatches, int $totalMatches, float $executionTime): void
    {
        $peakMemory = memory_get_peak_usage(true) / 1024 / 1024;

        echo str_repeat("=", 70) . "\n";
        echo "SEARCH SUMMARY\n";
        echo str_repeat("-", 70) . "\n";
        echo "Total Files Scanned : " . number_format($totalScanned) . "\n";
        echo "Files with Matches  : " . number_format($filesWithMatches) . "\n";
        echo "Total Matches       : " . number_format($totalMatches) . "\n";
        printf("Peak RAM Usage      : %.1f MB\n", $peakMemory);
        printf("Execution Time      : %.2fs\n", $executionTime);
        echo str_repeat("=", 70) . "\n";
    }
}
