<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('currency', 3)->default('USD');
            $table->string('status')->default('active'); // active, past_due, suspended, canceled
            $table->string('payment_method_token')->nullable();
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedInteger('base_price_cents');
            $table->string('interval')->default('monthly'); // monthly, yearly
            $table->unsignedInteger('included_api_calls')->default(10000);
            $table->unsignedInteger('overage_rate_cents_per_thousand')->default(150); // $1.50 per 1k
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained();
            $table->string('status')->default('active'); // active, past_due, suspended, canceled
            $table->dateTime('current_period_start');
            $table->dateTime('current_period_end');
            $table->unsignedTinyInteger('failed_payment_attempts')->default(0);
            $table->dateTime('last_payment_attempt_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'current_period_end']);
        });

        Schema::create('usage_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('metric_name');
            $table->unsignedInteger('quantity');
            $table->dateTime('recorded_at');
            $table->boolean('is_billed')->default(false);
            $table->foreignId('invoice_id')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_billed', 'recorded_at']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_number')->unique();
            $table->string('idempotency_hash')->unique();
            $table->dateTime('period_start');
            $table->dateTime('period_end');
            $table->unsignedInteger('subtotal_cents');
            $table->unsignedInteger('tax_cents')->default(0);
            $table->unsignedInteger('total_cents');
            $table->string('status')->default('draft'); // draft, paid, payment_failed, void
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('total_cents');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('usage_records');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('tenants');
    }
};
