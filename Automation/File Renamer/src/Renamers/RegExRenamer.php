<?php

declare(strict_types=1);

namespace Phlex\Renamers;

use Phlex\Contracts\RenamerInterface;
use Phlex\Parser\PatternParser;
use SplFileInfo;

/**
 * General-purpose pattern-based renamer.
 * Used as the fallback strategy when a file is neither an image nor audio.
 * Also used when the pattern doesn't need EXIF/ID3 metadata.
 */
final class RegExRenamer implements RenamerInterface
{
    public function __construct(
        private readonly PatternParser $parser,
        private readonly string        $pattern,
    ) {}

    public function supports(SplFileInfo $file): bool
    {
        // Fallback — supports everything
        return true;
    }

    public function buildNewName(SplFileInfo $file, int $index): string
    {
        return $this->parser->resolve(
            pattern:   $this->pattern,
            file:      $file,
            index:     $index,
            context:   [],
            timestamp: $file->getMTime(),
        );
    }
}
