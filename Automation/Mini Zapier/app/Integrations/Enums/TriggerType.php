<?php

declare(strict_types=1);

namespace App\Integrations\Enums;

enum TriggerType: string
{
    case WEBHOOK = 'Webhook';
    case SCHEDULE = 'Schedule';
    case EVENT = 'Event';

    public function icon(): string
    {
        return match ($this) {
            self::WEBHOOK => '⚡',
            self::SCHEDULE => '⏰',
            self::EVENT => '📡',
        };
    }
}
