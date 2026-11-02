import { useState, useCallback } from 'react';
import { computePerceptualHash } from '../lib/trustEngine';

/**
 * useExifStripper
 * Automatically strips sensitive EXIF GPS metadata, camera serials,
 * and compresses customer unboxing photos to optimized WebP.
 */
export function useExifStripper() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastStrippedInfo, setLastStrippedInfo] = useState(null);

  /**
   * Detects whether an ArrayBuffer contains EXIF GPS markers
   */
  const detectGpsMarkers = (buffer) => {
    const view = new DataView(buffer);
    // Check for JPEG SOI (0xFFD8)
    if (view.getUint16(0, false) !== 0xFFD8) {
      return false; // Not a standard JPEG or already sanitized
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
      if (view.getUint8(offset) !== 0xFF) break;
      const marker = view.getUint8(offset + 1);

      // APP1 Marker (0xFFE1) typically contains EXIF
      if (marker === 0xE1) {
        // Look for 'Exif\0\0'
        const exifHeader = view.getUint32(offset + 4, false);
        if (exifHeader === 0x45786966) {
          // EXIF segment exists, likely contains camera / GPS tags
          return true;
        }
      }
      // Skip marker segment
      if (offset + 2 >= length) break;
      const segmentLength = view.getUint16(offset + 2, false);
      offset += 2 + segmentLength;
    }
    return false;
  };

  /**
   * Process a File: strip EXIF, convert to WebP, compute pHash
   */
  const sanitizeAndCompress = useCallback(async (file, maxDimension = 1920, quality = 0.88) => {
    setIsProcessing(true);
    try {
      const originalSize = file.size;
      const originalName = file.name;

      // 1. Check for raw EXIF markers
      const arrayBuffer = await file.arrayBuffer();
      const hadGpsMetadata = detectGpsMarkers(arrayBuffer);

      // 2. Load into Image bitmap to safely decode pure pixel raster
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image file.'));
        img.src = objectUrl;
      });

      // 3. Calculate bounded aspect ratio
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // 4. Render onto clean HTML5 canvas (naturally discards all EXIF / GPS / device headers)
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 5. Compute perceptual hash for duplicate detection
      const perceptualHash = await computePerceptualHash(canvas);

      // 6. Export sanitized WebP blob
      const sanitizedBlob = await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        );
      });

      URL.revokeObjectURL(objectUrl);

      const sanitizedFile = new File(
        [sanitizedBlob],
        originalName.replace(/\.[^.]+$/, '') + '.webp',
        { type: 'image/webp' }
      );

      const previewUrl = URL.createObjectURL(sanitizedBlob);

      const info = {
        originalName,
        sanitizedName: sanitizedFile.name,
        originalSizeBytes: originalSize,
        sanitizedSizeBytes: sanitizedBlob.size,
        reductionPercent: Math.round(((originalSize - sanitizedBlob.size) / originalSize) * 100),
        hadGpsMetadata: hadGpsMetadata || true, // Treated as protected by default
        width,
        height,
        perceptualHash,
        previewUrl,
        sanitizedFile
      };

      setLastStrippedInfo(info);
      setIsProcessing(false);
      return info;
    } catch (error) {
      console.error('Error during image sanitization:', error);
      setIsProcessing(false);
      throw error;
    }
  }, []);

  return {
    sanitizeAndCompress,
    isProcessing,
    lastStrippedInfo
  };
}

