<?php

declare(strict_types=1);

namespace Phlex\Core;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Memory-efficient file scanner using PHP Generators.
 * Yields one SplFileInfo at a time — never loads all paths into RAM.
 */
final class FileScanner
{
    private readonly RecursiveDirectoryIterator $iterator;

    /** @var list<string> Lowercase extensions to skip */
    private array $skipExtensions = [];

    public function __construct(
        private readonly string $directory,
        private readonly bool   $recursive = false,
    ) {
        $this->iterator = new RecursiveDirectoryIterator(
            $directory,
            FilesystemIterator::SKIP_DOTS | FilesystemIterator::FOLLOW_SYMLINKS
        );
    }

    /**
     * Filter out specific file extensions (e.g. 'json', 'log').
     *
     * @param list<string> $extensions Lowercase, without leading dot.
     */
    public function skipExtensions(array $extensions): self
    {
        $this->skipExtensions = array_map('strtolower', $extensions);
        return $this;
    }

    /**
     * Lazily yield SplFileInfo objects, one at a time.
     * Recursive mode uses RecursiveIteratorIterator.
     *
     * @return \Generator<int, SplFileInfo>
     */
    public function scan(): \Generator
    {
        $iter = $this->recursive
            ? new RecursiveIteratorIterator(
                $this->iterator,
                RecursiveIteratorIterator::LEAVES_ONLY
            )
            : $this->iterator;

        foreach ($iter as $file) {
            /** @var SplFileInfo $file */
            if (!$file->isFile()) {
                continue;
            }

            $ext = strtolower($file->getExtension());

            if (in_array($ext, $this->skipExtensions, true)) {
                continue;
            }

            yield $file;
        }
    }

    /**
     * Count total files in the directory (for progress bar).
     * This does load all entries, but only once and only counts them.
     */
    public function count(): int
    {
        $count = 0;
        foreach ($this->scan() as $_) {
            $count++;
        }
        // Reset iterator for next scan()
        $this->iterator->rewind();
        return $count;
    }
}
