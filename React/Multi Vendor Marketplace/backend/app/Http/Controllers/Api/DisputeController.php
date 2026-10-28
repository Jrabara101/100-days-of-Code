<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Models\SubOrder;
use App\Models\VendorLedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DisputeController extends Controller
{
    /**
     * Open and process zero-hostility resolution ticket.
     */
    public function resolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sub_order_id' => 'required|string',
            'issue_type' => 'required|string',
            'resolution_type' => 'required|in:partial_refund,prepaid_return',
            'refund_amount_cents' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $subOrder = SubOrder::findOrFail($validated['sub_order_id']);

            $dispute = Dispute::create([
                'sub_order_id' => $subOrder->id,
                'vendor_id' => $subOrder->vendor_id,
                'issue_type' => $validated['issue_type'],
                'resolution_type' => $validated['resolution_type'],
                'refund_amount_cents' => $validated['refund_amount_cents'],
                'status' => 'resolved',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update sub-order status
            $subOrder->update([
                'fulfillment_status' => $validated['resolution_type'] === 'partial_refund' ? 'partially_refunded' : 'returned',
                'resolution_note' => "{$validated['resolution_type']}: $" . number_format($validated['refund_amount_cents'] / 100, 2),
            ]);

            // If partial refund, record refund_debit in ledger
            if ($validated['resolution_type'] === 'partial_refund' && $validated['refund_amount_cents'] > 0) {
                VendorLedgerEntry::create([
                    'vendor_id' => $subOrder->vendor_id,
                    'sub_order_id' => $subOrder->id,
                    'type' => 'refund_debit',
                    'amount_cents' => -$validated['refund_amount_cents'],
                    'balance_bucket' => 'escrow_pending',
                    'description' => "Zero-hostility partial refund issued ($" . number_format($validated['refund_amount_cents'] / 100, 2) . ") for buyer satisfaction.",
                    'created_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Dispute resolved without administrative escalation.',
                'dispute' => $dispute,
            ]);
        });
    }
}
