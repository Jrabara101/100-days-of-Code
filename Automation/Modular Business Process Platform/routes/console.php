<?php

declare(strict_types=1);

use App\Console\Commands\InspectWorkflowAuditCommand;
use App\Console\Commands\ListWorkflowsCommand;
use App\Console\Commands\ResumeWorkflowCommand;
use App\Console\Commands\RunWorkflowCommand;
use Illuminate\Console\Application as ArtisanApplication;

// Register AutomataCLI console commands
ArtisanApplication::starting(function (ArtisanApplication $artisan): void {
    $artisan->resolve(RunWorkflowCommand::class);
    $artisan->resolve(ResumeWorkflowCommand::class);
    $artisan->resolve(InspectWorkflowAuditCommand::class);
    $artisan->resolve(ListWorkflowsCommand::class);
});
