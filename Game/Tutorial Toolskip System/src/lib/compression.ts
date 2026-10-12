import LZString from 'lz-string';
import { ReplayPayload } from '../types/replay';

export function compressReplayPayload(payload: ReplayPayload): string {
  const jsonStr = JSON.stringify(payload);
  return LZString.compressToUTF16(jsonStr);
}

export function decompressReplayPayload(compressed: string): ReplayPayload {
  const decompressed = LZString.decompressFromUTF16(compressed);
  if (!decompressed) {
    throw new Error('Decompression failed: invalid or corrupted replay payload');
  }
  return JSON.parse(decompressed) as ReplayPayload;
}

export function compressToEncodedUri(payload: ReplayPayload): string {
  const jsonStr = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

export function decompressFromEncodedUri(encoded: string): ReplayPayload {
  const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
  if (!decompressed) {
    throw new Error('Decompression from URI hash failed: corrupted payload');
  }
  return JSON.parse(decompressed) as ReplayPayload;
}
