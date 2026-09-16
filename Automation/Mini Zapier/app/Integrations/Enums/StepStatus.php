<?php

declare(strict_types=1);

namespace App\Integrations\Enums;

enum StepStatus: string
{
    case PENDING = 'PENDING';
    case RUNNING = 'RUNNING';
    case SUCCESS = 'SUCCESS';
    case FAILED = 'FAILED';
    case SKIPPED = 'SKIPPED';

    public function badge(): string
    {
        return match ($this) {
            self::SUCCESS => '[✔]',
            self::FAILED => '[❌]',
            self::RUNNING => '[⏳]',
            self::PENDING => '[⏸]',
            self::SKIPPED => '[⏭]',
        };
    }
}
