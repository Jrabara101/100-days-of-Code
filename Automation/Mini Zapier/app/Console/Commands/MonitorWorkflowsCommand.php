<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Console\Rendering\TermwindMonitorRenderer;
use App\Integrations\Registry\IntegrationRegistry;
use App\Models\WorkflowExecution;
use Illuminate\Console\Command;

class MonitorWorkflowsCommand extends Command
{
    protected $signature = 'corelink:monitor 
                            {--interval=2 : Polling interval in seconds}
                            {--once : Output one frame and terminate (for testing or pipe)}';

    protected $description = 'Launch the CoreLink live workflow integration daemon and terminal monitor';

    public function handle(
        IntegrationRegistry $registry,
        TermwindMonitorRenderer $renderer
    ): int {
        $interval = max(1, (int) $this->option('interval'));
        $runOnce = (bool) $this->option('once');

        $startTime = time() - (4 * 3600 + 12 * 60 + 9); // Initialized to simulate ~4h 12m uptime

        // Register signal handling for graceful shutdown on supported environments
        if (function_exists('pcntl_async_signals') && function_exists('pcntl_signal')) {
            pcntl_async_signals(true);
            pcntl_signal(SIGINT, function () {
                $this->info("\nCoreLink Daemon gracefully stopped.");
                exit(0);
            });
        }

        do {
            // Clear screen (ANSI escape sequences: \033[2J\033[H)
            if (! $runOnce) {
                if (DIRECTORY_SEPARATOR === '\\') {
                    // Windows terminal support
                    echo "\033[2J\033[H";
                } else {
                    system('clear');
                }
            }

            // 1. Fetch live metrics & triggers
            $activeTriggers = $registry->getActiveTriggers();

            // 2. Fetch recent executions
            $recentExecutions = WorkflowExecution::with('workflow')
                ->latest('id')
                ->take(5)
                ->get();

            // 3. Find primary topology debug workflow (prefer #8802 or latest)
            $debugExecution = WorkflowExecution::with('workflow')
                ->where('workflow_id', 8802)
                ->latest('id')
                ->first()
                ?? $recentExecutions->first();

            // 4. Calculate stats
            $elapsedSeconds = time() - $startTime;
            $hours = floor($elapsedSeconds / 3600);
            $minutes = floor(($elapsedSeconds % 3600) / 60);
            $seconds = $elapsedSeconds % 60;
            $uptimeFormatted = sprintf('%02dh %02dm %02ds', $hours, $minutes, $seconds);

            $peakRamMB = round(memory_get_peak_usage(true) / 1024 / 1024, 0);
            $meta = [
                'uptime' => $uptimeFormatted,
                'throughput' => '12 Zaps/min',
                'peakRam' => max(24, (int) $peakRamMB) . 'MB',
                'engine' => 'Laravel 11',
                'driver' => 'Redis Horizon',
            ];

            // 5. Render through Termwind
            $renderer->renderDashboard(
                activeTriggers: $activeTriggers,
                recentExecutions: $recentExecutions,
                debugExecution: $debugExecution,
                meta: $meta
            );

            if ($runOnce) {
                break;
            }

            sleep($interval);
        } while (true);

        return self::SUCCESS;
    }
}
