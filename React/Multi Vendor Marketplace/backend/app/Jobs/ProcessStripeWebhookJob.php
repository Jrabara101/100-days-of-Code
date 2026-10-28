<?php

namespace App\Jobs;

use App\Models\ParentOrder;
use App\Services\EscrowSettlementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessStripeWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public array $payload)
    {
    }

    /**
     * Idempotent Stripe webhook handler.
     */
    public function handle(EscrowSettlementService $escrowService): void
    {
        $eventType = $this->payload['type'] ?? '';
        $dataObject = $this->payload['data']['object'] ?? [];

        Log::info("Processing Stripe Webhook: {$eventType}", ['id' => $dataObject['id'] ?? null]);

        switch ($eventType) {
            case 'payment_intent.succeeded':
                $paymentIntentId = $dataObject['id'] ?? null;
                if ($paymentIntentId) {
                    ParentOrder::where('payment_intent_id', $paymentIntentId)
                        ->update(['payment_status' => 'paid', 'paid_at' => now()]);
                }
                break;

            case 'charge.refunded':
                // Handle refund synchronization
                break;
        }
    }
}
