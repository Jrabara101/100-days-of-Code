<?php

namespace App\Services;

use App\Models\ParentOrder;
use App\Models\SubOrder;
use App\Models\SubOrderItem;
use App\Models\ProductVariant;
use App\Models\Vendor;
use App\Models\VendorLedgerEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class SplitCheckoutOrchestrator
{
    /**
     * Atomically orchestrate checkout, pessimistic variant locking,
     * sub-order splitting, and double-entry escrow ledger creation.
     *
     * @param array $payload [
     *    'buyer' => ['name' => '...', 'email' => '...', 'address' => '...'],
     *    'items' => [
     *        ['variant_id' => '...', 'quantity' => 1]
     *    ],
     *    'referral_code' => 'vendor_slug_or_null',
     *    'payment_intent_id' => 'pi_...'
     * ]
     * @return ParentOrder
     * @throws Exception
     */
    public function execute(array $payload): ParentOrder
    {
        return DB::transaction(function () use ($payload) {
            $rawItems = $payload['items'] ?? [];
            if (empty($rawItems)) {
                throw new Exception('Cart is empty. Cannot initiate split checkout.');
            }

            // 1. Acquire pessimistic row locks to prevent overselling during flash promotions
            $variantIds = array_column($rawItems, 'variant_id');
            $variants = ProductVariant::with(['product.vendor'])
                ->whereIn('id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // 2. Validate inventory availability & group items by vendor
            $vendorGroups = [];
            $totalGrossItemsCents = 0;

            foreach ($rawItems as $item) {
                $variantId = $item['variant_id'];
                $qty = (int) ($item['quantity'] ?? 1);

                /** @var ProductVariant|null $variant */
                $variant = $variants->get($variantId);
                if (!$variant) {
                    throw new Exception("Product variant {$variantId} no longer exists.");
                }

                if (!$variant->isAvailable($qty)) {
                    throw new Exception("Inventory exhausted for '{$variant->title}'. Only {$variant->stock_quantity} left.");
                }

                // Decrement inventory / update stock
                $variant->stock_quantity -= $qty;
                $variant->save();

                $vendor = $variant->product->vendor;
                $vendorId = $vendor->id;

                if (!isset($vendorGroups[$vendorId])) {
                    $vendorGroups[$vendorId] = [
                        'vendor' => $vendor,
                        'items' => [],
                        'subtotal_cents' => 0,
                    ];
                }

                $lineTotalCents = $variant->price_cents * $qty;
                $vendorGroups[$vendorId]['items'][] = [
                    'variant' => $variant,
                    'quantity' => $qty,
                    'unit_price_cents' => $variant->price_cents,
                    'line_total_cents' => $lineTotalCents,
                ];

                $vendorGroups[$vendorId]['subtotal_cents'] += $lineTotalCents;
                $totalGrossItemsCents += $lineTotalCents;
            }

            // 3. Calculate shipping totals per vendor
            $totalShippingCents = 0;
            $vendorShippingAllocations = [];

            foreach ($vendorGroups as $vId => $group) {
                /** @var Vendor $vendor */
                $vendor = $group['vendor'];
                $threshold = $vendor->free_shipping_threshold_cents ?? 7500;
                $isFree = $group['subtotal_cents'] >= $threshold;
                $shippingCharge = $isFree ? 0 : ($vendor->flat_shipping_rate_cents ?? 800);

                $vendorShippingAllocations[$vId] = $shippingCharge;
                $totalShippingCents += $shippingCharge;
            }

            $taxTotalCents = (int) round($totalGrossItemsCents * 0.08); // 8% sales tax
            $grandTotalCents = $totalGrossItemsCents + $totalShippingCents + $taxTotalCents;

            // 4. Create Parent Order (Buyer's unified receipt)
            $orderNumber = 'MKT-' . date('Y') . '-' . mt_rand(1000, 9999);
            $parentOrder = ParentOrder::create([
                'order_number' => $orderNumber,
                'buyer_name' => $payload['buyer']['name'] ?? 'Guest Buyer',
                'buyer_email' => $payload['buyer']['email'] ?? 'guest@example.com',
                'currency' => 'USD',
                'items_subtotal_cents' => $totalGrossItemsCents,
                'shipping_total_cents' => $totalShippingCents,
                'tax_total_cents' => $taxTotalCents,
                'discount_total_cents' => 0,
                'grand_total_cents' => $grandTotalCents,
                'payment_gateway' => 'stripe',
                'payment_intent_id' => $payload['payment_intent_id'] ?? ('pi_' . Str::random(24)),
                'payment_status' => 'paid',
                'shipping_address' => $payload['buyer']['address'] ?? ['line1' => 'Standard Delivery'],
                'paid_at' => now(),
            ]);

            // 5. Spawn Isolated Sub-Orders per Vendor & Record Escrow Ledger
            $subOrderIndex = 1;
            foreach ($vendorGroups as $vId => $group) {
                /** @var Vendor $vendor */
                $vendor = $group['vendor'];
                $subOrderNumber = "{$orderNumber}-V{$subOrderIndex}";
                $subOrderIndex++;

                $isDirectReferral = isset($payload['referral_code']) && $payload['referral_code'] === $vendor->slug;
                $commissionBps = $isDirectReferral ? 0 : $vendor->commission_rate_bps;

                $grossItemsCents = $group['subtotal_cents'];
                $shippingCents = $vendorShippingAllocations[$vId];
                $commissionCents = (int) round(($grossItemsCents * $commissionBps) / 10000);
                $gatewayFeeCents = (int) round($grossItemsCents * 0.029) + 30; // 2.9% + $0.30
                $vendorNetPayoutCents = $grossItemsCents + $shippingCents - $commissionCents - $gatewayFeeCents;

                $subOrder = SubOrder::create([
                    'sub_order_number' => $subOrderNumber,
                    'parent_order_id' => $parentOrder->id,
                    'vendor_id' => $vendor->id,
                    'shop_name_snapshot' => $vendor->shop_name,
                    'shop_origin_snapshot' => $vendor->origin_city,
                    'fulfillment_status' => 'confirmed',
                    'referral_source' => $isDirectReferral ? 'vendor_direct' : 'marketplace',
                    'gross_items_cents' => $grossItemsCents,
                    'shipping_charged_cents' => $shippingCents,
                    'tax_collected_cents' => (int) round($grossItemsCents * 0.08),
                    'platform_commission_bps' => $commissionBps,
                    'platform_commission_cents' => $commissionCents,
                    'gateway_fee_allocation_cents' => $gatewayFeeCents,
                    'vendor_net_payout_cents' => $vendorNetPayoutCents,
                    'escrow_status' => 'held_in_escrow',
                ]);

                // Create Sub-Order Line Items
                foreach ($group['items'] as $line) {
                    /** @var ProductVariant $v */
                    $v = $line['variant'];
                    SubOrderItem::create([
                        'sub_order_id' => $subOrder->id,
                        'product_variant_id' => $v->id,
                        'product_title_snapshot' => $v->product->title,
                        'variant_title_snapshot' => $v->title,
                        'quantity' => $line['quantity'],
                        'unit_price_cents' => $line['unit_price_cents'],
                        'line_total_cents' => $line['line_total_cents'],
                        'image_url_snapshot' => $v->product->images[0] ?? null,
                    ]);
                }

                // Credit Vendor Escrow Balance & Create Ledger Entry
                $vendor->escrow_balance_cents += $vendorNetPayoutCents;
                $vendor->save();

                VendorLedgerEntry::create([
                    'vendor_id' => $vendor->id,
                    'sub_order_id' => $subOrder->id,
                    'type' => 'sale_escrow_credit',
                    'amount_cents' => $vendorNetPayoutCents,
                    'balance_bucket' => 'escrow_pending',
                    'description' => "Sale funds locked in escrow for Sub-Order #{$subOrderNumber}. Auto-releases upon verified carrier delivery scan.",
                    'created_at' => now(),
                ]);
            }

            return $parentOrder->load('subOrders.items');
        });
    }
}
