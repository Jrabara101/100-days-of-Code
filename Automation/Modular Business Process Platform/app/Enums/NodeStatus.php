<?php

declare(strict_types=1);

namespace App\Enums;

enum NodeStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case SKIPPED = 'skipped';
    case RATE_LIMITED = 'rate_limited';

    public function isTerminal(): bool
    {
        return match ($this) {
            self::COMPLETED, self::FAILED, self::SKIPPED => true,
            default => false,
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::COMPLETED => '✔',
            self::PROCESSING => '⚙',
            self::FAILED => '✖',
            self::SKIPPED => '↷',
            self::RATE_LIMITED => '⏳',
            self::PENDING => ' ',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::COMPLETED => 'Completed',
            self::PROCESSING => 'Running',
            self::FAILED => 'Failed',
            self::SKIPPED => 'Skipped',
            self::RATE_LIMITED => 'Rate Limited',
            self::PENDING => 'Pending',
        };
    }
}
