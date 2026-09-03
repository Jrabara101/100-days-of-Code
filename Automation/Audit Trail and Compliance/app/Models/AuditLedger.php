<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use RuntimeException;

class AuditLedger extends Model
{
    protected $guarded = [];

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $casts = [
        'payload_diff' => 'array',
        'metadata' => 'array',
        'recorded_at' => 'datetime:Y-m-d H:i:s.u',
    ];

    protected static function booted(): void
    {
        // Enforce strict immutability at the Eloquent ORM level
        static::updating(function () {
            throw new RuntimeException("Tamper Protection: AuditLedger entries are append-only and cannot be mutated.");
        });

        static::deleting(function () {
            throw new RuntimeException("Tamper Protection: AuditLedger records cannot be deleted under compliance retention policy.");
        });
    }

    public function actor(): MorphTo
    {
        return $this->morphTo();
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Compute the deterministic SHA-256 integrity hash for an entry.
     */
    public static function computeIntegrityHash(?string $prevHash, string $action, array $payload, array $metadata, string $timestamp): string
    {
        ksort($payload);
        ksort($metadata);

        $material = sprintf(
            '%s|%s|%s|%s|%s',
            $prevHash ?? 'GENESIS_BLOCK_00000000000000000000000000000000000000000000000000000000',
            $action,
            json_encode($payload, JSON_UNESCAPED_SLASHES),
            json_encode($metadata, JSON_UNESCAPED_SLASHES),
            $timestamp
        );

        return hash('sha256', $material);
    }
}
