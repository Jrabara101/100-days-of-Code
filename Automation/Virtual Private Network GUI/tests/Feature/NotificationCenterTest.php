<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\DispatchEvent;
use App\Models\DispatchOutbox;
use App\Models\NotificationProvider;
use App\Models\NotificationSubscriber;
use App\Services\NotificationCenter\CircuitBreakerManager;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\NotificationOrchestratorService;
use Database\Seeders\NotificationCenterInfrastructureSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(NotificationCenterInfrastructureSeeder::class);
    }

    public function test_dry_run_does_not_persist_events_or_outbox(): void
    {
        $orchestrator = app(NotificationOrchestratorService::class);
        $dto = new IngestedEventDto(
            eventType: 'DRY_RUN_TEST',
            priority: 'P1',
            referenceId: 'REF-DRY-001',
            title: 'Test Dry Run',
            message: 'Testing dry run behavior'
        );

        $receipts = $orchestrator->orchestrate($dto, dryRun: true);

        $this->assertCount(3, $receipts);
        $this->assertEquals(0, DispatchEvent::count());
        $this->assertEquals(0, DispatchOutbox::count());
        $this->assertEquals('SIMULATED', $receipts[0]->status);
    }

    public function test_p0_critical_broadcasts_to_all_channels_and_bypasses_dnd(): void
    {
        $orchestrator = app(NotificationOrchestratorService::class);
        $dto = new IngestedEventDto(
            eventType: 'SECURITY_BREACH',
            priority: 'P0',
            referenceId: 'REF-P0-001',
            title: 'P0 Outage',
            message: 'Critical system outage'
        );

        $receipts = $orchestrator->orchestrate($dto, dryRun: false);

        // 3 subscribers * 4 channels = 12 delivery attempts
        $this->assertCount(12, $receipts);

        // Verify Elena Fisher (normally in Tokyo DND) was NOT suppressed
        $elenaReceipts = array_filter($receipts, fn($r) => str_contains($r->recipientName, 'Elena Fisher'));
        $this->assertCount(4, $elenaReceipts);
        foreach ($elenaReceipts as $r) {
            $this->assertNotEquals('SUPPRESSED_DND', $r->status);
        }
    }

    public function test_p1_high_escalates_to_fallback_when_slack_fails(): void
    {
        $orchestrator = app(NotificationOrchestratorService::class);
        $dto = new IngestedEventDto(
            eventType: 'CLUSTER_DOWN',
            priority: 'P1',
            referenceId: 'REF-P1-001',
            title: 'P1 Incident',
            message: 'Cluster unreachable'
        );

        $receipts = $orchestrator->orchestrate($dto, dryRun: false);

        // Find Marcus Brody receipt (who has simulated Slack outage)
        $marcusReceipts = array_values(array_filter($receipts, fn($r) => str_contains($r->recipientName, 'Marcus Brody')));
        $this->assertCount(1, $marcusReceipts);

        $marcus = $marcusReceipts[0];
        $this->assertEquals('FALLBACK_RECOVERED', $marcus->status);
        $this->assertEquals('SLACK ➔ DISCORD', $marcus->channelTrail);
        $this->assertTrue($marcus->fallbackOccurred);
    }

    public function test_p2_dnd_quiet_hours_suppresses_delivery_for_nighttime_subscriber(): void
    {
        $orchestrator = app(NotificationOrchestratorService::class);
        $dto = new IngestedEventDto(
            eventType: 'REPORT_READY',
            priority: 'P2',
            referenceId: 'REF-P2-001',
            title: 'P2 Report',
            message: 'Nightly report ready'
        );

        $receipts = $orchestrator->orchestrate($dto, dryRun: false);

        // Elena Fisher is configured in Asia/Tokyo with quiet hours 21:00 - 09:00
        // She should be SUPPRESSED_DND
        $elenaReceipts = array_values(array_filter($receipts, fn($r) => str_contains($r->recipientName, 'Elena Fisher')));
        $this->assertCount(1, $elenaReceipts);
        $this->assertEquals('SUPPRESSED_DND', $elenaReceipts[0]->status);
    }

    public function test_consecutive_failures_trips_circuit_breaker_to_open(): void
    {
        $circuitBreaker = app(CircuitBreakerManager::class);

        // Record 2 failures -> Still CLOSED
        $circuitBreaker->recordFailure('SLACK');
        $circuitBreaker->recordFailure('SLACK');
        $slack = NotificationProvider::where('code', 'SLACK')->first();
        $this->assertEquals('CLOSED', $slack->circuit_state);
        $this->assertEquals(2, $slack->consecutive_failures);

        // 3rd failure -> Trips to OPEN
        $circuitBreaker->recordFailure('SLACK');
        $slack->refresh();
        $this->assertEquals('OPEN', $slack->circuit_state);
        $this->assertEquals(3, $slack->consecutive_failures);
        $this->assertNotNull($slack->circuit_opened_at);

        // When circuit is OPEN, canAttempt returns false immediately
        $this->assertFalse($circuitBreaker->canAttempt('SLACK'));
    }

    public function test_idempotency_prevents_duplicate_dispatches(): void
    {
        $orchestrator = app(NotificationOrchestratorService::class);
        $dto = new IngestedEventDto(
            eventType: 'BILLING_BREACH',
            priority: 'P1',
            referenceId: 'REF-IDEM-999',
            title: 'Billing Alert',
            message: 'Threshold exceeded'
        );

        // First dispatch
        $receipts1 = $orchestrator->orchestrate($dto, dryRun: false);
        $alice1 = array_values(array_filter($receipts1, fn($r) => str_contains($r->recipientName, 'Alice Vance')))[0];
        $this->assertEquals('DELIVERED', $alice1->status);

        // Second dispatch with same eventType and referenceId
        $receipts2 = $orchestrator->orchestrate($dto, dryRun: false);
        $alice2 = array_values(array_filter($receipts2, fn($r) => str_contains($r->recipientName, 'Alice Vance')))[0];
        $this->assertEquals('IDEMPOTENT_SKIPPED', $alice2->status);
    }

    public function test_artisan_orchestrate_command_runs_successfully(): void
    {
        $this->artisan('notifications:orchestrate', [
            '--priority' => 'P1',
            '--type' => 'CLUSTER_DOWN',
        ])->assertExitCode(0);

        $this->artisan('notifications:orchestrate', [
            '--health' => true,
        ])->assertExitCode(0);

        $this->artisan('notifications:orchestrate', [
            '--reset-circuits' => true,
        ])->assertExitCode(0);
    }
}
