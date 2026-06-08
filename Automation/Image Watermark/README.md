# Advanced PHP CLI - Automated Dynamic Image Watermarker

A production-ready PHP CLI utility for automated image watermarking, featuring canvas bounding constraints, dynamic scale ratios, alpha transparency preservation, and proper memory cleanup.

## Features

- **Dynamic Proportion Scaling (Asset Elasticity)**: Automatically scales the watermark to maintain exactly 15% of the source image's width, preventing composition discrepancies between low-res screenshots and 4K camera images.
- **Relative Edge Padding Matrix**: Bounding box padding is calculated dynamically (default 2% of canvas width) instead of using hardcoded pixel offsets.
- **Alpha Blending Override**: Utilizes explicit PHP GD alpha handling (`imagealphablending()` and `imagesavealpha()`) to prevent black borders or artifacts around transparent PNG logo layers.
- **Resource Lifecycle Control**: Prevents memory exhaustion during bulk operations by explicitly calling `imagedestroy()` to free raw uncompressed pixels from RAM immediately after writing to disk.

## Requirements

Ensure the following extensions are enabled in your `php.ini`:
- `ext-gd`
- `ext-fileinfo`

## Usage

```bash
php watermark.php <source_image> <watermark_png> <output_image> [position]
```

### Positional Modifiers
Available overlay positions:
- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right` *(default)*

### Examples

**Standard Execution:**
```bash
php watermark.php landscape.jpg company_logo.png branded_landscape.jpg bottom-right
```

**Alternative Positioning:**
```bash
php watermark.php avatar.png beta_badge.png updated_avatar.png top-left
```
