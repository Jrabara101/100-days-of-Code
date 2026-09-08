<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->string('status', 32)->default('completed')->index();
            $table->unsignedBigInteger('total_amount_cents');
            $table->unsignedBigInteger('tax_amount_cents')->default(0);
            $table->unsignedBigInteger('discount_amount_cents')->default(0);
            $table->timestamps();

            // Composite index for high-throughput HWM cursor extraction seek
            $table->index(['updated_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
