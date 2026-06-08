#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Automated Dynamic Image Watermarker
 * * Usage: php watermark.php <source_image> <watermark_png> <output_image> [position]
 * Positions: top-left, top-right, bottom-left, bottom-right (default)
 */

// ==========================================
// 1. Visual Styling Component
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";

    public static function header(string $title): void {
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function log(string $msg): void { 
        echo " \e[2m[" . date('H:i:s') . "]\e[0m " . $msg . "\n"; 
    }

    public static function success(string $msg): void { 
        echo "\n" . self::GREEN . self::BOLD . "✔ SUCCESS: " . self::RESET . self::GREEN . $msg . self::RESET . "\n\n"; 
    }

    public static function error(string $msg): void { 
        echo "\n" . self::RED . self::BOLD . "✖ ERROR: " . self::RESET . self::RED . $msg . self::RESET . "\n\n"; 
        exit(1); 
    }
}

// ==========================================
// 2. Automation Processing Engine
// ==========================================
class WatermarkProcessor {
    private array $supportedMimeTypes = [
        'image/jpeg' => ['create' => 'imagecreatefromjpeg', 'save' => 'imagejpeg'],
        'image/png'  => ['create' => 'imagecreatefrompng',  'save' => 'imagepng'],
        'image/webp' => ['create' => 'imagecreatefromwebp', 'save' => 'imagewebp']
    ];

    private const WATERMARK_SCALE_RATIO = 0.15; // Watermark should take up 15% of source width
    private const PADDING_RATIO = 0.02;          // 2% padding from the image boundaries

    public function process(string $sourcePath, string $watermarkPath, string $outputPath, string $position): void {
        $this->validateFiles($sourcePath, $watermarkPath);

        // Detect MIME types dynamically to call proper GD drivers
        $sourceMime = $this->getMimeType($sourcePath);
        $watermarkMime = $this->getMimeType($watermarkPath);

        if ($watermarkMime !== 'image/png') {
            CliUI::error("Watermark asset must be a transparent PNG file.");
        }

        CliUI::log("Loading image assets into volatile memory map...");
        $sourceImg = $this->supportedMimeTypes[$sourceMime]['create']($sourcePath);
        $watermarkRaw = imagecreatefrompng($watermarkPath);

        $srcW = imagesx($sourceImg);
        $srcH = imagesy($sourceImg);
        CliUI::log("Source Canvas Resolution: " . CliUI::YELLOW . "{$srcW}x{$srcH}px" . CliUI::RESET);

        // Calculate proportional watermark scaling bounds
        $targetWmkW = (int)($srcW * self::WATERMARK_SCALE_RATIO);
        $wmkRatio = $targetWmkW / imagesx($watermarkRaw);
        $targetWmkH = (int)(imagesy($watermarkRaw) * $wmkRatio);

        CliUI::log("Scaling watermark to balance canvas ratios: " . CliUI::YELLOW . "{$targetWmkW}x{$targetWmkH}px" . CliUI::RESET);

        // Create a truecolor transparent template canvas for the rescaled watermark
        $watermarkImg = imagecreatetruecolor($targetWmkW, $targetWmkH);
        imagealphablending($watermarkImg, false);
        imagesavealpha($watermarkImg, true);
        
        imagecopyresampled(
            $watermarkImg, $watermarkRaw,
            0, 0, 0, 0,
            $targetWmkW, $targetWmkH, imagesx($watermarkRaw), imagesy($watermarkRaw)
        );

        // Calculate layout coordinates based on positioning logic matrix
        $padding = (int)($srcW * self::PADDING_RATIO);
        list($destX, $destY) = $this->calculateCoordinates($position, $srcW, $srcH, $targetWmkW, $targetWmkH, $padding);

        CliUI::log("Applying composite blending matrix to target layer offsets...");
        // Handle transparency layers correctly before composition alpha merging
        imagealphablending($sourceImg, true);
        imagecopy(
            $sourceImg, $watermarkImg,
            $destX, $destY, 0, 0,
            $targetWmkW, $targetWmkH
        );

        // Save output file to file system
        CliUI::log("Writing flattened composite metadata to storage stream...");
        $saveFunc = $this->supportedMimeTypes[$sourceMime]['save'];
        
        // Handle specific quality parameters to keep artifacts minimal
        if ($sourceMime === 'image/jpeg') {
            $saveFunc($sourceImg, $outputPath, 90); // 90% High Quality JPG
        } else {
            $saveFunc($sourceImg, $outputPath);
        }

        // Memory lifecycle protection: destroy GD structures to free server RAM instantly
        imagedestroy($sourceImg);
        imagedestroy($watermarkRaw);
        imagedestroy($watermarkImg);
    }

    private function calculateCoordinates(string $position, int $srcW, int $srcH, int $wmkW, int $wmkH, int $padding): array {
        return match ($position) {
            'top-left'     => [$padding, $padding],
            'top-right'    => [$srcW - $wmkW - $padding, $padding],
            'bottom-left'  => [$padding, $srcH - $wmkH - $padding],
            'bottom-right' => [$srcW - $wmkW - $padding, $srcH - $wmkH - $padding],
            default        => [$srcW - $wmkW - $padding, $srcH - $wmkH - $padding] // Fallback
        };
    }

    private function validateFiles(string $source, string $watermark): void {
        if (!file_exists($source)) CliUI::error("Source image file target does not exist: {$source}");
        if (!file_exists($watermark)) CliUI::error("Watermark asset PNG target does not exist: {$watermark}");

        $sourceMime = $this->getMimeType($source);
        if (!array_key_exists($sourceMime, $this->supportedMimeTypes)) {
            CliUI::error("Unsupported source file encoding: {$sourceMime}. Use JPEG, PNG, or WebP.");
        }
    }

    private function getMimeType(string $path): string {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $path);
        finfo_close($finfo);
        return $mime;
    }
}

// ==========================================
// 3. Runtime Verification Router
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This utility must be run via the CLI environment.");
}

if ($argc < 4) {
    CliUI::header("Media Automation Pipeline");
    echo "Usage: php " . basename(__FILE__) . " <source_image> <watermark_png> <output_image> [position]\n";
    echo "Positions: " . CliUI::CYAN . "top-left, top-right, bottom-left, bottom-right" . CliUI::RESET . " (default)\n";
    echo "Example: php " . basename(__FILE__) . " photo.jpg logo.png ./output/watermarked.jpg bottom-right\n\n";
    exit(1);
}

$source    = $argv[1];
$watermark = $argv[2];
$output    = $argv[3];
$position  = $argv[4] ?? 'bottom-right';

CliUI::header("Asset Production Pipeline");

try {
    $processor = new WatermarkProcessor();
    $processor->process($source, $watermark, $output, $position);
    CliUI::success("Asset pipeline execution closed cleanly. Output file written to: {$output}");
} catch (Exception $e) {
    CliUI::error("Pipeline Crash: " . $e->getMessage());
}
