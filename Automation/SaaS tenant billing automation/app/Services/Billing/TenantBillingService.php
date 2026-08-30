<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Subscription;
use App\Models\UsageRecord;
use Carbon\CarbonImmutable;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

readonly class BillingResult
{
    public function __construct(
        public bool $success,
        public string $tenantName,
        public string $invoiceNumber,
        public int $totalCents,
        public int $meteredUsageUnits,
        public int $overageCents,
        public string $status,
        public ?string $errorMessage = null
    ) {}
}

class TenantBillingService
{
    /**
     * Executes an atomic billing cycle calculation, invoice creation, and payment collection.
     */
    public function processCycle(Subscription $subscription, CarbonImmutable $targetDate, bool $dryRun = false): BillingResult
    {
        return DB::transaction(function () use ($subscription, $targetDate, $dryRun) {
            /** @var Subscription $lockedSub */
            $lockedSub = Subscription::query()
                ->where('id', $subscription->id)
                ->lockForUpdate()
                ->with(['tenant', 'plan'])
                ->firstOrFail();

            $tenant = $lockedSub->tenant;
            $plan = $lockedSub->plan;

            $periodStart = CarbonImmutable::parse($lockedSub->current_period_start);
            $periodEnd = CarbonImmutable::parse($lockedSub->current_period_end);

            // Compute deterministic idempotency key for this tenant's billing period
            $idempotencyHash = hash('sha256', sprintf(
                '%d|%d|%s|%s',
                $tenant->id,
                $lockedSub->id,
                $periodStart->toIso8601String(),
                $periodEnd->toIso8601String()
            ));

            // Prevent double-billing
            $existingInvoice = Invoice::query()->where('idempotency_hash', $idempotencyHash)->first();
            if ($existingInvoice && $existingInvoice->status === 'paid') {
                return new BillingResult(
                    success: true,
                    tenantName: $tenant->name,
                    invoiceNumber: $existingInvoice->invoice_number,
                    totalCents: $existingInvoice->total_cents,
                    meteredUsageUnits: 0,
                    overageCents: 0,
                    status: 'SKIPPED_ALREADY_PAID',
                    errorMessage: 'Billing cycle already settled.'
                );
            }

            // 1. Calculate Base Fee
            $basePriceCents = (int) $plan->base_price_cents;

            // 2. Aggregate Unbilled Metered Overages
            $totalUsage = (int) UsageRecord::query()
                ->where('tenant_id', $tenant->id)
                ->where('is_billed', false)
                ->whereBetween('recorded_at', [$periodStart, $periodEnd])
                ->sum('quantity');

            $includedCalls = (int) $plan->included_api_calls;
            $overageUnits = max(0, $totalUsage - $includedCalls);
            $overageCents = 0;

            if ($overageUnits > 0) {
                // Tiered overage pricing per 1,000 requests
                $overageRate = (int) $plan->overage_rate_cents_per_thousand;
                $overageCents = (int) ceil(($overageUnits / 1000) * $overageRate);
            }

            $subtotalCents = $basePriceCents + $overageCents;
            $taxCents = (int) round($subtotalCents * 0.08); // 8% statutory tax
            $totalCents = $subtotalCents + $taxCents;
            $invoiceNumber = $existingInvoice?->invoice_number ?? ('INV-' . $periodEnd->format('Ym') . '-' . Str::upper(Str::random(6)));

            if ($dryRun) {
                return new BillingResult(
                    success: true,
                    tenantName: $tenant->name,
                    invoiceNumber: $invoiceNumber . ' (SIMULATED)',
                    totalCents: $totalCents,
                    meteredUsageUnits: $totalUsage,
                    overageCents: $overageCents,
                    status: 'SIMULATED'
                );
            }

            // 3. Persist Immutable Invoice Record or Reuse Existing Failed Invoice for Dunning Retry
            if ($existingInvoice) {
                $invoice = $existingInvoice;
            } else {
                $invoice = Invoice::create([
                    'tenant_id' => $tenant->id,
                    'subscription_id' => $lockedSub->id,
                    'invoice_number' => $invoiceNumber,
                    'idempotency_hash' => $idempotencyHash,
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                    'subtotal_cents' => $subtotalCents,
                    'tax_cents' => $taxCents,
                    'total_cents' => $totalCents,
                    'status' => 'draft',
                ]);

                // Create Line Items
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => sprintf('%s Plan - Base Subscription (%s to %s)', $plan->name, $periodStart->format('M d'), $periodEnd->format('M d')),
                    'unit_price_cents' => $basePriceCents,
                    'quantity' => 1,
                    'total_cents' => $basePriceCents,
                ]);

                if ($overageCents > 0) {
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'description' => sprintf('Metered API Overage (%s units beyond %s quota)', number_format($overageUnits), number_format($includedCalls)),
                        'unit_price_cents' => $plan->overage_rate_cents_per_thousand,
                        'quantity' => (int) ceil($overageUnits / 1000),
                        'total_cents' => $overageCents,
                    ]);
                }
            }

            // 4. Attempt Gateway Settlement
            $paymentSuccess = $this->simulateGatewayCharge($tenant->payment_method_token, $totalCents);

            if ($paymentSuccess) {
                $invoice->update([
                    'status' => 'paid',
                    'paid_at' => CarbonImmutable::now(),
                ]);

                // Mark metered usage records as settled
                UsageRecord::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('is_billed', false)
                    ->whereBetween('recorded_at', [$periodStart, $periodEnd])
                    ->update([
                        'is_billed' => true,
                        'invoice_id' => $invoice->id,
                    ]);

                // Advance Billing Anchor Period
                $nextStart = $periodEnd;
                $nextEnd = $plan->interval === 'yearly'
                    ? $nextStart->addYear()
                    : $nextStart->addMonth();

                $lockedSub->update([
                    'status' => 'active',
                    'current_period_start' => $nextStart,
                    'current_period_end' => $nextEnd,
                    'failed_payment_attempts' => 0,
                    'last_payment_attempt_at' => CarbonImmutable::now(),
                ]);

                $tenant->update(['status' => 'active']);

                return new BillingResult(
                    success: true,
                    tenantName: $tenant->name,
                    invoiceNumber: $invoiceNumber,
                    totalCents: $totalCents,
                    meteredUsageUnits: $totalUsage,
                    overageCents: $overageCents,
                    status: 'PAID'
                );
            }

            // 5. Handle Payment Failure & Dunning State Progression
            $attempts = $lockedSub->failed_payment_attempts + 1;
            $newStatus = $attempts >= 3 ? 'suspended' : 'past_due';

            $lockedSub->update([
                'status' => $newStatus,
                'failed_payment_attempts' => $attempts,
                'last_payment_attempt_at' => CarbonImmutable::now(),
            ]);

            $tenant->update(['status' => $newStatus]);

            $invoice->update(['status' => 'payment_failed']);

            return new BillingResult(
                success: false,
                tenantName: $tenant->name,
                invoiceNumber: $invoiceNumber,
                totalCents: $totalCents,
                meteredUsageUnits: $totalUsage,
                overageCents: $overageCents,
                status: 'PAYMENT_FAILED',
                errorMessage: sprintf('Charge failed. Dunning state set to [%s] (Attempt %d/3).', strtoupper($newStatus), $attempts)
            );
        });
    }

    private function simulateGatewayCharge(?string $token, int $amountCents): bool
    {
        if (empty($token) || str_starts_with($token, 'pm_fail')) {
            return false;
        }

        // Simulate 50ms gateway API network latency
        usleep(50000);

        return true;
    }
}
