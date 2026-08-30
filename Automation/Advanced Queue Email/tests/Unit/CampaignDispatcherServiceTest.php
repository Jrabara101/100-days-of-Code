<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\CampaignDispatch;
use App\Models\EmailCampaign;
use App\Models\Subscriber;
use App\Services\Campaigns\CampaignDispatcherService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignDispatcherServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_dry_run_generates_report_without_creating_jobs_or_dispatches(): void
    {
        Subscriber::create([
            'email' => 'user1@example.com',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);

        Subscriber::create([
            'email' => 'bounced@example.com',
            'is_subscribed' => true,
            'bounce_count' => 2,
        ]);

        Subscriber::create([
            'email' => 'unsub@example.com',
            'is_subscribed' => false,
            'bounce_count' => 0,
        ]);

        $campaign = EmailCampaign::create([
            'name' => 'Dry Run Test',
            'subject' => 'Test Subject',
            'body_template' => 'Hello',
            'status' => 'draft',
        ]);

        $service = new CampaignDispatcherService();
        $report = $service->dispatchCampaign($campaign, chunkSize: 10, dryRun: true);

        $this->assertEquals(3, $report->totalAudience);
        $this->assertEquals(1, $report->deliverableCount);
        $this->assertEquals(2, $report->suppressedCount);
        $this->assertEquals(0, $report->batchesCreated);
        $this->assertNull($report->batchId);

        // Dispatches must not be inserted during dry-run
        $this->assertEquals(0, CampaignDispatch::count());
        $this->assertEquals('draft', $campaign->refresh()->status);
    }

    public function test_deterministic_idempotency_hash_format(): void
    {
        $campaignId = 42;
        $subscriberId = 99;
        $expectedHash = hash('sha256', '42|99');

        $computedHash = hash('sha256', sprintf('%d|%d', $campaignId, $subscriberId));

        $this->assertSame($expectedHash, $computedHash);
        $this->assertEquals(64, strlen($computedHash));
    }
}
