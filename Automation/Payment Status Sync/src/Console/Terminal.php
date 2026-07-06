<?php

namespace App\PaymentSync\Console;

class Terminal
{
    // ANSI Colors
    public const COLOR_RESET = "\033[0m";
    public const COLOR_BOLD = "\033[1m";
    public const COLOR_DIM = "\033[2m";
    
    public const FG_RED = "\033[31m";
    public const FG_GREEN = "\033[32m";
    public const FG_YELLOW = "\033[33m";
    public const FG_BLUE = "\033[34m";
    public const FG_MAGENTA = "\033[35m";
    public const FG_CYAN = "\033[36m";
    public const FG_WHITE = "\033[37m";
    public const FG_GRAY = "\033[90m";

    public const BG_RED = "\033[41m";
    public const BG_GREEN = "\033[42m";
    public const BG_YELLOW = "\033[43m";
    public const BG_BLUE = "\033[44m";
    public const BG_DARK_GRAY = "\033[100m";

    /**
     * Colorize a string with ANSI escape codes.
     */
    public static function colorize(string $text, string $fgColor, ?string $bgColor = null, bool $bold = false): string
    {
        $code = '';
        if ($bold) {
            $code .= self::COLOR_BOLD;
        }
        $code .= $fgColor;
        if ($bgColor) {
            $code .= $bgColor;
        }
        return $code . $text . self::COLOR_RESET;
    }

    /**
     * Strip ANSI escape codes to calculate raw text length.
     */
    public static function stripAnsi(string $text): string
    {
        return preg_replace('/\033\[[0-9;]*m/', '', $text);
    }

    /**
     * Print text to output.
     */
    public static function write(string $text): void
    {
        echo $text;
    }

    /**
     * Print text with a newline.
     */
    public static function writeln(string $text = ''): void
    {
        echo $text . PHP_EOL;
    }

    /**
     * Clear the current terminal line.
     */
    public static function clearLine(): void
    {
        echo "\r\033[K";
    }

    /**
     * Render an in-place progress bar.
     */
    public static function drawProgressBar(int $current, int $total, string $statusText = '', int $width = 30): void
    {
        self::clearLine();
        if ($total <= 0) {
            $percent = 0;
            $filled = 0;
        } else {
            $percent = round(($current / $total) * 100);
            $filled = (int)round(($current / $total) * $width);
        }
        $empty = $width - $filled;

        // Custom high-aesthetic blocks
        $bar = str_repeat('█', $filled) . str_repeat('░', $empty);
        
        $percentageString = str_pad("{$percent}%", 4, ' ', STR_PAD_LEFT);
        $counterString = "({$current}/{$total})";
        
        $output = self::colorize("[{$bar}]", self::FG_CYAN) . " {$percentageString} {$counterString}";
        if ($statusText) {
            $output .= " " . self::colorize($statusText, self::FG_GRAY);
        }

        self::write($output);
    }

    /**
     * Draw a beautiful CLI header.
     */
    public static function drawHeader(string $title): void
    {
        $len = strlen($title) + 6;
        $border = str_repeat('━', $len);
        
        self::writeln();
        self::writeln(self::colorize(" ┏" . $border . "┓", self::FG_MAGENTA, null, true));
        self::writeln(self::colorize(" ┃   " . strtoupper($title) . "   ┃", self::FG_MAGENTA, null, true));
        self::writeln(self::colorize(" ┗" . $border . "┛", self::FG_MAGENTA, null, true));
        self::writeln();
    }

    /**
     * Render a neat table with box-drawing characters and column alignment.
     *
     * @param array<string> $headers
     * @param array<array<string>> $rows
     * @param array<string> $alignments Alignments for each column ('left', 'right', 'center'). Defaults to 'left'.
     */
    public static function drawTable(array $headers, array $rows, array $alignments = []): void
    {
        // Calculate max width for each column
        $colWidths = [];
        foreach ($headers as $colIndex => $header) {
            $colWidths[$colIndex] = strlen(self::stripAnsi($header));
        }

        foreach ($rows as $row) {
            foreach ($row as $colIndex => $cell) {
                $cellStr = (string)$cell;
                $colWidths[$colIndex] = max($colWidths[$colIndex] ?? 0, strlen(self::stripAnsi($cellStr)));
            }
        }

        // Render top border
        $topBorder = '┌';
        foreach ($colWidths as $colIndex => $width) {
            $topBorder .= str_repeat('─', $width + 2);
            $topBorder .= ($colIndex === count($colWidths) - 1) ? '┐' : '┬';
        }
        self::writeln($topBorder);

        // Render headers
        $headerRow = '│';
        foreach ($headers as $colIndex => $header) {
            $headerRow .= ' ' . self::padCell($header, $colWidths[$colIndex], $alignments[$colIndex] ?? 'left') . ' │';
        }
        self::writeln($headerRow);

        // Render separator
        $separator = '├';
        foreach ($colWidths as $colIndex => $width) {
            $separator .= str_repeat('─', $width + 2);
            $separator .= ($colIndex === count($colWidths) - 1) ? '┤' : '┼';
        }
        self::writeln($separator);

        // Render rows
        foreach ($rows as $row) {
            $dataRow = '│';
            foreach ($row as $colIndex => $cell) {
                $dataRow .= ' ' . self::padCell((string)$cell, $colWidths[$colIndex], $alignments[$colIndex] ?? 'left') . ' │';
            }
            self::writeln($dataRow);
        }

        // Render bottom border
        $bottomBorder = '└';
        foreach ($colWidths as $colIndex => $width) {
            $bottomBorder .= str_repeat('─', $width + 2);
            $bottomBorder .= ($colIndex === count($colWidths) - 1) ? '┘' : '┴';
        }
        self::writeln($bottomBorder);
    }

    /**
     * Pad a cell's styled content, preserving ANSI escapes.
     */
    private static function padCell(string $text, int $width, string $align = 'left'): string
    {
        $rawText = self::stripAnsi($text);
        $rawLen = strlen($rawText);
        
        if ($rawLen >= $width) {
            return $text;
        }

        $diff = $width - $rawLen;

        switch ($align) {
            case 'right':
                return str_repeat(' ', $diff) . $text;
            case 'center':
                $left = (int)floor($diff / 2);
                $right = $diff - $left;
                return str_repeat(' ', $left) . $text . str_repeat(' ', $right);
            case 'left':
            default:
                return $text . str_repeat(' ', $diff);
        }
    }

    /**
     * Draw a banner block (e.g. for errors or warnings).
     */
    public static function drawBanner(string $title, string $message, string $colorCode, string $borderColorCode): void
    {
        $border = str_repeat('━', 60);
        self::writeln(self::colorize("┏" . $border . "┓", $borderColorCode));
        self::writeln(self::colorize("┃ ", $borderColorCode) . self::colorize(str_pad($title, 58), $colorCode, null, true) . self::colorize(" ┃", $borderColorCode));
        
        $wrapped = wordwrap($message, 58, "\n");
        $lines = explode("\n", $wrapped);
        foreach ($lines as $line) {
            self::writeln(self::colorize("┃ ", $borderColorCode) . str_pad($line, 58) . self::colorize(" ┃", $borderColorCode));
        }
        self::writeln(self::colorize("┗" . $border . "┛", $borderColorCode));
    }
}
