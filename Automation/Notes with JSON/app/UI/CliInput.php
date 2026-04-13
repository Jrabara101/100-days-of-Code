<?php

namespace App\UI;

use App\Helpers\Color;

/**
 * Handle user input in CLI
 */
class CliInput
{
    public static function read(string $prompt = "> ", bool $required = false): string
    {
        while (true) {
            echo Color::apply($prompt, Color::B_CYAN);
            $input = trim(fgets(STDIN));
            
            if ($required && $input === "") {
                echo Color::error("This field is required.") . PHP_EOL;
                continue;
            }
            
            return $input;
        }
    }

    public static function readMultiLine(string $prompt = "Enter content (Type '.' on a new line to save):"): string
    {
        echo Color::apply($prompt, Color::B_CYAN) . PHP_EOL;
        $lines = [];
        while (true) {
            $line = fgets(STDIN);
            if (trim($line) === ".") {
                break;
            }
            $lines[] = $line;
        }
        return rtrim(implode("", $lines));
    }

    public static function confirm(string $message = "Are you sure?", bool $default = false): bool
    {
        $suffix = $default ? "[Y/n]" : "[y/N]";
        echo Color::warning($message . " " . $suffix . " ");
        $input = strtolower(trim(fgets(STDIN)));

        if ($input === "") return $default;
        return $input === 'y';
    }

    public static function askSecret(string $prompt = "Enter password: "): string
    {
        // On Windows, this is harder to hide input without external deps, 
        // using simple read for now.
        return self::read($prompt);
    }
}
