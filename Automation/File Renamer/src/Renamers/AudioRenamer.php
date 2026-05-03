<?php

declare(strict_types=1);

namespace Phlex\Renamers;

use Phlex\Contracts\RenamerInterface;
use Phlex\Parser\PatternParser;
use SplFileInfo;

/**
 * ID3-aware audio renaming strategy.
 *
 * Reads tags using the getID3 library when available.
 * Falls back to filename-based context only if getID3 is not installed.
 *
 * Supports: mp3, flac, ogg, m4a, wav, aac, wma
 */
final class AudioRenamer implements RenamerInterface
{
    private const SUPPORTED_EXTENSIONS = [
        'mp3', 'flac', 'ogg', 'm4a', 'wav', 'aac', 'wma', 'opus', 'aiff', 'aif',
    ];

    public function __construct(
        private readonly PatternParser $parser,
        private readonly string        $pattern,
    ) {}

    public function supports(SplFileInfo $file): bool
    {
        $ext = strtolower($file->getExtension());
        return in_array($ext, self::SUPPORTED_EXTENSIONS, true);
    }

    public function buildNewName(SplFileInfo $file, int $index): string
    {
        $context = $this->extractId3Tags($file);

        return $this->parser->resolve(
            pattern:   $this->pattern,
            file:      $file,
            index:     $index,
            context:   $context,
            timestamp: $file->getMTime(),
        );
    }

    /**
     * Extract ID3 tags using getID3 library (or graceful fallback).
     *
     * @return array<string, string>
     */
    private function extractId3Tags(SplFileInfo $file): array
    {
        // Attempt to use getID3 (installed via Composer)
        if (class_exists(\getID3::class)) {
            return $this->readWithGetId3($file);
        }

        // No library available — return empty context (pattern uses fallback tokens)
        return [];
    }

    /**
     * @return array<string, string>
     */
    private function readWithGetId3(SplFileInfo $file): array
    {
        try {
            $getid3 = new \getID3();
            $info   = $getid3->analyze($file->getPathname());

            // Normalize tags from ID3v2 → ID3v1 → vorbiscomment
            \getid3_lib::CopyTagsToComments($info);

            $comments = $info['comments'] ?? [];
            $context  = [];

            $map = [
                'artist' => ['artist'],
                'album'  => ['album'],
                'title'  => ['title'],
                'year'   => ['year', 'date'],
                'track'  => ['track_number', 'track'],
                'genre'  => ['genre'],
            ];

            foreach ($map as $token => $keys) {
                foreach ($keys as $key) {
                    $value = $comments[$key][0] ?? null;
                    if (is_string($value) && $value !== '') {
                        $context[$token] = $value;
                        break;
                    }
                }
            }

            // Duration as "mm:ss"
            $duration = $info['playtime_seconds'] ?? 0;
            if ($duration > 0) {
                $mins = (int) floor($duration / 60);
                $secs = (int) ($duration % 60);
                $context['duration'] = sprintf('%d:%02d', $mins, $secs);
            }

            return $context;
        } catch (\Throwable) {
            return [];
        }
    }
}
