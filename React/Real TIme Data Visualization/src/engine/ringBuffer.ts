/**
 * Fast, bounded ring buffer for real-time telemetry streaming
 */
export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private capacity: number;
  private head: number = 0;
  private size: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T | undefined>(capacity);
  }

  public push(item: T): void {
    const insertIdx = (this.head + this.size) % this.capacity;
    if (this.size === this.capacity) {
      // Overwrite oldest item at head
      this.buffer[this.head] = item;
      this.head = (this.head + 1) % this.capacity;
    } else {
      this.buffer[insertIdx] = item;
      this.size++;
    }
  }

  public toArray(): T[] {
    const result: T[] = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head + i) % this.capacity;
      result[i] = this.buffer[idx] as T;
    }
    return result;
  }

  public get(index: number): T | undefined {
    if (index < 0 || index >= this.size) return undefined;
    const idx = (this.head + index) % this.capacity;
    return this.buffer[idx];
  }

  public getLast(): T | undefined {
    if (this.size === 0) return undefined;
    const lastIdx = (this.head + this.size - 1) % this.capacity;
    return this.buffer[lastIdx];
  }

  public getSize(): number {
    return this.size;
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public clear(): void {
    this.buffer = new Array<T | undefined>(this.capacity);
    this.head = 0;
    this.size = 0;
  }
}
