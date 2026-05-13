<?php

declare(strict_types=1);

namespace SearchLens;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use FilesystemIterator;
use SplFileInfo;
use Generator;

readonly class DirectoryScanner
{
    public function __construct(private Config $config) {}

    /**
     * @return Generator<SplFileInfo>
     */
    public function scan(): Generator
    {
        $dir = new RecursiveDirectoryIterator(
            $this->config->targetDirectory,
            FilesystemIterator::SKIP_DOTS | FilesystemIterator::FOLLOW_SYMLINKS
        );

        $iterator = new RecursiveIteratorIterator(
            $dir,
            RecursiveIteratorIterator::SELF_FIRST
        );

        $ignoredPaths = $this->config->ignoredPaths;

        foreach ($iterator as $file) {
            /** @var SplFileInfo $file */
            
            // Check for ignored paths
            $path = $file->getPathname();
            
            // Early exit for excluded directories
            if ($file->isDir()) {
                foreach ($ignoredPaths as $ignored) {
                    if (str_contains($path, DIRECTORY_SEPARATOR . $ignored) || $file->getFilename() === $ignored) {
                        // Skip children of this directory to save memory and time
                        // In a true filter iterator, we'd return false in accept().
                        // Using RecursiveDirectoryIterator directly, we can't easily skip children dynamically
                        // from the outside loop without extending RecursiveFilterIterator.
                        // Let's implement a quick inline skip or just continue. 
                        // Actually, for true deep optimization, extending RecursiveFilterIterator is better,
                        // but skipping via path matching works for now. 
                        continue 2;
                    }
                }
            }
            
            // We still need to exclude files that are inside ignored directories
            $isIgnored = false;
            foreach ($ignoredPaths as $ignored) {
                if (str_contains($path, DIRECTORY_SEPARATOR . $ignored . DIRECTORY_SEPARATOR) || 
                    str_ends_with($path, DIRECTORY_SEPARATOR . $ignored)) {
                    $isIgnored = true;
                    break;
                }
            }

            if ($isIgnored) {
                continue;
            }

            if ($file->isFile() && $file->isReadable()) {
                yield $file;
            }
        }
    }
}
