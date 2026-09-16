<?php

declare(strict_types=1);

namespace App\Enums;

enum LogLevel: string
{
    case INFO = 'INFO';
    case SUCCESS = 'SUCCESS';
    case QUEUE = 'QUEUE';
    case WARNING = 'WARNING';
    case ERROR = 'ERROR';
    case RETRY = 'RETRY';

    public function color(): string
    {
        return match ($this) {
            self::INFO => 'cyan',
            self::SUCCESS => 'green',
            self::QUEUE => 'yellow',
            self::WARNING => 'amber',
            self::ERROR => 'red',
            self::RETRY => 'magenta',
        };
    }
}
