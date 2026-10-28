import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'nestjs/index': 'src/nestjs/index.ts',
    'file-cache/index': 'src/file-cache/index.ts',
  },
  format: ['esm', 'cjs'],
  target: 'node20',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // The NestJS entry imports the core by package name so both share one TdxClient class.
  external: ['tdx-taiwan', '@nestjs/common'],
});
