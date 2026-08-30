<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\UsageRecord;
use App\Services\Billing\TenantBillingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantBillingTest extends TestCase
{
    use RefreshDatabase;

    private Plan $growthPlan;
    private Plan $scalePlan;
    private TenantBillingService $billingService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->billingService = app(TenantBillingService::class);

        $this->growthPlan = Plan::create([
            'code' => 'GROWTH',
            'name' => 'Growth Business Plan',
            'base_price_cents' => 9900, // $99.00
            'interval' => 'monthly',
            'included_api_calls' => 10000,
            'overage_rate_cents_per_thousand' => 200, // $2.00 / 1k calls
        ]);

        $this->scalePlan = Plan::create([
            'code' => 'SCALE',
            'name' => 'Scale Enterprise Plan',
            'base_price_cents' => 49900, // $499.00
            'interval' => 'monthly',
            'included_api_calls' => 50000,
            'overage_rate_cents_per_thousand' => 150, // $1.50 / 1k calls
        ]);
    }

    public function test_successful_billing_with_metered_overage(): void
    {
        $cycleStart = CarbonImmutable::now()->subMonth();
        $cycleEnd = CarbonImmutable::now()->subMinute();

        $tenant = Tenant::create([
            'name' => 'Acme Corp',
            'email' => 'acme@example.com',
            'payment_method_token' => 'pm_card_visa_valid',
        ]);

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $this->growthPlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);

        // 15,000 calls -> 5,000 overage @ $2.00/1k = 1000 cents ($10.00)
        // Subtotal = 9900 + 1000 = 10900 cents ($109.00)
        // Tax (8%) = round(10900 * 0.08) = 872 cents ($8.72)
        // Total = 11772 cents ($117.72)
        UsageRecord::create([
            'tenant_id' => $tenant->id,
            'metric_name' => 'api_requests',
            'quantity' => 15000,
            'recorded_at' => $cycleStart->addDays(5),
            'is_billed' => false,
        ]);

        $result = $this->billingService->processCycle($subscription, CarbonImmutable::now());

        $this->assertTrue($result->success);
        $this->assertEquals('PAID', $result->status);
        $this->assertEquals(11772, $result->totalCents);
        $this->assertEquals(1000, $result->overageCents);
        $this->assertEquals(15000, $result->meteredUsageUnits);

        // Verify Invoice persisted
        $invoice = Invoice::where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($invoice);
        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals(10900, $invoice->subtotal_cents);
        $this->assertEquals(872, $invoice->tax_cents);
        $this->assertEquals(11772, $invoice->total_cents);

        // Verify Invoice Items
        $this->assertCount(2, $invoice->items);

        // Verify Usage Record marked billed
        $usage = UsageRecord::where('tenant_id', $tenant->id)->first();
        $this->assertTrue($usage->is_billed);
        $this->assertEquals($invoice->id, $usage->invoice_id);

        // Verify Subscription cycle advanced
        $subscription->refresh();
        $this->assertEquals('active', $subscription->status);
        $this->assertEquals($cycleEnd->toDateTimeString(), $subscription->current_period_start->toDateTimeString());
        $this->assertEquals(0, $subscription->failed_payment_attempts);
    }

    public function test_dry_run_simulation_does_not_persist_or_mutate_state(): void
    {
        $cycleStart = CarbonImmutable::now()->subMonth();
        $cycleEnd = CarbonImmutable::now()->subMinute();

        $tenant = Tenant::create([
            'name' => 'Simulation Corp',
            'email' => 'sim@example.com',
            'payment_method_token' => 'pm_card_visa_valid',
        ]);

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $this->growthPlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);

        UsageRecord::create([
            'tenant_id' => $tenant->id,
            'metric_name' => 'api_requests',
            'quantity' => 12000,
            'recorded_at' => $cycleStart->addDays(3),
            'is_billed' => false,
        ]);

        $result = $this->billingService->processCycle($subscription, CarbonImmutable::now(), dryRun: true);

        $this->assertTrue($result->success);
        $this->assertEquals('SIMULATED', $result->status);

        // Ensure no invoices were created
        $this->assertEquals(0, Invoice::count());

        // Ensure usage records are still unbilled
        $this->assertFalse(UsageRecord::first()->is_billed);

        // Ensure subscription period unchanged
        $subscription->refresh();
        $this->assertEquals($cycleStart->toDateTimeString(), $subscription->current_period_start->toDateTimeString());
    }

    public function test_dunning_lifecycle_transitions_on_payment_failure(): void
    {
        $cycleStart = CarbonImmutable::now()->subMonth();
        $cycleEnd = CarbonImmutable::now()->subMinute();

        $tenant = Tenant::create([
            'name' => 'Failing Corp',
            'email' => 'fail@example.com',
            'payment_method_token' => 'pm_fail_insufficient_funds',
        ]);

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $this->growthPlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
            'failed_payment_attempts' => 0,
        ]);

        // Attempt 1: Should transition to past_due
        $result1 = $this->billingService->processCycle($subscription, CarbonImmutable::now());
        $this->assertFalse($result1->success);
        $this->assertEquals('PAYMENT_FAILED', $result1->status);

        $subscription->refresh();
        $tenant->refresh();
        $this->assertEquals('past_due', $subscription->status);
        $this->assertEquals('past_due', $tenant->status);
        $this->assertEquals(1, $subscription->failed_payment_attempts);

        // Attempt 2: Still past_due
        $result2 = $this->billingService->processCycle($subscription, CarbonImmutable::now());
        $this->assertFalse($result2->success);
        $subscription->refresh();
        $this->assertEquals('past_due', $subscription->status);
        $this->assertEquals(2, $subscription->failed_payment_attempts);

        // Attempt 3: Transitions to suspended
        $result3 = $this->billingService->processCycle($subscription, CarbonImmutable::now());
        $this->assertFalse($result3->success);
        $subscription->refresh();
        $tenant->refresh();
        $this->assertEquals('suspended', $subscription->status);
        $this->assertEquals('suspended', $tenant->status);
        $this->assertEquals(3, $subscription->failed_payment_attempts);
    }

    public function test_artisan_command_execution(): void
    {
        $cycleStart = CarbonImmutable::now()->subMonth();
        $cycleEnd = CarbonImmutable::now()->subMinute();

        $tenant = Tenant::create([
            'name' => 'CLI Test Corp',
            'email' => 'cli@example.com',
            'payment_method_token' => 'pm_card_visa_valid',
        ]);

        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $this->growthPlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);

        $this->artisan('billing:tenant-cycle', ['--tenant' => (string) $tenant->id])
            ->assertSuccessful();

        $this->assertDatabaseHas('invoices', [
            'tenant_id' => $tenant->id,
            'status' => 'paid',
        ]);
    }
}
