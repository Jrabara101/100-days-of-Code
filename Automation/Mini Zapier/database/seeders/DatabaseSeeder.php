<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Integrations\Enums\WorkflowStatus;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Models\WorkflowStep;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------------------
        // Workflow #8802: Onboard New Client
        // ---------------------------------------------------------------------
        $wf8802 = Workflow::updateOrCreate(['id' => 8802], [
            'name' => 'Onboard New Client',
            'trigger_type' => 'Webhook',
            'trigger_name' => 'Inbound User Registration',
            'trigger_route' => '/hooks/user-registration',
            'status' => WorkflowStatus::ACTIVE,
            'summary_mapping' => 'trigger.email -> slack.msg',
            'is_active' => true,
        ]);

        WorkflowStep::updateOrCreate(
            ['workflow_id' => $wf8802->id, 'order' => 1],
            [
                'name' => 'Create HubSpot Contact',
                'action_key' => 'hubspot.create_contact',
                'template' => [
                    'firstname' => '{{ trigger.user.name }}',
                    'email' => '{{ trigger.user.email }}',
                ],
            ]
        );

        WorkflowStep::updateOrCreate(
            ['workflow_id' => $wf8802->id, 'order' => 2],
            [
                'name' => 'Send Slack Notification',
                'action_key' => 'slack.send_message',
                'template' => [
                    'channel' => '#onboarding',
                    'message' => 'New Client Registered: {{ trigger.user.name }} ({{ trigger.user.email }}). HubSpot Contact ID: {{ step_1.contact_id }}',
                ],
            ]
        );

        WorkflowExecution::updateOrCreate(['id' => 8802], [
            'workflow_id' => $wf8802->id,
            'status' => WorkflowStatus::SUCCESS,
            'trigger_payload' => [
                'user' => [
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                ],
            ],
            'accumulated_context' => [
                'trigger' => [
                    'user' => [
                        'name' => 'Jane Doe',
                        'email' => 'jane@example.com',
                    ],
                ],
                'step_1' => [
                    'contact_id' => 'hub_9921',
                    'email' => 'jane@example.com',
                ],
                'step_2' => [
                    'ok' => true,
                    'channel' => '#onboarding',
                ],
            ],
            'topology_trace' => [
                [
                    'order' => 1,
                    'name' => 'Create HubSpot Contact',
                    'action_key' => 'hubspot.create_contact',
                    'duration' => 0.32,
                    'status' => 'SUCCESS',
                    'traces' => [
                        ['token' => '{{ trigger.user.name }}', 'resolved' => 'Jane Doe', 'target' => 'firstname'],
                        ['token' => '{{ trigger.user.email }}', 'resolved' => 'jane@example.com', 'target' => 'email'],
                    ],
                    'output' => ['contact_id' => 'hub_9921'],
                ],
                [
                    'order' => 2,
                    'name' => 'Send Slack Notification',
                    'action_key' => 'slack.send_message',
                    'duration' => 0.15,
                    'status' => 'SUCCESS',
                    'traces' => [
                        ['token' => '{{ trigger.user.name }}', 'resolved' => 'Jane Doe', 'target' => 'message'],
                        ['token' => '{{ trigger.user.email }}', 'resolved' => 'jane@example.com', 'target' => 'message'],
                        ['token' => '{{ step_1.contact_id }}', 'resolved' => 'hub_9921', 'target' => 'message'],
                    ],
                    'output' => ['ok' => true],
                ],
            ],
            'total_duration_seconds' => 0.47,
            'executed_at' => now()->subMinutes(2),
        ]);

        // ---------------------------------------------------------------------
        // Workflow #8801: Sync Jira Ticket
        // ---------------------------------------------------------------------
        $wf8801 = Workflow::updateOrCreate(['id' => 8801], [
            'name' => 'Sync Jira Ticket',
            'trigger_type' => 'Webhook',
            'trigger_name' => 'Webhook: Jira.IssueCreated',
            'trigger_route' => '/hooks/jira',
            'status' => WorkflowStatus::ACTIVE,
            'summary_mapping' => 'hook.issue_id -> db.ticket',
            'is_active' => true,
        ]);

        WorkflowStep::updateOrCreate(
            ['workflow_id' => $wf8801->id, 'order' => 1],
            [
                'name' => 'Sync Jira Ticket',
                'action_key' => 'jira.sync_ticket',
                'template' => [
                    'issue_id' => '{{ trigger.issue.id }}',
                    'summary' => '{{ trigger.issue.summary }}',
                    'description' => '{{ trigger.issue.description }}',
                ],
            ]
        );

        WorkflowExecution::updateOrCreate(['id' => 8801], [
            'workflow_id' => $wf8801->id,
            'status' => WorkflowStatus::SUCCESS,
            'trigger_payload' => [
                'issue' => [
                    'id' => '10492',
                    'summary' => 'Memory leak in queue daemon',
                    'description' => 'High memory consumption under heavy load',
                ],
            ],
            'accumulated_context' => [
                'trigger' => [
                    'issue' => ['id' => '10492'],
                ],
                'step_1' => [
                    'ticket_key' => 'ENG-10492',
                    'status' => 'IN_PROGRESS',
                ],
            ],
            'topology_trace' => [
                [
                    'order' => 1,
                    'name' => 'Sync Jira Ticket',
                    'action_key' => 'jira.sync_ticket',
                    'duration' => 0.21,
                    'status' => 'SUCCESS',
                    'traces' => [
                        ['token' => '{{ trigger.issue.id }}', 'resolved' => '10492', 'target' => 'issue_id'],
                    ],
                ],
            ],
            'total_duration_seconds' => 0.21,
            'executed_at' => now()->subMinutes(5),
        ]);

        // ---------------------------------------------------------------------
        // Workflow #8800: Failed Payment Alert
        // ---------------------------------------------------------------------
        $wf8800 = Workflow::updateOrCreate(['id' => 8800], [
            'name' => 'Failed Payment Alert',
            'trigger_type' => 'Webhook',
            'trigger_name' => 'Webhook: Stripe.PaymentFailed',
            'trigger_route' => '/hooks/stripe/failed',
            'status' => WorkflowStatus::ACTIVE,
            'summary_mapping' => 'null -> slack.channel',
            'is_active' => true,
        ]);

        WorkflowStep::updateOrCreate(
            ['workflow_id' => $wf8800->id, 'order' => 1],
            [
                'name' => 'Send Slack Notification',
                'action_key' => 'slack.send_message',
                'template' => [
                    'channel' => '{{ trigger.missing_channel }}',
                    'message' => 'Payment failed for customer {{ trigger.customer_id }}',
                ],
            ]
        );

        WorkflowExecution::updateOrCreate(['id' => 8800], [
            'workflow_id' => $wf8800->id,
            'status' => WorkflowStatus::FAILED,
            'trigger_payload' => [
                'customer_id' => 'cus_99182',
                'amount' => 4900,
            ],
            'accumulated_context' => [
                'trigger' => [
                    'customer_id' => 'cus_99182',
                ],
            ],
            'topology_trace' => [
                [
                    'order' => 1,
                    'name' => 'Send Slack Notification',
                    'action_key' => 'slack.send_message',
                    'duration' => 0.01,
                    'status' => 'FAILED',
                    'error' => 'Invalid payload: Slack channel [] or message cannot be null or empty.',
                    'traces' => [
                        ['token' => '{{ trigger.missing_channel }}', 'resolved' => null, 'target' => 'channel'],
                    ],
                ],
            ],
            'total_duration_seconds' => 0.01,
            'error_message' => 'Invalid payload: Slack channel [] or message cannot be null or empty.',
            'executed_at' => now()->subMinutes(8),
        ]);
    }
}
