<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\CampaignDispatch;
use App\Models\EmailCampaign;
use App\Models\Subscriber;
use Carbon\CarbonImmutable;
use Exception;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SendCampaignEmailJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;

    public function __construct(
        public int $campaignId,
        public int $subscriberId,
        public string $idempotencyHash
    ) {}

    public function handle(): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        /** @var CampaignDispatch|null $dispatch */
        $dispatch = CampaignDispatch::query()
            ->where('idempotency_hash', $this->idempotencyHash)
            ->first();

        if (!$dispatch || $dispatch->status === 'sent') {
            return; // Idempotent bypass
        }

        $subscriber = Subscriber::find($this->subscriberId);
        $campaign = EmailCampaign::find($this->campaignId);

        if (!$subscriber || !$campaign) {
            $dispatch?->update(['status' => 'failed', 'error_message' => 'Missing subscriber or campaign entity.']);
            return;
        }

        // Final sanity check for hard bounce or unsubscribe
        if (!$subscriber->isDeliverable()) {
            $dispatch->update(['status' => 'suppressed', 'error_message' => 'Suppressed prior to network transmission.']);
            DB::table('email_campaigns')->where('id', $this->campaignId)->increment('suppressed_count');
            return;
        }

        // Domain-specific rate limiting via Redis / domain parsing
        $domain = substr(strrchr($subscriber->email, '@') ?: '@unknown', 1);

        try {
            // Simulated ESP Transmission
            $this->simulateEspTransmission($subscriber, $campaign);

            // Commit atomic success state
            $dispatch->update([
                'status' => 'sent',
                'dispatched_at' => CarbonImmutable::now(),
            ]);

            DB::table('email_campaigns')->where('id', $this->campaignId)->increment('sent_count');

        } catch (Exception $e) {
            $dispatch->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            DB::table('email_campaigns')->where('id', $this->campaignId)->increment('failed_count');
            throw $e;
        }
    }

    private function simulateEspTransmission(Subscriber $subscriber, EmailCampaign $campaign): void
    {
        // Simulate network API latency
        usleep(rand(20000, 40000));

        // Intentionally simulate a failure for bad test domains
        if (str_contains($subscriber->email, 'fail-test')) {
            throw new Exception("ESP Gateway Rejected: Mailbox provider connection timeout.");
        }
    }
}
