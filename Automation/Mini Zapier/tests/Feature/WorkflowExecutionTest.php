<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Integrations\Enums\WorkflowStatus;
use App\Integrations\Registry\IntegrationRegistry;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Services\WorkflowEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowExecutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_executes_two_step_workflow_chain_successfully(): void
    {
        /** @var Workflow $workflow */
        $workflow = Workflow::findOrFail(8802);

        /** @var WorkflowEngine $engine */
        $engine = $this->app->make(WorkflowEngine::class);

        $execution = $engine->dispatch($workflow, [
            'user' => [
                'name' => 'John Wick',
                'email' => 'john.wick@continental.com',
            ],
        ], sync: true);

        $this->assertNotNull($execution);
        $this->assertSame(WorkflowStatus::SUCCESS, $execution->status);

        // Check context accumulation
        $context = $execution->accumulated_context;
        $this->assertArrayHasKey('trigger', $context);
        $this->assertArrayHasKey('step_1', $context);
        $this->assertArrayHasKey('step_2', $context);
        $this->assertSame('john.wick@continental.com', $context['step_1']['email']);
        $this->assertSame('#onboarding', $context['step_2']['channel']);

        // Check topology traces
        $traces = $execution->topology_trace;
        $this->assertCount(2, $traces);
        $this->assertSame('Create HubSpot Contact', $traces[0]['name']);
        $this->assertSame('SUCCESS', $traces[0]['status']);
        $this->assertSame('Send Slack Notification', $traces[1]['name']);
        $this->assertSame('SUCCESS', $traces[1]['status']);
    }

    public function test_halts_workflow_chain_when_action_validation_fails(): void
    {
        /** @var Workflow $workflow */
        $workflow = Workflow::findOrFail(8800);

        /** @var WorkflowEngine $engine */
        $engine = $this->app->make(WorkflowEngine::class);

        try {
            $engine->dispatch($workflow, [
                'customer_id' => 'cus_error_test',
                'missing_channel' => null,
            ], sync: true);
        } catch (\Throwable $e) {
            // Expected to be thrown during sync execution
        }

        /** @var WorkflowExecution $execution */
        $execution = WorkflowExecution::where('workflow_id', 8800)->latest('id')->first();

        $this->assertNotNull($execution);
        $this->assertSame(WorkflowStatus::FAILED, $execution->status);
        $this->assertStringContainsString('Invalid payload', (string) $execution->error_message);
    }

    public function test_integration_registry_resolves_strategies_via_service_container(): void
    {
        /** @var IntegrationRegistry $registry */
        $registry = $this->app->make(IntegrationRegistry::class);

        $slackAction = $registry->resolveAction('slack.send_message');
        $hubSpotAction = $registry->resolveAction('hubspot.create_contact');
        $jiraAction = $registry->resolveAction('jira.sync_ticket');

        $this->assertSame('Send Slack Notification', $slackAction->getName());
        $this->assertSame('Create HubSpot Contact', $hubSpotAction->getName());
        $this->assertSame('Sync Jira Ticket', $jiraAction->getName());

        $triggers = $registry->getActiveTriggers();
        $this->assertGreaterThanOrEqual(3, count($triggers));
    }
}
