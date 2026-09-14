<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\WorkflowDefinition;
use App\Models\WorkflowRun;
use Illuminate\Console\Command;

class ListWorkflowsCommand extends Command
{
    protected $signature = 'automata:list';

    protected $description = 'List all registered workflow definitions, DAG topologies, and past execution runs';

    public function handle(): int
    {
        $this->info("======================================================================");
        $this->info(" AutomataCLI v1.0.0 – REGISTERED WORKFLOW PIPELINES");
        $this->info("======================================================================");

        $definitions = WorkflowDefinition::withCount(['nodes', 'runs'])->get();

        if ($definitions->isEmpty()) {
            $this->warn("No workflow definitions registered. Run `php artisan db:seed` to load defaults.");
            return Command::SUCCESS;
        }

        $defRows = [];
        foreach ($definitions as $def) {
            $defRows[] = [
                $def->id,
                $def->name,
                $def->trigger_type,
                $def->nodes_count,
                $def->runs_count,
                $def->version,
                $def->is_active ? 'ACTIVE' : 'INACTIVE',
            ];
        }

        $this->table(
            ['ID', 'Name', 'Trigger', 'Nodes', 'Runs', 'Version', 'Status'],
            $defRows
        );

        $this->newLine();
        $this->info("--- RECENT EXECUTION RUNS ---");

        $runs = WorkflowRun::with('workflowDefinition')->orderByDesc('created_at')->limit(10)->get();

        if ($runs->isEmpty()) {
            $this->comment("No execution runs recorded yet.");
            return Command::SUCCESS;
        }

        $runRows = [];
        foreach ($runs as $run) {
            $runRows[] = [
                $run->id,
                $run->workflow_definition_id,
                $run->status->value,
                number_format($run->total_execution_time_ms, 2) . ' ms',
                $run->started_at?->diffForHumans() ?? 'N/A',
                $run->error_summary ? substr($run->error_summary, 0, 40) : 'None',
            ];
        }

        $this->table(
            ['Run ID', 'Definition', 'Status', 'Duration', 'Started', 'Error'],
            $runRows
        );

        return Command::SUCCESS;
    }
}
