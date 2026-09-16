<?php

declare(strict_types=1);

namespace App\Enums;

enum WorkflowStatus: string
{
    case INITIALIZED = 'initialized';
    case RUNNING = 'running';
    case PAUSED = 'paused';
    case COMPLETED = 'completed';
    case FAILED = 'failed';

    public function isFinished(): bool
    {
        return match ($this) {
            self::COMPLETED, self::FAILED => true,
            default => false,
        };
    }
}
