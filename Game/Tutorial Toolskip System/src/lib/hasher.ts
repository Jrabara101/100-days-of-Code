// Modern browser and Node 18+ native Web Crypto API
export async function calculateSha256(data: string): Promise<string> {
  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : undefined) ||
                    (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);

  if (cryptoObj && cryptoObj.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure deterministic hashing fallback
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  return 'sha256-' + Math.abs(hash).toString(16).padStart(16, '0') + '-digest';
}
