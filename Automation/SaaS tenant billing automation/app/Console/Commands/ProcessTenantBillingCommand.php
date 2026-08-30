<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\Billing\BillingResult;
use App\Services\Billing\TenantBillingService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use function Termwind\{render};

class ProcessTenantBillingCommand extends Command
{
    protected $signature = 'billing:tenant-cycle
                            {--tenant= : Specific Tenant ID to process}
                            {--date= : Target execution date (YYYY-MM-DD)}
                            {--dry-run : Simulate billing calculations without mutating state or charging gateways}
                            {--force : Bypass confirmation prompt in production}';

    protected $description = 'Executes recurring subscription settlement, overage calculation, and dunning workflows.';

    public function handle(TenantBillingService $billingService): int
    {
        $targetDate = $this->option('date')
            ? CarbonImmutable::parse((string) $this->option('date'))
            : CarbonImmutable::now();

        $dryRun = (bool) $this->option('dry-run');
        $tenantId = $this->option('tenant');

        $this->renderHeader($targetDate, $dryRun);

        // Fetch subscriptions due for cycle settlement
        $query = Subscription::query()
            ->with(['tenant', 'plan'])
            ->whereIn('status', ['active', 'past_due'])
            ->where('current_period_end', '<=', $targetDate);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $subscriptions = $query->get();

        if ($subscriptions->isEmpty()) {
            render(<<<'HTML'
                <div class="my-1 mx-2 p-1 bg-blue-900 text-white font-bold">
                    ℹ No tenant subscriptions are due for billing cycle settlement.
                </div>
            HTML);
            return self::SUCCESS;
        }

        render(sprintf(
            '<div class="my-1 text-gray-400">Identified <span class="text-cyan-400 font-bold">%d</span> tenant subscription(s) matching renewal anchor window.</div>',
            $subscriptions->count()
        ));

        if (!$dryRun && app()->isProduction() && !$this->option('force')) {
            if (!$this->confirm('You are in PRODUCTION. Do you want to process live credit card charges?')) {
                $this->warn('Billing run aborted by operator.');
                return self::FAILURE;
            }
        }

        $results = [];
        $totalCollectedCents = 0;
        $totalOverageCents = 0;
        $failures = 0;

        $progressBar = $this->output->createProgressBar($subscriptions->count());
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% -- %message%');
        $progressBar->setMessage('Initializing payment pipeline...');
        $progressBar->start();

        foreach ($subscriptions as $subscription) {
            $progressBar->setMessage('Billing: ' . $subscription->tenant->name);

            $result = $billingService->processCycle($subscription, $targetDate, $dryRun);
            $results[] = $result;

            if ($result->success && $result->status !== 'SKIPPED_ALREADY_PAID') {
                $totalCollectedCents += $result->totalCents;
                $totalOverageCents += $result->overageCents;
            } elseif (!$result->success) {
                $failures++;
            }

            $progressBar->advance();
        }

        $progressBar->setMessage('Settlement run finalized.');
        $progressBar->finish();
        $this->newLine(2);

        $this->renderResultsTable($results);
        $this->renderSummaryCard($results, $totalCollectedCents, $totalOverageCents, $failures, $dryRun);

        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function renderHeader(CarbonImmutable $date, bool $dryRun): void
    {
        $modeBadge = $dryRun
            ? '<span class="bg-yellow-500 text-black px-1 font-bold">DRY-RUN SIMULATION</span>'
            : '<span class="bg-emerald-600 text-white px-1 font-bold">LIVE PRODUCTION SETTLEMENT</span>';

        render(<<<HTML
            <div class="mx-1 my-1 p-1 bg-gray-900">
                <div class="flex justify-between">
                    <span class="text-indigo-400 font-bold">⚡ SAAS MULTI-TENANT RECURRING BILLING ENGINE</span>
                    {$modeBadge}
                </div>
                <div class="text-gray-400 mt-1">
                    Target Execution Anchor: <span class="text-white font-bold">{$date->toFormattedDateString()}</span> | Engine: <span class="text-cyan-400">Strict Minor-Units / Pessimistic Locking</span>
                </div>
            </div>
        HTML);
    }

    /**
     * @param array<BillingResult> $results
     */
    private function renderResultsTable(array $results): void
    {
        $rows = '';
        foreach ($results as $r) {
            $statusBadge = match ($r->status) {
                'PAID' => '<span class="text-emerald-400 font-bold">✔ PAID</span>',
                'SIMULATED' => '<span class="text-yellow-400 font-bold">⊙ SIMULATED</span>',
                'SKIPPED_ALREADY_PAID' => '<span class="text-blue-400">⏭ SKIPPED</span>',
                default => '<span class="text-red-400 font-bold">✖ FAILED</span>',
            };

            $formattedTotal = '$' . number_format($r->totalCents / 100, 2);
            $formattedOverage = $r->overageCents > 0
                ? '<span class="text-yellow-300">+$' . number_format($r->overageCents / 100, 2) . '</span>'
                : '<span class="text-gray-500">$0.00</span>';

            $errorDetail = $r->errorMessage
                ? sprintf('<div class="text-red-400 italic">%s</div>', e($r->errorMessage))
                : '';

            $rows .= <<<HTML
                <tr>
                    <td class="font-bold text-white">{$r->tenantName}</td>
                    <td class="text-gray-300">{$r->invoiceNumber}</td>
                    <td class="text-right">{$formattedTotal}</td>
                    <td class="text-right">{$formattedOverage}</td>
                    <td>{$statusBadge} {$errorDetail}</td>
                </tr>
            HTML;
        }

        render(<<<HTML
            <table class="w-full my-1">
                <thead>
                    <tr>
                        <th class="text-left font-bold text-cyan-400">Tenant Profile</th>
                        <th class="text-left font-bold text-cyan-400">Invoice Ref</th>
                        <th class="text-right font-bold text-cyan-400">Total Billed</th>
                        <th class="text-right font-bold text-cyan-400">Metered Overage</th>
                        <th class="text-left font-bold text-cyan-400">Settlement Status</th>
                    </tr>
                </thead>
                <tbody>
                    {$rows}
                </tbody>
            </table>
        HTML);
    }

    /**
     * @param array<BillingResult> $results
     */
    private function renderSummaryCard(array $results, int $totalCollectedCents, int $totalOverageCents, int $failures, bool $dryRun): void
    {
        $totalFormatted = '$' . number_format($totalCollectedCents / 100, 2);
        $overageFormatted = '$' . number_format($totalOverageCents / 100, 2);
        $count = count($results);

        $healthColor = $failures > 0 ? 'text-red-400' : 'text-emerald-400';

        render(<<<HTML
            <div class="my-1 p-1 bg-gray-900">
                <div class="font-bold text-indigo-300 mb-1">📊 RECONCILIATION SUMMARY</div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Total Invoices Evaluated:</span>
                    <span class="text-white font-bold">{$count}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Gross Settlement Volume:</span>
                    <span class="text-emerald-400 font-bold">{$totalFormatted}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Metered Overages Captured:</span>
                    <span class="text-yellow-400 font-bold">{$overageFormatted}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Dunning / Collection Failures:</span>
                    <span class="{$healthColor} font-bold">{$failures}</span>
                </div>
            </div>
        HTML);
    }
}
