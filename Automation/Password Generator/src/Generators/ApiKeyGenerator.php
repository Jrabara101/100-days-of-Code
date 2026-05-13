<?php

declare(strict_types=1);

namespace AegisGen\Generators;

use AegisGen\Contracts\GeneratorStrategyInterface;
use AegisGen\Security\EntropyCalculator;
use AegisGen\ValueObjects\Password;

/**
 * ApiKeyGenerator — Strategy: Developer-Ready API Keys
 *
 * Architectural Reasoning:
 * -----------------------
 * API keys must be generated from raw entropy — `random_bytes(N)` requests
 * N cryptographically random bytes directly from the OS CSPRNG with no
 * character-set filtering. Encoding (base64 or hex) is a lossless bijection;
 * it does not reduce entropy, it merely makes the byte sequence printable.
 *
 * Entropy:
 *   - 32 raw bytes = 256 bits of entropy (absolute maximum for this length)
 *   - base64(32 bytes) = 44 chars, but entropy remains 256 bits (not 44×log₂(64))
 *     because the encoded characters are NOT independently random — they are
 *     determined by the underlying byte sequence. We report the TRUE entropy
 *     (256 bits from the raw bytes) rather than the inflated pool estimate.
 *
 * Output Format:
 *   base64 → sk_live_<44 chars>   (suitable for Authorization: Bearer headers)
 *   hex    → 0x<64 hex chars>     (suitable for HMAC secrets, .env HEX_KEY=)
 */
class ApiKeyGenerator implements GeneratorStrategyInterface
{
    // Raw byte lengths → entropy bits
    private const BYTE_LENGTH   = 32;   // 256-bit entropy
    private const ENTROPY_BITS  = self::BYTE_LENGTH * 8; // 256

    public function __construct(private readonly EntropyCalculator $entropy) {}

    /**
     * @param array{
     *   format: 'base64'|'hex',
     *   prefix: string,
     * } $options
     */
    public function generate(array $options): Password
    {
        $start  = hrtime(true);
        $format = $options['format'] ?? 'base64';

        // Pull 32 bytes (256 bits) from OS CSPRNG — no user-space intermediary
        $rawBytes = random_bytes(self::BYTE_LENGTH);

        if ($format === 'hex') {
            $encoded       = bin2hex($rawBytes);
            $displayValue  = '0x' . $encoded;
            $poolSize      = 16;   // hex alphabet size (0-9, a-f)
            $displayLength = self::BYTE_LENGTH * 2;
            $prefix        = '';
        } else {
            // default: base64
            $encoded       = rtrim(base64_encode($rawBytes), '=');
            $displayValue  = $encoded;
            $poolSize      = 64;   // base64 alphabet size
            $displayLength = (int) ceil(self::BYTE_LENGTH * 4 / 3);
            $prefix        = 'sk_live_';
        }

        $value     = $prefix . $displayValue;
        $elapsedMs = (hrtime(true) - $start) / 1_000_000;

        // TRUE entropy = raw byte entropy (256 bits), not character-pool estimate
        return new Password(
            value:             $value,
            entropyBits:       self::ENTROPY_BITS,
            generationTimeMs:  $elapsedMs,
            mode:              $this->modeLabel() . ' [' . strtoupper($format) . ']',
            poolSize:          $poolSize,
            length:            $displayLength,
        );
    }

    public function modeLabel(): string
    {
        return 'API Key / Secret';
    }
}
