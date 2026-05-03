<?php

declare(strict_types=1);

namespace Phlex\Security;

use InvalidArgumentException;

/**
 * Prevents directory traversal attacks by ensuring all paths
 * remain within a declared root directory.
 */
final class PathSanitizer
{
    private readonly string $resolvedRoot;

    public function __construct(private readonly string $root)
    {
        $resolved = realpath($root);

        if ($resolved === false) {
            throw new InvalidArgumentException(
                "Target directory does not exist or is not accessible: {$root}"
            );
        }

        $this->resolvedRoot = $resolved;
    }

    /**
     * Validate that a given path is safely inside the root directory.
     *
     * @throws InvalidArgumentException on traversal attempt.
     */
    public function validate(string $path): string
    {
        $resolved = realpath($path);

        // For files that don't exist yet (rename targets), resolve the parent
        if ($resolved === false) {
            $resolved = realpath(dirname($path));
            if ($resolved !== false) {
                $resolved = $resolved . DIRECTORY_SEPARATOR . basename($path);
            }
        }

        if ($resolved === false) {
            throw new InvalidArgumentException(
                "Cannot resolve path: {$path}"
            );
        }

        // Ensure path starts with root + separator (or equals root)
        $rootWithSep = rtrim($this->resolvedRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

        if (
            $resolved !== $this->resolvedRoot
            && !str_starts_with($resolved, $rootWithSep)
        ) {
            throw new InvalidArgumentException(
                "Security violation — path escapes root directory: {$path}"
            );
        }

        return $resolved;
    }

    public function getRoot(): string
    {
        return $this->resolvedRoot;
    }
}
