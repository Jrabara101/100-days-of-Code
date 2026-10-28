<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Parent Order: The Buyer's Unified Checkout Record
        Schema::create('parent_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number')->unique();
            $table->foreignId('buyer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('buyer_name');
            $table->string('buyer_email');
            $table->char('currency', 3)->default('USD');
            $table->bigInteger('items_subtotal_cents');
            $table->bigInteger('shipping_total_cents');
            $table->bigInteger('tax_total_cents');
            $table->bigInteger('discount_total_cents')->default(0);
            $table->bigInteger('grand_total_cents');
            $table->enum('payment_gateway', ['stripe', 'paypal'])->default('stripe');
            $table->string('payment_intent_id')->unique();
            $table->enum('payment_status', ['pending', 'paid', 'partially_refunded', 'refunded'])->default('paid');
            $table->json('shipping_address');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // Sub-Order: Per-Vendor Fulfillment & Financial Slice
        Schema::create('sub_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sub_order_number')->unique();
            $table->uuid('parent_order_id');
            $table->uuid('vendor_id');
            $table->string('shop_name_snapshot');
            $table->string('shop_origin_snapshot');
            $table->enum('fulfillment_status', [
                'unfulfilled',
                'confirmed',
                'packed',
                'shipped',
                'delivered',
                'partially_refunded',
                'returned',
                'cancelled'
            ])->default('confirmed');
            $table->enum('referral_source', ['marketplace', 'vendor_direct'])->default('marketplace');
            $table->bigInteger('gross_items_cents');
            $table->bigInteger('shipping_charged_cents')->default(0);
            $table->bigInteger('tax_collected_cents')->default(0);
            $table->integer('platform_commission_bps')->default(1000); // 10.00%
            $table->bigInteger('platform_commission_cents')->default(0);
            $table->bigInteger('gateway_fee_allocation_cents')->default(0);
            $table->bigInteger('vendor_net_payout_cents');
            $table->enum('escrow_status', [
                'pending_fulfillment',
                'held_in_escrow',
                'in_transit_escrow_held',
                'escrow_released',
                'refunded'
            ])->default('held_in_escrow');
            $table->string('carrier_name')->nullable();
            $table->string('tracking_number')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('escrow_release_at')->nullable();
            $table->text('resolution_note')->nullable();
            $table->timestamps();

            $table->foreign('parent_order_id')->references('id')->on('parent_orders')->cascadeOnDelete();
            $table->foreign('vendor_id')->references('id')->on('vendors')->cascadeOnDelete();
        });

        // Sub-Order Line Items
        Schema::create('sub_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sub_order_id');
            $table->uuid('product_variant_id')->nullable();
            $table->string('product_title_snapshot');
            $table->string('variant_title_snapshot');
            $table->integer('quantity');
            $table->bigInteger('unit_price_cents');
            $table->bigInteger('line_total_cents');
            $table->string('image_url_snapshot')->nullable();
            $table->timestamps();

            $table->foreign('sub_order_id')->references('id')->on('sub_orders')->cascadeOnDelete();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_order_items');
        Schema::dropIfExists('sub_orders');
        Schema::dropIfExists('parent_orders');
    }
};
