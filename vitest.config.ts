import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'tdx-taiwan/nestjs': fileURLToPath(new URL('./src/nestjs/index.ts', import.meta.url)),
      'tdx-taiwan': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**', 'node_modules/**'],
    environment: 'node',
    globalSetup: ['tests/global-setup.ts'],
  },
});
