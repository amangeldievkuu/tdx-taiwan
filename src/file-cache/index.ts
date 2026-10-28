import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TdxCacheStore } from '../cache/store.js';

/** One stored response, as written to disk. */
interface Entry {
  key: string;
  expiresAt: number;
  value: unknown;
}

/**
 * A `TdxCacheStore` on disk: one JSON file per URL in `dir`, named by the URL's SHA-256. Use it
 * to keep static responses across restarts:
 *
 * ```ts
 * import { TdxClient } from 'tdx-taiwan';
 * import { FileCacheStore } from 'tdx-taiwan/file-cache';
 *
 * const tdx = new TdxClient({ clientId, clientSecret, cache: { store: new FileCacheStore(dir) } });
 * ```
 *
 * Writes go to a temporary file first and are renamed into place, so concurrent processes never
 * read half a file. Unreadable or expired files count as misses. Node.js only.
 */
export class FileCacheStore implements TdxCacheStore {
  private ready: Promise<unknown> | undefined;

  constructor(
    /** Directory for the cache files; created when first written to. */
    readonly dir: string,
    private readonly now: () => number = Date.now,
  ) {}

  async get(key: string): Promise<unknown> {
    let entry: Entry;
    try {
      entry = JSON.parse(await readFile(this.path(key), 'utf8')) as Entry;
    } catch {
      return undefined;
    }
    // A hash collision or a foreign file is a miss, as is an expired entry.
    if (entry.key !== key) return undefined;
    if (this.now() >= entry.expiresAt) {
      await rm(this.path(key), { force: true }).catch(() => undefined);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    if (ttlMs <= 0) return;
    this.ready ??= mkdir(this.dir, { recursive: true });
    await this.ready;
    const entry: Entry = { key, expiresAt: this.now() + ttlMs, value };
    const temporary = join(this.dir, `.${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(entry));
    await rename(temporary, this.path(key));
  }

  /** Deletes the expired entries (and stray temporary files); returns how many were removed. */
  async prune(): Promise<number> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return 0;
    }
    let removed = 0;
    for (const name of names) {
      const path = join(this.dir, name);
      if (name.endsWith('.tmp')) {
        await rm(path, { force: true });
        continue;
      }
      if (!name.endsWith('.json')) continue;
      try {
        const entry = JSON.parse(await readFile(path, 'utf8')) as Entry;
        if (this.now() < entry.expiresAt) continue;
      } catch {
        // Unreadable: remove it too.
      }
      await rm(path, { force: true });
      removed++;
    }
    return removed;
  }

  /** Deletes every entry. */
  async clear(): Promise<void> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return;
    }
    await Promise.all(
      names
        .filter((name) => name.endsWith('.json') || name.endsWith('.tmp'))
        .map((name) => rm(join(this.dir, name), { force: true })),
    );
  }

  private path(key: string): string {
    return join(this.dir, `${createHash('sha256').update(key).digest('hex')}.json`);
  }
}

export type { TdxCacheStore } from '../cache/store.js';
