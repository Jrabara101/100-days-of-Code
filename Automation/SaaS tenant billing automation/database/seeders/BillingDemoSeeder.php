<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\UsageRecord;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class BillingDemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Base Plans
        $growthPlan = Plan::create([
            'code' => 'GROWTH',
            'name' => 'Growth Business Plan',
            'base_price_cents' => 9900, // $99.00
            'interval' => 'monthly',
            'included_api_calls' => 10000,
            'overage_rate_cents_per_thousand' => 200, // $2.00 / 1k calls
        ]);

        $scalePlan = Plan::create([
            'code' => 'SCALE',
            'name' => 'Scale Enterprise Plan',
            'base_price_cents' => 49900, // $499.00
            'interval' => 'monthly',
            'included_api_calls' => 50000,
            'overage_rate_cents_per_thousand' => 150, // $1.50 / 1k calls
        ]);

        $cycleStart = CarbonImmutable::now()->subMonth();
        $cycleEnd = CarbonImmutable::now()->subMinute();

        // 2. Tenant 1: Clean settlement with metered overage
        $acme = Tenant::create([
            'name' => 'Acme Cloud Systems',
            'email' => 'billing@acme.corp',
            'payment_method_token' => 'pm_card_visa_valid',
        ]);

        Subscription::create([
            'tenant_id' => $acme->id,
            'plan_id' => $growthPlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);

        // Ingest 15,000 calls (5,000 over quota)
        UsageRecord::create([
            'tenant_id' => $acme->id,
            'metric_name' => 'api_requests',
            'quantity' => 15000,
            'recorded_at' => $cycleStart->addDays(5),
            'is_billed' => false,
        ]);

        // 3. Tenant 2: Heavy Enterprise Tenant (Within Quota)
        $cyberdyne = Tenant::create([
            'name' => 'Cyberdyne Research Labs',
            'email' => 'finance@cyberdyne.ai',
            'payment_method_token' => 'pm_card_mastercard_valid',
        ]);

        Subscription::create([
            'tenant_id' => $cyberdyne->id,
            'plan_id' => $scalePlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);

        UsageRecord::create([
            'tenant_id' => $cyberdyne->id,
            'metric_name' => 'api_requests',
            'quantity' => 42000,
            'recorded_at' => $cycleStart->addDays(12),
            'is_billed' => false,
        ]);

        // 4. Tenant 3: Payment Gateway Declines (Dunning Trigger)
        $stark = Tenant::create([
            'name' => 'Stark Aeronautics',
            'email' => 'accounts@stark.aero',
            'payment_method_token' => 'pm_fail_insufficient_funds',
        ]);

        Subscription::create([
            'tenant_id' => $stark->id,
            'plan_id' => $growthPlan->id,
            'status' => 'active',
            'current_period_start' => $cycleStart,
            'current_period_end' => $cycleEnd,
        ]);
    }
}
