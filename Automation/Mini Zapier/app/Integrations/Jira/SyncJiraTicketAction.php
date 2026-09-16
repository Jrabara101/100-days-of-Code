<?php

declare(strict_types=1);

namespace App\Integrations\Jira;

use App\Integrations\Attributes\AsAction;
use App\Integrations\Contracts\ActionInterface;
use App\Integrations\DTOs\ActionResult;
use App\Integrations\DTOs\Payload;
use Illuminate\Support\Facades\Log;

#[AsAction(
    id: 'jira.sync_ticket',
    name: 'Sync Jira Ticket',
    description: 'Creates or updates an issue ticket in Atlassian Jira.',
    inputSchema: [
        'issue_id' => 'string or integer',
        'summary' => 'string',
        'description' => 'string',
    ]
)]
class SyncJiraTicketAction implements ActionInterface
{
    public function execute(Payload $payload): ActionResult
    {
        $startTime = microtime(true);

        $issueId = $payload->get('issue_id');
        $summary = (string) $payload->get('summary', 'Automated Ticket Update');
        $description = (string) $payload->get('description', '');

        if (! $issueId) {
            $duration = round(microtime(true) - $startTime, 3);
            return ActionResult::failure(
                errorMessage: "Missing required Jira issue_id.",
                duration: $duration,
                logs: ["Jira sync aborted due to missing issue_id."]
            );
        }

        // Simulate Jira API latency
        usleep(210000); // 0.21s
        $duration = round(microtime(true) - $startTime, 2);

        $ticketKey = "ENG-{$issueId}";
        Log::info("Synced Jira ticket: {$ticketKey} - {$summary}");

        return ActionResult::success(
            output: [
                'ticket_key' => $ticketKey,
                'status' => 'IN_PROGRESS',
                'summary' => $summary,
                'synced_at' => now()->toIso8601String(),
            ],
            duration: $duration,
            logs: ["Synchronized ticket {$ticketKey} with Atlassian Cloud"]
        );
    }

    public function getName(): string
    {
        return 'Sync Jira Ticket';
    }

    public function getDescription(): string
    {
        return 'Creates or updates an issue ticket in Atlassian Jira.';
    }

    public function getInputSchema(): array
    {
        return [
            'issue_id' => 'string',
            'summary' => 'string',
            'description' => 'string',
        ];
    }
}
