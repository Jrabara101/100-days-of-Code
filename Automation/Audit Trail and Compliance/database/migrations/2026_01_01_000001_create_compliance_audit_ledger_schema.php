<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_ledgers', function (Blueprint $table) {
            $table->id();
            $table->uuid('entry_uuid')->unique();
            $table->string('prev_hash', 64)->nullable()->index();
            $table->string('current_hash', 64)->unique();
            $table->string('compliance_standard', 32)->default('SOC2_CC6_1'); // SOC2, HIPAA, GDPR, PCI_DSS
            $table->string('event_action', 64); // CREATE, UPDATE, DELETE, ACCESS, AUTH, EXPORT
            
            // Actor Context
            $table->nullableMorphs('actor');
            $table->string('actor_email')->nullable();
            
            // Target Entity Context
            $table->nullableMorphs('auditable');
            
            // Structured Payloads
            $table->json('payload_diff'); // Sanitized before & after state
            $table->json('metadata');     // IP, User-Agent, Request ID, Trace Parent
            
            $table->timestamp('recorded_at', 6);
            $table->timestamps();

            $table->index(['compliance_standard', 'recorded_at']);
            $table->index(['event_action', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_ledgers');
    }
};
