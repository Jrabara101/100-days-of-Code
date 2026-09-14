<?php

declare(strict_types=1);

namespace App\Nodes\Core;

use App\DTOs\WorkflowContext;
use App\Enums\LogLevel;
use App\Exceptions\WorkflowExecutionException;
use App\Models\Configurations\WebhookNodeConfig;
use App\Nodes\Contracts\NodeInterface;
use Closure;

class WebhookReceiverNode implements NodeInterface
{
    public function __construct(
        protected ?WebhookNodeConfig $config = null,
    ) {
    }

    public function key(): string
    {
        return 'WebhookReceiverNode';
    }

    public function label(): string
    {
        return 'WebhookReceiverNode';
    }

    public function handle(WorkflowContext $context, Closure $next): WorkflowContext
    {
        $payload = $context->payload;

        // Verify incoming event structure
        $eventType = $payload->get('event_type') ?? $payload->get('type');
        if (! $eventType) {
            throw new WorkflowExecutionException(
                message: 'Invalid webhook payload: Missing event type identifier.',
                nodeKey: $this->key(),
            );
        }

        // Simulate signature and schema validation
        usleep(20000); // 20ms simulation

        $mutatedPayload = $payload
            ->withMeta('validated_at', now()->toIso8601String())
            ->withMeta('webhook_verified', true)
            ->with('validation.status', 'PASSED')
            ->with('validation.schema_version', 'stripe_v2');

        $updatedContext = $context
            ->withPayload($mutatedPayload)
            ->withStepOutput($this->key(), [
                'status_detail' => 'Payload Validated',
                'event_type' => $eventType,
            ])
            ->addLog(
                level: LogLevel::SUCCESS,
                message: 'Webhook payload verified and schema validated.',
                nodeKey: $this->key(),
            );

        return $next($updatedContext);
    }
}
