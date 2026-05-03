<?php

declare(strict_types=1);

namespace OmniLog\UI;

/**
 * Terminal – ANSI 24-bit (true color) styling engine.
 *
 * All color output is centralized here. This decouples presentation
 * from business logic — if the user runs with --no-color, only this
 * class needs to change (all methods return plain text).
 *
 * Uses ANSI SGR sequences:
 *   \033[38;2;R;G;Bm  → 24-bit foreground
 *   \033[48;2;R;G;Bm  → 24-bit background
 *   \033[0m            → reset all attributes
 */
class Terminal
{
    public const RESET  = "\033[0m";
    public const BOLD   = "\033[1m";
    public const DIM    = "\033[2m";
    public const ITALIC = "\033[3m";

    private static bool $colorEnabled = true;

    public static function disableColor(): void
    {
        self::$colorEnabled = false;
    }

    // ─── 24-bit color primitives ───────────────────────────────────────────

    public static function fg(int $r, int $g, int $b, string $text): string
    {
        if (!self::$colorEnabled) return $text;
        return "\033[38;2;{$r};{$g};{$b}m{$text}" . self::RESET;
    }

    public static function bg(int $r, int $g, int $b, string $text): string
    {
        if (!self::$colorEnabled) return $text;
        return "\033[48;2;{$r};{$g};{$b}m{$text}" . self::RESET;
    }

    public static function fgbg(
        int $fr, int $fg, int $fb,
        int $br, int $bg2, int $bb,
        string $text
    ): string {
        if (!self::$colorEnabled) return $text;
        return "\033[38;2;{$fr};{$fg};{$fb}m\033[48;2;{$br};{$bg2};{$bb}m{$text}" . self::RESET;
    }

    // ─── Semantic color shortcuts ──────────────────────────────────────────

    public static function error(string $text): string
    {
        return self::BOLD . self::fg(255, 90, 90, $text);
    }

    public static function critical(string $text): string
    {
        return self::BOLD . self::fgbg(255, 255, 255, 160, 0, 0, " {$text} ");
    }

    public static function warn(string $text): string
    {
        return self::fg(255, 195, 55, $text);
    }

    public static function info(string $text): string
    {
        return self::fg(90, 185, 255, $text);
    }

    public static function success(string $text): string
    {
        return self::fg(80, 225, 105, $text);
    }

    public static function muted(string $text): string
    {
        return self::DIM . self::fg(160, 160, 175, $text);
    }

    public static function accent(string $text): string
    {
        return self::fg(145, 110, 255, $text);
    }

    public static function highlight(string $text): string
    {
        return self::BOLD . self::fg(255, 225, 100, $text);
    }

    public static function cyan(string $text): string
    {
        return self::fg(0, 215, 215, $text);
    }

    public static function white(string $text): string
    {
        return self::fg(220, 220, 235, $text);
    }

    // ─── Gradient text (character-by-character color shift) ───────────────

    public static function gradient(string $text): string
    {
        if (!self::$colorEnabled) return $text;
        $chars = mb_str_split($text);
        $out   = '';
        $total = count($chars);
        foreach ($chars as $i => $char) {
            $r = (int) (80  + ($i / max($total - 1, 1)) * 175);
            $b = (int) (255 - ($i / max($total - 1, 1)) * 155);
            $out .= "\033[38;2;{$r};110;{$b}m{$char}";
        }
        return $out . self::RESET;
    }

    // ─── Log level badge ──────────────────────────────────────────────────

    public static function levelTag(string $level): string
    {
        $padded = str_pad(strtoupper($level), 9);
        return match (strtoupper(trim($level))) {
            'CRITICAL', 'ALERT', 'EMERGENCY' => self::fgbg(255, 255, 255, 160, 0,   0,   " {$padded}"),
            'ERROR'                           => self::fgbg(255, 255, 255, 190, 40,  40,  " {$padded}"),
            'WARN', 'WARNING'                 => self::fgbg(0,   0,   0,   200, 140, 0,   " {$padded}"),
            'NOTICE'                          => self::fgbg(255, 255, 255, 0,   90,  160, " {$padded}"),
            'INFO'                            => self::fgbg(255, 255, 255, 30,  100, 180, " {$padded}"),
            default                           => self::muted("[{$level}]"),
        };
    }

    // ─── Layout helpers ───────────────────────────────────────────────────

    public static function line(string $char = '═', int $width = 72): string
    {
        return self::muted(str_repeat($char, $width));
    }

    public static function divider(int $width = 72): string
    {
        return self::muted(str_repeat('─', $width)) . "\n";
    }

    public static function banner(): void
    {
        $phpVer = PHP_VERSION;
        $memPeak = round(memory_get_peak_usage(true) / 1024 / 1024, 1);
        echo "\n";
        echo "  " . self::line() . "\n";
        echo "  " . self::gradient('OmniLog Analyzer v3.1.0')
            . '  '
            . self::muted("[Engine: PHP {$phpVer} | Memory Peak: {$memPeak}MB]")
            . "\n";
        echo "  " . self::line() . "\n";
    }

    public static function fileInfo(string $path, int $bytes, array $filterDesc): void
    {
        $size = self::formatBytes($bytes);
        echo "  " . self::muted('Target File : ')
            . self::highlight($path)
            . self::muted(" ({$size})") . "\n";

        if (!empty($filterDesc)) {
            echo "  " . self::muted('Filters     : ')
                . self::warn(implode(' | ', $filterDesc)) . "\n";
        }
        echo "\n";
    }

    public static function sectionHeader(string $title): void
    {
        echo "\n";
        echo "  " . self::line() . "\n";
        echo "  " . self::BOLD . self::accent("[{$title}]") . "\n";
        echo "  " . self::line() . "\n";
    }

    // ─── Format helpers ───────────────────────────────────────────────────

    public static function formatBytes(int $bytes): string
    {
        return match (true) {
            $bytes >= 1_073_741_824 => round($bytes / 1_073_741_824, 2) . ' GB',
            $bytes >= 1_048_576     => round($bytes / 1_048_576, 2) . ' MB',
            $bytes >= 1_024         => round($bytes / 1_024, 2) . ' KB',
            default                 => $bytes . ' B',
        };
    }

    public static function formatNumber(int|float $n): string
    {
        return number_format((float) $n);
    }

    public static function clearLine(): void
    {
        echo "\r\033[K";
    }
}
