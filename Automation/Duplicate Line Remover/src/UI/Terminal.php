<?php

declare(strict_types=1);

namespace DedupeCLI\UI;

/**
 * Terminal – ANSI 24-bit (true-colour) escape code primitives.
 *
 * All methods are static so they can be called without injecting
 * the object throughout the codebase. A static $colorEnabled flag
 * allows clean disabling for piped output (--no-color flag).
 *
 * 24-bit colour format: ESC[38;2;<r>;<g>;<b>m  (foreground)
 *                       ESC[48;2;<r>;<g>;<b>m  (background)
 */
class Terminal
{
    private static bool $colorEnabled = true;

    // ── Colour palette (24-bit RGB) ────────────────────────────────────────────

    // Brand / accent
    private const C_ACCENT    = [139, 92, 246];   // vibrant violet
    private const C_CYAN      = [34,  211, 238];  // electric cyan
    private const C_GREEN     = [74,  222, 128];  // neon green
    private const C_GOLD      = [251, 191, 36];   // amber/gold
    private const C_WHITE     = [248, 248, 248];  // near-white
    private const C_MUTED     = [113, 113, 122];  // zinc-500
    private const C_ERROR     = [248, 113, 113];  // red-400
    private const C_WARN      = [251, 146, 60];   // orange-400
    private const C_SUCCESS   = [74,  222, 128];  // same as green
    private const C_HIGHLIGHT = [253, 224, 71];   // yellow-300
    private const C_DUPE      = [251, 113, 133];  // rose-400 (duplicate events)
    private const C_BLUE      = [96,  165, 250];  // blue-400

    // Background tints for section headers
    private const BG_HEADER   = [24,  24,  27];   // zinc-950

    public static function disableColor(): void
    {
        self::$colorEnabled = false;
    }

    public static function isColorEnabled(): bool
    {
        return self::$colorEnabled;
    }

    // ── Low-level escape builders ──────────────────────────────────────────────

    /**
     * Wrap $text in 24-bit foreground colour.
     * Falls back to plain text when colour is disabled.
     */
    public static function fg(int $r, int $g, int $b, string $text): string
    {
        if (!self::$colorEnabled) {
            return $text;
        }
        return "\e[38;2;{$r};{$g};{$b}m{$text}\e[0m";
    }

    /** 24-bit background. */
    public static function bg(int $r, int $g, int $b, string $text): string
    {
        if (!self::$colorEnabled) {
            return $text;
        }
        return "\e[48;2;{$r};{$g};{$b}m{$text}\e[0m";
    }

    /** Bold text. */
    public static function bold(string $text): string
    {
        return self::$colorEnabled ? "\e[1m{$text}\e[0m" : $text;
    }

    /** Dim/italic text. */
    public static function dim(string $text): string
    {
        return self::$colorEnabled ? "\e[2m{$text}\e[0m" : $text;
    }

    // ── Semantic colour shortcuts ──────────────────────────────────────────────

    public static function accent(string $t): string    { [$r,$g,$b] = self::C_ACCENT;    return self::bold(self::fg($r,$g,$b,$t)); }
    public static function cyan(string $t): string      { [$r,$g,$b] = self::C_CYAN;      return self::fg($r,$g,$b,$t); }
    public static function green(string $t): string     { [$r,$g,$b] = self::C_GREEN;     return self::fg($r,$g,$b,$t); }
    public static function gold(string $t): string      { [$r,$g,$b] = self::C_GOLD;      return self::fg($r,$g,$b,$t); }
    public static function white(string $t): string     { [$r,$g,$b] = self::C_WHITE;     return self::fg($r,$g,$b,$t); }
    public static function muted(string $t): string     { [$r,$g,$b] = self::C_MUTED;     return self::fg($r,$g,$b,$t); }
    public static function error(string $t): string     { [$r,$g,$b] = self::C_ERROR;     return self::fg($r,$g,$b,$t); }
    public static function warn(string $t): string      { [$r,$g,$b] = self::C_WARN;      return self::fg($r,$g,$b,$t); }
    public static function success(string $t): string   { [$r,$g,$b] = self::C_SUCCESS;   return self::fg($r,$g,$b,$t); }
    public static function highlight(string $t): string { [$r,$g,$b] = self::C_HIGHLIGHT; return self::bold(self::fg($r,$g,$b,$t)); }
    public static function dupe(string $t): string      { [$r,$g,$b] = self::C_DUPE;      return self::fg($r,$g,$b,$t); }
    public static function blue(string $t): string      { [$r,$g,$b] = self::C_BLUE;      return self::fg($r,$g,$b,$t); }

    // ── Layout helpers ─────────────────────────────────────────────────────────

    /** A full-width horizontal rule using ═ characters. */
    public static function rule(int $width = 70): string
    {
        return self::muted(str_repeat('═', $width));
    }

    /** A thinner rule using ─ characters. */
    public static function thinRule(int $width = 70): string
    {
        return self::muted(str_repeat('─', $width));
    }

    // ── Format helpers ─────────────────────────────────────────────────────────

    /** Format integer with thousands separators. */
    public static function num(int $n): string
    {
        return number_format($n);
    }

    /**
     * Convert bytes to a human-readable string.
     *
     * @param int $bytes
     * @return string  e.g. "12.4 GB", "145 MB", "512 KB"
     */
    public static function bytes(int $bytes): string
    {
        return match (true) {
            $bytes >= 1_073_741_824 => sprintf('%.1f GB', $bytes / 1_073_741_824),
            $bytes >= 1_048_576     => sprintf('%.1f MB', $bytes / 1_048_576),
            $bytes >= 1_024         => sprintf('%.1f KB', $bytes / 1_024),
            default                 => "{$bytes} B",
        };
    }

    /**
     * Format a memory value in MB with colour coding:
     *   < 64 MB  → green, 64–256 MB → gold, > 256 MB → error
     */
    public static function memColour(float $mb): string
    {
        $label = sprintf('%.1f MB', $mb);
        return match (true) {
            $mb < 64.0  => self::green($label),
            $mb < 256.0 => self::gold($label),
            default     => self::error($label),
        };
    }

    // ── Status tag ─────────────────────────────────────────────────────────────

    public static function onBadge(string $label): string
    {
        return self::fg(74, 222, 128, '[') . self::bold(self::fg(74, 222, 128, 'ON')) . self::fg(74, 222, 128, ']') . ' ' . self::muted($label);
    }

    public static function offBadge(string $label): string
    {
        return self::muted('[OFF] ' . $label);
    }

    /**
     * Return a coloured ON/OFF badge for a boolean.
     */
    public static function badge(string $label, bool $on): string
    {
        return $on ? self::onBadge($label) : self::offBadge($label);
    }
}
