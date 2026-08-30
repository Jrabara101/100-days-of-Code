<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Jobs\SendCampaignEmailJob;
use App\Models\CampaignDispatch;
use App\Models\EmailCampaign;
use App\Models\Subscriber;
use App\Services\Campaigns\CampaignDispatcherService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class CampaignDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_streaming_ingestion_with_bus_fake_verifies_batch_and_initial_queue_state(): void
    {
        Bus::fake();

        // 10 Deliverable subscribers
        for ($i = 1; $i <= 10; $i++) {
            Subscriber::create([
                'email' => "deliverable_{$i}@enterprise.io",
                'first_name' => "User_{$i}",
                'is_subscribed' => true,
                'bounce_count' => 0,
            ]);
        }

        // 3 Bounced subscribers
        for ($i = 1; $i <= 3; $i++) {
            Subscriber::create([
                'email' => "bounced_{$i}@deadmail.com",
                'first_name' => "Bounce_{$i}",
                'is_subscribed' => true,
                'bounce_count' => 1,
            ]);
        }

        // 2 Unsubscribed subscribers
        for ($i = 1; $i <= 2; $i++) {
            Subscriber::create([
                'email' => "optout_{$i}@privacy.org",
                'first_name' => "OptOut_{$i}",
                'is_subscribed' => false,
                'bounce_count' => 0,
            ]);
        }

        $campaign = EmailCampaign::create([
            'name' => 'Q3 Feature Blast',
            'subject' => 'New Features ⚡',
            'body_template' => '<h1>Hello</h1>',
            'status' => 'draft',
        ]);

        $dispatcher = new CampaignDispatcherService();
        $report = $dispatcher->dispatchCampaign($campaign, chunkSize: 5);

        $this->assertEquals(15, $report->totalAudience);
        $this->assertEquals(10, $report->deliverableCount);
        $this->assertEquals(5, $report->suppressedCount);
        $this->assertEquals(10, $report->batchesCreated);

        // Verify initial dispatches state prior to queue execution
        $this->assertEquals(15, CampaignDispatch::count());
        $this->assertEquals(10, CampaignDispatch::where('status', 'queued')->count());
        $this->assertEquals(5, CampaignDispatch::where('status', 'suppressed')->count());

        Bus::assertBatched(function ($batch) {
            return $batch->jobs->count() === 10;
        });
    }

    public function test_streaming_ingestion_sync_execution_and_counter_updates(): void
    {
        // 5 Deliverable subscribers
        for ($i = 1; $i <= 5; $i++) {
            Subscriber::create([
                'email' => "deliverable_sync_{$i}@enterprise.io",
                'first_name' => "User_{$i}",
                'is_subscribed' => true,
                'bounce_count' => 0,
            ]);
        }

        // 2 Bounced subscribers
        for ($i = 1; $i <= 2; $i++) {
            Subscriber::create([
                'email' => "bounced_sync_{$i}@deadmail.com",
                'first_name' => "Bounce_{$i}",
                'is_subscribed' => true,
                'bounce_count' => 2,
            ]);
        }

        $campaign = EmailCampaign::create([
            'name' => 'Sync Campaign Blast',
            'subject' => 'Live Delivery ⚡',
            'body_template' => '<h1>Hello</h1>',
            'status' => 'draft',
        ]);

        $dispatcher = new CampaignDispatcherService();
        $report = $dispatcher->dispatchCampaign($campaign, chunkSize: 3);

        $this->assertEquals(7, $report->totalAudience);
        $this->assertEquals(5, $report->deliverableCount);
        $this->assertEquals(2, $report->suppressedCount);

        // In sync driver, jobs run synchronously to completion
        $this->assertEquals(7, CampaignDispatch::count());
        $this->assertEquals(5, CampaignDispatch::where('status', 'sent')->count());
        $this->assertEquals(2, CampaignDispatch::where('status', 'suppressed')->count());

        $freshCampaign = $campaign->refresh();
        $this->assertEquals(5, $freshCampaign->sent_count);
        $this->assertEquals(2, $freshCampaign->suppressed_count);
        $this->assertEquals('completed', $freshCampaign->status);
    }

    public function test_idempotency_prevents_duplicate_dispatch_records(): void
    {
        $subscriber = Subscriber::create([
            'email' => 'idempotent@example.com',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);

        $campaign = EmailCampaign::create([
            'name' => 'Idempotency Test Campaign',
            'subject' => 'Idempotent Broadcast',
            'body_template' => '<p>Test</p>',
            'status' => 'draft',
        ]);

        $dispatcher = new CampaignDispatcherService();

        // First dispatch run
        $dispatcher->dispatchCampaign($campaign, chunkSize: 10);
        $this->assertEquals(1, CampaignDispatch::count());

        // Second dispatch run on same campaign and subscriber
        $dispatcher->dispatchCampaign($campaign, chunkSize: 10);
        $this->assertEquals(1, CampaignDispatch::count()); // Unique constraint prevents duplicate rows
    }

    public function test_job_execution_updates_dispatch_and_campaign_sent_counters(): void
    {
        $subscriber = Subscriber::create([
            'email' => 'recipient@company.org',
            'first_name' => 'Alice',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);

        $campaign = EmailCampaign::create([
            'name' => 'Job Execution Test',
            'subject' => 'Test Subject',
            'body_template' => '<p>Hello {{first_name}}</p>',
            'status' => 'processing',
        ]);

        $hash = hash('sha256', sprintf('%d|%d', $campaign->id, $subscriber->id));

        $dispatch = CampaignDispatch::create([
            'email_campaign_id' => $campaign->id,
            'subscriber_id' => $subscriber->id,
            'idempotency_hash' => $hash,
            'status' => 'queued',
            'recipient_email' => $subscriber->email,
        ]);

        $job = new SendCampaignEmailJob($campaign->id, $subscriber->id, $hash);
        $job->handle();

        $dispatch->refresh();
        $this->assertEquals('sent', $dispatch->status);
        $this->assertNotNull($dispatch->dispatched_at);

        $campaign->refresh();
        $this->assertEquals(1, $campaign->sent_count);

        // Idempotent re-run should not increment counters again
        $job->handle();
        $campaign->refresh();
        $this->assertEquals(1, $campaign->sent_count);
    }

    public function test_job_handles_simulated_esp_failure(): void
    {
        $subscriber = Subscriber::create([
            'email' => 'bad.gateway.fail-test@telecom.org',
            'first_name' => 'FailUser',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);

        $campaign = EmailCampaign::create([
            'name' => 'Failure Handling Test',
            'subject' => 'Failure Test',
            'body_template' => '<p>Hello</p>',
            'status' => 'processing',
        ]);

        $hash = hash('sha256', sprintf('%d|%d', $campaign->id, $subscriber->id));

        $dispatch = CampaignDispatch::create([
            'email_campaign_id' => $campaign->id,
            'subscriber_id' => $subscriber->id,
            'idempotency_hash' => $hash,
            'status' => 'queued',
            'recipient_email' => $subscriber->email,
        ]);

        $job = new SendCampaignEmailJob($campaign->id, $subscriber->id, $hash);

        try {
            $job->handle();
            $this->fail('Expected job to throw ESP exception for fail-test domain.');
        } catch (\Throwable $e) {
            $this->assertStringContainsString('ESP Gateway Rejected', $e->getMessage());
        }

        $dispatch->refresh();
        $this->assertEquals('failed', $dispatch->status);
        $this->assertStringContainsString('ESP Gateway Rejected', (string) $dispatch->error_message);

        $campaign->refresh();
        $this->assertEquals(1, $campaign->failed_count);
    }

    public function test_second_pass_suppression_in_job_handler(): void
    {
        $subscriber = Subscriber::create([
            'email' => 'just.bounced@example.com',
            'first_name' => 'JustBounced',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);

        $campaign = EmailCampaign::create([
            'name' => 'Pre-Flight Race Test',
            'subject' => 'Race Test',
            'body_template' => '<p>Hello</p>',
            'status' => 'processing',
        ]);

        $hash = hash('sha256', sprintf('%d|%d', $campaign->id, $subscriber->id));

        $dispatch = CampaignDispatch::create([
            'email_campaign_id' => $campaign->id,
            'subscriber_id' => $subscriber->id,
            'idempotency_hash' => $hash,
            'status' => 'queued',
            'recipient_email' => $subscriber->email,
        ]);

        // Subscriber status changes to bounced before worker picks it up
        $subscriber->update(['bounce_count' => 1, 'last_bounced_at' => CarbonImmutable::now()]);

        $job = new SendCampaignEmailJob($campaign->id, $subscriber->id, $hash);
        $job->handle();

        $dispatch->refresh();
        $this->assertEquals('suppressed', $dispatch->status);
        $this->assertStringContainsString('Suppressed prior to network transmission', (string) $dispatch->error_message);

        $campaign->refresh();
        $this->assertEquals(1, $campaign->suppressed_count);
        $this->assertEquals(0, $campaign->sent_count);
    }

    public function test_artisan_command_dry_run(): void
    {
        Subscriber::create([
            'email' => 'artisan.user@example.com',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);

        EmailCampaign::create([
            'name' => 'Artisan Test Campaign',
            'subject' => 'Artisan Subject',
            'body_template' => '<p>Artisan</p>',
            'status' => 'draft',
        ]);

        $this->artisan('campaign:dispatch', ['--dry-run' => true])
            ->assertSuccessful();

        $this->assertEquals(0, CampaignDispatch::count());
    }

    public function test_artisan_command_live_dispatch(): void
    {
        Subscriber::create([
            'email' => 'artisan.live@example.com',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);

        $campaign = EmailCampaign::create([
            'name' => 'Live Artisan Test',
            'subject' => 'Live Artisan Subject',
            'body_template' => '<p>Live</p>',
            'status' => 'draft',
        ]);

        $this->artisan('campaign:dispatch', [
            '--campaign' => (string) $campaign->id,
            '--force' => true,
        ])->assertSuccessful();

        $this->assertEquals(1, CampaignDispatch::count());
    }
}
