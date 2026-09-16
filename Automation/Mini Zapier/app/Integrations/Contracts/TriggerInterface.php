<?php

declare(strict_types=1);

namespace App\Integrations\Contracts;

use App\Integrations\Enums\TriggerType;

/**
 * Contract for inbound event triggers (Webhooks, Schedules, Database Events).
 */
interface TriggerInterface
{
    public function getId(): string;

    public function getName(): string;

    public function getType(): TriggerType;

    public function getRoute(): string;

    /**
     * @return array<string, string>
     */
    public function getOutputSchema(): array;
}
