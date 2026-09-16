<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ResumeWorkflowCommand extends Command
{
    protected $signature = 'automata:resume
        {workflow=WF-992-ALPHA : The workflow run ID to resume idempotently}
        {--queue=Redis : Name of the queue driver}';

    protected $description = 'Resume an existing workflow run from the last preserved state without re-executing completed nodes';

    public function handle(): int
    {
        $workflow = (string) $this->argument('workflow');
        $queue = (string) $this->option('queue');

        $this->info("Initiating idempotent resumption for workflow run [{$workflow}]...");

        return $this->call('automata:run', [
            'workflow' => $workflow,
            '--resume' => true,
            '--queue' => $queue,
        ]);
    }
}
