<?php

declare(strict_types=1);

namespace OmniLog\UI;

/**
 * TableRenderer – ASCII box-drawing table generator with ANSI styling.
 *
 * Dynamically sizes column widths based on content length (header or data).
 * Supports left (L) and right (R) column alignment.
 * Alternates row colors for improved readability on wide tables.
 *
 * Example output:
 *   +-----------------+---------------+-------------------+
 *   | IP Address      | Error Count   | Primary Status    |
 *   +-----------------+---------------+-------------------+
 *   | 192.168.1.5     | 4,521         | 500 Internal      |
 *   +-----------------+---------------+-------------------+
 */
class TableRenderer
{
    /**
     * Render a complete ASCII table to stdout.
     *
     * @param string[] $headers  Column header labels
     * @param array[]  $rows     2D array — each row is an array of cell values
     * @param string[] $aligns   Per-column alignment: 'L' (default) or 'R'
     */
    public static function render(array $headers, array $rows, array $aligns = []): void
    {
        $widths = self::calculateWidths($headers, $rows);
        $sep    = self::separator($widths);

        // Header row
        echo "  " . Terminal::muted($sep) . "\n";
        echo "  " . self::headerRow($headers, $widths, $aligns);
        echo "  " . Terminal::muted($sep) . "\n";

        // Data rows
        foreach ($rows as $i => $row) {
            echo "  " . self::dataRow($row, $widths, $aligns, $i);
        }

        echo "  " . Terminal::muted($sep) . "\n";
    }

    // ─── Internal builders ────────────────────────────────────────────────

    private static function calculateWidths(array $headers, array $rows): array
    {
        $widths = array_map('mb_strlen', $headers);

        foreach ($rows as $row) {
            foreach (array_values($row) as $i => $cell) {
                $len = mb_strlen((string) $cell);
                $widths[$i] = isset($widths[$i]) ? max($widths[$i], $len) : $len;
            }
        }

        return $widths;
    }

    private static function separator(array $widths): string
    {
        $parts = array_map(fn(int $w) => str_repeat('-', $w + 2), $widths);
        return '+' . implode('+', $parts) . '+';
    }

    private static function headerRow(array $headers, array $widths, array $aligns): string
    {
        $cells = [];
        foreach ($headers as $i => $header) {
            $w      = $widths[$i] ?? mb_strlen($header);
            $align  = $aligns[$i] ?? 'L';
            $padded = $align === 'R'
                ? str_pad($header, $w, ' ', STR_PAD_LEFT)
                : str_pad($header, $w);
            $cells[] = ' ' . Terminal::highlight($padded) . ' ';
        }
        return Terminal::muted('|') . implode(Terminal::muted('|'), $cells) . Terminal::muted('|') . "\n";
    }

    private static function dataRow(array $row, array $widths, array $aligns, int $rowIndex): string
    {
        $cells = array_values($row);
        $parts = [];
        foreach ($cells as $i => $cell) {
            $w      = $widths[$i] ?? 10;
            $align  = $aligns[$i] ?? 'L';
            $str    = (string) $cell;
            $padded = $align === 'R'
                ? str_pad($str, $w, ' ', STR_PAD_LEFT)
                : str_pad($str, $w);

            // Alternate row color for readability
            $colored = $rowIndex % 2 === 0
                ? Terminal::info($padded)
                : Terminal::fg(200, 200, 225, $padded);

            $parts[] = ' ' . $colored . ' ';
        }
        return Terminal::muted('|') . implode(Terminal::muted('|'), $parts) . Terminal::muted('|') . "\n";
    }
}
