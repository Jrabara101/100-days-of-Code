<?php

declare(strict_types=1);

namespace Phlex\Parser;

use SplFileInfo;

/**
 * Resolves dynamic tokens in a pattern string into real values.
 *
 * Supported tokens:
 *   {YYYY}        4-digit year
 *   {YY}          2-digit year
 *   {MM}          Month (01-12)
 *   {DD}          Day (01-31)
 *   {HH}          Hour 24h (00-23)
 *   {ii}          Minutes (00-59)
 *   {ss}          Seconds (00-59)
 *   {OriginalName} Basename without extension
 *   {ext}          Lowercase extension
 *   {index}        Zero-padded counter (0001, 0002…)
 *   {artist}       ID3 artist (set via context)
 *   {album}        ID3 album
 *   {title}        ID3 title
 *   {res}          Image resolution e.g. 1920x1080
 *   {camera}       EXIF camera model
 */
final class PatternParser
{
    /**
     * @param string                $pattern  Pattern with {tokens}
     * @param SplFileInfo           $file     The source file
     * @param int                   $index    1-based counter
     * @param array<string, string> $context  Extra metadata (artist, album, res, camera…)
     * @param int|null              $timestamp Unix timestamp to use for date tokens; defaults to file mtime
     *
     * @return string Resolved filename (no directory component)
     */
    public function resolve(
        string      $pattern,
        SplFileInfo $file,
        int         $index,
        array       $context = [],
        ?int        $timestamp = null,
    ): string {
        $ts = $timestamp ?? $file->getMTime();

        // Build core token map using match() — PHP 8.x style
        $tokens = [
            '{YYYY}'        => date('Y', $ts),
            '{YY}'          => date('y', $ts),
            '{MM}'          => date('m', $ts),
            '{DD}'          => date('d', $ts),
            '{HH}'          => date('H', $ts),
            '{ii}'          => date('i', $ts),
            '{ss}'          => date('s', $ts),
            '{OriginalName}'=> $file->getBasename('.' . $file->getExtension()),
            '{ext}'         => strtolower($file->getExtension()),
            '{index}'       => str_pad((string) $index, 4, '0', STR_PAD_LEFT),
        ];

        // Merge context tokens (artist, album, title, res, camera, etc.)
        foreach ($context as $key => $value) {
            $tokens['{' . $key . '}'] = $this->sanitizeSegment($value);
        }

        // Replace tokens
        $result = str_replace(
            array_keys($tokens),
            array_values($tokens),
            $pattern
        );

        // Sanitize any remaining illegal filesystem characters
        return $this->sanitizeFilename($result);
    }

    /**
     * Remove characters illegal in filenames on Windows & Unix.
     */
    private function sanitizeFilename(string $name): string
    {
        // Strip null bytes and control chars
        $name = preg_replace('/[\x00-\x1F\x7F]/', '', $name) ?? $name;

        // Replace characters illegal on Windows: \ / : * ? " < > |
        $name = preg_replace('/[\/\\\\:*?"<>|]/', '_', $name) ?? $name;

        // Collapse multiple spaces/underscores
        $name = preg_replace('/_{2,}/', '_', $name)  ?? $name;
        $name = preg_replace('/ {2,}/', ' ', $name)  ?? $name;

        return trim($name, ". \t\n\r\0\x0B");
    }

    /**
     * Sanitize a single metadata segment (e.g. artist name).
     */
    private function sanitizeSegment(string $value): string
    {
        return $this->sanitizeFilename($value);
    }
}
