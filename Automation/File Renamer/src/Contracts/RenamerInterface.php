<?php

declare(strict_types=1);

namespace Phlex\Contracts;

use SplFileInfo;

/**
 * Strategy contract for all file renaming strategies.
 * Every concrete renamer must implement this interface.
 */
interface RenamerInterface
{
    /**
     * Build the new filename (basename only, no directory) for the given file.
     *
     * @param SplFileInfo $file  The file to be renamed.
     * @param int         $index The 1-based position in the current scan queue.
     *
     * @return string New basename (e.g. "2024-05-01_IMG_001.jpg")
     */
    public function buildNewName(SplFileInfo $file, int $index): string;

    /**
     * Returns true if this strategy supports the given file.
     */
    public function supports(SplFileInfo $file): bool;
}
