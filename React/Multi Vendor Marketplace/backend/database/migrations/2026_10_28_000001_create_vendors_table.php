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
        Schema::create('vendors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('shop_name');
            $table->string('slug')->unique();
            $table->string('logo_url')->nullable();
            $table->string('banner_url')->nullable();
            $table->text('story_bio')->nullable();
            $table->char('origin_country', 2)->default('US');
            $table->string('origin_city')->default('Portland, OR');
            $table->integer('commission_rate_bps')->default(1000); // 10.00% default
            $table->bigInteger('free_shipping_threshold_cents')->nullable()->default(7500); // $75.00
            $table->bigInteger('flat_shipping_rate_cents')->default(800); // $8.00
            $table->integer('avg_ship_hours')->default(24);
            $table->decimal('on_time_ship_pct', 5, 2)->default(99.00);
            $table->string('response_time_text')->default('< 2 hrs');
            $table->decimal('rating_avg', 3, 2)->default(4.90);
            $table->integer('reviews_count')->default(0);
            $table->string('stripe_connect_account_id')->nullable();
            $table->boolean('is_vacation_mode')->default(false);
            $table->string('vacation_return_date')->nullable();
            $table->enum('status', ['pending_kyc', 'active', 'suspended'])->default('active');
            $table->string('tier')->default('Maker Partner');
            $table->bigInteger('escrow_balance_cents')->default(0);
            $table->bigInteger('available_balance_cents')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
