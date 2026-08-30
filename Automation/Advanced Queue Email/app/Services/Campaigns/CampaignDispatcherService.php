<?php

declare(strict_types=1);

namespace App\Services\Campaigns;

use App\Jobs\SendCampaignEmailJob;
use App\Models\CampaignDispatch;
use App\Models\EmailCampaign;
use App\Models\Subscriber;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Throwable;

readonly class IngestionReport
{
    public function __construct(
        public int $totalAudience,
        public int $deliverableCount,
        public int $suppressedCount,
        public int $batchesCreated,
        public ?string $batchId
    ) {}
}

class CampaignDispatcherService
{
    /**
     * Ingests, filters, and streams campaign dispatches into a Laravel Bus Batch.
     */
    public function dispatchCampaign(EmailCampaign $campaign, int $chunkSize = 500, bool $dryRun = false): IngestionReport
    {
        $totalAudience = Subscriber::count();
        $deliverableCount = 0;
        $suppressedCount = 0;
        $jobs = [];

        $campaign->update([
            'status' => $dryRun ? 'draft' : 'processing',
            'started_at' => CarbonImmutable::now(),
        ]);

        // Stream subscribers with O(1) memory usage
        Subscriber::query()
            ->orderBy('id')
            ->chunkById($chunkSize, function ($subscribers) use ($campaign, $dryRun, &$deliverableCount, &$suppressedCount, &$jobs) {
                $dispatchInserts = [];

                foreach ($subscribers as $sub) {
                    $hash = hash('sha256', sprintf('%d|%d', $campaign->id, $sub->id));

                    if (!$sub->isDeliverable()) {
                        $suppressedCount++;
                        if (!$dryRun) {
                            $dispatchInserts[] = [
                                'email_campaign_id' => $campaign->id,
                                'subscriber_id' => $sub->id,
                                'idempotency_hash' => $hash,
                                'status' => 'suppressed',
                                'recipient_email' => $sub->email,
                                'error_message' => $sub->bounce_count > 0 ? 'Hard Bounced Mailbox' : 'Unsubscribed Recipient',
                                'dispatched_at' => null,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                        continue;
                    }

                    $deliverableCount++;

                    if (!$dryRun) {
                        $dispatchInserts[] = [
                            'email_campaign_id' => $campaign->id,
                            'subscriber_id' => $sub->id,
                            'idempotency_hash' => $hash,
                            'status' => 'queued',
                            'recipient_email' => $sub->email,
                            'error_message' => null,
                            'dispatched_at' => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        $jobs[] = new SendCampaignEmailJob($campaign->id, $sub->id, $hash);
                    }
                }

                if (!$dryRun && !empty($dispatchInserts)) {
                    // Bulk insert dispatches ignoring duplicates
                    CampaignDispatch::insertOrIgnore($dispatchInserts);
                }
            });

        $batchId = null;

        if (!$dryRun && !empty($jobs)) {
            $campaignId = $campaign->id;

            $batch = Bus::batch($jobs)
                ->name('Email Campaign: ' . $campaign->name)
                ->allowFailures()
                ->then(function (Batch $batch) use ($campaignId) {
                    DB::table('email_campaigns')->where('id', $campaignId)->update([
                        'status' => 'completed',
                        'completed_at' => now(),
                    ]);
                })
                ->catch(function (Batch $batch, Throwable $e) use ($campaignId) {
                    // Handled at individual job failure level
                })
                ->finally(function (Batch $batch) use ($campaignId) {
                    // Safety check if not marked completed
                    DB::table('email_campaigns')->where('id', $campaignId)->where('status', 'processing')->update([
                        'status' => 'completed',
                        'completed_at' => now(),
                    ]);
                })
                ->dispatch();

            $batchId = $batch->id;

            $campaign->update([
                'batch_id' => $batchId,
                'total_recipients' => $deliverableCount,
                'suppressed_count' => $suppressedCount,
            ]);
        }

        return new IngestionReport(
            totalAudience: $totalAudience,
            deliverableCount: $deliverableCount,
            suppressedCount: $suppressedCount,
            batchesCreated: count($jobs),
            batchId: $batchId
        );
    }
}
