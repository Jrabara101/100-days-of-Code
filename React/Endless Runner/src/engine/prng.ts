/**
 * Mulberry32 Seedable PRNG Implementation
 * Fast, 32-bit pseudo-random number generator with uniform distribution.
 */

export function hashStringToSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0);
}

export class Mulberry32 {
  private state: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      this.state = hashStringToSeed(seed);
    } else {
      this.state = seed >>> 0;
    }
    // Warm up generator
    this.next();
    this.next();
  }

  public next(): number {
    let z = (this.state += 0x6d2b79f5);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public choice<T>(arr: T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  public chance(probability: number): boolean {
    return this.next() < probability;
  }
}
