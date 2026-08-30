<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\EmailCampaign;
use App\Services\Campaigns\CampaignDispatcherService;
use App\Services\Campaigns\IngestionReport;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;
use function Termwind\{render};

class DispatchCampaignCommand extends Command
{
    protected $signature = 'campaign:dispatch
                            {--campaign= : Specific Campaign ID to trigger}
                            {--chunk=500 : Batch subscriber streaming size}
                            {--dry-run : Simulate suppression filtering and volume calculations without queuing}
                            {--monitor : Keep terminal open to monitor live batch execution progress}
                            {--force : Bypass confirmation prompts in production}';

    protected $description = 'Streams, pre-filters, and dispatches enterprise queue-based email campaign batches.';

    public function handle(CampaignDispatcherService $dispatcherService): int
    {
        $campaignId = $this->option('campaign');
        $chunkSize = (int) $this->option('chunk');
        $dryRun = (bool) $this->option('dry-run');
        $monitor = (bool) $this->option('monitor');

        $campaign = $campaignId
            ? EmailCampaign::find($campaignId)
            : EmailCampaign::query()->whereIn('status', ['draft', 'queued'])->latest()->first();

        if (!$campaign) {
            render(<<<'HTML'
                <div class="my-1 mx-2 p-1 bg-red-900 text-white font-bold">
                    ✖ ERROR: No valid email campaign found in [DRAFT] or [QUEUED] state.
                </div>
            HTML);
            return self::FAILURE;
        }

        $this->renderHeader($campaign, $dryRun);

        if (!$dryRun && app()->isProduction() && !$this->option('force')) {
            if (!$this->confirm(sprintf('Queue live broadcast to deliverable audience for [%s]?', $campaign->name))) {
                $this->warn('Campaign broadcast aborted by operator.');
                return self::FAILURE;
            }
        }

        $this->output->write("  <fg=cyan>⚡ Streaming subscriber pipeline and verifying suppressions...</> ");
        $report = $dispatcherService->dispatchCampaign($campaign, $chunkSize, $dryRun);
        $this->output->writeln("<fg=green;options=bold>DONE</>");
        $this->newLine();

        $this->renderIngestionSummary($report, $dryRun);

        if ($monitor && !$dryRun && $report->batchId) {
            $this->monitorLiveBatchProgress($report->batchId, $campaign);
        }

        return self::SUCCESS;
    }

    private function renderHeader(EmailCampaign $campaign, bool $dryRun): void
    {
        $modeBadge = $dryRun
            ? '<span class="bg-yellow-500 text-black px-1 font-bold">DRY-RUN SIMULATION</span>'
            : '<span class="bg-emerald-600 text-white px-1 font-bold">LIVE QUEUE DISPATCH</span>';

        render(<<<HTML
            <div class="mx-1 my-1 p-1 bg-gray-900">
                <div class="flex justify-between">
                    <span class="text-indigo-400 font-bold">🚀 ENTERPRISE EMAIL CAMPAIGN ENGINE</span>
                    {$modeBadge}
                </div>
                <div class="text-gray-400 mt-1">
                    Campaign: <span class="text-white font-bold">{$campaign->name}</span> (ID: #{$campaign->id}) | Subject: <span class="text-cyan-300">"{$campaign->subject}"</span>
                </div>
            </div>
        HTML);
    }

    private function renderIngestionSummary(IngestionReport $report, bool $dryRun): void
    {
        $deliverablePct = $report->totalAudience > 0
            ? round(($report->deliverableCount / $report->totalAudience) * 100, 1)
            : 0;

        $suppressedPct = $report->totalAudience > 0
            ? round(($report->suppressedCount / $report->totalAudience) * 100, 1)
            : 0;

        $batchDisplay = $report->batchId ?? 'None (Simulation)';

        render(<<<HTML
            <div class="my-1 p-1 bg-gray-900">
                <div class="font-bold text-indigo-300 mb-1">📊 PRE-FLIGHT AUDIENCE AUDIT</div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Total Subscriber Master Audience:</span>
                    <span class="text-white font-bold">{$report->totalAudience}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Deliverable Pipeline Clean:</span>
                    <span class="text-emerald-400 font-bold">{$report->deliverableCount} ({$deliverablePct}%)</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Suppressed (Hard Bounces and Unsubscribes):</span>
                    <span class="text-red-400 font-bold">{$report->suppressedCount} ({$suppressedPct}%)</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Queued Jobs / Bus Batch ID:</span>
                    <span class="text-cyan-400 font-bold">{$report->batchesCreated} jobs • {$batchDisplay}</span>
                </div>
            </div>
        HTML);
    }

    private function monitorLiveBatchProgress(string $batchId, EmailCampaign $campaign): void
    {
        $this->newLine();
        render(<<<'HTML'
            <div class="text-yellow-400 font-bold uppercase mb-1">
                ⏳ Live Queue Worker Progress (Polling every 500ms - Press Ctrl+C to detach):
            </div>
        HTML);

        $progressBar = $this->output->createProgressBar(100);
        $progressBar->setFormat(' [%bar%] %percent:3s%% -- %message%');
        $progressBar->start();

        while (true) {
            $batch = Bus::findBatch($batchId);

            if (!$batch) {
                break;
            }

            $progressBar->setProgress($batch->progress());
            $progressBar->setMessage(sprintf(
                '<fg=white>Processed: %d/%d</> | <fg=green>Sent: %d</> | <fg=red>Failed: %d</>',
                $batch->processedJobs(),
                $batch->totalJobs,
                $campaign->refresh()->sent_count,
                $campaign->failed_count
            ));

            if ($batch->finished() || $batch->cancelled()) {
                break;
            }

            usleep(500000); // 500ms polling
        }

        $progressBar->finish();
        $this->newLine(2);

        $fresh = $campaign->refresh();
        $statusColor = $fresh->status === 'completed' ? 'text-emerald-400' : 'text-red-400';

        render(<<<HTML
            <div class="p-1 bg-gray-900">
                <div class="flex justify-between">
                    <span class="font-bold text-white">BATCH BROADCAST FINALIZED:</span>
                    <span class="{$statusColor} font-bold uppercase">{$fresh->status}</span>
                </div>
                <div class="text-gray-400 mt-1">
                    Delivered: <span class="text-emerald-400 font-bold">{$fresh->sent_count}</span> • 
                    Failed: <span class="text-red-400 font-bold">{$fresh->failed_count}</span> • 
                    Suppressed: <span class="text-yellow-400 font-bold">{$fresh->suppressed_count}</span>
                </div>
            </div>
        HTML);
    }
}
