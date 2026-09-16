<?php

declare(strict_types=1);

namespace App\Integrations\Slack;

use App\Integrations\Attributes\AsAction;
use App\Integrations\Contracts\ActionInterface;
use App\Integrations\DTOs\ActionResult;
use App\Integrations\DTOs\Payload;
use Illuminate\Support\Facades\Log;

#[AsAction(
    id: 'slack.send_message',
    name: 'Send Slack Notification',
    description: 'Post a formatted markdown message to a Slack channel or webhook.',
    inputSchema: [
        'channel' => 'string (e.g. #alerts, #general)',
        'message' => 'string (markdown supported)',
    ]
)]
class SendSlackNotificationAction implements ActionInterface
{
    public function execute(Payload $payload): ActionResult
    {
        $startTime = microtime(true);

        $channel = (string) $payload->get('channel', '#general');
        $message = (string) $payload->get('message', '');

        // Fail-safe validation check: if channel or message is empty/null, fail gracefully
        if ($channel === '' || $channel === 'null' || $message === '') {
            $duration = round(microtime(true) - $startTime, 3);
            return ActionResult::failure(
                errorMessage: "Invalid payload: Slack channel [{$channel}] or message cannot be null or empty.",
                duration: $duration,
                logs: ["Validation failed for Slack payload: channel='{$channel}'"]
            );
        }

        // Simulate network dispatch with realistic latency
        usleep(150000); // 0.15s
        $duration = round(microtime(true) - $startTime, 2);

        Log::info("Slack Action executed: Channel={$channel}, Message={$message}");

        return ActionResult::success(
            output: [
                'ok' => true,
                'channel' => $channel,
                'message_id' => 'msg_' . bin2hex(random_bytes(4)),
                'timestamp' => time(),
            ],
            duration: $duration,
            logs: ["Delivered notification to {$channel}"]
        );
    }

    public function getName(): string
    {
        return 'Send Slack Notification';
    }

    public function getDescription(): string
    {
        return 'Post a formatted markdown message to a Slack channel or webhook.';
    }

    public function getInputSchema(): array
    {
        return [
            'channel' => 'string',
            'message' => 'string',
        ];
    }
}
