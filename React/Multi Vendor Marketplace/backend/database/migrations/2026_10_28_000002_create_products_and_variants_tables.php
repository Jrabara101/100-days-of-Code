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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            $table->string('category');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('images');
            $table->enum('status', ['draft', 'published', 'archived'])->default('published');
            $table->decimal('rating_avg', 3, 2)->default(5.00);
            $table->integer('reviews_count')->default(0);
            $table->string('provenance_badge')->nullable();
            $table->boolean('is_add_on')->default(false);
            $table->json('dimensional_reviews')->nullable();
            $table->timestamps();

            $table->foreign('vendor_id')->references('id')->on('vendors')->cascadeOnDelete();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->string('sku')->unique();
            $table->string('title');
            $table->json('attributes')->nullable();
            $table->bigInteger('price_cents');
            $table->bigInteger('compare_at_price_cents')->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->integer('reserved_quantity')->default(0);
            $table->integer('velocity_days_left')->default(7);
            $table->integer('weight_grams')->default(500);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
    }
};
