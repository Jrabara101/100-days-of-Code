<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\AuditLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class AuditLedgerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_computes_deterministic_integrity_hash(): void
    {
        $payload1 = ['action' => 'LOGIN', 'user' => 'admin'];
        $payload2 = ['user' => 'admin', 'action' => 'LOGIN']; // Permuted order

        $meta1 = ['ip' => '10.0.0.1', 'req' => 'abc'];
        $meta2 = ['req' => 'abc', 'ip' => '10.0.0.1'];

        $timestamp = '2026-09-03 12:00:00.123456';
        $prevHash = 'parent_hash_123456';

        $hash1 = AuditLedger::computeIntegrityHash($prevHash, 'AUTH', $payload1, $meta1, $timestamp);
        $hash2 = AuditLedger::computeIntegrityHash($prevHash, 'AUTH', $payload2, $meta2, $timestamp);

        $this->assertSame($hash1, $hash2, 'Hashes must be identical regardless of key insertion order');
        $this->assertSame(64, strlen($hash1));
    }

    public function test_it_uses_genesis_block_constant_when_prev_hash_is_null(): void
    {
        $hash = AuditLedger::computeIntegrityHash(null, 'GENESIS_ACTION', [], [], '2026-01-01 00:00:00.000000');
        $this->assertNotEmpty($hash);
        $this->assertSame(64, strlen($hash));
    }

    public function test_it_prevents_model_updating_via_eloquent_event_guard(): void
    {
        $entry = AuditLedger::create([
            'entry_uuid' => '00000000-0000-0000-0000-000000000001',
            'prev_hash' => null,
            'current_hash' => 'dummy_hash_initial',
            'compliance_standard' => 'SOC2_CC6_1',
            'event_action' => 'CREATE',
            'payload_diff' => ['key' => 'val'],
            'metadata' => ['env' => 'test'],
            'recorded_at' => '2026-09-03 10:00:00.000000',
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Tamper Protection: AuditLedger entries are append-only and cannot be mutated.');

        $entry->update(['current_hash' => 'hacked_hash']);
    }

    public function test_it_prevents_model_deleting_via_eloquent_event_guard(): void
    {
        $entry = AuditLedger::create([
            'entry_uuid' => '00000000-0000-0000-0000-000000000002',
            'prev_hash' => null,
            'current_hash' => 'dummy_hash_initial_2',
            'compliance_standard' => 'HIPAA_164_312',
            'event_action' => 'ACCESS',
            'payload_diff' => ['resource' => 'patient'],
            'metadata' => ['env' => 'test'],
            'recorded_at' => '2026-09-03 10:00:00.000000',
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Tamper Protection: AuditLedger records cannot be deleted under compliance retention policy.');

        $entry->delete();
    }
}
