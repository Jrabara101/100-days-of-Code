<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Checkpoint Ledger (Stored in Primary OLTP or Warehouse DB)
        Schema::create('etl_checkpoints', function (Blueprint $table) {
            $table->id();
            $table->string('pipeline_name')->unique();
            $table->dateTime('last_high_water_mark');
            $table->unsignedBigInteger('last_processed_id')->default(0);
            $table->string('status')->default('IDLE'); // IDLE, RUNNING, FAILED
            $table->unsignedBigInteger('total_rows_synced')->default(0);
            $table->float('last_duration_seconds')->default(0.0);
            $table->text('last_error')->nullable();
            $table->timestamps();
        });

        // OLAP Target Fact Table (Typically on the 'warehouse' connection)
        Schema::connection('warehouse')->create('fact_orders', function (Blueprint $table) {
            $table->id('fact_id');
            $table->unsignedBigInteger('order_id')->unique(); // Natural OLTP Key
            $table->unsignedBigInteger('customer_key')->index();
            $table->string('order_status', 32);
            $table->unsignedInteger('item_count');
            $table->unsignedBigInteger('subtotal_cents');
            $table->unsignedBigInteger('tax_cents');
            $table->unsignedBigInteger('discount_cents');
            $table->unsignedBigInteger('total_net_cents');
            $table->date('order_date_key')->index(); // YYYYMMDD dimensional key
            $table->dateTime('ordered_at_utc');
            $table->dateTime('etl_ingested_at');
            $table->timestamps();
        });

        // OLAP Target Dimension Table
        Schema::connection('warehouse')->create('dim_customers', function (Blueprint $table) {
            $table->unsignedBigInteger('customer_key')->primary(); // Natural Key or Surrogate
            $table->string('email_domain', 128)->index();
            $table->string('country_code', 3)->default('USA')->index();
            $table->string('lifetime_tier', 32)->default('BRONZE');
            $table->dateTime('account_created_at');
            $table->dateTime('etl_updated_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('warehouse')->dropIfExists('fact_orders');
        Schema::connection('warehouse')->dropIfExists('dim_customers');
        Schema::dropIfExists('etl_checkpoints');
    }
};
