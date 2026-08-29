<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\UsageRecord;
use App\Services\Billing\TenantBillingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantBillingServiceTest extends TestCase
{
    use RefreshDatabase;

    private TenantBillingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(TenantBillingService::class);
    }

    public function test_yearly_subscription_advances_by_one_year(): void
    {
        $yearlyPlan = Plan::create([
            'code' => 'YEARLY_PRO',
            'name' => 'Yearly Pro Plan',
            'base_price_cents' => 99900, // $999.00
            'interval' => 'yearly',
            'included_api_calls' => 100000,
            'overage_rate_cents_per_thousand' => 100,
        ]);

        $cycleStart = CarbonImmutable::parse('2025-01-01 00:00:00');
        $cycleEnd = CarbonImmutable::parse('2026-01-01 00:00:00');

        $tenant = Tenant::create([
            'name' => 'Yearly Corp',
            'email' => 'yearly@example.com',
            'payment_method_token' => 'pm_card_visa_valid',
        ]);

        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $yearlyPlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);

        $result = $this->service->processCycle($sub, CarbonImmutable::parse('2026-01-02'));

        $this->assertTrue($result->success);
        $sub->refresh();
        $this->assertEquals('2026-01-01 00:00:00', $sub->current_period_start->toDateTimeString());
        $this->assertEquals('2027-01-01 00:00:00', $sub->current_period_end->toDateTimeString());
    }

    public function test_zero_overage_when_usage_within_included_quota(): void
    {
        $plan = Plan::create([
            'code' => 'TIER_1',
            'name' => 'Tier 1',
            'base_price_cents' => 5000,
            'interval' => 'monthly',
            'included_api_calls' => 5000,
            'overage_rate_cents_per_thousand' => 100,
        ]);

        $cycleStart = CarbonImmutable::now()->subMonth();
        $cycleEnd = CarbonImmutable::now()->subMinute();

        $tenant = Tenant::create([
            'name' => 'Within Quota Corp',
            'email' => 'quota@example.com',
            'payment_method_token' => 'pm_card_valid',
        ]);

        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);

        UsageRecord::create([
            'tenant_id' => $tenant->id,
            'metric_name' => 'api_requests',
            'quantity' => 4999,
            'recorded_at' => $cycleStart->addDays(2),
            'is_billed' => false,
        ]);

        $result = $this->service->processCycle($sub, CarbonImmutable::now());

        $this->assertTrue($result->success);
        $this->assertEquals(0, $result->overageCents);
        // Subtotal = 5000, Tax = round(5000 * 0.08) = 400, Total = 5400
        $this->assertEquals(5400, $result->totalCents);
    }
}
