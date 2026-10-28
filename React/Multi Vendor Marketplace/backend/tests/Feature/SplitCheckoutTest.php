<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Vendor;
use App\Services\EscrowSettlementService;
use App\Services\SplitCheckoutOrchestrator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SplitCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_split_checkout_orchestrator_creates_parent_and_sub_orders_with_escrow(): void
    {
        // 1. Create 2 distinct makers
        $vendorA = Vendor::create([
            'shop_name' => 'Studio Kyoto',
            'slug' => 'studio-kyoto',
            'commission_rate_bps' => 1000, // 10%
            'free_shipping_threshold_cents' => 7500,
            'flat_shipping_rate_cents' => 800,
            'escrow_balance_cents' => 0,
            'available_balance_cents' => 0,
        ]);

        $vendorB = Vendor::create([
            'shop_name' => 'Studio Lisbon',
            'slug' => 'studio-lisbon',
            'commission_rate_bps' => 800, // 8%
            'free_shipping_threshold_cents' => 5000,
            'flat_shipping_rate_cents' => 600,
            'escrow_balance_cents' => 0,
            'available_balance_cents' => 0,
        ]);

        // 2. Create products and variants
        $prodA = Product::create([
            'vendor_id' => $vendorA->id,
            'category' => 'Ceramics',
            'title' => 'Stoneware Mug',
            'slug' => 'stoneware-mug',
            'images' => ['https://example.com/mug.jpg'],
        ]);

        $varA = ProductVariant::create([
            'product_id' => $prodA->id,
            'sku' => 'KYO-MUG-01',
            'title' => 'Slate Gray',
            'price_cents' => 6000, // $60.00
            'stock_quantity' => 10,
        ]);

        $prodB = Product::create([
            'vendor_id' => $vendorB->id,
            'category' => 'Candles',
            'title' => 'Beeswax Candle',
            'slug' => 'beeswax-candle',
            'images' => ['https://example.com/candle.jpg'],
        ]);

        $varB = ProductVariant::create([
            'product_id' => $prodB->id,
            'sku' => 'LIS-CNDL-01',
            'title' => '280g Glass',
            'price_cents' => 3000, // $30.00
            'stock_quantity' => 5,
        ]);

        // 3. Execute atomic checkout
        $orchestrator = app(SplitCheckoutOrchestrator::class);
        $parentOrder = $orchestrator->execute([
            'buyer' => [
                'name' => 'Sofia Alcantara',
                'email' => 'sofia@example.com',
                'address' => '124 Brooklyn Way, NY',
            ],
            'items' => [
                ['variant_id' => $varA->id, 'quantity' => 1],
                ['variant_id' => $varB->id, 'quantity' => 1],
            ],
            'referral_code' => null,
            'payment_intent_id' => 'pi_test_12345',
        ]);

        // 4. Assert Parent Order & Sub-Orders structure
        $this->assertNotNull($parentOrder);
        $this->assertEquals(9000, $parentOrder->items_subtotal_cents);
        $this->assertCount(2, $parentOrder->subOrders);

        // 5. Assert Inventory was safely decremented
        $this->assertEquals(9, $varA->fresh()->stock_quantity);
        $this->assertEquals(4, $varB->fresh()->stock_quantity);

        // 6. Assert Escrow credit was recorded in Double-Entry Ledger
        $this->assertDatabaseHas('vendor_ledger_entries', [
            'vendor_id' => $vendorA->id,
            'type' => 'sale_escrow_credit',
            'balance_bucket' => 'escrow_pending',
        ]);

        // 7. Verify Carrier Delivery unlocks Escrow into Available Balance
        $subOrderA = $parentOrder->subOrders()->where('vendor_id', $vendorA->id)->first();
        $escrowService = app(EscrowSettlementService::class);
        $escrowService->verifyCarrierDelivery($subOrderA->id);

        $freshVendorA = $vendorA->fresh();
        $this->assertEquals(0, $freshVendorA->escrow_balance_cents);
        $this->assertGreaterThan(0, $freshVendorA->available_balance_cents);

        // 8. Assert Double-Entry escrow_released entry exists
        $this->assertDatabaseHas('vendor_ledger_entries', [
            'vendor_id' => $vendorA->id,
            'sub_order_id' => $subOrderA->id,
            'type' => 'escrow_released',
            'balance_bucket' => 'available',
        ]);
    }
}
