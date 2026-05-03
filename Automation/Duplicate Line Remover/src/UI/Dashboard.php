<?php

declare(strict_types=1);

namespace DedupeCLI\UI;

use DedupeCLI\Config\DedupeConfig;
use DedupeCLI\Engine\DeduplicationEngine;

/**
 * Dashboard – Orchestrates all CLI visual output for DedupeCLI.
 *
 * This class is responsible for ONLY the visual layout and rendering.
 * It receives data from the engine and config, but never touches files
 * or performs any deduplication logic. (Single Responsibility Principle)
 *
 * Sections rendered:
 *   1. banner()          – App title + version bar
 *   2. fileInfo()        – Source/output paths and rule badges
 *   3. sectionHeader()   – Titled section separators
 *   4. liveDetectionLog()– Scrolling list of recent duplicate events
 *   5. summary()         – Final statistics table
 *   6. helpScreen()      – Usage instructions
 */
class Dashboard
{
    private const VERSION  = '1.2.0';
    private const WIDTH    = 70;

    public function __construct(
        private readonly DedupeConfig $config
    ) {}

    // ── Section 1: Banner ──────────────────────────────────────────────────────

    public function banner(): void
    {
        $phpVersion = PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;
        $version    = self::VERSION;
        $mode       = $this->config->useBloomFilter ? 'Bloom Filter' : 'MD5 HashSet';

        echo "\n";
        echo '  ' . Terminal::rule(self::WIDTH) . "\n";
        echo '  '
            . Terminal::accent("DedupeCLI v{$version}")
            . Terminal::muted('  [Engine: ')
            . Terminal::cyan("PHP {$phpVersion}")
            . Terminal::muted(' | Mode: ')
            . Terminal::gold($mode)
            . Terminal::muted(']')
            . "\n";
        echo '  ' . Terminal::rule(self::WIDTH) . "\n";
    }

    // ── Section 2: File info header ────────────────────────────────────────────

    public function fileInfo(int $sourceBytes): void
    {
        $srcLabel  = Terminal::muted('Source File : ');
        $srcPath   = Terminal::cyan($this->config->inputPath);
        $srcSize   = Terminal::muted(' (' . Terminal::bytes($sourceBytes) . ')');
        $outLabel  = Terminal::muted('Output File : ');
        $outPath   = Terminal::green($this->config->outputPath);

        echo "  {$srcLabel}{$srcPath}{$srcSize}\n";
        echo "  {$outLabel}{$outPath}\n";

        // Rules line
        echo '  ' . Terminal::muted('Rules       : ');
        $rules = $this->config->rulesDisplay();
        $parts = [];
        foreach ($rules as $label => $state) {
            $parts[] = Terminal::badge($label, $state === 'ON');
        }
        echo implode(Terminal::muted('  |  '), $parts) . "\n";
        echo '  ' . Terminal::rule(self::WIDTH) . "\n\n";
    }

    // ── Section 3: Section header ──────────────────────────────────────────────

    public function sectionHeader(string $title): void
    {
        echo '  ' . Terminal::accent('[' . $title . ']') . "\n";
    }

    // ── Section 4: Live detection log ─────────────────────────────────────────

    /**
     * Print any new duplicate events that arrived since the last call.
     * Clears the lines by using cursor-up (ESC[A) and \r to overwrite.
     *
     * For simplicity in a CLI context, this is a rolling append (not
     * an in-place update), since the progress bar already occupies the
     * most recent terminal line.
     */
    public function printDuplicateEvent(int $lineNumber, string $shortHash): void
    {
        $time     = Terminal::muted('[' . date('H:i:s') . ']');
        $lineNum  = Terminal::highlight(number_format($lineNumber));
        $hashDisp = Terminal::dupe("#{$shortHash}…");

        echo "\n  {$time} " . Terminal::dupe('Duplicate Found') . " (Line {$lineNum}) " . Terminal::muted('→ Hash: ') . $hashDisp;
    }

    // ── Section 5: Final summary table ────────────────────────────────────────

