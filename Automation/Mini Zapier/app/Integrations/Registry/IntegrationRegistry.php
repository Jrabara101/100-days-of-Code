<?php

declare(strict_types=1);

namespace App\Integrations\Registry;

use App\Integrations\Attributes\AsAction;
use App\Integrations\Attributes\AsTrigger;
use App\Integrations\Contracts\ActionInterface;
use App\Integrations\Contracts\TriggerInterface;
use App\Integrations\HubSpot\CreateHubSpotContactAction;
use App\Integrations\Jira\SyncJiraTicketAction;
use App\Integrations\Slack\SendSlackNotificationAction;
use App\Integrations\Triggers\DailyMidnightScheduleTrigger;
use App\Integrations\Triggers\StripePaymentWebhookTrigger;
use App\Integrations\Triggers\UserCreatedEventTrigger;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;
use ReflectionClass;

/**
 * Strategy Registry and Service Container Resolver for CoreLink Integrations.
 *
 * Utilizes PHP 8.2+ Attributes to inspect registered Action and Trigger strategies,
 * while utilizing Laravel's Service Container for dependency injection.
 */
class IntegrationRegistry
{
    /**
     * @var array<string, class-string<ActionInterface>>
     */
    private array $actions = [];

    /**
     * @var array<string, class-string<TriggerInterface>>
     */
    private array $triggers = [];

    public function __construct(
        private readonly Container $container
    ) {
        $this->registerDefaults();
    }

    /**
     * Register default built-in Actions and Triggers.
     */
    private function registerDefaults(): void
    {
        $this->registerAction(SendSlackNotificationAction::class);
        $this->registerAction(CreateHubSpotContactAction::class);
        $this->registerAction(SyncJiraTicketAction::class);

        $this->registerTrigger(StripePaymentWebhookTrigger::class);
        $this->registerTrigger(DailyMidnightScheduleTrigger::class);
        $this->registerTrigger(UserCreatedEventTrigger::class);
    }

    /**
     * Register an Action Strategy class.
     *
     * @param class-string<ActionInterface> $actionClass
     */
    public function registerAction(string $actionClass): void
    {
        $reflection = new ReflectionClass($actionClass);
        $attributes = $reflection->getAttributes(AsAction::class);

        if (! empty($attributes)) {
            /** @var AsAction $instance */
            $instance = $attributes[0]->newInstance();
            $this->actions[$instance->id] = $actionClass;
        }

        // Also index by FQCN
        $this->actions[$actionClass] = $actionClass;
    }

    /**
     * Register a Trigger class.
     *
     * @param class-string<TriggerInterface> $triggerClass
     */
    public function registerTrigger(string $triggerClass): void
    {
        $reflection = new ReflectionClass($triggerClass);
        $attributes = $reflection->getAttributes(AsTrigger::class);

        if (! empty($attributes)) {
            /** @var AsTrigger $instance */
            $instance = $attributes[0]->newInstance();
            $this->triggers[$instance->id] = $triggerClass;
        }

        $this->triggers[$triggerClass] = $triggerClass;
    }

    /**
     * Resolve an Action Strategy instance from the Service Container.
     *
     * @param string $actionIdentifier Action ID (e.g. 'slack.send_message') or FQCN
     */
    public function resolveAction(string $actionIdentifier): ActionInterface
    {
        $class = $this->actions[$actionIdentifier] ?? null;

        if (! $class && class_exists($actionIdentifier) && is_subclass_of($actionIdentifier, ActionInterface::class)) {
            $class = $actionIdentifier;
        }

        if (! $class) {
            throw new InvalidArgumentException("Action strategy [{$actionIdentifier}] is not registered in CoreLink.");
        }

        // Strategy resolved via Laravel Service Container (supports DI constructor dependencies)
        return $this->container->make($class);
    }

    /**
     * Resolve a Trigger instance.
     */
    public function resolveTrigger(string $triggerIdentifier): TriggerInterface
    {
        $class = $this->triggers[$triggerIdentifier] ?? null;

        if (! $class && class_exists($triggerIdentifier) && is_subclass_of($triggerIdentifier, TriggerInterface::class)) {
            $class = $triggerIdentifier;
        }

        if (! $class) {
            throw new InvalidArgumentException("Trigger [{$triggerIdentifier}] is not registered in CoreLink.");
        }

        return $this->container->make($class);
    }

    /**
     * Return all registered active triggers for daemon monitoring.
     *
     * @return array<TriggerInterface>
     */
    public function getActiveTriggers(): array
    {
        $uniqueClasses = array_unique(array_values($this->triggers));
        $resolved = [];

        foreach ($uniqueClasses as $class) {
            $resolved[] = $this->container->make($class);
        }

        return $resolved;
    }

    /**
     * @return array<string, class-string<ActionInterface>>
     */
    public function getRegisteredActions(): array
    {
        return $this->actions;
    }
}
