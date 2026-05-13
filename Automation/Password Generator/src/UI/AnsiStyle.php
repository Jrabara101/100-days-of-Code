<?php

declare(strict_types=1);

namespace AegisGen\UI;

/**
 * AnsiStyle — Terminal Color & Formatting Engine
 *
 * Architectural Reasoning:
 * -----------------------
 * All ANSI escape sequences are centralised here. No other class references
 * raw \e[ codes — they call methods on this class. This means switching to
 * a "no-color" mode (e.g., when stdout is piped to a file) requires only
 * a flag on this class, not a grep-and-replace across the codebase.
 *
 * 256-Color Mode vs. Basic 16:
 *   We use \e[38;5;<n>m (256-color foreground) for rich, precise colors.
 *   Fallback to basic 16-color codes is available via the basic* constants.
 *   Most modern terminals (Windows Terminal, iTerm2, Alacritty, tmux) support
 *   256-color. Legacy cmd.exe users can enable via `--no-color` flag.
 */
class AnsiStyle
{
    // ── Reset ────────────────────────────────────────────────────────────
    public const RESET    = "\e[0m";
    public const BOLD     = "\e[1m";
    public const DIM      = "\e[2m";
    public const ITALIC   = "\e[3m";
    public const UNDER    = "\e[4m";

    // ── Basic 16-color foreground (wide compatibility) ───────────────────
    public const FG_RED     = "\e[31m";
    public const FG_YELLOW  = "\e[33m";
    public const FG_GREEN   = "\e[32m";
    public const FG_CYAN    = "\e[36m";
    public const FG_BLUE    = "\e[34m";
    public const FG_MAGENTA = "\e[35m";
    public const FG_WHITE   = "\e[97m";
    public const FG_GRAY    = "\e[90m";

    // ── 256-color foreground presets ─────────────────────────────────────
    public const FG_ORANGE      = "\e[38;5;208m";
    public const FG_LIME        = "\e[38;5;154m";
    public const FG_TEAL        = "\e[38;5;87m";
    public const FG_STEEL       = "\e[38;5;117m";
    public const FG_GOLD        = "\e[38;5;220m";
    public const FG_VIOLET      = "\e[38;5;141m";
    public const FG_CRIMSON     = "\e[38;5;196m";
    public const FG_CORAL       = "\e[38;5;203m";

    // ── Background ───────────────────────────────────────────────────────
    public const BG_DARK        = "\e[48;5;235m";
    public const BG_DARKER      = "\e[48;5;232m";
    public const BG_HIGHLIGHT   = "\e[48;5;237m";

    // ── Decorative characters ─────────────────────────────────────────────
    public const BLOCK_FULL  = '█';
    public const BLOCK_EMPTY = '░';
    public const CHECK       = '✔';
    public const CROSS       = '✘';
    public const ARROW_R     = '▶';
    public const BULLET      = '•';

    /** Disable all color output (pipe-safe mode) */
    private static bool $colorEnabled = true;

    public static function disableColor(): void
    {
        self::$colorEnabled = false;
    }

    /**
     * Wrap $text with one or more ANSI codes, then reset.
     *
     * @param  string   $text
     * @param  string[] $codes  ANSI escape constants from this class
     * @return string
     */
    public static function wrap(string $text, string ...$codes): string
    {
        if (!self::$colorEnabled) {
            return $text;
        }
        return implode('', $codes) . $text . self::RESET;
    }

    /**
     * Bold + color shorthand.
     */
    public static function bold(string $text, string $color = ''): string
    {
        return self::wrap($text, self::BOLD, $color);
    }

    /**
     * Select ANSI color based on entropy tier (0–4).
     *
     * Tier 0–1 → crimson  (WEAK)
     * Tier 2   → gold     (MODERATE)
     * Tier 3   → lime     (STRONG)
     * Tier 4   → teal     (MILITARY)
     */
    public static function entropyColor(int $tier): string
    {
        return match ($tier) {
            0, 1    => self::FG_CRIMSON,
            2       => self::FG_GOLD,
            3       => self::FG_LIME,
            default => self::FG_TEAL,
        };
    }

    /**
     * Color-coded strength bar — left half uses full-intensity entropy color,
     * empty blocks are dimmed gray for contrast.
     *
     * @param  string $bar    Raw bar string (e.g. "████████░░░░")
     * @param  int    $tier   Entropy tier (0–4)
     * @return string         ANSI-colored bar
     */
    public static function colorBar(string $bar, int $tier): string
    {
        if (!self::$colorEnabled) {
            return $bar;
        }

        $color    = self::entropyColor($tier);
        $filled   = str_replace(self::BLOCK_EMPTY, '', $bar); // full blocks only
        $empty    = str_replace(self::BLOCK_FULL, '', $bar);  // empty blocks only

        // Re-split accurately from original bar
        $fullCount  = substr_count($bar, self::BLOCK_FULL);
        $emptyCount = substr_count($bar, self::BLOCK_EMPTY);

        $coloredFull  = self::$colorEnabled
            ? ($color . self::BOLD . str_repeat(self::BLOCK_FULL, $fullCount) . self::RESET)
            : str_repeat(self::BLOCK_FULL, $fullCount);

        $coloredEmpty = self::$colorEnabled
            ? (self::DIM . self::FG_GRAY . str_repeat(self::BLOCK_EMPTY, $emptyCount) . self::RESET)
            : str_repeat(self::BLOCK_EMPTY, $emptyCount);

        return $coloredFull . $coloredEmpty;
    }

    /**
     * Produce a Yes/No check badge:  [✔] or [✘]
     */
    public static function badge(bool $active): string
    {
        if ($active) {
            return self::wrap('[' . self::CHECK . ']', self::FG_LIME, self::BOLD);
        }
        return self::wrap('[' . self::CROSS . ']', self::FG_CRIMSON);
    }

    /**
     * Section header line (double equals border).
     */
    public static function sectionLine(int $width = 70): string
    {
        return self::wrap(str_repeat('=', $width), self::FG_STEEL, self::DIM);
    }

    /**
     * Thin divider line (single dash).
     */
    public static function dividerLine(int $width = 70): string
    {
        return self::wrap(str_repeat('-', $width), self::FG_GRAY, self::DIM);
    }

    /**
     * Section label:  [ SECTION NAME ]
     */
    public static function sectionLabel(string $label): string
    {
        return self::wrap('[ ', self::FG_STEEL)
            . self::wrap($label, self::FG_WHITE, self::BOLD)
            . self::wrap(' ]', self::FG_STEEL);
    }

    /**
     * Pad a string to a fixed width for column alignment.
     */
    public static function padRight(string $text, int $width): string
    {
        // strlen counts bytes; mb_strlen counts chars. For ASCII-only keys this is fine.
        return $text . str_repeat(' ', max(0, $width - strlen($text)));
    }

    /**
     * Format a key/value pair for the config section.
     */
    public static function kv(string $key, string $value, int $keyWidth = 8): string
    {
        $k = self::wrap(self::padRight($key . ' :', $keyWidth + 2), self::FG_GRAY);
        $v = self::wrap($value, self::FG_WHITE);
        return $k . ' ' . $v;
    }
}
