<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\WorkflowEvent;
use App\Models\WorkflowRun;
use Illuminate\Console\Command;

class InspectWorkflowAuditCommand extends Command
{
    protected $signature = 'automata:inspect
        {run=WF-992-ALPHA : The workflow run identifier to inspect}
        {--step= : Inspect a specific node key or step}';

    protected $description = 'Time-travel and inspect the event-sourced immutable audit log and payload mutations';

    public function handle(): int
    {
        $runId = (string) $this->argument('run');
        $stepFilter = $this->option('step');

        /** @var WorkflowRun|null $run */
        $run = WorkflowRun::with(['nodeExecutions', 'events'])->find($runId);

        if (! $run) {
            $this->error("Workflow run [{$runId}] not found.");
            return Command::FAILURE;
        }

        $this->info("======================================================================");
        $this->info(" TIME-TRAVEL AUDIT TRAIL: {$run->id}");
        $this->info(" Trigger: {$run->trigger_source} | Status: {$run->status->value}");
        $this->info(" Total Execution Time: " . number_format($run->total_execution_time_ms, 2) . "ms");
        $this->info("======================================================================");
        $this->newLine();

        $query = $run->events()->orderBy('id');
        if ($stepFilter) {
            $query->where('node_key', $stepFilter);
        }

        $events = $query->get();

        if ($events->isEmpty()) {
            $this->warn("No audit events recorded for run [{$runId}].");
            return Command::SUCCESS;
        }

        $tableRows = [];
        foreach ($events as $event) {
            $payloadBeforeBytes = $event->payload_before ? strlen(json_encode($event->payload_before)) : 0;
            $payloadAfterBytes = $event->payload_after ? strlen(json_encode($event->payload_after)) : 0;
            $diffBytes = $payloadAfterBytes - $payloadBeforeBytes;
            $diffLabel = $diffBytes >= 0 ? "+{$diffBytes} B" : "{$diffBytes} B";

            $tableRows[] = [
                $event->created_at->format('H:i:s.u'),
                $event->node_key ?? '[ENGINE]',
                $event->event_type,
                $event->log_level->value,
                $diffLabel,
                substr($event->message, 0, 50),
            ];
        }

        $this->table(
            ['Timestamp', 'Node', 'Event Type', 'Level', 'Payload Delta', 'Audit Log Message'],
            $tableRows
        );

        $this->newLine();
        $this->comment("Use --step={NodeKey} to drill into individual payload snapshots.");

        return Command::SUCCESS;
    }
}
