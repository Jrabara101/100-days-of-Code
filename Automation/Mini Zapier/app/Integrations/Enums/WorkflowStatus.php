<?php

declare(strict_types=1);

namespace App\Integrations\Enums;

enum WorkflowStatus: string
{
    case DRAFT = 'DRAFT';
    case ACTIVE = 'ACTIVE';
    case PENDING = 'PENDING';
    case RUNNING = 'RUNNING';
    case SUCCESS = 'SUCCESS';
    case FAILED = 'FAILED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::ACTIVE => 'Active',
            self::PENDING => 'Pending',
            self::RUNNING => 'Running',
            self::SUCCESS => '[SUCCESS]',
            self::FAILED => '[FAILED] ❌',
            self::CANCELLED => '[CANCELLED]',
        };
    }

    public function colorClass(): string
    {
        return match ($this) {
            self::SUCCESS => 'text-emerald-400 font-bold',
            self::FAILED => 'text-rose-500 font-bold',
            self::RUNNING => 'text-amber-400 font-bold animate-pulse',
            self::PENDING => 'text-blue-400',
            default => 'text-slate-400',
        };
    }
}
