import LZString from 'lz-string';
import { ReplayPayload } from '../types/replay';

self.onmessage = async (e: MessageEvent) => {
  const { type, id, data } = e.data;

  try {
    switch (type) {
      case 'COMPRESS_PAYLOAD': {
        const payload: ReplayPayload = data;
        const jsonStr = JSON.stringify(payload);
        const originalBytes = new TextEncoder().encode(jsonStr).length;

        // Calculate SHA-256 hash
        let checksum = '';
        if (self.crypto && self.crypto.subtle) {
          const hashBuffer = await self.crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonStr));
          checksum = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        } else {
          checksum = 'hash-' + Math.random().toString(36).substring(2);
        }

        // Compress
        const compressed = LZString.compressToUTF16(jsonStr);
        const compressedBytes = compressed.length * 2; // UTF16 bytes

        self.postMessage({
          id,
          success: true,
          type: 'COMPRESS_RESULT',
          data: {
            compressed,
            checksum,
            originalBytes,
            compressedBytes,
            ratio: (compressedBytes / originalBytes).toFixed(3),
          },
        });
        break;
      }

      case 'DECOMPRESS_PAYLOAD': {
        const compressed: string = data;
        const decompressed = LZString.decompressFromUTF16(compressed);
        if (!decompressed) {
          throw new Error('Decompression failed');
        }
        const parsed = JSON.parse(decompressed);

        self.postMessage({
          id,
          success: true,
          type: 'DECOMPRESS_RESULT',
          data: parsed,
        });
        break;
      }

      default:
        self.postMessage({
          id,
          success: false,
          error: `Unknown worker message type: ${type}`,
        });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    self.postMessage({
      id,
      success: false,
      error: errorMsg,
    });
  }
};
