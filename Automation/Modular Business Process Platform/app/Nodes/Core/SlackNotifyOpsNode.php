<?php

declare(strict_types=1);

namespace App\Nodes\Core;

use App\DTOs\WorkflowContext;
use App\Enums\LogLevel;
use App\Models\Configurations\SlackNodeConfig;
use App\Nodes\Contracts\NodeInterface;
use Closure;

class SlackNotifyOpsNode implements NodeInterface
{
    public function __construct(
        protected ?SlackNodeConfig $config = null,
    ) {
    }

    public function key(): string
    {
        return 'SlackNotifyOpsNode';
    }

    public function label(): string
    {
        return 'SlackNotifyOpsNode';
    }

    public function handle(WorkflowContext $context, Closure $next): WorkflowContext
    {
        usleep(30000); // 30ms simulation

        $payload = $context->payload;
        $channel = $this->config?->channel ?? '#ops-alerts';
        $customerName = $payload->get('extracted.customer.name') ?? 'Sarah Connor';
        $amount = $payload->get('extracted.invoice.amount_formatted') ?? '$1,450.00';

        $slackMessage = [
            'channel' => $channel,
            'text' => "🎉 Processed invoice for *{$customerName}* ({$amount})",
            'timestamp' => now()->toIso8601String(),
            'ts_id' => microtime(true),
        ];

        $mutatedPayload = $payload
            ->with('dispatches.slack', $slackMessage);

        $updatedContext = $context
            ->withPayload($mutatedPayload)
            ->withStepOutput($this->key(), [
                'status_detail' => "Alerted: {$channel}",
                'slack_message' => $slackMessage,
            ])
            ->addLog(
                level: LogLevel::SUCCESS,
                message: "Operations notification published to Slack channel {$channel}.",
                nodeKey: $this->key(),
            );

        return $next($updatedContext);
    }
}
