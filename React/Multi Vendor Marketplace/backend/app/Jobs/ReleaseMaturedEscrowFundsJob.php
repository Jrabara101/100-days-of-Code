<?php

namespace App\Jobs;

use App\Services\EscrowSettlementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ReleaseMaturedEscrowFundsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(EscrowSettlementService $escrowService): void
    {
        $releasedCount = $escrowService->sweepMaturedEscrow();
        Log::info("Scheduled Escrow Sweep: Auto-released {$releasedCount} matured sub-orders.");
    }
}
