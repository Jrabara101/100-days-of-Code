<?php

declare(strict_types=1);

namespace App\Services\Compliance;

use App\Models\AuditLedger;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

readonly class VerificationResult
{
    public function __construct(
        public int $totalChecked,
        public int $validCount,
        public int $corruptedCount,
        public array $corruptedEntryIds,
        public bool $chainIntact
    ) {}
}

class AuditComplianceService
{
    /**
     * Records an immutable, cryptographically chained audit log entry.
     */
    public function record(
        string $eventAction,
        string $complianceStandard,
        array $payload,
        ?Model $actor = null,
        ?Model $auditable = null,
        array $extraMetadata = []
    ): AuditLedger {
        return DB::transaction(function () use ($eventAction, $complianceStandard, $payload, $actor, $auditable, $extraMetadata) {
            // Lock latest entry to resolve upstream parent hash
            /** @var AuditLedger|null $latest */
            $latest = AuditLedger::query()->latest('id')->lockForUpdate()->first();

            $prevHash = $latest?->current_hash;
            $timestamp = CarbonImmutable::now()->format('Y-m-d H:i:s.u');

            $sanitizedPayload = PiiSanitizer::sanitize($payload);
            $metadata = array_merge([
                'request_id' => Str::uuid()->toString(),
                'ip_address' => request()?->ip() ?? '127.0.0.1',
                'user_agent' => request()?->userAgent() ?? 'CLI_ARTISAN',
            ], $extraMetadata);

            $currentHash = AuditLedger::computeIntegrityHash(
                $prevHash,
                $eventAction,
                $sanitizedPayload,
                $metadata,
                $timestamp
            );

            return AuditLedger::create([
                'entry_uuid' => Str::uuid()->toString(),
                'prev_hash' => $prevHash,
                'current_hash' => $currentHash,
                'compliance_standard' => $complianceStandard,
                'event_action' => $eventAction,
                'actor_type' => $actor ? get_class($actor) : null,
                'actor_id' => $actor?->getKey(),
                'actor_email' => $actor?->email ?? ($extraMetadata['email'] ?? null),
                'auditable_type' => $auditable ? get_class($auditable) : null,
                'auditable_id' => $auditable?->getKey(),
                'payload_diff' => $sanitizedPayload,
                'metadata' => $metadata,
                'recorded_at' => $timestamp,
            ]);
        });
    }

    /**
     * Performs an $O(N)$ linear verification sweep verifying hash integrity across the ledger.
     */
    public function verifyChainIntegrity(): VerificationResult
    {
        $entries = AuditLedger::query()->orderBy('id', 'asc')->get();
        
        $total = $entries->count();
        $valid = 0;
        $corrupted = 0;
        $corruptedIds = [];
        $expectedPrevHash = null;

        foreach ($entries as $index => $entry) {
            $isCorrupted = false;

            // 1. Check parent link continuity
            if ($entry->prev_hash !== $expectedPrevHash) {
                $isCorrupted = true;
            }

            // 2. Re-compute deterministic current hash
            $computedHash = AuditLedger::computeIntegrityHash(
                $entry->prev_hash,
                $entry->event_action,
                $entry->payload_diff,
                $entry->metadata,
                $entry->recorded_at->format('Y-m-d H:i:s.u')
            );

            if ($computedHash !== $entry->current_hash) {
                $isCorrupted = true;
            }

            if ($isCorrupted) {
                $corrupted++;
                $corruptedIds[] = $entry->id;
            } else {
                $valid++;
            }

            $expectedPrevHash = $entry->current_hash;
        }

        return new VerificationResult(
            totalChecked: $total,
            validCount: $valid,
            corruptedCount: $corrupted,
            corruptedEntryIds: $corruptedIds,
            chainIntact: $corrupted === 0
        );
    }
}
