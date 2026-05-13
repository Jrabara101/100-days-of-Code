<?php

declare(strict_types=1);

namespace PromoForge\UI;

class AnsiStyle
{
    public const RESET = "\e[0m";
    public const BOLD = "\e[1m";
    public const DIM = "\e[2m";
    
    public const RED = "\e[31m";
    public const GREEN = "\e[32m";
    public const YELLOW = "\e[33m";
    public const BLUE = "\e[34m";
    public const MAGENTA = "\e[35m";
    public const CYAN = "\e[36m";
    public const WHITE = "\e[37m";
    
    public const BG_BLUE = "\e[44m";
    
    public static function format(string $text, string ...$styles): string
    {
        $styleStr = implode('', $styles);
        return $styleStr . $text . self::RESET;
    }
}
