<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('crawl_targets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('target_url');
            $table->string('parser_strategy')->default('DEFAULT_ARTICLE'); // Strategy identifier
            $table->unsignedInteger('rate_limit_delay_ms')->default(300);
            $table->dateTime('last_crawled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('scraped_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crawl_target_id')->constrained()->cascadeOnDelete();
            $table->string('fingerprint_hash')->unique(); // SHA-256 dedupe key
            $table->string('title');
            $table->string('canonical_url');
            $table->unsignedInteger('numeric_value_cents')->default(0); // Prices, metrics (in cents/minor units)
            $table->json('metadata'); // Extracted custom tags, authors, specs
            $table->string('status')->default('NEW'); // NEW, UNCHANGED, UPDATED
            $table->timestamps();

            $table->index(['crawl_target_id', 'created_at']);
        });

        Schema::create('crawl_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crawl_target_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('items_found')->default(0);
            $table->unsignedInteger('items_saved')->default(0);
            $table->unsignedInteger('duplicates_skipped')->default(0);
            $table->unsignedInteger('http_status')->default(200);
            $table->float('duration_seconds')->default(0.0);
            $table->string('status')->default('COMPLETED'); // COMPLETED, FAILED
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crawl_runs');
        Schema::dropIfExists('scraped_records');
        Schema::dropIfExists('crawl_targets');
    }
};
