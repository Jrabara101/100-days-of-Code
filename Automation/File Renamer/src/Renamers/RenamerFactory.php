<?php

declare(strict_types=1);

namespace Phlex\Renamers;

use Phlex\Contracts\RenamerInterface;
use Phlex\Parser\PatternParser;
use SplFileInfo;

/**
 * Detects the appropriate RenamerInterface strategy for a given file
 * based on its MIME type or file extension.
 *
 * Priority: AudioRenamer → ImageRenamer → RegExRenamer (fallback)
 */
final class RenamerFactory
{
    /** @var list<RenamerInterface> */
    private readonly array $strategies;

    public function __construct(PatternParser $parser, string $pattern)
    {
        // Order matters — more specific strategies first
        $this->strategies = [
            new AudioRenamer($parser, $pattern),
            new ImageRenamer($parser, $pattern),
            new RegExRenamer($parser, $pattern),  // always matches
        ];
    }

    /**
     * Return the first strategy that supports the given file.
     * RegExRenamer is always the guaranteed fallback.
     */
    public function make(SplFileInfo $file): RenamerInterface
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($file)) {
                return $strategy;
            }
        }

        // Unreachable — RegExRenamer::supports() always returns true
        throw new \LogicException('No renaming strategy found. This should never happen.');
    }
}
