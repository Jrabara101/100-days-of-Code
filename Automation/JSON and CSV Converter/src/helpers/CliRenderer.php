<?php

/**
 * CliRenderer.php
 * 
 * Handles all CLI UI rendering:
 * - ANSI color codes for success, error, warning
 * - Formatted boxes, separators, titles
 * - Interactive prompts and loading messages
 */

class CliRenderer
{
    // ─────────────────────────────────────────
    //   ANSI Color Constants
    // ─────────────────────────────────────────
    const RESET   = "\033[0m";
    const BOLD    = "\033[1m";
    const DIM     = "\033[2m";

    const BLACK   = "\033[30m";
    const RED     = "\033[31m";
    const GREEN   = "\033[32m";
    const YELLOW  = "\033[33m";
    const BLUE    = "\033[34m";
    const MAGENTA = "\033[35m";
    const CYAN    = "\033[36m";
    const WHITE   = "\033[37m";

    const BG_BLACK   = "\033[40m";
    const BG_GREEN   = "\033[42m";
    const BG_YELLOW  = "\033[43m";
    const BG_BLUE    = "\033[44m";
    const BG_MAGENTA = "\033[45m";
    const BG_CYAN    = "\033[46m";
    const BG_RED     = "\033[41m";

    // ─────────────────────────────────────────
    //   Screen Controls
    // ─────────────────────────────────────────

