<?php

declare(strict_types=1);

namespace App\Integrations\Triggers;

use App\Integrations\Attributes\AsTrigger;
use App\Integrations\Contracts\TriggerInterface;
use App\Integrations\Enums\TriggerType;

#[AsTrigger(
    id: 'eloquent.user_created',
    name: 'Event: Eloquent.UserCreated',
    type: 'Event',
    route: 'Internal Bus',
    description: 'Triggered when a new App\\Models\\User model is persisted.',
    outputSchema: [
        'user' => [
            'id' => 'integer',
            'name' => 'string',
            'email' => 'string',
        ],
    ]
)]
class UserCreatedEventTrigger implements TriggerInterface
{
    public function getId(): string
    {
        return 'eloquent.user_created';
    }

    public function getName(): string
    {
        return 'Event: Eloquent.UserCreated';
    }

    public function getType(): TriggerType
    {
        return TriggerType::EVENT;
    }

    public function getRoute(): string
    {
        return 'Internal Bus';
    }

    public function getOutputSchema(): array
    {
        return [
            'user' => 'array',
        ];
    }
}
