<?php

namespace App\Console;

class Style
{
    private const COLORS = [
        'reset' => "\033[0m",
        'black' => "\033[30m",
        'red' => "\033[31m",
        'green' => "\033[32m",
        'yellow' => "\033[33m",
        'blue' => "\033[34m",
        'magenta' => "\033[35m",
        'cyan' => "\033[36m",
        'white' => "\033[37m",
        'bg_blue' => "\033[44m",
        'bg_red' => "\033[41m",
        'bg_green' => "\033[42m",
        'bold' => "\033[1m",
    ];

    public static function format(string $text, string $color, bool $bold = false): string
    {
        $prefix = self::COLORS[$color] ?? '';
        $prefix .= $bold ? self::COLORS['bold'] : '';
        $suffix = self::COLORS['reset'];
        
        return "{$prefix}{$text}{$suffix}";
    }

    public static function print(string $text, string $color = 'white', bool $bold = false): void
    {
        echo self::format($text, $color, $bold) . PHP_EOL;
    }

    public static function success(string $text): void
    {
        echo self::format(" SUCCESS ", 'bg_green', true) . " " . self::format($text, 'green') . PHP_EOL;
    }

    public static function error(string $text): void
    {
        echo self::format(" ERROR ", 'bg_red', true) . " " . self::format($text, 'red') . PHP_EOL;
    }

    public static function warning(string $text): void
    {
        echo self::format(" WARNING ", 'yellow', true) . " " . self::format($text, 'yellow') . PHP_EOL;
    }

    public static function info(string $text): void
    {
        echo self::format(" INFO ", 'bg_blue', true) . " " . self::format($text, 'blue') . PHP_EOL;
    }

    public static function displayWeatherDashboard(array $data): void
    {
        $loc = $data['location'];
        $current = $data['current'];
        
        $locationStr = "{$loc['name']}, {$loc['region']}";
        $tempStr = "{$current['temp_c']} °C";
        $feelsStr = "{$current['feelslike_c']} °C";
        $conditionStr = $current['condition']['text'];
        $humidityStr = "{$current['humidity']}%";
        $windStr = "{$current['wind_kph']} km/h {$current['wind_dir']}";
        $updatedAt = $current['last_updated'];

        $width = 50;
        $border = str_repeat('=', $width);
        
        echo PHP_EOL;
        self::print("+" . str_repeat('-', $width - 2) . "+", 'cyan');
        self::print("|" . str_pad(" PHILIPPINES WEATHER REPORT ", $width - 2, " ", STR_PAD_BOTH) . "|", 'cyan', true);
        self::print("+" . str_repeat('-', $width - 2) . "+", 'cyan');
        
        self::print(sprintf("| %-15s : %-29s|", "Location", $locationStr), 'white', true);
        self::print(sprintf("| %-15s : %-29s|", "Condition", $conditionStr), 'yellow', true);
        self::print(sprintf("| %-15s : %-29s|", "Temperature", $tempStr), 'white', true);
        self::print(sprintf("| %-15s : %-29s|", "Feels Like", $feelsStr), 'white');
        self::print(sprintf("| %-15s : %-29s|", "Humidity", $humidityStr), 'cyan');
        self::print(sprintf("| %-15s : %-29s|", "Wind", $windStr), 'green');
        
        self::print("+" . str_repeat('-', $width - 2) . "+", 'cyan');
        self::print(sprintf("| %-46s |", "Last Updated: " . $updatedAt), 'magenta');
        self::print("+" . str_repeat('-', $width - 2) . "+", 'cyan');
        echo PHP_EOL;
    }

    public static function title(string $title): void
    {
        echo PHP_EOL;
        self::print($title, 'cyan', true);
        self::print(str_repeat('=', strlen($title)), 'cyan');
    }
}
