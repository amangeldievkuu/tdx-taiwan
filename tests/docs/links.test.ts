import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REPO_URL = 'https://github.com/amangeldievkuu/tdx-taiwan/blob/main/';

const files = [
  'README.md',
  'CONTRIBUTING.md',
  'tests/fixtures/README.md',
  ...readdirSync(join(root, 'docs'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `docs/${f}`),
];

/** GitHub-style heading slug: lower-case, spaces to dashes, punctuation removed. */
function slug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function headings(file: string): Set<string> {
  const text = readFileSync(join(root, file), 'utf8');
  return new Set(
    [...text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) => slug((m[1] ?? '').replace(/`/g, ''))),
  );
}

/** `[text](target)` links outside fenced code blocks. */
function links(file: string): string[] {
  const text = readFileSync(join(root, file), 'utf8').replace(/```[\s\S]*?```/g, '');
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1] ?? '');
}

describe('documentation links', () => {
  for (const file of files) {
    it(`${file} links resolve`, () => {
      for (const target of links(file)) {
        let path: string;
        let anchor: string;
        if (target.startsWith(REPO_URL)) {
          [path, anchor = ''] = target.slice(REPO_URL.length).split('#') as [string, string?];
        } else if (/^[a-z]+:/.test(target)) {
          continue; // other external URLs are not checked
        } else if (target.startsWith('#')) {
          path = file;
          anchor = target.slice(1);
        } else {
          const [rel, a = ''] = target.split('#') as [string, string?];
          path = join(dirname(file), rel);
          anchor = a;
        }
        expect(existsSync(join(root, path)), `${file}: ${target}`).toBe(true);
        if (anchor && path.endsWith('.md')) {
          expect(headings(path), `${file}: ${target}`).toContain(decodeURIComponent(anchor));
        }
      }
    });
  }

  it('the README stays a quick start', () => {
    const lines = readFileSync(join(root, 'README.md'), 'utf8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(350);
  });
});
