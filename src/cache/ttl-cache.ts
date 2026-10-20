interface Entry<V> {
  value: V;
  expiresAt: number;
}

/**
 * Minimal in-memory TTL cache. When full, the least recently used entry is evicted
 * (a Map keeps insertion order, and hits are re-inserted).
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, Entry<V>>();

  constructor(
    private readonly maxEntries: number,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    if (this.now() >= entry.expiresAt) return undefined;
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    if (ttlMs <= 0 || this.maxEntries <= 0) return;
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
  }

  /** Removes `key`; when `ifValue` is given, only if it is still the cached value. */
  delete(key: string, ifValue?: V): void {
    if (ifValue !== undefined && this.entries.get(key)?.value !== ifValue) return;
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
