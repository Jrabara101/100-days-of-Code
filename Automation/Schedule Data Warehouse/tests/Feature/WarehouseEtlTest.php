<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\Etl\WarehouseEtlService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WarehouseEtlTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Drop warehouse tables first
        Schema::connection('warehouse')->dropIfExists('fact_orders');
        Schema::connection('warehouse')->dropIfExists('dim_customers');
        Schema::dropIfExists('etl_checkpoints');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('users');

        // Run migrations
        Artisan::call('migrate', ['--force' => true]);

        // Seed test users
        DB::table('users')->insert([
            [
                'id' => 1,
                'name' => 'Alice Enterprise',
                'email' => 'alice@company.com',
                'password' => bcrypt('password'),
                'created_at' => CarbonImmutable::now()->subDays(10)->toDateTimeString(),
                'updated_at' => CarbonImmutable::now()->subDays(10)->toDateTimeString(),
            ],
            [
                'id' => 2,
                'name' => 'Bob Corporation',
                'email' => 'bob@corp.org',
                'password' => bcrypt('password'),
                'created_at' => CarbonImmutable::now()->subDays(5)->toDateTimeString(),
                'updated_at' => CarbonImmutable::now()->subDays(5)->toDateTimeString(),
            ],
        ]);

        // Seed test orders
        DB::table('orders')->insert([
            [
                'id' => 101,
                'user_id' => 1,
                'status' => 'completed',
                'total_amount_cents' => 10800,
                'tax_amount_cents' => 800,
                'discount_amount_cents' => 1000,
                'created_at' => CarbonImmutable::now()->subHours(2)->toDateTimeString(),
                'updated_at' => CarbonImmutable::now()->subHours(2)->toDateTimeString(),
            ],
            [
                'id' => 102,
                'user_id' => 1,
                'status' => 'refunded',
                'total_amount_cents' => 5400,
                'tax_amount_cents' => 400,
                'discount_amount_cents' => 0,
                'created_at' => CarbonImmutable::now()->subHour()->toDateTimeString(),
                'updated_at' => CarbonImmutable::now()->subHour()->toDateTimeString(),
            ],
            [
                'id' => 103,
                'user_id' => 2,
                'status' => 'completed',
                'total_amount_cents' => 25000,
                'tax_amount_cents' => 2000,
                'discount_amount_cents' => 2000,
                'created_at' => CarbonImmutable::now()->subMinutes(30)->toDateTimeString(),
                'updated_at' => CarbonImmutable::now()->subMinutes(30)->toDateTimeString(),
            ],
        ]);
    }

    public function test_dry_run_extracts_and_transforms_without_modifying_warehouse(): void
    {
        $service = app(WarehouseEtlService::class);
        $stats = $service->run(chunkSize: 10, lookbackMinutes: 180, fullRefresh: true, dryRun: true);

        $this->assertEquals(3, $stats->extractedCount);
        $this->assertEquals(0, $stats->loadedCount);
        $this->assertEquals(3, $stats->skippedCount);

        // Verify warehouse tables remain untouched
        $this->assertEquals(0, DB::connection('warehouse')->table('fact_orders')->count());
        $this->assertEquals(0, DB::connection('warehouse')->table('dim_customers')->count());
        $this->assertEquals(0, DB::table('etl_checkpoints')->count());
    }

    public function test_live_incremental_sync_transforms_and_upserts_records(): void
    {
        $service = app(WarehouseEtlService::class);
        $stats = $service->run(chunkSize: 2, lookbackMinutes: 180, fullRefresh: false, dryRun: false);

        $this->assertEquals(3, $stats->extractedCount);
        $this->assertEquals(3, $stats->loadedCount);
        $this->assertEquals(0, $stats->skippedCount);

        // Verify Fact records
        $facts = DB::connection('warehouse')->table('fact_orders')->orderBy('order_id')->get();
        $this->assertCount(3, $facts);

        $order101 = $facts->firstWhere('order_id', 101);
        $this->assertNotNull($order101);
        $this->assertEquals(1, $order101->customer_key);
        $this->assertEquals('COMPLETED', $order101->order_status);
        $this->assertEquals(10800, $order101->total_net_cents);
        $this->assertEquals(800, $order101->tax_cents);
        $this->assertEquals(1000, $order101->discount_cents);
        // subtotal = total (10800) - tax (800) + discount (1000) = 11000
        $this->assertEquals(11000, $order101->subtotal_cents);

        // Verify Dimension records
        $dims = DB::connection('warehouse')->table('dim_customers')->orderBy('customer_key')->get();
        $this->assertCount(2, $dims);

        $customer1 = $dims->firstWhere('customer_key', 1);
        $this->assertNotNull($customer1);
        $this->assertEquals('company.com', $customer1->email_domain);
        $this->assertEquals('ACTIVE', $customer1->lifetime_tier);
        $this->assertEquals('USA', $customer1->country_code);

        // Verify Checkpoint updated
        $checkpoint = DB::table('etl_checkpoints')->where('pipeline_name', 'sales_orders_fact_pipeline')->first();
        $this->assertNotNull($checkpoint);
        $this->assertEquals('IDLE', $checkpoint->status);
        $this->assertEquals(3, $checkpoint->total_rows_synced);
    }

    public function test_idempotent_reexecution_within_drift_buffer_prevents_duplicate_records(): void
    {
        $service = app(WarehouseEtlService::class);

        // First run loads 3 orders
        $firstRun = $service->run(chunkSize: 10, lookbackMinutes: 300);
        $this->assertEquals(3, $firstRun->loadedCount);
        $this->assertEquals(3, DB::connection('warehouse')->table('fact_orders')->count());

        // Second run with overlap lookback buffer should extract them again but upsert idempotently
        $secondRun = $service->run(chunkSize: 10, lookbackMinutes: 300);
        $this->assertEquals(3, $secondRun->extractedCount);
        $this->assertEquals(3, $secondRun->loadedCount);

        // Warehouse total must still be 3, absolutely NO duplicates!
        $this->assertEquals(3, DB::connection('warehouse')->table('fact_orders')->count());
        $this->assertEquals(2, DB::connection('warehouse')->table('dim_customers')->count());
    }

    public function test_artisan_etl_command_execution(): void
    {
        $this->artisan('etl:warehouse-sync', ['--chunk' => 500, '--lookback' => 180])
            ->assertSuccessful();

        $this->assertEquals(3, DB::connection('warehouse')->table('fact_orders')->count());
    }
}
