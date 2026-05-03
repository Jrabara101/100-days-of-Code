<?php

declare(strict_types=1);

namespace Phlex\Renamers;

use Phlex\Contracts\RenamerInterface;
use Phlex\Parser\PatternParser;
use SplFileInfo;

/**
 * EXIF-aware image renaming strategy.
 * Reads DateTimeOriginal and camera model from EXIF data.
 * Falls back to file mtime when EXIF is unavailable.
 */
final class ImageRenamer implements RenamerInterface
{
    private const SUPPORTED_MIME = [
        'image/jpeg',
        'image/jpg',
        'image/tiff',
    ];

    private const EXIF_EXTENSIONS = ['jpg', 'jpeg', 'tiff', 'tif'];

    public function __construct(
        private readonly PatternParser $parser,
        private readonly string        $pattern,
    ) {}

    public function supports(SplFileInfo $file): bool
    {
        $ext = strtolower($file->getExtension());
        if (in_array($ext, self::EXIF_EXTENSIONS, true)) {
            return true;
        }

        if (function_exists('mime_content_type')) {
            $mime = @mime_content_type($file->getPathname()) ?: '';
            return str_starts_with($mime, 'image/');
        }

        return false;
    }

    public function buildNewName(SplFileInfo $file, int $index): string
    {
        $context   = [];
        $timestamp = $file->getMTime();

        // Only attempt EXIF on JPEG/TIFF
        $ext = strtolower($file->getExtension());
        if (
            in_array($ext, self::EXIF_EXTENSIONS, true)
            && function_exists('exif_read_data')
        ) {
            $exif = @exif_read_data($file->getPathname(), 'EXIF,IFD0', false);

            if (is_array($exif)) {
                // Date token: prefer DateTimeOriginal, then DateTime
                $rawDate = $exif['DateTimeOriginal'] ?? $exif['DateTime'] ?? null;
                if (is_string($rawDate) && strlen($rawDate) >= 10) {
                    // EXIF date format: "YYYY:MM:DD HH:ii:ss"
                    $parsed = strtotime(str_replace(':', '-', substr($rawDate, 0, 10)) . substr($rawDate, 10));
                    if ($parsed !== false) {
                        $timestamp = $parsed;
                    }
                }

                // Camera model
                $camera = trim(($exif['Model'] ?? ''));
                if ($camera !== '') {
                    $context['camera'] = $camera;
                }

                // Resolution from EXIF
                $width  = $exif['COMPUTED']['Width']  ?? 0;
                $height = $exif['COMPUTED']['Height'] ?? 0;
                if ($width > 0 && $height > 0) {
                    $context['res'] = "{$width}x{$height}";
                }
            }
        }

        // For non-EXIF images, still get resolution via getimagesize()
        if (!isset($context['res']) && function_exists('getimagesize')) {
            $size = @getimagesize($file->getPathname());
            if (is_array($size) && $size[0] > 0) {
                $context['res'] = "{$size[0]}x{$size[1]}";
            }
        }

        return $this->parser->resolve(
            pattern:   $this->pattern,
            file:      $file,
            index:     $index,
            context:   $context,
            timestamp: $timestamp,
        );
    }
}
