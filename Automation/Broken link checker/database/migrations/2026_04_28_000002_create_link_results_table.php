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
        Schema::create('link_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_session_id')->constrained()->cascadeOnDelete();
            $table->string('url', 2048);
            $table->string('source_page', 2048)->nullable();
            $table->integer('status_code')->nullable()->comment('null = timeout or connection error');
            $table->string('final_url', 2048)->nullable()->comment('Resolved URL after redirects');
            $table->text('error_message')->nullable()->comment('Error description for non-HTTP failures');
            $table->boolean('is_broken')->default(false)->comment('true for 4xx, 5xx, timeout, SSL error');
            $table->boolean('is_external')->default(false)->comment('true if the link is off-domain');
            $table->timestamp('checked_at')->nullable();
            $table->timestamps();

            $table->index('scan_session_id');
            $table->index('is_broken');
            $table->index('status_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('link_results');
    }
};
