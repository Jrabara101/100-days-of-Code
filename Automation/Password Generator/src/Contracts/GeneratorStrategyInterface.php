<?php

declare(strict_types=1);

namespace AegisGen\Contracts;

use AegisGen\ValueObjects\Password;

/**
 * GeneratorStrategyInterface — Strategy Pattern Contract
 *
 * Architectural Reasoning:
 * -----------------------
 * This interface is the backbone of AegisGen's extensibility. By enforcing
 * a single `generate(array $options): Password` contract, the system gains
 * the Open/Closed Principle: the core engine (CLI dispatcher, dashboard)
 * is forever closed to modification, while new generation strategies
 * (UUIDv7, TOTP secrets, SSH key fingerprints) are open for extension by
 * simply implementing this interface and registering in the strategy map.
 *
 * The `$options` array is intentionally untyped at the interface level to
 * give each strategy full freedom over its own parameter surface without
 * forcing a shared DTO. Each strategy validates its own options internally.
 */
interface GeneratorStrategyInterface
{
    /**
     * Generate a password/key/passphrase and return it as an immutable
     * Password Value Object containing the value, entropy, timing, and
     * generation mode metadata.
     *
     * @param  array<string, mixed> $options  Strategy-specific options
     * @return Password
     */
    public function generate(array $options): Password;

    /**
     * Return a human-readable label for this strategy, used in the
     * "Mode" field of the terminal dashboard.
     */
    public function modeLabel(): string;
}
