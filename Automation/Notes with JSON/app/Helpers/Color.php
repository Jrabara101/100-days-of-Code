<?php

namespace App\Helpers;

/**
 * Senior ANSI Color Utility for Premium CLI Output
 */
class Color
{
    private const ESC = "\033[";
    
    public const RESET = self::ESC . "0m";
    public const BOLD = self::ESC . "1m";
    public const DIM = self::ESC . "2m";
    public const UNDERLINE = self::ESC . "4m";
    
    // Foreground Colors
    public const BLACK = self::ESC . "30m";
    public const RED = self::ESC . "31m";
    public const GREEN = self::ESC . "32m";
    public const YELLOW = self::ESC . "33m";
    public const BLUE = self::ESC . "34m";
    public const MAGENTA = self::ESC . "35m";
    public const CYAN = self::ESC . "36m";
    public const WHITE = self::ESC . "37m";
    public const GRAY = self::ESC . "90m";
    
    // Bright Foreground
    public const B_RED = self::ESC . "91m";
    public const B_GREEN = self::ESC . "92m";
    public const B_YELLOW = self::ESC . "93m";
    public const B_BLUE = self::ESC . "94m";
    public const B_CYAN = self::ESC . "96m";
    
    // Background Colors
    public const BG_BLACK = self::ESC . "40m";
    public const BG_RED = self::ESC . "41m";
    public const BG_GREEN = self::ESC . "42m";
    public const BG_YELLOW = self::ESC . "43m";
    public const BG_BLUE = self::ESC . "44m";
    
    public static function apply(string $text, string $color, bool $bold = false): string
    {
        $prefix = $bold ? self::BOLD : "";
        return $prefix . $color . $text . self::RESET;
    }

    public static function success(string $text): string
    {
        return self::apply($text, self::GREEN, true);
    }

    public static function error(string $text): string
    {
        return self::apply($text, self::RED, true);
    }

    public static function warning(string $text): string
    {
        return self::apply($text, self::YELLOW, true);
    }

    public static function info(string $text): string
    {
        return self::apply($text, self::CYAN, true);
    }

    public static function header(string $text): string
    {
        return self::apply($text, self::WHITE, true);
    }

    public static function bold(string $text): string
    {
        return self::BOLD . $text . self::RESET;
    }
}
