<?php

declare(strict_types=1);

namespace App\Services\Etl;

use App\Services\Etl\Dto\OrderFactDto;
use Carbon\CarbonImmutable;
use Exception;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

readonly class EtlExecutionStats
{
    public function __construct(
        public int $extractedCount,
        public int $loadedCount,
        public int $skippedCount,
        public float $durationSeconds,
        public float $peakMemoryMb,
        public CarbonImmutable $newHighWaterMark
    ) {}
}

class WarehouseEtlService
{
    private const PIPELINE_NAME = 'sales_orders_fact_pipeline';

    /**
     * Executes the incremental ETL pipeline from OLTP to the data warehouse.
     */
    public function run(
        int $chunkSize = 1000,
        int $lookbackMinutes = 5,
        bool $fullRefresh = false,
        bool $dryRun = false,
        ?callable $onChunkProcessed = null
    ): EtlExecutionStats {
        $startTime = microtime(true);

        // 1. Resolve High-Water Mark with concurrency lock
        $checkpoint = DB::table('etl_checkpoints')
            ->where('pipeline_name', self::PIPELINE_NAME)
            ->lockForUpdate()
            ->first();

        $lastHwm = $checkpoint && !$fullRefresh
            ? CarbonImmutable::parse($checkpoint->last_high_water_mark)
            : CarbonImmutable::createFromTimestamp(0);

        // Subtract lookback buffer to safeguard against clock-drift mutations
        $effectiveHwm = $lastHwm->subMinutes($lookbackMinutes);
        $syncStartAnchor = CarbonImmutable::now();

        if (!$dryRun) {
            DB::table('etl_checkpoints')->updateOrInsert(
                ['pipeline_name' => self::PIPELINE_NAME],
                [
                    'last_high_water_mark' => $checkpoint ? $checkpoint->last_high_water_mark : CarbonImmutable::createFromTimestamp(0)->toDateTimeString(),
                    'status' => 'RUNNING',
                    'updated_at' => now(),
                ]
            );
        }

        $extracted = 0;
        $loaded = 0;
        $skipped = 0;

        try {
            // 2. Build extraction query (pointing to primary or OLTP replica)
            $query = DB::table('orders')
                ->join('users', 'orders.user_id', '=', 'users.id')
                ->where('orders.updated_at', '>=', $effectiveHwm->toDateTimeString())
                ->select([
                    'orders.id as order_id',
                    'orders.user_id as customer_key',
                    'orders.status as order_status',
                    'orders.total_amount_cents',
                    'orders.tax_amount_cents',
                    'orders.discount_amount_cents',
                    'orders.created_at as ordered_at',
                    'users.email',
                    'users.created_at as user_created_at',
                ])
                ->orderBy('orders.id', 'asc');

            // 3. Process records with O(1) indexed chunking
            $query->chunkById($chunkSize, function ($rows) use (&$extracted, &$loaded, &$skipped, $dryRun, $onChunkProcessed) {
                $extracted += $rows->count();
                $orderFactPayloads = [];
                $dimCustomerPayloads = [];

                foreach ($rows as $row) {
                    $orderedAt = CarbonImmutable::parse($row->ordered_at);

                    // Compute Fact Record
                    $subtotal = (int) $row->total_amount_cents - (int) $row->tax_amount_cents + (int) $row->discount_amount_cents;
                    $fact = new OrderFactDto(
                        orderId: (int) $row->order_id,
                        customerKey: (int) $row->customer_key,
                        orderStatus: strtoupper((string) $row->order_status),
                        itemCount: 1, // Normalized count or aggregated subquery
                        subtotalCents: max(0, $subtotal),
                        taxCents: (int) $row->tax_amount_cents,
                        discountCents: (int) $row->discount_amount_cents,
                        totalNetCents: (int) $row->total_amount_cents,
                        orderDateKey: $orderedAt->format('Y-m-d'),
                        orderedAtUtc: $orderedAt
                    );

                    $orderFactPayloads[] = $fact->toWarehouseArray();

                    // Compute Customer Dimension Record (Idempotent SCD Type 1)
                    $emailDomain = substr(strrchr((string) $row->email, '@') ?: '@unknown', 1);
                    $dimCustomerPayloads[(int) $row->customer_key] = [
                        'customer_key' => (int) $row->customer_key,
                        'email_domain' => strtolower($emailDomain),
                        'country_code' => 'USA',
                        'lifetime_tier' => 'ACTIVE',
                        'account_created_at' => $row->user_created_at,
                        'etl_updated_at' => now()->toDateTimeString(),
                        'created_at' => now()->toDateTimeString(),
                        'updated_at' => now()->toDateTimeString(),
                    ];
                }

                if (!$dryRun) {
                    $dimCustomerValues = array_values($dimCustomerPayloads);

                    // 4. Atomic Multi-Row Upsert to Warehouse Target
                    DB::connection('warehouse')->transaction(function () use ($orderFactPayloads, $dimCustomerValues) {
                        // Upsert Dimensions first to satisfy foreign reference hierarchy
                        if (!empty($dimCustomerValues)) {
                            DB::connection('warehouse')->table('dim_customers')->upsert(
                                $dimCustomerValues,
                                ['customer_key'],
                                ['email_domain', 'lifetime_tier', 'etl_updated_at', 'updated_at']
                            );
                        }

                        // Upsert Facts idempotently
                        if (!empty($orderFactPayloads)) {
                            DB::connection('warehouse')->table('fact_orders')->upsert(
                                $orderFactPayloads,
                                ['order_id'],
                                [
                                    'order_status',
                                    'subtotal_cents',
                                    'tax_cents',
                                    'discount_cents',
                                    'total_net_cents',
                                    'updated_at',
                                    'etl_ingested_at',
                                ]
                            );
                        }
                    });

                    $loaded += count($orderFactPayloads);
                } else {
                    $skipped += count($orderFactPayloads);
                }

                if ($onChunkProcessed) {
                    $onChunkProcessed($extracted, $loaded);
                }
            }, 'orders.id', 'order_id');

            $duration = round(microtime(true) - $startTime, 2);
            $peakMemory = round(memory_get_peak_usage(true) / 1024 / 1024, 2);

            // 5. Update Checkpoint Ledger
            if (!$dryRun) {
                DB::table('etl_checkpoints')->where('pipeline_name', self::PIPELINE_NAME)->update([
                    'last_high_water_mark' => $syncStartAnchor->toDateTimeString(),
                    'status' => 'IDLE',
                    'total_rows_synced' => DB::raw("total_rows_synced + {$loaded}"),
                    'last_duration_seconds' => $duration,
                    'last_error' => null,
                    'updated_at' => now(),
                ]);
            }

            return new EtlExecutionStats(
                extractedCount: $extracted,
                loadedCount: $loaded,
                skippedCount: $skipped,
                durationSeconds: $duration,
                peakMemoryMb: $peakMemory,
                newHighWaterMark: $syncStartAnchor
            );

        } catch (Exception $e) {
            if (!$dryRun) {
                DB::table('etl_checkpoints')->where('pipeline_name', self::PIPELINE_NAME)->update([
                    'status' => 'FAILED',
                    'last_error' => $e->getMessage(),
                    'updated_at' => now(),
                ]);
            }

            throw new RuntimeException("ETL Pipeline failure: " . $e->getMessage(), 0, $e);
        }
    }
}
