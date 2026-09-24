export interface EXIFData {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutter?: string;
  focalLength?: string;
  date?: string;
  resolution?: string;
  megapixels?: string;
  colorSpace?: string;
  bitDepth?: string;
  fileSize?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface DominantColor {
  hex: string;
  percentage: number;
}

export interface MediaItem {
  id: string;
  title: string;
  srcThumbnail: string; // Stage 1 WebP
  srcFull: string;      // Stage 2 RAW / Ultra high-res
  blurHash: string;     // Stage 0 Micro proxy / blur representation
  width: number;
  height: number;
  albumId: string | null;
  tags: string[];
  rating: number; // 1-5 stars
  isHDR?: boolean;
  format: 'ARW' | 'DNG' | 'RAW' | 'TIFF' | 'JPEG';
  exif: EXIFData;
  dominantColors: DominantColor[];
  spectralRGB?: { r: number; g: number; b: number };
}

export interface Album {
  id: string;
  name: string;
  icon?: string;
  itemCount: number;
  coverSrc?: string;
  description?: string;
  isSmart?: boolean;
}

export interface SpatialBounds {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  column: number;
}

export interface WorkerLayoutPayload {
  items: Array<{ id: string; width: number; height: number }>;
  containerWidth: number;
  columnCount: number;
  gutter: number;
}

export interface WorkerLayoutResponse {
  bounds: Record<string, SpatialBounds>;
  totalHeight: number;
  columnHeights: number[];
}

export type BackgroundVariation = 'void' | 'canvas' | 'volumetric' | 'studio';

export type LayoutMode = 'masonry' | 'scatter' | 'timeline' | 'lens';