    /**
     * Clear the terminal screen
     */
    public static function clearScreen(): void
    {
        // Works on Linux/macOS and Windows CMD/PowerShell
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            system('cls');
        } else {
            system('clear');
        }
    }

    // ─────────────────────────────────────────
    //   Separator & Layout Helpers
    // ─────────────────────────────────────────

    /**
     * Print a full-width horizontal line
     */
    public static function separator(string $char = '─', int $width = 60, string $color = ''): void
    {
        $line = str_repeat($char, $width);
        echo ($color ? $color : self::DIM) . $line . self::RESET . PHP_EOL;
    }

    /**
     * Print an empty line
     */
    public static function newLine(int $count = 1): void
    {
        echo str_repeat(PHP_EOL, $count);
    }

    // ─────────────────────────────────────────
    //   Title & Header Rendering
    // ─────────────────────────────────────────

    /**
     * Print the main application banner
     */
    public static function banner(): void
    {
        self::clearScreen();
        self::newLine();
        self::separator('═', 60, self::CYAN);

        $title = '  ⚡  CSV ↔ JSON Converter — Automation CLI PHP  ⚡';
        echo self::BOLD . self::CYAN . $title . self::RESET . PHP_EOL;

        self::separator('═', 60, self::CYAN);
        echo self::DIM . '  PHP CLI Tool  |  Pure PHP 8+  |  No Frameworks' . self::RESET . PHP_EOL;
        self::separator('─', 60);
        self::newLine();
    }

    /**
     * Print a section heading inside a bordered box
     */
    public static function sectionTitle(string $title): void
    {
        self::newLine();
        $width   = 60;
        $padded  = ' ' . strtoupper($title) . ' ';
        $total   = $width - 2; // inner width
        $left    = (int) floor(($total - strlen($padded)) / 2);
        $right   = $total - $left - strlen($padded);

        $top    = '┌' . str_repeat('─', $width - 2) . '┐';
        $middle = '│' . str_repeat(' ', $left) . $padded . str_repeat(' ', $right) . '│';
        $bottom = '└' . str_repeat('─', $width - 2) . '┘';

        echo self::BOLD . self::BLUE . $top    . self::RESET . PHP_EOL;
        echo self::BOLD . self::BLUE . $middle . self::RESET . PHP_EOL;
        echo self::BOLD . self::BLUE . $bottom . self::RESET . PHP_EOL;
        self::newLine();
    }

    // ─────────────────────────────────────────
    //   Message Types
    // ─────────────────────────────────────────

    /**
     * Print a success message (green)
     */
    public static function success(string $message): void
    {
        echo self::BOLD . self::GREEN . '  ✔  ' . self::RESET . self::GREEN . $message . self::RESET . PHP_EOL;
    }

    /**
     * Print an error message (red)
     */
    public static function error(string $message): void
    {
        echo self::BOLD . self::RED . '  ✘  ' . self::RESET . self::RED . $message . self::RESET . PHP_EOL;
    }

    /**
     * Print a warning message (yellow)
     */
    public static function warning(string $message): void
    {
        echo self::BOLD . self::YELLOW . '  ⚠  ' . self::RESET . self::YELLOW . $message . self::RESET . PHP_EOL;
    }

    /**
     * Print an info/hint message (cyan)
     */
    public static function info(string $message): void
    {
        echo self::CYAN . '  ℹ  ' . self::RESET . self::DIM . $message . self::RESET . PHP_EOL;
    }

    /**
     * Print a step/process message (magenta)
     */
    public static function step(string $message): void
    {
        echo self::MAGENTA . '  ▶  ' . self::RESET . $message . PHP_EOL;
    }

    // ─────────────────────────────────────────
    //   Loading / Progress Feedback
    // ─────────────────────────────────────────

    /**
     * Simulate a loading animation with a message
     */
    public static function loading(string $message, int $durationMs = 800): void
    {
        $frames = ['⠋', '⠙', '⠸', '⠴', '⠦', '⠇'];
        $count  = intdiv($durationMs, 100);

        for ($i = 0; $i < $count; $i++) {
            $frame = $frames[$i % count($frames)];
            echo "\r" . self::CYAN . "  $frame  " . self::RESET . $message;
            usleep(100000); // 100ms per frame
        }
        // Clear the loading line
        echo "\r" . str_repeat(' ', strlen($message) + 8) . "\r";
    }

    // ─────────────────────────────────────────
    //   Prompt Rendering
    // ─────────────────────────────────────────

    /**
     * Print a styled prompt label — returns user input
     */
    public static function prompt(string $label, string $default = ''): string
    {
        $defaultHint = $default !== '' ? self::DIM . " [$default]" . self::RESET : '';
        echo self::BOLD . self::YELLOW . '  › ' . self::RESET . $label . $defaultHint . self::YELLOW . ': ' . self::RESET;

        $input = trim(fgets(STDIN));
        return ($input === '' && $default !== '') ? $default : $input;
    }

    /**
     * Print a yes/no confirmation prompt — returns bool
     */
    public static function confirm(string $question, bool $default = true): bool
    {
        $hint = $default ? '[Y/n]' : '[y/N]';
        echo self::BOLD . self::YELLOW . '  › ' . self::RESET . $question . ' ' . self::DIM . $hint . self::RESET . self::YELLOW . ': ' . self::RESET;

        $input = strtolower(trim(fgets(STDIN)));

        if ($input === '') {
            return $default;
        }
        return in_array($input, ['y', 'yes'], true);
    }

    // ─────────────────────────────────────────
    //   Menu Rendering
    // ─────────────────────────────────────────

    /**
     * Render a numbered menu box with title and options
     * Returns the selected option number (int)
     */
    public static function menu(string $title, array $options): int
    {
        $width = 52;

        echo self::BOLD . self::CYAN;
        echo '  ┌' . str_repeat('─', $width) . '┐' . PHP_EOL;
        $paddedTitle = str_pad($title, $width, ' ', STR_PAD_BOTH);
        echo '  │' . self::YELLOW . $paddedTitle . self::CYAN . '│' . PHP_EOL;
        echo '  ├' . str_repeat('─', $width) . '┤' . PHP_EOL;

        foreach ($options as $num => $label) {
            $line = "  $num.  $label";
            $line = str_pad($line, $width);
            echo '  │' . self::RESET . self::WHITE . $line . self::BOLD . self::CYAN . '│' . PHP_EOL;
        }

        echo '  └' . str_repeat('─', $width) . '┘' . self::RESET . PHP_EOL;
        self::newLine();

        // Keep asking until valid input
        while (true) {
            $choice = self::prompt('Enter your choice');
            if (is_numeric($choice) && array_key_exists((int)$choice, $options)) {
                return (int)$choice;
            }
            self::error("Invalid choice. Please enter a number between " . min(array_keys($options)) . " and " . max(array_keys($options)) . ".");
        }
    }

    // ─────────────────────────────────────────
    //   Data Preview Table
    // ─────────────────────────────────────────

    /**
     * Render a preview table for CSV-like data (array of arrays)
     */
    public static function previewTable(array $rows, int $maxRows = 3): void
    {
        if (empty($rows)) {
            self::warning('No data to preview.');
            return;
        }

        $headers = array_keys(is_array($rows[0]) ? $rows[0] : []);

        if (empty($headers)) {
            self::info('Preview: ' . substr(json_encode($rows[0]), 0, 80));
            return;
        }

        // Calculate column widths
        $colWidths = [];
        foreach ($headers as $h) {
            $colWidths[$h] = min(strlen((string)$h), 20);
        }
        foreach (array_slice($rows, 0, $maxRows) as $row) {
            foreach ($headers as $h) {
                $val = isset($row[$h]) ? substr((string)$row[$h], 0, 20) : '';
                $colWidths[$h] = max($colWidths[$h], strlen($val));
            }
        }

        // Header row
        $headerLine = '  │';
        $divider    = '  ├';
        $topBorder  = '  ┌';
        $botBorder  = '  └';

        foreach ($headers as $h) {
            $w = $colWidths[$h] + 2;
            $topBorder  .= str_repeat('─', $w) . '┬';
            $divider    .= str_repeat('─', $w) . '┼';
            $botBorder  .= str_repeat('─', $w) . '┴';
            $headerLine .= ' ' . self::BOLD . self::CYAN . str_pad(substr($h, 0, 20), $colWidths[$h]) . self::RESET . ' │';
        }
        $topBorder = rtrim($topBorder, '┬') . '┐';
        $divider   = rtrim($divider, '┼') . '┤';
        $botBorder = rtrim($botBorder, '┴') . '┘';

        echo $topBorder . PHP_EOL;
        echo $headerLine . PHP_EOL;
        echo $divider . PHP_EOL;

        // Data rows
        $shown = 0;
        foreach (array_slice($rows, 0, $maxRows) as $row) {
            $line = '  │';
            foreach ($headers as $h) {
                $val  = isset($row[$h]) ? substr((string)$row[$h], 0, 20) : '';
                $line .= ' ' . str_pad($val, $colWidths[$h]) . ' │';
            }
            echo $line . PHP_EOL;
            $shown++;
        }

        echo $botBorder . PHP_EOL;

        if (count($rows) > $maxRows) {
            echo self::DIM . "  ... and " . (count($rows) - $maxRows) . " more row(s) not shown." . self::RESET . PHP_EOL;
        }
    }

    /**
     * Render a summary info box (key => value pairs)
     */
    public static function summaryBox(string $title, array $data): void
    {
        self::newLine();
        $width = 56;
        echo self::BOLD . self::GREEN;
        echo '  ┌─ ' . $title . ' ' . str_repeat('─', max(0, $width - strlen($title) - 4)) . '┐' . PHP_EOL;

        foreach ($data as $key => $value) {
            $row = "  $key: $value";
            $row = str_pad($row, $width - 1);
            echo '  │' . self::RESET . self::WHITE . $row . self::BOLD . self::GREEN . '│' . PHP_EOL;
        }

        echo '  └' . str_repeat('─', $width) . '┘' . self::RESET . PHP_EOL;
        self::newLine();
    }
}
