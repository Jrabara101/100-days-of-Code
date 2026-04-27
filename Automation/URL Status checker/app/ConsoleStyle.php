<?php

declare(strict_types=1);

namespace App;

/**
 * ConsoleStyle
 *
 * Handles all terminal output formatting:
 * ANSI colors, banners, tables, boxes, and progress indicators.
 *
 * @package App
 */
class ConsoleStyle
{
    // ─── ANSI Color Codes ────────────────────────────────────────────────────

    const RESET   = "\033[0m";
    const BOLD    = "\033[1m";
    const DIM     = "\033[2m";

    // Foreground
    const BLACK   = "\033[30m";
    const RED     = "\033[31m";
    const GREEN   = "\033[32m";
    const YELLOW  = "\033[33m";
    const BLUE    = "\033[34m";
    const MAGENTA = "\033[35m";
    const CYAN    = "\033[36m";
    const WHITE   = "\033[37m";
    const GRAY    = "\033[90m";

    // Bright Foreground
    const BRIGHT_RED    = "\033[91m";
    const BRIGHT_GREEN  = "\033[92m";
    const BRIGHT_YELLOW = "\033[93m";
    const BRIGHT_CYAN   = "\033[96m";
    const BRIGHT_WHITE  = "\033[97m";

    // Background
    const BG_RED    = "\033[41m";
    const BG_GREEN  = "\033[42m";
    const BG_YELLOW = "\033[43m";
    const BG_BLUE   = "\033[44m";
    const BG_CYAN   = "\033[46m";

    // ─── Widths ──────────────────────────────────────────────────────────────

    const WIDTH = 80;

    // ─── Text Helpers ────────────────────────────────────────────────────────

    /**
     * Wrap text in an ANSI color code.
     */
    public static function color(string $text, string $color): string
    {
        return $color . $text . self::RESET;
    }

    /**
     * Print a line to STDOUT.
     */
    public static function line(string $text = ''): void
    {
        echo $text . PHP_EOL;
    }

    /**
     * Print a blank line.
     */
    public static function blank(): void
    {
        echo PHP_EOL;
    }

    // ─── Banner ──────────────────────────────────────────────────────────────

