<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentOrder;
use App\Models\SubOrder;
use App\Services\SplitCheckoutOrchestrator;
use App\Services\EscrowSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class OrderController extends Controller
{
    public function __construct(
        protected SplitCheckoutOrchestrator $splitOrchestrator,
        protected EscrowSettlementService $escrowService
    ) {
    }

    /**
     * Atomically split unified checkout across vendors.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'buyer' => 'required|array',
            'buyer.name' => 'required|string',
            'buyer.email' => 'required|email',
            'buyer.address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'referral_code' => 'nullable|string',
            'payment_intent_id' => 'nullable|string',
        ]);

        try {
            $order = $this->splitOrchestrator->execute($validated);
            return response()->json([
                'success' => true,
                'message' => 'Checkout succeeded. Order split into vendor fulfillment queues.',
                'order' => $order,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get Parent Order details with its sub-orders.
     */
    public function show(string $orderNumber): JsonResponse
    {
        $order = ParentOrder::with(['subOrders.items', 'subOrders.vendor'])
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'order' => $order,
        ]);
    }

    /**
     * Carrier Webhook simulation: verifies delivery & auto-releases escrow to maker.
     */
    public function verifyDelivery(string $subOrderId): JsonResponse
    {
        try {
            $subOrder = $this->escrowService->verifyCarrierDelivery($subOrderId);
            return response()->json([
                'success' => true,
                'message' => 'Carrier delivery verified. Escrow auto-released to vendor available balance.',
                'sub_order' => $subOrder,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
