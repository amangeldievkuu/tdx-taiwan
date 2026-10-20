import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Builds dist/ once per run so tests/dist/* always exercise the current bundled output. */
export default function setup(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const pkgPath = createRequire(import.meta.url).resolve('tsup/package.json');
  const { bin } = JSON.parse(readFileSync(pkgPath, 'utf8')) as { bin: Record<string, string> };
  const cli = join(dirname(pkgPath), bin.tsup ?? 'dist/cli-default.js');
  execFileSync(process.execPath, [cli, '--silent'], { cwd: root, stdio: 'inherit' });
}