    /**
     * Print the ASCII art banner for the tool.
     */
    public static function banner(): void
    {
        self::blank();
        self::line(self::color('╔══════════════════════════════════════════════════════════════════════════════╗', self::CYAN));
        self::line(self::color('║                                                                              ║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('   ██╗   ██╗██████╗ ██╗         ███████╗████████╗ █████╗ ████████╗██╗   ██╗  ', self::BRIGHT_CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('   ██║   ██║██╔══██╗██║         ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║   ██║  ', self::BRIGHT_CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('   ██║   ██║██████╔╝██║         ███████╗   ██║   ███████║   ██║   ██║   ██║  ', self::BRIGHT_CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('   ██║   ██║██╔══██╗██║         ╚════██║   ██║   ██╔══██║   ██║   ██║   ██║  ', self::BRIGHT_CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('   ╚██████╔╝██║  ██║███████╗    ███████║   ██║   ██║  ██║   ██║   ╚██████╔╝  ', self::BRIGHT_CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('    ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝   ', self::BRIGHT_CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║                                                                              ║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('                ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗███████╗██████╗         ', self::CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('               ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝██╔════╝██╔══██╗        ', self::CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('               ██║     ███████║█████╗  ██║     █████╔╝ █████╗  ██████╔╝        ', self::CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('               ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗ ██╔══╝  ██╔══██╗        ', self::CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('               ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗███████╗██║  ██║        ', self::CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('                ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝        ', self::CYAN) . self::color('║', self::CYAN));
        self::line(self::color('║                                                                              ║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('         Professional HTTP Status Automation Tool  •  PHP CLI Edition         ', self::GRAY) . self::color('║', self::CYAN));
        self::line(self::color('║', self::CYAN) . self::color('                          Version 1.0.0  •  2026                              ', self::GRAY) . self::color('║', self::CYAN));
        self::line(self::color('╚══════════════════════════════════════════════════════════════════════════════╝', self::CYAN));
        self::blank();
    }

    // ─── Section Headers ─────────────────────────────────────────────────────

    /**
     * Print a styled section title.
     */
    public static function sectionTitle(string $title): void
    {
        $line = str_repeat('─', self::WIDTH);
        self::blank();
        self::line(self::color($line, self::CYAN));
        self::line(self::color('  ' . strtoupper($title), self::BOLD . self::BRIGHT_WHITE));
        self::line(self::color($line, self::CYAN));
    }

    // ─── Box ─────────────────────────────────────────────────────────────────

    /**
     * Print text inside a styled box.
     *
     * @param string[] $lines
     */
    public static function box(array $lines, string $color = self::CYAN): void
    {
        $maxLen = max(array_map('strlen', $lines));
        $inner  = $maxLen + 2;

        self::line($color . '┌' . str_repeat('─', $inner) . '┐' . self::RESET);
        foreach ($lines as $line) {
            $pad = $maxLen - strlen($line);
            self::line($color . '│ ' . self::RESET . $line . str_repeat(' ', $pad) . $color . ' │' . self::RESET);
        }
        self::line($color . '└' . str_repeat('─', $inner) . '┘' . self::RESET);
    }

    // ─── Table ───────────────────────────────────────────────────────────────

    /**
     * Print a formatted table with headers and rows.
     *
     * @param string[]   $headers   Column header labels
     * @param int[]      $widths    Column widths in characters
     * @param array[]    $rows      Array of row data arrays (each row matches headers count)
     */
    public static function table(array $headers, array $widths, array $rows): void
    {
        // Build separator line
        $sep = '├';
        $top = '┌';
        $bot = '└';
        foreach ($widths as $i => $w) {
            $top .= str_repeat('─', $w + 2) . ($i < count($widths) - 1 ? '┬' : '┐');
            $sep .= str_repeat('─', $w + 2) . ($i < count($widths) - 1 ? '┼' : '┤');
            $bot .= str_repeat('─', $w + 2) . ($i < count($widths) - 1 ? '┴' : '┘');
        }

        // Top border
        self::line(self::color($top, self::GRAY));

        // Header row
        $headerRow = self::color('│', self::GRAY);
        foreach ($headers as $i => $h) {
            $headerRow .= ' ' . self::color(str_pad(substr($h, 0, $widths[$i]), $widths[$i]), self::BOLD . self::BRIGHT_WHITE) . ' ' . self::color('│', self::GRAY);
        }
        self::line($headerRow);

        // Header separator
        self::line(self::color($sep, self::GRAY));

        // Data rows
        foreach ($rows as $row) {
            $rowLine = self::color('│', self::GRAY);
            foreach ($row as $i => $cell) {
                // cell is [text, color] or just text
                if (is_array($cell)) {
                    [$cellText, $cellColor] = $cell;
                } else {
                    $cellText  = (string)$cell;
                    $cellColor = self::WHITE;
                }
                // Truncate + pad
                $stripped  = self::stripAnsi($cellText);
                $truncated = mb_strlen($stripped) > $widths[$i]
                    ? mb_substr($stripped, 0, $widths[$i] - 1) . '…'
                    : $stripped;
                $padded    = str_pad($truncated, $widths[$i]);
                $rowLine  .= ' ' . $cellColor . $padded . self::RESET . ' ' . self::color('│', self::GRAY);
            }
            self::line($rowLine);
        }

        // Bottom border
        self::line(self::color($bot, self::GRAY));
    }

    // ─── Progress ────────────────────────────────────────────────────────────

    /**
     * Print a progress indicator for the current/total item.
     */
    public static function progress(int $current, int $total, string $url): void
    {
        $pct      = $total > 0 ? (int)(($current / $total) * 100) : 0;
        $filled   = (int)(($pct / 100) * 30);
        $bar      = str_repeat('█', $filled) . str_repeat('░', 30 - $filled);
        $label    = self::truncate($url, 40);

        echo "\r" . self::CYAN . "  [" . self::BRIGHT_CYAN . $bar . self::CYAN . "] " .
             self::BRIGHT_WHITE . sprintf('%3d%%', $pct) . self::RESET .
             self::GRAY . "  ({$current}/{$total}) " . self::RESET .
             self::color($label, self::GRAY) . str_repeat(' ', 5);
    }

    /**
     * Clear the progress line.
     */
    public static function clearProgress(): void
    {
        echo "\r" . str_repeat(' ', self::WIDTH + 10) . "\r";
    }

    // ─── Status Messages ─────────────────────────────────────────────────────

    public static function success(string $msg): void
    {
        self::line(self::color('  ✔ ', self::BRIGHT_GREEN) . self::color($msg, self::WHITE));
    }

    public static function warning(string $msg): void
    {
        self::line(self::color('  ⚠ ', self::BRIGHT_YELLOW) . self::color($msg, self::YELLOW));
    }

    public static function error(string $msg): void
    {
        self::line(self::color('  ✖ ', self::BRIGHT_RED) . self::color($msg, self::RED));
    }

    public static function info(string $msg): void
    {
        self::line(self::color('  ℹ ', self::BRIGHT_CYAN) . self::color($msg, self::CYAN));
    }

    // ─── Summary Dashboard ───────────────────────────────────────────────────

    /**
     * Print a summary stat tile.
     *
     * @param array<array{label: string, value: string|int, color: string}> $stats
     */
    public static function dashboard(array $stats): void
    {
        self::sectionTitle('Summary Dashboard');
        self::blank();

        $tileWidth = 16;
        $tiles     = [];

        foreach ($stats as $s) {
            $val   = str_pad((string)$s['value'], $tileWidth, ' ', STR_PAD_BOTH);
            $lbl   = str_pad($s['label'], $tileWidth, ' ', STR_PAD_BOTH);
            $color = $s['color'];

            $tiles[] = [
                $color . '┌' . str_repeat('─', $tileWidth) . '┐' . self::RESET,
                $color . '│' . self::RESET . self::color($val, self::BOLD . $color) . $color . '│' . self::RESET,
                $color . '│' . self::RESET . self::GRAY . $lbl . self::RESET . $color . '│' . self::RESET,
                $color . '└' . str_repeat('─', $tileWidth) . '┘' . self::RESET,
            ];
        }

        // Print tiles side by side (max 4 per row)
        $chunks = array_chunk($tiles, 4);
        foreach ($chunks as $chunk) {
            $rows = count($chunk[0]);
            for ($r = 0; $r < $rows; $r++) {
                $rowLine = '  ';
                foreach ($chunk as $tile) {
                    $rowLine .= ($tile[$r] ?? '') . '  ';
                }
                self::line($rowLine);
            }
        }
    }

    // ─── Utility ─────────────────────────────────────────────────────────────

    /**
     * Strip ANSI escape codes from a string (used for length calculations).
     */
    public static function stripAnsi(string $text): string
    {
        return preg_replace('/\033\[[0-9;]*m/', '', $text) ?? $text;
    }

    /**
     * Truncate a string to a max length, appending '...' if needed.
     */
    public static function truncate(string $text, int $max): string
    {
        return mb_strlen($text) > $max
            ? mb_substr($text, 0, $max - 3) . '...'
            : $text;
    }
}
