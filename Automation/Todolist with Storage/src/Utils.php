<?php

namespace TodoApp;

class Utils {
    private const COLORS = [
        'success' => "\033[32m", // Green
        'error'   => "\033[31m", // Red
        'info'    => "\033[34m", // Blue
        'warning' => "\033[33m", // Yellow
        'reset'   => "\033[0m",  // Reset
        'bold'    => "\033[1m",
    ];

    public static function print(string $message, string $type = 'info', bool $newline = true): void {
        $color = self::COLORS[$type] ?? self::COLORS['info'];
        $reset = self::COLORS['reset'];
        echo $color . $message . $reset . ($newline ? PHP_EOL : '');
    }

    public static function success(string $message): void {
        self::print("✔ " . $message, 'success');
    }

    public static function error(string $message): void {
        self::print("✘ " . $message, 'error');
    }

    public static function header(string $message): void {
        echo PHP_EOL;
        self::print("--- " . strtoupper($message) . " ---", 'bold');
    }

    public static function formatTable(array $headers, array $rows): void {
        if (empty($rows)) {
            self::print("No data found.", 'warning');
            return;
        }

        // Calculate column widths
        $widths = [];
        foreach ($headers as $index => $header) {
            $widths[$index] = strlen($header);
        }

        foreach ($rows as $row) {
            foreach ($row as $index => $value) {
                $widths[$index] = max($widths[$index], strlen((string)$value));
            }
        }

        // Print headers
        foreach ($headers as $index => $header) {
            echo str_pad($header, $widths[$index] + 2);
        }
        echo PHP_EOL;

        // Print separator
        foreach ($widths as $width) {
            echo str_repeat('-', $width) . "  ";
        }
        echo PHP_EOL;

        // Print rows
        foreach ($rows as $row) {
            foreach ($row as $index => $value) {
                $color = '';
                if ($headers[$index] === 'Status') {
                    $color = ($value === 'completed') ? self::COLORS['success'] : self::COLORS['warning'];
                }
                echo $color . str_pad((string)$value, $widths[$index] + 2) . self::COLORS['reset'];
            }
            echo PHP_EOL;
        }
        echo PHP_EOL;
    }
}
