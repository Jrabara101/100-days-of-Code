<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AuditLedger;
use App\Models\User;
use App\Services\Compliance\AuditComplianceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditComplianceServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuditComplianceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AuditComplianceService();
    }

    public function test_it_records_genesis_entry_with_null_prev_hash(): void
    {
        $entry = $this->service->record(
            eventAction: 'AUTH_LOGIN',
            complianceStandard: 'SOC2_CC6_1',
            payload: ['status' => 'SUCCESS']
        );

        $this->assertNull($entry->prev_hash);
        $this->assertNotEmpty($entry->current_hash);
        $this->assertSame('AUTH_LOGIN', $entry->event_action);
        $this->assertSame('SOC2_CC6_1', $entry->compliance_standard);
    }

    public function test_it_chains_sequential_entries_cryptographically(): void
    {
        $user = User::factory()->create(['email' => 'auditor@enterprise.com']);

        $entry1 = $this->service->record(
            eventAction: 'CREATE',
            complianceStandard: 'SOC2_CC6_1',
            payload: ['item' => 'doc_1'],
            actor: $user
        );

        $entry2 = $this->service->record(
            eventAction: 'UPDATE',
            complianceStandard: 'SOC2_CC6_1',
            payload: ['item' => 'doc_1', 'status' => 'APPROVED'],
            actor: $user
        );

        $this->assertSame($entry1->current_hash, $entry2->prev_hash);

        $result = $this->service->verifyChainIntegrity();
        $this->assertTrue($result->chainIntact);
        $this->assertSame(2, $result->totalChecked);
        $this->assertSame(2, $result->validCount);
        $this->assertSame(0, $result->corruptedCount);
    }

    public function test_it_sanitizes_pii_during_record_ingestion(): void
    {
        $entry = $this->service->record(
            eventAction: 'CREATE',
            complianceStandard: 'PCI_DSS_REQ_10',
            payload: [
                'card_number' => '4111222233334444',
                'cvv' => '999',
                'description' => 'Payment for order #1001',
            ]
        );

        $this->assertSame('[REDACTED_CONFIDENTIAL]', $entry->payload_diff['card_number']);
        $this->assertSame('[REDACTED_CONFIDENTIAL]', $entry->payload_diff['cvv']);
        $this->assertSame('Payment for order #1001', $entry->payload_diff['description']);
    }

    public function test_it_detects_tampered_payload_in_database(): void
    {
        $this->service->record('CREATE', 'SOC2_CC6_1', ['order' => '101']);
        $this->service->record('UPDATE', 'SOC2_CC6_1', ['order' => '101', 'status' => 'PAID']);
        $entry3 = $this->service->record('EXPORT', 'SOC2_CC6_8', ['order' => '101']);

        // Directly manipulate database bypassing Eloquent
        DB::table('audit_ledgers')->where('id', $entry3->id)->update([
            'payload_diff' => json_encode(['order' => '101', 'malicious' => 'injected_data']),
        ]);

        $result = $this->service->verifyChainIntegrity();
        $this->assertFalse($result->chainIntact);
        $this->assertSame(1, $result->corruptedCount);
        $this->assertContains($entry3->id, $result->corruptedEntryIds);
    }

    public function test_it_detects_broken_parent_chain_link(): void
    {
        $this->service->record('CREATE', 'SOC2_CC6_1', ['key' => 'v1']);
        $entry2 = $this->service->record('UPDATE', 'SOC2_CC6_1', ['key' => 'v2']);

        // Tamper with previous hash link
        DB::table('audit_ledgers')->where('id', $entry2->id)->update([
            'prev_hash' => 'invalid_forged_parent_hash_000000000000000000000000000000000000',
        ]);

        $result = $this->service->verifyChainIntegrity();
        $this->assertFalse($result->chainIntact);
        $this->assertContains($entry2->id, $result->corruptedEntryIds);
    }
}
