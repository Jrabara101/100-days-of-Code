<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Etl\WarehouseEtlService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use function Termwind\{render};

class RunWarehouseEtlCommand extends Command
{
    protected $signature = 'etl:warehouse-sync
                            {--chunk=1000 : Chunk size for index-based stream extraction}
                            {--lookback=5 : Lookback safety window in minutes to prevent clock-drift gaps}
                            {--full-refresh : Re-sync the entire OLTP history from epoch 0}
                            {--dry-run : Simulate extraction and transformation without writing to warehouse}
                            {--force : Force execution even if marked as already running}';

    protected $description = 'Executes the scheduled high-throughput incremental ETL sync into the Data Warehouse.';

    public function handle(WarehouseEtlService $etlService): int
    {
        $chunkSize = (int) $this->option('chunk');
        $lookbackMinutes = (int) $this->option('lookback');
        $fullRefresh = (bool) $this->option('full-refresh');
        $dryRun = (bool) $this->option('dry-run');

        $this->renderHeader($chunkSize, $lookbackMinutes, $fullRefresh, $dryRun);

        if ($fullRefresh && app()->isProduction() && !$this->option('force')) {
            if (!$this->confirm('WARNING: Full refresh will backfill historical data. Continue?')) {
                $this->warn('Aborted by operator.');
                return self::FAILURE;
            }
        }

        $progressBar = false;

        try {
            $stats = $etlService->run(
                chunkSize: $chunkSize,
                lookbackMinutes: $lookbackMinutes,
                fullRefresh: $fullRefresh,
                dryRun: $dryRun,
                onChunkProcessed: function (int $extracted, int $loaded) use (&$progressBar) {
                    if (!$progressBar) {
                        $this->output->write("  <fg=cyan>➜ Loading warehouse batches:</> ");
                        $progressBar = true;
                    }
                    $this->output->write("<fg=green>.</>");
                }
            );

            if ($progressBar) {
                $this->output->writeln(" <fg=green;options=bold>DONE</>\n");
            } else {
                $this->output->writeln("  <fg=gray>➜ No new records found within extraction window.</>\n");
            }

            $this->renderSuccessSummary($stats, $dryRun);

            return self::SUCCESS;

        } catch (\Throwable $e) {
            $this->newLine();
            render(sprintf(<<<'HTML'
                <div class="my-1 p-1 bg-red-900 text-red-100">
                    <div class="font-bold text-white">✖ CRITICAL ETL PIPELINE FAILURE:</div>
                    <div class="text-gray-200 mt-1">%s</div>
                </div>
            HTML, e($e->getMessage())));

            return self::FAILURE;
        }
    }

    private function renderHeader(int $chunk, int $lookback, bool $fullRefresh, bool $dryRun): void
    {
        $modeBadge = $dryRun
            ? '<span class="bg-yellow-500 text-black px-1 font-bold">DRY-RUN SIMULATION</span>'
            : ($fullRefresh
                ? '<span class="bg-red-600 text-white px-1 font-bold">FULL HISTORICAL REFRESH</span>'
                : '<span class="bg-emerald-600 text-white px-1 font-bold">INCREMENTAL HWM SYNC</span>');

        render(<<<HTML
            <div class="mx-1 my-1 p-1 bg-gray-900">
                <div class="flex justify-between">
                    <span class="text-indigo-400 font-bold">⚡ ENTERPRISE DATA WAREHOUSE ETL SYNC</span>
                    {$modeBadge}
                </div>
                <div class="text-gray-400 mt-1">
                    Chunk: <span class="text-white font-bold">{$chunk}</span> | 
                    Drift Buffer: <span class="text-cyan-300 font-bold">{$lookback}m</span> | 
                    Target: <span class="text-indigo-300 font-bold">fact_orders &amp; dim_customers</span>
                </div>
            </div>
            <hr class="text-gray-700"/>
        HTML);
    }

    private function renderSuccessSummary($stats, bool $dryRun): void
    {
        $throughput = $stats->durationSeconds > 0
            ? round($stats->extractedCount / $stats->durationSeconds)
            : $stats->extractedCount;

        render(<<<HTML
            <div class="my-1 p-1 bg-gray-900">
                <div class="font-bold text-indigo-300 mb-1">📊 TELEMETRY RECONCILIATION REPORT</div>
                <hr class="text-gray-700 mb-1"/>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Total Records Extracted:</span>
                    <span class="text-white font-bold">{$stats->extractedCount}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Idempotently Upserted into Warehouse:</span>
                    <span class="text-emerald-400 font-bold">{$stats->loadedCount}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Dry-Run Skipped Rows:</span>
                    <span class="text-yellow-400 font-bold">{$stats->skippedCount}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Execution Duration:</span>
                    <span class="text-cyan-300 font-bold">{$stats->durationSeconds}s ({$throughput} rows/sec)</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Peak Memory Consumption:</span>
                    <span class="text-gray-300 font-bold">{$stats->peakMemoryMb} MB</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">New High-Water Mark Anchor:</span>
                    <span class="text-indigo-300 font-bold">{$stats->newHighWaterMark->toIso8601String()}</span>
                </div>
            </div>
        HTML);
    }
}
