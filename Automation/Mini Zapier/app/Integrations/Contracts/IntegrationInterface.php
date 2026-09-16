<?php

declare(strict_types=1);

namespace App\Integrations\Contracts;

/**
 * Contract for full Integration suites (e.g. Slack, Jira, HubSpot).
 */
interface IntegrationInterface
{
    public function getId(): string;

    public function getName(): string;

    public function getIcon(): string;

    /**
     * @return array<class-string<ActionInterface>>
     */
    public function getActions(): array;

    /**
     * @return array<class-string<TriggerInterface>>
     */
    public function getTriggers(): array;
}
