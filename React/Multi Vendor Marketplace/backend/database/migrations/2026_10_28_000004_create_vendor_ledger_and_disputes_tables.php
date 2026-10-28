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
        // Double-Entry Vendor Escrow & Payout Ledger
        Schema::create('vendor_ledger_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            $table->uuid('sub_order_id')->nullable();
            $table->enum('type', [
                'sale_escrow_credit',
                'escrow_released',
                'refund_debit',
                'payout_withdrawal'
            ]);
            $table->bigInteger('amount_cents'); // Signed integer
            $table->enum('balance_bucket', ['escrow_pending', 'available']);
            $table->string('stripe_transfer_id')->nullable();
            $table->text('description');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('vendor_id')->references('id')->on('vendors')->cascadeOnDelete();
            $table->foreign('sub_order_id')->references('id')->on('sub_orders')->nullOnDelete();
        });

        // Zero-Hostility Resolution Disputes
        Schema::create('disputes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sub_order_id');
            $table->uuid('vendor_id');
            $table->string('issue_type');
            $table->enum('resolution_type', ['partial_refund', 'prepaid_return'])->default('partial_refund');
            $table->bigInteger('refund_amount_cents')->default(0);
            $table->enum('status', ['opened', 'resolved', 'escalated'])->default('resolved');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('sub_order_id')->references('id')->on('sub_orders')->cascadeOnDelete();
            $table->foreign('vendor_id')->references('id')->on('vendors')->cascadeOnDelete();
        });

        // Co-Funded Marketing Campaigns
        Schema::create('coop_campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->integer('discount_pct')->default(20);
            $table->integer('marketplace_subsidy_pct')->default(10);
            $table->integer('vendor_contribution_pct')->default(10);
            $table->enum('status', ['draft', 'active', 'ended'])->default('active');
            $table->string('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coop_campaigns');
        Schema::dropIfExists('disputes');
        Schema::dropIfExists('vendor_ledger_entries');
    }
};
