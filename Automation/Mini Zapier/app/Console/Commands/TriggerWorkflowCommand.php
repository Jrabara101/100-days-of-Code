<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Workflow;
use App\Services\WorkflowEngine;
use Illuminate\Console\Command;
use function Termwind\render;

class TriggerWorkflowCommand extends Command
{
    protected $signature = 'corelink:trigger 
                            {workflow_id=8802 : The ID of the workflow to execute}
                            {--payload= : JSON string of incoming trigger payload}
                            {--sync : Run the job chain synchronously in-process}';

    protected $description = 'Trigger a CoreLink workflow and execute its asynchronous Job Chain';

    public function handle(WorkflowEngine $engine): int
    {
        $workflowId = (int) $this->argument('workflow_id');
        $rawPayload = $this->option('payload');

        /** @var Workflow|null $workflow */
        $workflow = Workflow::with('steps')->find($workflowId);

        if (! $workflow) {
            $this->error("Workflow #{$workflowId} not found.");
            return self::FAILURE;
        }

        $payload = [];
        if ($rawPayload) {
            $decoded = json_decode((string) $rawPayload, true);
            if (is_array($decoded)) {
                $payload = $decoded;
            } else {
                $this->error("Invalid JSON provided in --payload option.");
                return self::FAILURE;
            }
        } else {
            // Default sample payload based on workflow
            $payload = match ($workflowId) {
                8802 => [
                    'user' => [
                        'name' => 'Jane Doe',
                        'email' => 'jane@example.com',
                    ],
                ],
                8801 => [
                    'issue' => [
                        'id' => (string) rand(10500, 10999),
                        'summary' => 'Worker memory exhaustion under high load',
                        'description' => 'Investigate Redis queue job memory footprints',
                    ],
                ],
                8800 => [
                    'customer_id' => 'cus_' . bin2hex(random_bytes(3)),
                    'amount' => 4900,
                    'missing_channel' => null, // Deliberate failure trigger
                ],
                default => [
                    'timestamp' => time(),
                    'source' => 'CLI Trigger',
                ],
            };
        }

        render("
        <div class=\"my-1\">
            <div class=\"text-cyan-400 font-bold\">⚡ Dispatched Trigger for Workflow #{$workflow->id} [{$workflow->name}]</div>
            <div class=\"text-slate-400\">Trigger: {$workflow->trigger_name} ({$workflow->trigger_route})</div>
            <div class=\"text-slate-500\">Compiling Bus::chain with {$workflow->steps->count()} action steps...</div>
        </div>
        ");

        $sync = (bool) $this->option('sync');

        try {
            $execution = $engine->dispatch($workflow, $payload, $sync);
        } catch (\Throwable $e) {
            /** @var \App\Models\WorkflowExecution|null $execution */
            $execution = \App\Models\WorkflowExecution::where('workflow_id', $workflow->id)->latest('id')->first();
        }

        if (! $execution) {
            $this->error("Failed to retrieve execution state.");
            return self::FAILURE;
        }

        $statusColor = $execution->status?->value === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400';
        $duration = number_format((float) $execution->total_duration_seconds, 2);

        render("
        <div class=\"my-1\">
            <div class=\"{$statusColor} font-bold\">✔ Execution #{$execution->id} Completed: [{$execution->status?->value}] in {$duration}s</div>
            <div class=\"text-slate-400\">Run <span class=\"text-yellow-400 font-bold\">php artisan corelink:monitor --once</span> to inspect the visual topology.</div>
        </div>
        ");

        return self::SUCCESS;
    }
}
