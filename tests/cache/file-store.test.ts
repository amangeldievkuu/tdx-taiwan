import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileCacheStore } from '../../src/file-cache/index.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tdx-cache-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('FileCacheStore', () => {
  it('reads back what it wrote until it expires, creating the directory', async () => {
    let now = 1_000;
    const store = new FileCacheStore(join(dir, 'nested'), () => now);
    await store.set('https://example/a', [{ id: 1 }], 500);
    expect(await store.get('https://example/a')).toEqual([{ id: 1 }]);
    expect(await store.get('https://example/b')).toBeUndefined();
    now = 1_500;
    expect(await store.get('https://example/a')).toBeUndefined();
    // The expired file is deleted on read.
    expect(await readdir(join(dir, 'nested'))).toEqual([]);
  });

  it('treats an unreadable file, or one written for another key, as a miss', async () => {
    const store = new FileCacheStore(dir);
    await store.set('https://example/a', 1, 60_000);
    const [file] = await readdir(dir);
    await writeFile(join(dir, file ?? ''), '{not json');
    expect(await store.get('https://example/a')).toBeUndefined();
    await writeFile(
      join(dir, file ?? ''),
      JSON.stringify({ key: 'https://example/other', expiresAt: Date.now() + 60_000, value: 2 }),
    );
    expect(await store.get('https://example/a')).toBeUndefined();
  });

  it('prunes expired entries and stray temporary files, and clears everything', async () => {
    let now = 0;
    const store = new FileCacheStore(dir, () => now);
    await store.set('old', 1, 10);
    await store.set('new', 2, 1_000);
    await store.set('none', 3, 0);
    await writeFile(join(dir, '.left-over.tmp'), '');
    now = 100;
    expect(await store.prune()).toBe(1);
    expect(await readdir(dir)).toHaveLength(1);
    expect(await store.get('new')).toBe(2);
    await store.clear();
    expect(await readdir(dir)).toEqual([]);
    expect(await new FileCacheStore(join(dir, 'missing')).prune()).toBe(0);
  });
});
