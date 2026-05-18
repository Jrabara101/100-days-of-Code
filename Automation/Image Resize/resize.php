#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Image Resizer
 * 
 * Usage: php resize.php <source_file> <dest_file> <max_width> <max_height>
 */

class CliFormatter {
    // ANSI Color Codes
    const RESET = "\e[0m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const BOLD = "\e[1m";

    public static function info($msg) { echo self::CYAN . "ℹ INFO: " . self::RESET . $msg . PHP_EOL; }
    public static function success($msg) { echo self::GREEN . self::BOLD . "✔ SUCCESS: " . self::RESET . self::GREEN . $msg . self::RESET . PHP_EOL; }
    public static function error($msg) { echo self::RED . self::BOLD . "✖ ERROR: " . self::RESET . self::RED . $msg . self::RESET . PHP_EOL; exit(1); }
    public static function warning($msg) { echo self::YELLOW . "⚠ WARNING: " . self::RESET . $msg . PHP_EOL; }
    public static function title($msg) { echo PHP_EOL . self::BOLD . self::CYAN . "=== " . $msg . " ===" . self::RESET . PHP_EOL . PHP_EOL; }
}

class ImageResizer {
    private string $sourcePath;
    private string $destPath;
    private int $maxWidth;
    private int $maxHeight;

    private array $supportedTypes = [
        'image/jpeg' => 'imagecreatefromjpeg',
        'image/png'  => 'imagecreatefrompng',
        'image/gif'  => 'imagecreatefromgif',
        'image/webp' => 'imagecreatefromwebp'
    ];

    public function __construct(string $sourcePath, string $destPath, int $maxWidth, int $maxHeight) {
        $this->sourcePath = $sourcePath;
        $this->destPath = $destPath;
        $this->maxWidth = $maxWidth;
        $this->maxHeight = $maxHeight;
    }

    public function process(): void {
        $this->validate();
        $this->ensureMemoryLimit();

        CliFormatter::info("Analyzing source image...");
        $imageInfo = getimagesize($this->sourcePath);
        $mimeType = $imageInfo['mime'];
        $origWidth = $imageInfo[0];
        $origHeight = $imageInfo[1];

        CliFormatter::info("Original dimensions: {$origWidth}x{$origHeight}px ({$mimeType})");

        // Calculate proportional dimensions
        $ratio = min($this->maxWidth / $origWidth, $this->maxHeight / $origHeight);
        
        // Don't upscale if the image is already smaller than target
        if ($ratio >= 1) {
            $ratio = 1;
            CliFormatter::warning("Image is smaller than target dimensions. Skipping upscale to maintain quality.");
        }

        $newWidth = (int)round($origWidth * $ratio);
        $newHeight = (int)round($origHeight * $ratio);

        CliFormatter::info("Target dimensions: {$newWidth}x{$newHeight}px");

        // Create image resources
        $createFunction = $this->supportedTypes[$mimeType];
        $sourceImage = $createFunction($this->sourcePath);
        
        if (!$sourceImage) {
            CliFormatter::error("Failed to load source image into memory.");
        }

        $destImage = imagecreatetruecolor($newWidth, $newHeight);

        // Handle transparency for PNG and WebP
        if ($mimeType === 'image/png' || $mimeType === 'image/webp') {
            imagealphablending($destImage, false);
            imagesavealpha($destImage, true);
            $transparent = imagecolorallocatealpha($destImage, 255, 255, 255, 127);
            imagefilledrectangle($destImage, 0, 0, $newWidth, $newHeight, $transparent);
        }

        CliFormatter::info("Resampling image...");
        
        // Use resampled for better quality (bicubic interpolation) rather than resized
        imagecopyresampled(
            $destImage, $sourceImage, 
            0, 0, 0, 0, 
            $newWidth, $newHeight, 
            $origWidth, $origHeight
        );

        $this->saveImage($destImage, $mimeType);

        // Free up RAM
        imagedestroy($sourceImage);
        imagedestroy($destImage);

        $filesize = round(filesize($this->destPath) / 1024, 2);
        CliFormatter::success("Image successfully resized and saved to {$this->destPath} ({$filesize} KB)");
    }

    private function saveImage($destImage, string $mimeType): void {
        CliFormatter::info("Writing file to disk...");
        $success = match($mimeType) {
            'image/jpeg' => imagejpeg($destImage, $this->destPath, 85), // 85% quality is the sweet spot
            'image/png'  => imagepng($destImage, $this->destPath, 8),   // Compression 0-9
            'image/gif'  => imagegif($destImage, $this->destPath),
            'image/webp' => imagewebp($destImage, $this->destPath, 85),
            default      => false
        };

        if (!$success) {
            CliFormatter::error("Failed to write image to destination path.");
        }
    }

    private function validate(): void {
        if (!file_exists($this->sourcePath)) {
            CliFormatter::error("Source file does not exist: {$this->sourcePath}");
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $this->sourcePath);
        finfo_close($finfo);

        if (!array_key_exists($mime, $this->supportedTypes)) {
            CliFormatter::error("Unsupported file type: {$mime}. Supported types: JPEG, PNG, GIF, WebP.");
        }

        $destDir = dirname($this->destPath);
        if (!is_dir($destDir) && !mkdir($destDir, 0755, true)) {
            CliFormatter::error("Cannot create destination directory: {$destDir}");
        }
        if (!is_writable($destDir)) {
            CliFormatter::error("Destination directory is not writable: {$destDir}");
        }
    }

    private function ensureMemoryLimit(): void {
        $currentLimit = ini_get('memory_limit');
        // If memory limit is not unlimited (-1) and is less than 256M, bump it.
        // Image processing uncompresses files, requiring massive RAM arrays per pixel.
        if ($currentLimit != '-1' && (int)$currentLimit < 256) {
            ini_set('memory_limit', '256M');
            CliFormatter::info("Memory limit temporarily increased to 256M for processing.");
        }
    }
}

// ==========================================
// CLI Bootstrap
// ==========================================

if (php_sapi_name() !== 'cli') {
    die("This script can only be run from the command line.");
}

if ($argc < 5) {
    CliFormatter::title("Image Resizer CLI");
    echo "Usage: php " . basename(__FILE__) . " <source> <destination> <max_width> <max_height>\n";
    echo "Example: php " . basename(__FILE__) . " input.jpg ./output/thumb.jpg 800 600\n\n";
    exit(1);
}

$source = $argv[1];
$dest = $argv[2];
$maxWidth = (int)$argv[3];
$maxHeight = (int)$argv[4];

CliFormatter::title("Image Resizer CLI");

try {
    $resizer = new ImageResizer($source, $dest, $maxWidth, $maxHeight);
    $resizer->process();
} catch (Exception $e) {
    CliFormatter::error("An unexpected error occurred: " . $e->getMessage());
}