    public function summary(DeduplicationEngine $engine, int $sourceBytes): void
    {
        $w = self::WIDTH;

        echo "\n\n  " . Terminal::rule($w) . "\n";
        echo '  ' . Terminal::bold(Terminal::accent('DEDUPLICATION SUMMARY')) . "\n";
        echo '  ' . Terminal::thinRule($w) . "\n\n";

        $rows = [
            ['Total Lines Scanned', Terminal::num($engine->getTotalScanned())],
            ['Unique Lines Saved',  Terminal::num($engine->getUniqueWritten())],
            ['Duplicates Removed',  Terminal::dupe(Terminal::num($engine->getDuplicatesFound()))],
        ];

        // File size reduction
        $outputBytes = is_file($this->config->outputPath)
            ? (int) filesize($this->config->outputPath)
            : 0;
        $savedBytes  = max(0, $sourceBytes - $outputBytes);
        $rows[]      = ['File Size Reduction', Terminal::green(Terminal::bytes($savedBytes) . ' Saved')];

        echo "\n";
        foreach ($rows as [$label, $value]) {
            echo '  ' . Terminal::muted(str_pad($label, 24) . ' : ') . $value . "\n";
        }

        echo "\n  " . Terminal::thinRule($w) . "\n";

        $peakMem = $engine->getPeakMemoryMB();
        $elapsed = $engine->getFormattedElapsed();
        $lps     = number_format($engine->getLinesPerSecond());

        echo '  ' . Terminal::muted(str_pad('Peak RAM Usage',    24) . ' : ') . Terminal::memColour($peakMem) . "\n";
        echo '  ' . Terminal::muted(str_pad('Processing Speed',  24) . ' : ') . Terminal::cyan("{$lps} lines/sec") . "\n";
        echo '  ' . Terminal::muted(str_pad('Execution Time',    24) . ' : ') . Terminal::gold($elapsed) . "\n\n";

        echo '  ' . Terminal::rule($w) . "\n\n";

        // Output path confirmation
        echo '  ' . Terminal::success('✔ Clean file written → ') . Terminal::highlight($this->config->outputPath) . "\n\n";
    }

    // ── Section 6: Help screen ────────────────────────────────────────────────

    public static function helpScreen(): void
    {
        $w = 70;

        echo "\n  " . Terminal::rule($w) . "\n";
        echo '  ' . Terminal::accent('DedupeCLI v' . self::VERSION) . '  '
            . Terminal::muted('High-Efficiency Duplicate Line Eliminator') . "\n";
        echo '  ' . Terminal::rule($w) . "\n\n";

        echo '  ' . Terminal::accent('USAGE') . "\n";
        echo '  ' . Terminal::thinRule($w) . "\n";
        echo '  ' . Terminal::highlight('php dedupe.php') . Terminal::cyan(' --input=<path>') . Terminal::muted(' [options]') . "\n\n";

        echo '  ' . Terminal::accent('OPTIONS') . "\n";
        echo '  ' . Terminal::thinRule($w) . "\n";

        $flags = [
            ['--input=<path>',         'required', 'Source file to deduplicate'],
            ['--output=<path>',        'optional', 'Output path (default: <input>_clean.<ext>)'],
            ['--ignore-case',          'optional', 'Case-insensitive matching'],
            ['--trim-whitespace',      'optional', 'Trim leading/trailing spaces before comparing'],
            ['--bloom',                'optional', 'Use Bloom filter (ultra-low RAM, slight FP risk)'],
            ['--bloom-capacity=<n>',   'optional', 'Expected unique lines for Bloom filter (default: 50M)'],
            ['--bloom-error=<rate>',   'optional', 'Bloom false-positive rate 0.0–1.0 (default: 0.001)'],
            ['--no-color',             'optional', 'Disable ANSI colour output'],
            ['--help',                 'optional', 'Show this help screen'],
        ];

        foreach ($flags as [$flag, $req, $desc]) {
            $flagStr = Terminal::cyan(str_pad($flag, 26));
            $reqStr  = $req === 'required'
                ? Terminal::error('[required]')
                : Terminal::muted('[optional]');
            echo "  {$flagStr} {$reqStr}  {$desc}\n";
        }

        echo "\n  " . Terminal::accent('EXAMPLES') . "\n";
        echo '  ' . Terminal::thinRule($w) . "\n";
        echo '  ' . Terminal::muted('# Remove duplicate lines (default strict match)') . "\n";
        echo '  ' . Terminal::highlight('php dedupe.php') . ' --input=data/records.csv' . "\n\n";
        echo '  ' . Terminal::muted('# Case-insensitive + whitespace-tolerant deduplication') . "\n";
        echo '  ' . Terminal::highlight('php dedupe.php') . ' --input=emails.txt --ignore-case --trim-whitespace' . "\n\n";
        echo '  ' . Terminal::muted('# Ultra-scale 50 GB file with Bloom filter (< 100 MB RAM)') . "\n";
        echo '  ' . Terminal::highlight('php dedupe.php') . ' --input=dump.sql --output=dump_clean.sql --bloom --bloom-capacity=200000000' . "\n\n";
        echo '  ' . Terminal::rule($w) . "\n\n";
    }
}
