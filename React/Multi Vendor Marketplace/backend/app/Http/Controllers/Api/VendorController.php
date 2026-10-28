<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubOrder;
use App\Models\Vendor;
use App\Models\VendorLedgerEntry;
use App\Services\EscrowSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class VendorController extends Controller
{
    public function __construct(protected EscrowSettlementService $escrowService)
    {
    }

    /**
     * Get vendor dashboard overview metrics.
     */
    public function dashboard(string $vendorId): JsonResponse
    {
        $vendor = Vendor::withCount(['products', 'subOrders'])->findOrFail($vendorId);
        $recentLedgers = VendorLedgerEntry::where('vendor_id', $vendorId)
            ->latest('created_at')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'vendor' => $vendor,
            'recent_ledgers' => $recentLedgers,
        ]);
    }

    /**
     * Sub-Order fulfillment queue for this specific studio.
     */
    public function subOrders(string $vendorId): JsonResponse
    {
        $subOrders = SubOrder::with(['items', 'parentOrder'])
            ->where('vendor_id', $vendorId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'sub_orders' => $subOrders,
        ]);
    }

    /**
     * Mark sub-order shipped with carrier and tracking code.
     */
    public function markShipped(Request $request, string $subOrderId): JsonResponse
    {
        $validated = $request->validate([
            'carrier_name' => 'required|string',
            'tracking_number' => 'nullable|string',
        ]);

        $subOrder = SubOrder::findOrFail($subOrderId);
        $trackingNumber = $validated['tracking_number'] ?? ('TRK-' . strtoupper(substr($validated['carrier_name'], 0, 3)) . '-' . mt_rand(10000000, 99999999));

        $subOrder->update([
            'fulfillment_status' => 'shipped',
            'escrow_status' => 'in_transit_escrow_held',
            'carrier_name' => $validated['carrier_name'],
            'tracking_number' => $trackingNumber,
            'shipped_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sub-Order marked shipped. Tracking assigned.',
            'sub_order' => $subOrder,
        ]);
    }

    /**
     * 1-Click Bank Withdrawal Sweep via Stripe Connect.
     */
    public function withdraw(Request $request, string $vendorId): JsonResponse
    {
        $amountCents = $request->input('amount_cents');

        try {
            $withdrawn = $this->escrowService->withdrawVendorAvailableBalance($vendorId, $amountCents ? (int)$amountCents : null);
            return response()->json([
                'success' => true,
                'message' => 'Payout initiated to linked bank account.',
                'amount_cents' => $withdrawn,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Toggle vacation mode.
     */
    public function toggleVacation(string $vendorId): JsonResponse
    {
        $vendor = Vendor::findOrFail($vendorId);
        $vendor->is_vacation_mode = !$vendor->is_vacation_mode;
        $vendor->save();

        return response()->json([
            'success' => true,
            'is_vacation_mode' => $vendor->is_vacation_mode,
            'message' => $vendor->is_vacation_mode ? 'Vacation mode enabled.' : 'Storefront live.',
        ]);
    }

    /**
     * Real-time Net-to-Pocket Pricing Calculator waterfall.
     */
    public function calculatePricing(Request $request, string $vendorId): JsonResponse
    {
        $vendor = Vendor::findOrFail($vendorId);
        $retailPriceCents = (int) $request->input('retail_price_cents', 10000);
        $isDirect = (bool) $request->input('is_direct_referral', false);

        $waterfall = $vendor->computeWaterfall($retailPriceCents, $isDirect);

        return response()->json([
            'success' => true,
            'waterfall' => $waterfall,
        ]);
    }
}
