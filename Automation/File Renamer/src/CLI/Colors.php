<?php

declare(strict_types=1);

namespace Phlex\CLI;

/**
 * ANSI 24-bit (true-color) terminal color helpers.
 * All methods return escape-code-wrapped strings — nothing is printed directly.
 */
final class Colors
{
    // ── Brand palette (RGB) ──────────────────────────────────────────────────
    public const BRAND_BLUE     = [79,  195, 247];   // #4FC3F7
    public const BRAND_CYAN     = [0,   229, 255];   // #00E5FF
    public const BRAND_PURPLE   = [179, 136, 255];   // #B388FF
    public const BRAND_GREEN    = [105, 240, 174];   // #69F0AE
    public const BRAND_YELLOW   = [255, 214,  0];    // #FFD600
    public const BRAND_RED      = [255,  82,  82];   // #FF5252
    public const BRAND_ORANGE   = [255, 145,  0];    // #FF9100
    public const BRAND_GRAY     = [120, 144, 156];   // #78909C
    public const BRAND_WHITE    = [236, 239, 241];   // #ECEFF1
    public const BRAND_DIM      = [55,  71,  79];    // #37474F

    // ── Foreground (text) ────────────────────────────────────────────────────

    public static function rgb(int $r, int $g, int $b, string $text): string
    {
        return "\e[38;2;{$r};{$g};{$b}m{$text}\e[0m";
    }

    public static function fromPalette(array $color, string $text): string
    {
        return self::rgb($color[0], $color[1], $color[2], $text);
    }

    // ── Background ───────────────────────────────────────────────────────────

    public static function bgRgb(int $r, int $g, int $b, string $text): string
    {
        return "\e[48;2;{$r};{$g};{$b}m{$text}\e[0m";
    }

    // ── Compound (fg + bg) ───────────────────────────────────────────────────

    public static function badge(array $bg, array $fg, string $text): string
    {
        return "\e[48;2;{$bg[0]};{$bg[1]};{$bg[2]}m"
             . "\e[38;2;{$fg[0]};{$fg[1]};{$fg[2]}m"
             . " {$text} "
             . "\e[0m";
    }

    // ── Typography helpers ───────────────────────────────────────────────────

    public static function bold(string $text): string
    {
        return "\e[1m{$text}\e[0m";
    }

    public static function dim(string $text): string
    {
        return "\e[2m{$text}\e[0m";
    }

    public static function italic(string $text): string
    {
        return "\e[3m{$text}\e[0m";
    }

    public static function underline(string $text): string
    {
        return "\e[4m{$text}\e[0m";
    }

    // ── Reset ────────────────────────────────────────────────────────────────

    public static function reset(): string
    {
        return "\e[0m";
    }

    // ── Shorthand semantic helpers ────────────────────────────────────────────

    public static function success(string $text): string
    {
        return self::fromPalette(self::BRAND_GREEN, $text);
    }

    public static function error(string $text): string
    {
        return self::fromPalette(self::BRAND_RED, $text);
    }

    public static function warning(string $text): string
    {
        return self::fromPalette(self::BRAND_ORANGE, $text);
    }

    public static function info(string $text): string
    {
        return self::fromPalette(self::BRAND_CYAN, $text);
    }

    public static function muted(string $text): string
    {
        return self::fromPalette(self::BRAND_GRAY, $text);
    }

    public static function highlight(string $text): string
    {
        return self::fromPalette(self::BRAND_PURPLE, $text);
    }

    public static function white(string $text): string
    {
        return self::fromPalette(self::BRAND_WHITE, $text);
    }
}
