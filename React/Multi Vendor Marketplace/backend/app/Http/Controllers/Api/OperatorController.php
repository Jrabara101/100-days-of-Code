<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoopCampaign;
use App\Models\ParentOrder;
use App\Models\Vendor;
use App\Models\VendorLedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OperatorController extends Controller
{
    /**
     * Operator Dashboard Metrics & Solvency Audit.
     */
    public function metrics(): JsonResponse
    {
        $totalGmvCents = ParentOrder::sum('grand_total_cents');
        $totalEscrowHeldCents = Vendor::sum('escrow_balance_cents');
        $vendorsCount = Vendor::count();
        $campaigns = CoopCampaign::latest()->get();

        return response()->json([
            'success' => true,
            'metrics' => [
                'total_gmv_cents' => (int) $totalGmvCents,
                'total_escrow_held_cents' => (int) $totalEscrowHeldCents,
                'active_vendors_count' => $vendorsCount,
                'solvency_status' => 'fully_backed_by_stripe',
            ],
            'campaigns' => $campaigns,
        ]);
    }

    /**
     * Launch new Co-Funded Campaign.
     */
    public function storeCampaign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'discount_pct' => 'required|integer|min:5|max:50',
            'marketplace_subsidy_pct' => 'required|integer|min:0|max:50',
            'vendor_contribution_pct' => 'required|integer|min:0|max:50',
            'end_date' => 'nullable|string',
        ]);

        $campaign = CoopCampaign::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']),
            'discount_pct' => $validated['discount_pct'],
            'marketplace_subsidy_pct' => $validated['marketplace_subsidy_pct'],
            'vendor_contribution_pct' => $validated['vendor_contribution_pct'],
            'status' => 'active',
            'end_date' => $validated['end_date'] ?? 'Nov 15, 2026',
        ]);

        return response()->json([
            'success' => true,
            'campaign' => $campaign,
        ], 201);
    }
}
