<?php

declare(strict_types=1);

namespace App\Integrations\Triggers;

use App\Integrations\Attributes\AsTrigger;
use App\Integrations\Contracts\TriggerInterface;
use App\Integrations\Enums\TriggerType;

#[AsTrigger(
    id: 'cron.daily_midnight',
    name: 'Schedule: Daily At Midnight',
    type: 'Schedule',
    route: 'CRON',
    description: 'Fires automatically at 00:00:00 UTC daily.',
    outputSchema: [
        'timestamp' => 'integer',
        'scheduled_for' => 'string',
    ]
)]
class DailyMidnightScheduleTrigger implements TriggerInterface
{
    public function getId(): string
    {
        return 'cron.daily_midnight';
    }

    public function getName(): string
    {
        return 'Schedule: Daily At Midnight';
    }

    public function getType(): TriggerType
    {
        return TriggerType::SCHEDULE;
    }

    public function getRoute(): string
    {
        return 'CRON';
    }

    public function getOutputSchema(): array
    {
        return [
            'timestamp' => 'integer',
            'scheduled_for' => 'string',
        ];
    }
}
