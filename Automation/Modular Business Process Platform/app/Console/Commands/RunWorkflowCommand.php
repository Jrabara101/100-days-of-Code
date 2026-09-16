<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\DTOs\WorkflowContext;
use App\DTOs\WorkflowPayload;
use App\Engine\WorkflowManager;
use App\Enums\WorkflowStatus;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowNodeExecution;
use App\Models\WorkflowRun;
use App\Rendering\CliTopologyRenderer;
use Illuminate\Console\Command;
use Throwable;

class RunWorkflowCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'automata:run
        {workflow=WF-992-ALPHA : The workflow run or definition identifier}
        {--resume : Resume previous run from last successful state idempotently}
        {--fail-at= : Inject simulated failure at specific node for idempotency testing}
        {--rate-limit-at= : Inject simulated rate limit at specific node for backoff testing}
        {--queue=Redis : Name of the queue driver to display in dashboard}';

    /**
     * The console command description.
     */
    protected $description = 'Execute a modular BPA workflow DAG pipeline with live Termwind visual topology';

    public function handle(WorkflowManager $workflowManager, CliTopologyRenderer $renderer): int
    {
        $workflowId = (string) $this->argument('workflow');
        $resume = (bool) $this->option('resume');
        $failAt = $this->option('fail-at');
        $rateLimitAt = $this->option('rate-limit-at');
        $queueDriver = (string) $this->option('queue');

        $renderer->setOutput($this->output);
        $renderer->setQueueDriver($queueDriver);

        // Find or create definition
        /** @var WorkflowDefinition|null $definition */
        $definition = WorkflowDefinition::with('nodes.configurable')->find($workflowId);

        if (! $definition) {
            $jsonPath = base_path('workflows/stripe_invoice_workflow.json');
            if (file_exists($jsonPath)) {
                $this->call('db:seed');
                $definition = WorkflowDefinition::with('nodes.configurable')->find($workflowId);
            }
        }

        if (! $definition) {
            $this->error("Workflow definition [{$workflowId}] not found in database or workflows directory.");
            return Command::FAILURE;
        }

        // Load sample payload from definition file if starting fresh
        $jsonFile = base_path('workflows/stripe_invoice_workflow.json');
        $initialData = [];
        $initialMeta = [];

        if (file_exists($jsonFile)) {
            $raw = json_decode(file_get_contents($jsonFile), true, 512, JSON_THROW_ON_ERROR);
            $initialData = $raw['sample_payload'] ?? [];
            $initialMeta = $raw['sample_payload']['_meta'] ?? [];
        }

        if ($failAt) {
            $initialData['__simulation']['fail_at'] = $failAt;
        }

        if ($rateLimitAt) {
            $initialData['__simulation']['rate_limit_at'] = $rateLimitAt;
        }

        $payload = WorkflowPayload::fromArray($initialData, $initialMeta);

        // Bind real-time state observer to re-render CLI topology on each transition
        $workflowManager->onStateChange(
            function (WorkflowRun $run, WorkflowContext $context, ?WorkflowNodeExecution $activeExec) use ($renderer): void {
                $executions = WorkflowNodeExecution::where('workflow_run_id', $run->id)
                    ->orderBy('order_index')
                    ->get();

                $renderer->renderDashboard(
                    run: $run,
                    context: $context,
                    executions: $executions,
                    activeExecution: $activeExec,
                    clear: true,
                );

                // Small pause for realistic terminal animation visualization
                usleep(180000);
            }
        );

        $runId = $workflowId;

        try {
            $resultContext = $workflowManager->executeRun(
                runId: $runId,
                definition: $definition,
                initialPayload: $payload,
                resume: $resume,
            );

            // Final render to ensure terminal state is reflected
            $finalRun = WorkflowRun::find($runId);
            $finalExecutions = WorkflowNodeExecution::where('workflow_run_id', $runId)
                ->orderBy('order_index')
                ->get();

            $renderer->renderDashboard(
                run: $finalRun,
                context: $resultContext,
                executions: $finalExecutions,
                activeExecution: null,
                clear: true,
            );

            $this->newLine();
            $this->info("✨ Workflow [{$runId}] completed successfully.");

            return Command::SUCCESS;
        } catch (Throwable $e) {
            $finalRun = WorkflowRun::find($runId);
            $finalExecutions = WorkflowNodeExecution::where('workflow_run_id', $runId)
                ->orderBy('order_index')
                ->get();

            $emptyContext = WorkflowContext::create(
                runId: $runId,
                definitionId: $definition->id,
                trigger: $definition->trigger_type,
                payload: $payload,
            );

            $renderer->renderDashboard(
                run: $finalRun ?? new WorkflowRun(['id' => $runId, 'trigger_source' => $definition->trigger_type, 'status' => WorkflowStatus::FAILED]),
                context: $emptyContext,
                executions: $finalExecutions,
                activeExecution: null,
                clear: false,
            );

            $this->newLine();
            $this->error(" Pipeline halted: {$e->getMessage()}");
            $this->warn("Tip: Fix the issue and resume idempotently using: php artisan automata:run {$runId} --resume");

            return Command::FAILURE;
        }
    }
}
