/**
 * Tests against the bundled output in dist/ (built by tests/global-setup.ts).
 *
 * Each case runs in a separate plain Node process: inside Vitest, `tdx-taiwan` is aliased
 * to src/, which would hide problems that only exist in the bundle.
 */
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const run = promisify(execFile);
const script = (name: string) => fileURLToPath(new URL(`./${name}`, import.meta.url));

async function runNode(name: string, timeout = 20_000): Promise<Record<string, unknown>> {
  const { stdout } = await run(process.execPath, [script(name)], { timeout });
  const lastLine = stdout.trim().split('\n').at(-1) ?? '';
  return JSON.parse(lastLine) as Record<string, unknown>;
}

describe('dist/nestjs', () => {
  it('resolves TdxClient from the ESM bundle without decorator metadata', async () => {
    const result = await runNode('nest-consumer.mjs');

    expect(result.resolved).toMatch(/\/dist\/nestjs\/index\.js$/);
    expect(result).toMatchObject({
      forRoot: true,
      injected: true,
      forRootAsync: true,
      asyncOptions: { clientId: 'cfg-id', clientSecret: 'cfg-secret' },
    });
  });

  it('resolves TdxClient from the CommonJS bundle', async () => {
    const result = await runNode('nest-consumer.cjs');

    expect(result.resolved).toMatch(/\/dist\/nestjs\/index\.cjs$/);
    expect(result).toMatchObject({ forRoot: true, injected: true });
  });
});

describe('dist open handles', () => {
  it('leaves no timers behind, so the process exits promptly', async () => {
    const started = Date.now();
    const result = await runNode('open-handles.mjs', 10_000);

    expect(result).toEqual({ calls: 4, timers: 0 });
    expect(Date.now() - started).toBeLessThan(10_000);
  });
});
